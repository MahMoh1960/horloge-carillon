'use strict';
/* Horloge carillon — réveils, agenda, minuteur, prière, sons importés */

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* ---------- Traductions ---------- */
const T = {
  fr: {
    title: 'Horloge carillon', clock: 'Horloge', chime: 'Carillon', alarms: 'Réveils', agenda: 'Agenda', timer: 'Minuteur', prayer: 'Prière', sounds: 'Sons', settings: 'Réglages',
    unlock: '🔊 Activer le son', analog: 'Analogique', digital: 'Numérique', chimeOn: 'Carillon actif', sound: 'Son', mode: 'Mode',
    single: 'Un seul clic', count: 'Autant de clics que l’heure', every: 'Fréquence', hour: 'Chaque heure', half: 'Chaque demi-heure', quarter: 'Chaque quart d’heure',
    from: 'De (h)', to: 'À (h)', volume: 'Volume', test: 'Tester', label: 'Libellé', time: 'Heure', days: 'Jours', repeat: 'Répéter',
    vibrate: 'Vibration', add: 'Ajouter', del: 'Supprimer', snooze: 'Rappel', stop: 'Arrêter', min: 'min', titleF: 'Titre', date: 'Date', cat: 'Catégorie',
    alert: 'Alerte', atTime: 'À l’heure', b10: '10 min avant', b60: '1 h avant', msg: 'Message (facultatif)', minutes: 'Minutes', seconds: 'Secondes',
    start: 'Démarrer', pause: 'Pause', reset: 'Réinitialiser', prayerOn: 'Alertes de prière actives', city: 'Ville', country: 'Pays (en anglais)',
    fetch: 'Récupérer les horaires', imp: 'Importer mes sons (mp3, wav…)', exp: 'Exporter', expAll: 'Tout exporter (WAV)', mine: 'Mes sons importés',
    builtin: 'Sons intégrés', theme: 'Thème', lang: 'Langue', light: 'Clair', dark: 'Sombre', notif: 'Autoriser les notifications', none: 'Aucun élément.',
    once: 'Une fois', daily: 'Tous les jours', catSounds: 'Son par catégorie', defSound: 'Son par défaut des réveils', snoozeMin: 'Durée du rappel (min)',
    evAlarm: 'Alarme (sonnerie répétée avec rappel)', catSound: 'Son de la catégorie',
    nat: 'Alarmes Android (écran éteint)', natHint: 'Le carillon, les réveils, l’agenda, le minuteur et la prière sont programmés dans Android : ils sonnent même application fermée ou écran éteint. Le son suit le volume des notifications.',
    natPerm: 'Notifications', natExact: 'Alarmes exactes', natYes: 'autorisé', natNo: 'non autorisé', natAllow: 'Autoriser', natTest: 'Tester dans 1 minute',
    natCheck: 'Vérifier la programmation', natPending: 'Alarmes programmées dans Android', natLast: 'Dernière synchronisation',
    natTestTitle: 'Alarme de test', natTestMsg: 'Alarme de test programmée : fermez l’écran et patientez 1 minute.', natDefault: 'Son du système',
    natBatt: 'Si une alarme tarde ou manque : Paramètres Android → Applications → Horloge carillon → Batterie → « Sans restriction ».',
    natLimit: 'Limites : écran éteint, un seul son est joué (le mode « autant de clics que l’heure » et les sons importés ne fonctionnent qu’application ouverte ; un son importé est remplacé par le son du système). Ouvrez l’application au moins tous les 2 jours.',
    prayBefore: 'Alarme avant chaque prière (minutes ; 0 = aucune)', prayBeforeSound: 'Son de l’alarme avant la prière', inMin: 'Dans',
    timerSound: 'Son du minuteur', hintChime: 'Le carillon retentit tant que la page reste ouverte et le son activé.',
    hintPrayer: 'Horaires obtenus en ligne (méthode du Maroc) ; modifiables à la main. L’horloge de l’appareil doit être à l’heure locale.',
    fetched: 'Horaires mis à jour.', fetchErr: 'Échec : connexion indisponible.', timerEnd: 'Minuteur terminé', alarm: 'Réveil', event: 'Agenda', prayerAt: 'Heure de prière',
    c_cours: 'Cours', c_reunion: 'Réunion', c_soutenance: 'Soutenance', c_rappel: 'Rappel', c_autre: 'Autre',
    s_click: 'Clic sec', s_tick: 'Tic mécanique', s_drop: 'Goutte', s_beep: 'Bip doux', s_gong: 'Gong léger', s_bell: 'Sonnerie',
    p_Fajr: 'Fajr', p_Dhuhr: 'Dhuhr', p_Asr: 'Asr', p_Maghrib: 'Maghrib', p_Isha: 'Isha',
    days7: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  },
  ar: {
    title: 'ساعة الرنين', clock: 'الساعة', chime: 'الرنين', alarms: 'المنبهات', agenda: 'الأجندة', timer: 'المؤقت', prayer: 'الصلاة', sounds: 'الأصوات', settings: 'الإعدادات',
    unlock: '🔊 تفعيل الصوت', analog: 'عقارب', digital: 'رقمية', chimeOn: 'الرنين مفعّل', sound: 'الصوت', mode: 'النمط',
    single: 'نقرة واحدة', count: 'عدد النقرات بعدد الساعة', every: 'التكرار', hour: 'كل ساعة', half: 'كل نصف ساعة', quarter: 'كل ربع ساعة',
    from: 'من (س)', to: 'إلى (س)', volume: 'مستوى الصوت', test: 'تجربة', label: 'التسمية', time: 'الوقت', days: 'الأيام', repeat: 'تكرار',
    vibrate: 'اهتزاز', add: 'إضافة', del: 'حذف', snooze: 'غفوة', stop: 'إيقاف', min: 'د', titleF: 'العنوان', date: 'التاريخ', cat: 'الفئة',
    alert: 'التنبيه', atTime: 'في الوقت', b10: 'قبل 10 دقائق', b60: 'قبل ساعة', msg: 'رسالة (اختياري)', minutes: 'دقائق', seconds: 'ثوان',
    start: 'ابدأ', pause: 'إيقاف مؤقت', reset: 'إعادة', prayerOn: 'تنبيهات الصلاة مفعّلة', city: 'المدينة', country: 'البلد (بالإنجليزية)',
    fetch: 'جلب المواقيت', imp: 'استيراد أصواتي (mp3، wav…)', exp: 'تصدير', expAll: 'تصدير الكل (WAV)', mine: 'أصواتي المستوردة',
    builtin: 'الأصوات المدمجة', theme: 'المظهر', lang: 'اللغة', light: 'فاتح', dark: 'داكن', notif: 'السماح بالإشعارات', none: 'لا توجد عناصر.',
    once: 'مرة واحدة', daily: 'كل يوم', catSounds: 'صوت لكل فئة', defSound: 'الصوت الافتراضي للمنبهات', snoozeMin: 'مدة الغفوة (د)',
    evAlarm: 'منبه (رنين متكرر مع غفوة)', catSound: 'صوت الفئة',
    nat: 'منبهات أندرويد (والشاشة مطفأة)', natHint: 'يتم برمجة الرنين والمنبهات والأجندة والمؤقت والصلاة داخل أندرويد، فتعمل حتى والتطبيق مغلق أو الشاشة مطفأة. الصوت يتبع مستوى صوت الإشعارات.',
    natPerm: 'الإشعارات', natExact: 'المنبهات الدقيقة', natYes: 'مسموح', natNo: 'غير مسموح', natAllow: 'السماح', natTest: 'تجربة بعد دقيقة',
    natCheck: 'التحقق من البرمجة', natPending: 'المنبهات المبرمجة في أندرويد', natLast: 'آخر مزامنة',
    natTestTitle: 'منبه تجريبي', natTestMsg: 'تمت برمجة منبه تجريبي: أطفئ الشاشة وانتظر دقيقة.', natDefault: 'صوت النظام',
    natBatt: 'إذا تأخر المنبه أو لم يرنّ: إعدادات أندرويد ← التطبيقات ← ساعة الرنين ← البطارية ← «دون قيود».',
    natLimit: 'حدود: والشاشة مطفأة يُشغَّل صوت واحد فقط (نمط «نقرات بعدد الساعة» والأصوات المستوردة لا تعمل إلا والتطبيق مفتوح؛ ويُستبدل الصوت المستورد بصوت النظام). افتح التطبيق مرة كل يومين على الأقل.',
    prayBefore: 'منبه قبل كل صلاة (بالدقائق ؛ 0 = بدون)', prayBeforeSound: 'صوت المنبه قبل الصلاة', inMin: 'بعد',
    timerSound: 'صوت المؤقت', hintChime: 'يرنّ ما دامت الصفحة مفتوحة والصوت مفعّلاً.',
    hintPrayer: 'المواقيت مأخوذة عبر الإنترنت (طريقة المغرب) ويمكن تعديلها. يجب أن تكون ساعة الجهاز على التوقيت المحلي.',
    fetched: 'تم تحديث المواقيت.', fetchErr: 'فشل: لا يوجد اتصال.', timerEnd: 'انتهى المؤقت', alarm: 'منبه', event: 'الأجندة', prayerAt: 'وقت الصلاة',
    c_cours: 'درس', c_reunion: 'اجتماع', c_soutenance: 'مناقشة', c_rappel: 'تذكير', c_autre: 'أخرى',
    s_click: 'نقرة جافة', s_tick: 'تكّة ميكانيكية', s_drop: 'قطرة', s_beep: 'صفير ناعم', s_gong: 'غونغ خفيف', s_bell: 'جرس',
    p_Fajr: 'الفجر', p_Dhuhr: 'الظهر', p_Asr: 'العصر', p_Maghrib: 'المغرب', p_Isha: 'العشاء',
    days7: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
  }
};
const t = k => (T[state.lang] && T[state.lang][k]) ?? T.fr[k] ?? k;

