'use strict';
/* Alarmes natives Android (Capacitor) : carillon, réveils, agenda, minuteur et prière
   sont programmés dans Android (AlarmManager) et sonnent écran éteint, application fermée.
   Dans un navigateur ordinaire, ce fichier ne fait rien. */
(function () {
  const N = window.Native = {
    available: false, perm: 'unknown', exact: 'unknown',
    active() { return this.available && this.perm === 'granted'; },
    init() { }, changed() { }, guard() { }, sync() { }, test() { }, requestPerm() { }, requestExact() { },
    async shareFile() { return false; }, minimize() { }, handledKey: null
  };
  const Cap = window.Capacitor;
  if (!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform())) return;
  let LN = null;
  try { LN = (Cap.Plugins && Cap.Plugins.LocalNotifications) || (Cap.registerPlugin && Cap.registerPlugin('LocalNotifications')); } catch (e) { }
  if (!LN) return;
  N.available = true;

  const DAY = 86400000;
  const GUARD = 150000;           // application ouverte : c'est elle qui sonne les 2,5 prochaines minutes
  const MAX = 300;
  const TEST_ID = 2147483000;
  const SOUNDS = ['click', 'tick', 'drop', 'beep', 'gong', 'bell'];
  const cancelled = new Set();
  const msg = e => String((e && (e.message || e.errorMessage)) || e).slice(0, 120);
  const fmt = ms => { const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  // L'application ne sonne elle-même que si son moteur audio est réellement actif (sinon Android sonne).
  const jsRings = () => !document.hidden && typeof AC !== 'undefined' && !!AC && AC.state === 'running';

  /* ---------- Identifiants et canaux ---------- */
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) % 512; };
  const mkId = (at, key) => (Math.floor(at / 60000) % 4000000) * 512 + hash(key);
  const soundKey = ref => { const [k, v] = String(ref || 'b:click').split(':'); return (k === 'b' && SOUNDS.includes(v)) ? v : 'default'; };
  const chan = (kind, ref) => (kind === 'chime' ? 'c_' : 'a_') + soundKey(ref);

  async function createChannels() {
    for (const kind of ['chime', 'alert']) {
      for (const s of SOUNDS.concat(['default'])) {
        const ch = {
          id: (kind === 'chime' ? 'c_' : 'a_') + s,
          name: (kind === 'chime' ? t('chime') : t('alarms')) + ' · ' + (s === 'default' ? t('natDefault') : t('s_' + s)),
          description: 'Horloge carillon',
          importance: kind === 'chime' ? 4 : 5,
          visibility: 1,
          vibration: kind !== 'chime'
        };
        if (s !== 'default') ch.sound = 'snd_' + s + '.wav';
        try { await LN.createChannel(ch); } catch (e) { }
      }
    }
  }

  /* ---------- Calcul des déclencheurs à venir ---------- */
  function build(now) {
    const out = [];
    let mutated = false;
    const push = (at, key, o) => { if (at > now + 2000) out.push(Object.assign({ at, key }, o)); };
    const pushAlarm = (at, key, o, reps) => {
      for (let i = 0; i <= reps; i++) push(at + i * 60000, i ? key + ':r' + i : key, Object.assign({}, o, { group: key }));
    };

    // Carillon
    const c = state.chime;
    if (c.on) {
      const step = c.every === 'quarter' ? 15 : c.every === 'half' ? 30 : 60;
      const horizon = (step === 60 ? 7 : step === 30 ? 4 : 2) * DAY;
      const base = new Date(now); base.setSeconds(0, 0);
      base.setMinutes(base.getMinutes() - (base.getMinutes() % step) + step);
      for (let ts = base.getTime(); ts < now + horizon; ts += step * 60000) {
        const dt = new Date(ts), h = dt.getHours(), m = dt.getMinutes();
        if (m % step !== 0 || !inRange(h, c.from, c.to)) continue;
        push(ts, 'chime', { title: `🔔 ${pad(h)}:${pad(m)}`, body: t('chime'), sound: c.sound, kind: 'chime', fullScreen: !!c.wake && m === 0 });
      }
    }

    // Réveils
    for (const a of state.alarms) {
      if (!a.on) continue;
      if (!a.repeat && a.armed && a.armed <= now) { a.on = false; a.armed = 0; mutated = true; continue; }
      const [hh, mm] = String(a.time).split(':').map(Number);
      for (let i = 0; i < 8; i++) {
        const d = new Date(now); d.setDate(d.getDate() + i); d.setHours(hh, mm, 0, 0);
        const at = d.getTime();
        if (at <= now) continue;
        if (a.days.length && !a.days.includes(d.getDay())) continue;
        pushAlarm(at, 'al:' + a.id + ':' + todayStr(d), { title: `⏰ ${a.label || t('alarm')}`, body: a.time, sound: a.sound, kind: 'alarm' }, 4);
        if (!a.repeat) { if (a.armed !== at) { a.armed = at; mutated = true; } break; }
      }
    }

    // Agenda
    for (const e of state.events) {
      if (e.fired) continue;
      const at = new Date(`${e.date}T${e.time}`).getTime() - e.alert * 60000;
      if (isNaN(at)) continue;
      if (at <= now) {
        if (N.active() && now - at < 6 * 3600000) { e.fired = true; mutated = true; }   // déjà sonné par Android
        continue;
      }
      if (at > now + 8 * DAY) continue;
      const snd = (e.sound && e.sound !== 'cat') ? e.sound : (state.catSounds[e.cat] || 'b:click');
      pushAlarm(at, 'ev:' + e.id, { title: `📅 ${e.title}`, body: `${e.date} ${e.time} · ${t('c_' + e.cat)}${e.msg ? ' — ' + e.msg : ''}`, sound: snd, kind: 'alarm' }, e.alarm ? 4 : 0);
    }

    // Prière
    const p = state.prayer;
    if (p.on) {
      for (let i = 0; i < (p.cal ? 7 : 3); i++) {
        const d = new Date(now); d.setDate(d.getDate() + i);
        const ds = todayStr(d);
        const times = (i === 0 && p.date === ds) ? p.times : ((p.cal && p.cal[ds]) || p.times);
        for (const k of PR) {
          const tm = times[k];
          if (!/^\d\d:\d\d/.test(tm || '')) continue;
          const at = new Date(d); at.setHours(Number(tm.slice(0, 2)), Number(tm.slice(3, 5)), 0, 0);
          const ts = at.getTime();
          push(ts, 'pr:' + k + ':' + ds, { title: `🕌 ${t('p_' + k)}`, body: `${t('prayerAt')} ${tm}`, sound: p.sound, kind: 'alert' });
          if (p.before > 0) {
            push(ts - p.before * 60000, 'prb:' + k + ':' + ds,
              { title: `🕌 ${t('inMin')} ${p.before} ${t('min')} · ${t('p_' + k)}`, body: `${t('prayerAt')} ${tm}`, sound: p.beforeSound, kind: 'alert' });
          }
        }
      }
    }

    // Minuteur
    if (timer.running && timer.end > now) {
      pushAlarm(timer.end, 'timer', { title: `⏳ ${t('timerEnd')}`, body: '', sound: state.timerSound, kind: 'alarm' }, 2);
    }

    out.sort((a, b) => a.at - b.at);
    out.forEach(x => { x.id = mkId(x.at, x.key); });
    return { list: out.slice(0, MAX), mutated };
  }

  function toNotif(x) {
    const sk = soundKey(x.sound);
    const n = {
      id: x.id, title: x.title, body: x.body || '', channelId: chan(x.kind, x.sound),
      schedule: { at: new Date(x.at), allowWhileIdle: true }, autoCancel: true
    };
    if (x.group) n.extra = { group: x.group };
    if (x.fullScreen) n.extra = Object.assign(n.extra || {}, { fullScreen: true });   // écran allumé + horloge (voir patch-android.py)
    if (sk !== 'default') n.sound = 'snd_' + sk + '.wav';
    return n;
  }

  /* ---------- Synchronisation avec Android ---------- */
  // Ordre voulu : programmer d'abord, annuler les obsolètes ensuite. Si l'application passe en
  // arrière-plan au milieu de l'opération, il reste toujours des alarmes programmées.
  async function scheduleChunk(chunk, info) {
    try { await LN.schedule({ notifications: chunk.map(toNotif) }); info.scheduled += chunk.length; return; }
    catch (e) { info.errors.push(msg(e)); }
    for (const x of chunk) {            // un élément fautif ne doit pas bloquer les autres
      try { await LN.schedule({ notifications: [toNotif(x)] }); info.scheduled++; } catch (e) { }
    }
  }
  let syncing = false, again = false, timerId = null;
  async function sync() {
    if (syncing) { again = true; return; }
    syncing = true;
    const info = { time: Date.now(), planned: 0, scheduled: 0, errors: [] };
    try {
      const now = Date.now();
      const { list, mutated } = build(now);
      if (mutated) save();
      const keep = jsRings() ? list.filter(x => x.at > now + GUARD) : list;
      const granted = N.perm === 'granted';
      info.planned = granted ? keep.length : 0;
      const keepIds = new Set(granted ? keep.map(x => x.id) : []);
      if (granted) for (let i = 0; i < keep.length; i += 40) await scheduleChunk(keep.slice(i, i + 40), info);
      try {
        const pend = await LN.getPending();
        const stale = (pend.notifications || []).filter(n => n.id !== TEST_ID && !keepIds.has(n.id)).map(n => ({ id: n.id }));
        for (let i = 0; i < stale.length; i += 100) await LN.cancel({ notifications: stale.slice(i, i + 100) });
      } catch (e) { info.errors.push(msg(e)); }
      cancelled.clear();
    } catch (e) { info.errors.push(msg(e)); }
    finally { N.lastSync = info; syncing = false; if (again) { again = false; sync(); } }
  }
  N.sync = sync;
  N.changed = () => { clearTimeout(timerId); timerId = setTimeout(sync, 700); };

  // L'application passe en arrière-plan : un seul appel, sans attente, pour reprogrammer les
  // alarmes proches que l'application sonnait elle-même (le moteur web peut être suspendu aussitôt).
  function scheduleNear() {
    if (!N.active()) return;
    const now = Date.now();
    const near = build(now).list.filter(x => x.at <= now + GUARD + 120000);
    if (near.length) { try { LN.schedule({ notifications: near.map(toNotif) }).catch(() => { }); } catch (e) { } }
  }
  N._scheduleNear = scheduleNear;

  // Application ouverte : annule dans Android ce que l'application sonne elle-même.
  N.guard = async () => {
    if (!N.active() || !jsRings()) return;
    try {
      const now = Date.now();
      const ids = build(now).list.filter(x => x.at <= now + GUARD && !cancelled.has(x.id)).map(x => x.id);
      if (!ids.length) return;
      ids.forEach(id => cancelled.add(id));
      await LN.cancel({ notifications: ids.map(id => ({ id })) });
    } catch (e) { }
  };

  /* ---------- Autorisations et test ---------- */
  async function refresh() {
    try { N.perm = (await LN.checkPermissions()).display; } catch (e) { }
    try { N.exact = (await LN.checkExactNotificationSetting()).exact_alarm; } catch (e) { }
    if (typeof render === 'function' && state.tab === 'settings') render();
  }
  N.requestPerm = async () => {
    try { N.perm = (await LN.requestPermissions()).display; } catch (e) { }
    await refresh(); sync();
  };
  N.requestExact = async () => { try { await LN.changeExactNotificationSetting(); } catch (e) { } await refresh(); sync(); };
  N.test = async () => {
    if (N.perm !== 'granted') { await N.requestPerm(); if (N.perm !== 'granted') return; }
    try {
      await LN.schedule({
        notifications: [{
          id: TEST_ID, title: '⏰ ' + t('natTestTitle'), body: t('title'), channelId: 'a_bell', sound: 'snd_bell.wav',
          schedule: { at: new Date(Date.now() + 60000), allowWhileIdle: true }, autoCancel: true
        }]
      });
      alert(t('natTestMsg'));
    } catch (e) { alert(String(e)); }
  };

  // Partage d'un fichier (sauvegarde) : écrit dans le cache de l'application puis ouvre la feuille de partage
  // d'Android (Drive, Fichiers, e-mail, WhatsApp...). Renvoie faux si les plugins sont absents.
  N.shareFile = async (blob, name, title) => {
    const FS = Cap.Plugins && Cap.Plugins.Filesystem, SH = Cap.Plugins && Cap.Plugins.Share;
    if (!FS || !SH) return false;
    try {
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1] || '');
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });
      const w = await FS.writeFile({ path: name, data, directory: 'CACHE' });
      await SH.share({ title, dialogTitle: title, url: w.uri });
      return true;
    } catch (e) { return /cancel/i.test(msg(e)); }
  };

  N.check = async () => {
    await refresh();
    const L = [];
    try {
      const pend = (await LN.getPending()).notifications || [];
      L.push(`${t('natPending')} : ${pend.length}`);
      pend.filter(n => n.schedule && n.schedule.at).map(n => ({ at: new Date(n.schedule.at).getTime(), title: n.title }))
        .filter(r => !isNaN(r.at)).sort((a, b) => a.at - b.at).slice(0, 6).forEach(r => L.push(`${fmt(r.at)}  ${r.title}`));
    } catch (e) { L.push('⚠ ' + msg(e)); }
    const q = N.lastSync;
    if (q) L.push(`${t('natLast')} ${fmt(q.time)} · ${q.scheduled}/${q.planned}${q.errors.length ? ' · ⚠ ' + q.errors[0] : ''}`);
    N.diagText = L.join('\n');
    if (typeof render === 'function' && state.tab === 'settings') render();
  };

  /* ---------- Horloge affichée à l'heure pile, écran verrouillé ---------- */
  let lastWake = 0;
  N.minimize = () => { try { const A = Cap.Plugins && Cap.Plugins.App; if (A && A.minimizeApp) A.minimizeApp(); } catch (e) { } };
  // Affiche l'horloge si l'application vient d'être lancée par la notification plein écran de l'heure pile
  function wakeOnce() {
    const c = state.chime;
    if (!c.on || !c.wake || typeof showWake !== 'function') return;
    const now = Date.now(), d = new Date(now); d.setMinutes(0, 0, 0);
    const h0 = d.getTime();
    if (lastWake === h0 || now - h0 > 25000 || !inRange(d.getHours(), c.from, c.to)) return;
    lastWake = h0;
    showWake();
  }
  N._wakeOnce = wakeOnce;

  N.init = async () => {
    wakeOnce();                      // lancement à froid par la notification plein écran de l'heure pile
    await refresh();
    await createChannels();
    try { await LN.removeAllDeliveredNotifications(); } catch (e) { }
    try {
      LN.addListener('localNotificationActionPerformed', async ev => {
        const ex = ev && ev.notification && ev.notification.extra;
        if (ex && ex.fullScreen) wakeOnce();
        const g = ex && ex.group;
        if (!g) return;
        try {
          const pend = await LN.getPending();
          const ids = (pend.notifications || []).filter(n => n.extra && n.extra.group === g).map(n => ({ id: n.id }));
          if (ids.length) await LN.cancel({ notifications: ids });
        } catch (e) { }
      });
    } catch (e) { }
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) { scheduleNear(); return; }
      if (N.active()) N.handledKey = keyOf(new Date());   // la minute en cours a déjà été sonnée par Android
      await refresh();
      try { await LN.removeAllDeliveredNotifications(); } catch (e) { }
      sync();
    });
    setInterval(() => { if (!document.hidden) sync(); }, 6 * 3600000);
    sync();
  };

  N._build = build;   // pour les tests
})();