/* ---------- État et persistance ---------- */
const BUILTIN = ['click', 'tick', 'drop', 'beep', 'gong', 'bell'];
const CATS = ['cours', 'reunion', 'soutenance', 'rappel', 'autre'];
const PR = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DEF = {
  lang: 'fr', theme: 'dark', view: 'analog', snooze: 5, vib: true, defSound: 'b:bell', timerSound: 'b:bell',
  chime: { on: true, sound: 'b:click', mode: 'single', every: 'hour', from: 7, to: 22, vol: 0.7 },
  alarms: [], events: [],
  catSounds: { cours: 'b:beep', reunion: 'b:drop', soutenance: 'b:gong', rappel: 'b:tick', autre: 'b:click' },
  prayer: { on: false, city: 'Mohammedia', country: 'Morocco', sound: 'b:bell', before: 10, beforeSound: 'b:beep', date: '', times: { Fajr: '', Dhuhr: '', Asr: '', Maghrib: '', Isha: '' } }
};
const KEY = 'horloge.v1';
let state = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { }
  const o = JSON.parse(JSON.stringify(DEF));
  for (const k of Object.keys(s)) {
    if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) Object.assign(o[k], s[k]); else o[k] = s[k];
  }
  o.tab = 'clock';
  return o;
})();
const save = () => {
  try { const c = { ...state }; delete c.tab; localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { }
  if (window.Native && Native.available) Native.changed();
};
function setPath(o, p, v) { const k = p.split('.'); while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; }

/* ---------- Sons importés (IndexedDB) ---------- */
let customs = [];
const bufCache = {};
const DB = () => new Promise((res, rej) => { const r = indexedDB.open('horloge', 1); r.onupgradeneeded = () => r.result.createObjectStore('sounds', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function dbAll() { const db = await DB(); return new Promise((res, rej) => { const q = db.transaction('sounds').objectStore('sounds').getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function dbPut(o) { const db = await DB(); return new Promise((res, rej) => { const tx = db.transaction('sounds', 'readwrite'); tx.objectStore('sounds').put(o); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function dbDel(id) { const db = await DB(); return new Promise((res, rej) => { const tx = db.transaction('sounds', 'readwrite'); tx.objectStore('sounds').delete(id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function importFiles(files) {
  for (const f of files) {
    const o = { id: uid(), name: f.name.replace(/\.[^.]+$/, ''), blob: f };
    try { await dbPut(o); customs.push(o); } catch (e) { }
  }
  render();
}

/* ---------- Moteur audio ---------- */
let AC = null;
function ctx() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(c, d, t0, o) {
  const f = o.f || 440, dur = o.dur || .2, vol = Math.max(o.vol || .5, 0.0001), a = o.a || .005;
  const os = c.createOscillator(), g = c.createGain();
  os.type = o.type || 'sine';
  os.frequency.setValueAtTime(f, t0);
  if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  os.connect(g); g.connect(d);
  os.start(t0); os.stop(t0 + dur + .02);
}
const SY = {
  click: (c, d, t0, v) => {
    const n = Math.floor(c.sampleRate * .04), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * .003));
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = .7;
    const g = c.createGain(); g.gain.value = Math.min(v * 2, 2);
    s.connect(f); f.connect(g); g.connect(d); s.start(t0);
    return .1;
  },
  tick: (c, d, t0, v) => { tone(c, d, t0, { f: 1500, f2: 700, type: 'square', dur: .05, vol: .25 * v, a: .001 }); tone(c, d, t0 + .002, { f: 300, dur: .06, vol: .4 * v, a: .001 }); return .12; },
  drop: (c, d, t0, v) => { tone(c, d, t0, { f: 1200, f2: 350, dur: .18, vol: .6 * v, a: .003 }); return .25; },
  beep: (c, d, t0, v) => { tone(c, d, t0, { f: 880, dur: .35, vol: .5 * v, a: .02 }); return .4; },
  gong: (c, d, t0, v) => { [[196, 1], [392, .6], [588, .35], [790, .25], [1180, .12]].forEach(([f, k]) => tone(c, d, t0, { f, dur: 3.5, vol: .45 * k * v, a: .01 })); return 3.6; },
  bell: (c, d, t0, v) => { for (let i = 0; i < 3; i++) { tone(c, d, t0 + i * .28, { f: 1046, type: 'triangle', dur: .2, vol: .5 * v, a: .005 }); tone(c, d, t0 + i * .28, { f: 2093, dur: .2, vol: .15 * v, a: .005 }); } return 1; }
};
async function playRef(ref, vol = 1) {
  const c = ctx();
  const [k, v] = String(ref || 'b:click').split(':');
  if (k === 'b') return (SY[v] || SY.click)(c, c.destination, c.currentTime + .02, vol);
  const item = customs.find(x => x.id === v);
  if (!item) return SY.click(c, c.destination, c.currentTime + .02, vol);
  try {
    let buf = bufCache[v];
    if (!buf) buf = bufCache[v] = await c.decodeAudioData(await item.blob.arrayBuffer());
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(c.destination); s.start();
    return Math.min(buf.duration, 10);
  } catch (e) { return SY.click(c, c.destination, c.currentTime + .02, vol); }
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function exportWav(name) {
  const sr = 44100, dur = name === 'gong' ? 4 : 1.5;
  const oc = new OfflineAudioContext(1, Math.floor(sr * dur), sr);
  SY[name](oc, oc.destination, 0.01, 1);
  const d = (await oc.startRendering()).getChannelData(0);
  const buf = new ArrayBuffer(44 + d.length * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, d.length * 2, true);
  for (let i = 0; i < d.length; i++) { const s = Math.max(-1, Math.min(1, d[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  download(new Blob([buf], { type: 'audio/wav' }), `horloge-${name}.wav`);
}

/* ---------- Sonnerie plein écran ---------- */
let ring = null, snoozes = [];
function stopRing() {
  if (!ring) return;
  clearInterval(ring.iv); clearInterval(ring.vib); clearTimeout(ring.stopT);
  if (navigator.vibrate) navigator.vibrate(0);
  ring = null; const m = $('#ring'); m.hidden = true; m.innerHTML = '';
}
function notify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(r => r.showNotification(title, { body, icon: 'icon.svg' })).catch(() => { try { new Notification(title, { body }); } catch (e) { } });
    } else new Notification(title, { body });
  } catch (e) { }
}
function startRing(o) {
  stopRing(); ctx();
  const m = $('#ring');
  m.innerHTML = `<div class="box"><div class="big">${esc(o.title)}</div><div class="muted">${esc(o.sub || '')}</div><div style="margin-top:16px">
    <button data-act="stopRing">${t('stop')}</button>${o.snooze ? `<button class="ghost" data-act="snoozeRing">${t('snooze')} ${state.snooze} ${t('min')}</button>` : ''}</div></div>`;
  m.hidden = false;
  const play = () => playRef(o.sound, 1);
  play();
  ring = { o, iv: setInterval(play, 2500), stopT: setTimeout(stopRing, 90000) };
  if (state.vib && navigator.vibrate) { navigator.vibrate([400, 200, 400]); ring.vib = setInterval(() => navigator.vibrate([400, 200, 400]), 2000); }
  notify(o.title, o.sub || '');
}

/* ---------- Déclencheurs ---------- */
const inRange = (h, a, b) => a <= b ? (h >= a && h <= b) : (h >= a || h <= b);
function chimeNow(kind, h) {
  const c = state.chime;
  const n = (kind === 'hour' && c.mode === 'count') ? (h % 12 || 12) : 1;
  const sp = c.sound === 'b:gong' ? 1800 : c.sound.startsWith('c:') ? 1200 : 600;
  for (let i = 0; i < n; i++) setTimeout(() => playRef(c.sound, c.vol), i * sp);
}
function onMinute(n) {
  if (window.Native && Native.active() && document.hidden) return;   // en arrière-plan, c'est Android qui sonne
  const h = n.getHours(), m = n.getMinutes(), hm = `${pad(h)}:${pad(m)}`, dow = n.getDay(), now = n.getTime();
  const c = state.chime;
  if (c.on) {
    let kind = null;
    if (m === 0) kind = 'hour';
    else if ((c.every === 'half' && m === 30) || (c.every === 'quarter' && m % 15 === 0)) kind = 'sub';
    if (kind && inRange(h, c.from, c.to)) chimeNow(kind, h);
  }
  let dirty = false;
  for (const a of state.alarms) {
    if (a.on && a.time === hm && (!a.days.length || a.days.includes(dow))) {
      startRing({ title: `⏰ ${a.label || t('alarm')}`, sub: a.time, sound: a.sound, snooze: true });
      if (!a.repeat) { a.on = false; dirty = true; }
    }
  }
  for (const e of state.events) {
    if (e.fired) continue;
    const trig = new Date(`${e.date}T${e.time}`).getTime() - e.alert * 60000;
    if (isNaN(trig)) continue;
    const win = (window.Native && Native.active()) ? 120000 : 6 * 3600000;   // Android a déjà sonné les plus anciens
    if (now >= trig && now < trig + win) {
      e.fired = true; dirty = true;
      startRing({ title: `📅 ${e.title}`, sub: `${e.date} ${e.time} · ${t('c_' + e.cat)}${e.msg ? ' — ' + e.msg : ''}`, sound: (e.sound && e.sound !== 'cat') ? e.sound : (state.catSounds[e.cat] || 'b:click'), snooze: !!e.alarm });
    }
  }
  const p = state.prayer;
  if (p.on) {
    for (const k of PR) {
      const tm = p.times[k]; if (!tm) continue;
      if (tm === hm) startRing({ title: `🕌 ${t('p_' + k)}`, sub: `${t('prayerAt')} ${hm}`, sound: p.sound });
      else if (p.before > 0) {
        const [ph, pm] = tm.split(':').map(Number);
        const bm = (((ph * 60 + pm - p.before) % 1440) + 1440) % 1440;
        if (bm === h * 60 + m) startRing({ title: `🕌 ${t('inMin')} ${p.before} ${t('min')} · ${t('p_' + k)}`, sub: `${t('prayerAt')} ${tm}`, sound: p.beforeSound });
      }
    }
    if (p.date !== todayStr(n)) fetchPrayer(true);
  }
  if (dirty) { save(); if (['alarms', 'agenda'].includes(state.tab)) render(); }
}
let lastKey = '';
const keyOf = n => `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}-${n.getHours()}-${n.getMinutes()}`;
const timer = { end: null, left: 0, running: false };
function tick() {
  const n = new Date();
  updateClock(n); updateTimer();
  const k = keyOf(n);
  if (k !== lastKey) { lastKey = k; onMinute(n); if (window.Native) Native.guard(); }
  const due = snoozes.filter(s => s.ts <= Date.now());
  if (due.length) { snoozes = snoozes.filter(s => s.ts > Date.now()); startRing(due[0].o); }
  const u = $('#unlock'); if (u) u.hidden = !!(AC && AC.state === 'running');
}

/* ---------- Horloge ---------- */
function analogSVG() {
  let tk = '', nums = '';
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 92 : 86, r2 = 96;
    tk += `<line x1="${(Math.sin(a) * r1).toFixed(2)}" y1="${(-Math.cos(a) * r1).toFixed(2)}" x2="${(Math.sin(a) * r2).toFixed(2)}" y2="${(-Math.cos(a) * r2).toFixed(2)}" stroke="currentColor" stroke-width="${i % 5 ? 1 : 2.5}"/>`;
  }
  for (let i = 1; i <= 12; i++) {
    const a = i * 30 * Math.PI / 180;
    nums += `<text x="${(Math.sin(a) * 72).toFixed(2)}" y="${(-Math.cos(a) * 72 + 6).toFixed(2)}" text-anchor="middle" font-size="16" fill="currentColor">${i}</text>`;
  }
  return `<svg viewBox="-100 -100 200 200" class="analog"><circle r="98" fill="none" stroke="currentColor" stroke-width="2"/>${tk}${nums}
  <line id="hh" y2="-50" stroke-width="5" stroke-linecap="round" stroke="currentColor"/>
  <line id="mh" y2="-72" stroke-width="3.5" stroke-linecap="round" stroke="currentColor"/>
  <line id="sh" y1="12" y2="-80" stroke-width="1.5" stroke="var(--accent2)"/><circle r="4" fill="var(--accent2)"/></svg>`;
}
function updateClock(n) {
  const h = n.getHours(), m = n.getMinutes(), s = n.getSeconds();
  const hh = $('#hh');
  if (hh) {
    hh.setAttribute('transform', `rotate(${(h % 12 + m / 60) * 30})`);
    $('#mh').setAttribute('transform', `rotate(${(m + s / 60) * 6})`);
    $('#sh').setAttribute('transform', `rotate(${s * 6})`);
  }
  const dg = $('#dig'); if (dg) dg.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  const dl = $('#dateline');
  if (dl) {
    try { dl.textContent = new Intl.DateTimeFormat(state.lang === 'ar' ? 'ar-MA-u-nu-latn' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(n); }
    catch (e) { dl.textContent = todayStr(n); }
  }
}
function fmtMs(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; }
function updateTimer() {
  if (timer.running && Date.now() >= timer.end) {
    timer.running = false; timer.left = 0; timer.end = null;
    startRing({ title: `⏳ ${t('timerEnd')}`, sub: '', sound: state.timerSound });
    if (state.tab === 'timer') render();
  }
  const d = $('#tdisp'); if (d) d.textContent = fmtMs(timer.running ? timer.end - Date.now() : timer.left);
}

/* ---------- Prière ---------- */
// Horaires des prochains jours (utilisés par les alarmes Android, programmées à l'avance)
async function fetchCalendar() {
  const p = state.prayer, n = new Date();
  const months = [[n.getFullYear(), n.getMonth() + 1]];
  const nx = new Date(n.getFullYear(), n.getMonth() + 1, 1);
  if (nx - n < 8 * 86400000) months.push([nx.getFullYear(), nx.getMonth() + 1]);
  const cal = {};
  for (const [y, m] of months) {
    const r = await fetch(`https://api.aladhan.com/v1/calendarByCity/${y}/${m}?city=${encodeURIComponent(p.city)}&country=${encodeURIComponent(p.country)}&method=21`);
    const j = await r.json();
    for (const day of j.data) {
      const [dd, mm, yy] = day.date.gregorian.date.split('-');
      const o = {};
      for (const k of PR) { const v = String(day.timings[k] || '').slice(0, 5); if (/^\d\d:\d\d$/.test(v)) o[k] = v; }
      if (Object.keys(o).length === PR.length) cal[`${yy}-${mm}-${dd}`] = o;
    }
  }
  if (Object.keys(cal).length) p.cal = cal;
}
async function fetchPrayer(silent) {
  const p = state.prayer;
  try {
    const r = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(p.city)}&country=${encodeURIComponent(p.country)}&method=21`);
    const j = await r.json();
    for (const k of PR) p.times[k] = j.data.timings[k].slice(0, 5);
    p.date = todayStr();
    try { await fetchCalendar(); } catch (e) { }
    save();
    if (!silent) { alert(t('fetched')); }
    if (state.tab === 'prayer') render();
  } catch (e) { if (!silent) alert(t('fetchErr')); }
}

/* ---------- Vues ---------- */
const opt = (v, l, cur) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${l}</option>`;
function soundOpts(sel) {
  return BUILTIN.map(k => opt('b:' + k, t('s_' + k), sel)).join('') + customs.map(c => opt('c:' + c.id, '♪ ' + esc(c.name), sel)).join('');
}
const TABS = ['clock', 'chime', 'alarms', 'agenda', 'timer', 'prayer', 'sounds', 'settings'];
const views = {
  clock() {
    const a = state.view === 'analog';
    return `<section class="card center"><div id="dateline" class="muted"></div>${a ? analogSVG() : '<div id="dig" class="dig"></div>'}
    <div class="seg"><button class="${a ? 'on' : 'ghost'}" data-act="view" data-arg="analog">${t('analog')}</button>
    <button class="${a ? 'ghost' : 'on'}" data-act="view" data-arg="digital">${t('digital')}</button></div></section>`;
  },
  chime() {
    const c = state.chime;
    return `<section class="card"><h2>${t('chime')}</h2>
    <label class="row"><input type="checkbox" data-k="chime.on" ${c.on ? 'checked' : ''}> ${t('chimeOn')}</label>
    <label>${t('sound')}<select data-k="chime.sound">${soundOpts(c.sound)}</select></label>
    <label>${t('mode')}<select data-k="chime.mode">${opt('single', t('single'), c.mode)}${opt('count', t('count'), c.mode)}</select></label>
    <label>${t('every')}<select data-k="chime.every">${opt('hour', t('hour'), c.every)}${opt('half', t('half'), c.every)}${opt('quarter', t('quarter'), c.every)}</select></label>
    <div class="two"><label>${t('from')}<input type="number" min="0" max="23" data-k="chime.from" value="${c.from}"></label>
    <label>${t('to')}<input type="number" min="0" max="23" data-k="chime.to" value="${c.to}"></label></div>
    <label>${t('volume')}<input type="range" min="0" max="1" step="0.05" data-k="chime.vol" value="${c.vol}"></label>
    <button data-act="testChime">${t('test')}</button><p class="muted">${t('hintChime')}</p></section>`;
  },
  alarms() {
    const list = state.alarms.slice().sort((a, b) => a.time.localeCompare(b.time)).map(a => `<div class="item">
      <input type="checkbox" data-tog="${a.id}" ${a.on ? 'checked' : ''}>
      <div class="grow"><b>${a.time}</b> ${esc(a.label)}<div class="muted">${a.days.length ? a.days.map(d => t('days7')[d]).join(' ') : (a.repeat ? t('daily') : t('once'))}</div></div>
      <button class="ghost" data-act="delAlarm" data-id="${a.id}">✕</button></div>`).join('') || `<p class="muted">${t('none')}</p>`;
    return `<section class="card"><h2>${t('alarms')}</h2>${list}</section>
    <section class="card"><label>${t('label')}<input type="text" id="al_label"></label>
    <label>${t('time')}<input type="time" id="al_time" value="07:00"></label>
    <div class="days">${t('days7').map((d, i) => `<label><input type="checkbox" class="al_d" value="${i}"> ${d}</label>`).join('')}</div>
    <label class="row"><input type="checkbox" id="al_rep" checked> ${t('repeat')}</label>
    <label>${t('sound')}<select id="al_sound">${soundOpts(state.defSound)}</select></label>
    <button data-act="addAlarm">${t('add')}</button></section>`;
  },
  agenda() {
    const list = state.events.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(e => `<div class="item">
      <div class="grow"><b>${esc(e.title)}</b><div class="muted">${e.date} ${e.time} · ${t('c_' + e.cat)} · ${e.alert ? '−' + e.alert + ' ' + t('min') : t('atTime')}${e.alarm ? ' ⏰' : ''}${e.fired ? ' ✓' : ''}</div>${e.msg ? `<div class="muted">${esc(e.msg)}</div>` : ''}</div>
      <button class="ghost" data-act="delEvent" data-id="${e.id}">✕</button></div>`).join('') || `<p class="muted">${t('none')}</p>`;
    return `<section class="card"><h2>${t('agenda')}</h2>${list}</section>
    <section class="card"><label>${t('titleF')}<input type="text" id="ev_title"></label>
    <div class="two"><label>${t('date')}<input type="date" id="ev_date" value="${todayStr()}"></label><label>${t('time')}<input type="time" id="ev_time" value="09:00"></label></div>
    <div class="two"><label>${t('cat')}<select id="ev_cat">${CATS.map(c => opt(c, t('c_' + c), 'cours')).join('')}</select></label>
    <label>${t('alert')}<select id="ev_alert">${opt(0, t('atTime'), 0)}${opt(10, t('b10'), 0)}${opt(60, t('b60'), 0)}</select></label></div>
    <label class="row"><input type="checkbox" id="ev_alarm" checked> ${t('evAlarm')}</label>
    <label>${t('sound')}<select id="ev_sound">${opt('cat', t('catSound'), 'cat')}${soundOpts('cat')}</select></label>
    <label>${t('msg')}<input type="text" id="ev_msg"></label>
    <button data-act="addEvent">${t('add')}</button></section>`;
  },
  timer() {
    return `<section class="card center"><h2>${t('timer')}</h2><div id="tdisp" class="dig">00:00:00</div>
    <div class="two"><label>${t('minutes')}<input type="number" min="0" max="999" id="t_min" value="5"></label><label>${t('seconds')}<input type="number" min="0" max="59" id="t_sec" value="0"></label></div>
    <button data-act="tStart">${t('start')}</button><button class="ghost" data-act="tPause">${t('pause')}</button><button class="ghost" data-act="tReset">${t('reset')}</button></section>`;
  },
  prayer() {
    const p = state.prayer;
    return `<section class="card"><h2>${t('prayer')}</h2>
    <label class="row"><input type="checkbox" data-k="prayer.on" ${p.on ? 'checked' : ''}> ${t('prayerOn')}</label>
    <div class="two"><label>${t('city')}<input type="text" data-k="prayer.city" value="${esc(p.city)}"></label><label>${t('country')}<input type="text" data-k="prayer.country" value="${esc(p.country)}"></label></div>
    ${PR.map(k => `<label>${t('p_' + k)}<input type="time" data-k="prayer.times.${k}" value="${p.times[k]}"></label>`).join('')}
    <label>${t('sound')}<select data-k="prayer.sound">${soundOpts(p.sound)}</select></label>
    <label>${t('prayBefore')}<input type="number" min="0" max="180" data-k="prayer.before" value="${p.before}"></label>
    <label>${t('prayBeforeSound')}<select data-k="prayer.beforeSound">${soundOpts(p.beforeSound)}</select></label>
    <button data-act="fetchPrayer">${t('fetch')}</button><p class="muted">${t('hintPrayer')}</p></section>`;
  },
  sounds() {
    const b = BUILTIN.map(k => `<div class="item"><div class="grow">${t('s_' + k)}</div><button class="ghost" data-act="testSound" data-arg="b:${k}">▶</button><button class="ghost" data-act="expSound" data-arg="${k}">${t('exp')}</button></div>`).join('');
    const c = customs.map(x => `<div class="item"><div class="grow">♪ ${esc(x.name)}</div><button class="ghost" data-act="testSound" data-arg="c:${x.id}">▶</button><button class="ghost" data-act="delCustom" data-id="${x.id}">✕</button></div>`).join('') || `<p class="muted">${t('none')}</p>`;
    return `<section class="card"><h2>${t('builtin')}</h2>${b}<button data-act="expAll">${t('expAll')}</button></section>
    <section class="card"><h2>${t('mine')}</h2>${c}<label>${t('imp')}<input type="file" id="imp" accept="audio/*" multiple></label></section>`;
  },
  settings() {
    const st = v => v === 'granted' ? `✓ ${t('natYes')}` : `✗ ${t('natNo')}`;
    const nat = (window.Native && Native.available) ? `<section class="card"><h2>${t('nat')}</h2>
    <p class="muted">${t('natHint')}</p>
    <div class="item"><div class="grow">${t('natPerm')} : <b>${st(Native.perm)}</b></div><button data-act="natPerm">${t('natAllow')}</button></div>
    <div class="item"><div class="grow">${t('natExact')} : <b>${st(Native.exact)}</b></div><button data-act="natExact">${t('natAllow')}</button></div>
    <button data-act="natTest">${t('natTest')}</button><button class="ghost" data-act="natCheck">${t('natCheck')}</button>
    ${Native.diagText ? `<div class="muted" style="white-space:pre-wrap;margin:8px 0">${esc(Native.diagText)}</div>` : ''}
    <p class="muted">${t('natBatt')}</p><p class="muted">${t('natLimit')}</p></section>` : '';
    return `${nat}<section class="card"><h2>${t('settings')}</h2>
    <label>${t('lang')}<select data-k="lang" data-re="1">${opt('fr', 'Français', state.lang)}${opt('ar', 'العربية', state.lang)}</select></label>
    <label>${t('theme')}<select data-k="theme" data-re="1">${opt('dark', t('dark'), state.theme)}${opt('light', t('light'), state.theme)}</select></label>
    <label>${t('snoozeMin')}<input type="number" min="1" max="60" data-k="snooze" value="${state.snooze}"></label>
    <label class="row"><input type="checkbox" data-k="vib" ${state.vib ? 'checked' : ''}> ${t('vibrate')}</label>
    <label>${t('defSound')}<select data-k="defSound">${soundOpts(state.defSound)}</select></label>
    <label>${t('timerSound')}<select data-k="timerSound">${soundOpts(state.timerSound)}</select></label>
    <h2 style="margin-top:14px">${t('catSounds')}</h2>
    ${CATS.map(c => `<label>${t('c_' + c)}<select data-k="catSounds.${c}">${soundOpts(state.catSounds[c])}</select></label>`).join('')}
    <button class="ghost" data-act="notifPerm">${t('notif')}</button></section>`;
  }
};

function render() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = state.theme;
  $('#appTitle').textContent = t('title');
  $('#unlock').textContent = t('unlock');
  $('#nav').innerHTML = TABS.map(k => `<button class="${state.tab === k ? 'on' : ''}" data-act="tab" data-arg="${k}">${t(k)}</button>`).join('');
  $('#main').innerHTML = views[state.tab]();
  updateClock(new Date()); updateTimer();
}

/* ---------- Actions ---------- */
const ACT = {
  tab: (id, arg) => { state.tab = arg; render(); window.scrollTo(0, 0); if (arg === 'settings' && window.Native && Native.available) Native.check(); },
  view: (id, arg) => { state.view = arg; save(); render(); },
  unlock: () => { ctx(); playRef('b:click', .3); },
  testChime: () => chimeNow('hour', new Date().getHours()),
  testSound: (id, arg) => playRef(arg, 1),
  expSound: (id, arg) => exportWav(arg),
  expAll: async () => { for (const k of BUILTIN) { await exportWav(k); await new Promise(r => setTimeout(r, 400)); } },
  delCustom: async id => { await dbDel(id); customs = customs.filter(c => c.id !== id); delete bufCache[id]; render(); },
  addAlarm: () => {
    const days = [...document.querySelectorAll('.al_d:checked')].map(x => Number(x.value));
    state.alarms.push({ id: uid(), label: $('#al_label').value.trim(), time: $('#al_time').value || '07:00', days, repeat: $('#al_rep').checked, sound: $('#al_sound').value, on: true });
    save(); render();
  },
  delAlarm: id => { state.alarms = state.alarms.filter(a => a.id !== id); save(); render(); },
  addEvent: () => {
    const title = $('#ev_title').value.trim(), date = $('#ev_date').value, time = $('#ev_time').value;
    if (!title || !date || !time) return;
    state.events.push({ id: uid(), title, date, time, cat: $('#ev_cat').value, alert: Number($('#ev_alert').value), msg: $('#ev_msg').value.trim(), alarm: $('#ev_alarm').checked, sound: $('#ev_sound').value, fired: false });
    save(); render();
  },
  delEvent: id => { state.events = state.events.filter(e => e.id !== id); save(); render(); },
  tStart: () => {
    if (timer.running) return;
    const total = timer.left > 0 ? timer.left : ((Number($('#t_min').value) || 0) * 60 + (Number($('#t_sec').value) || 0)) * 1000;
    if (total <= 0) return;
    ctx(); timer.end = Date.now() + total; timer.running = true;
    if (window.Native) Native.changed();
  },
  tPause: () => { if (timer.running) { timer.left = timer.end - Date.now(); timer.running = false; timer.end = null; if (window.Native) Native.changed(); } },
  tReset: () => { timer.running = false; timer.left = 0; timer.end = null; updateTimer(); if (window.Native) Native.changed(); },
  natPerm: () => Native.requestPerm(),
  natExact: () => Native.requestExact(),
  natTest: () => Native.test(),
  natCheck: () => Native.check(),
  fetchPrayer: () => fetchPrayer(false),
  notifPerm: () => { if ('Notification' in window) Notification.requestPermission(); },
  stopRing: () => stopRing(),
  snoozeRing: () => { if (ring) { snoozes.push({ ts: Date.now() + state.snooze * 60000, o: ring.o }); stopRing(); } }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const f = ACT[b.dataset.act]; if (f) f(b.dataset.id, b.dataset.arg, b);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.k) {
    const v = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.type === 'range') ? Number(el.value) : el.value;
    setPath(state, el.dataset.k, v); save();
    if (el.dataset.re) render();
    return;
  }
  if (el.dataset.tog) { const a = state.alarms.find(x => x.id === el.dataset.tog); if (a) { a.on = el.checked; a.armed = 0; save(); } return; }
  if (el.id === 'imp' && el.files.length) importFiles([...el.files]);
});
document.addEventListener('pointerdown', () => ctx(), { once: true });
document.addEventListener('keydown', () => ctx(), { once: true });

/* ---------- Démarrage ---------- */
(async () => {
  try { customs = await dbAll(); } catch (e) { customs = []; }
  lastKey = keyOf(new Date());
  render();
  if (window.Native && Native.available) Native.init();
  setInterval(tick, 250);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
