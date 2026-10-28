#!/usr/bin/env python3
"""Génère les sons intégrés de l'horloge en fichiers WAV (même synthèse que app.js).
Usage : python3 make-sounds.py <dossier_de_sortie>
Les fichiers (snd_click.wav, snd_tick.wav, ...) servent de sons de notification Android."""
import math
import os
import random
import struct
import sys
import wave

SR = 44100
LEAD = 0.03   # courte pause au début : certains appareils « mangent » les premières millisecondes
TAIL = 0.05


def new_buf(dur):
    return [0.0] * int(SR * (dur + LEAD + TAIL))


def tone(buf, t0, f, dur, vol, a=0.005, f2=None, kind='sine'):
    """Oscillateur avec enveloppe exponentielle (comme Web Audio)."""
    vol = max(vol, 1e-4)
    start = int((t0 + LEAD) * SR)
    n = int(dur * SR)
    phase = 0.0
    for i in range(n):
        j = start + i
        if j >= len(buf):
            break
        t = i / SR
        fr = f if f2 is None else f * (f2 / f) ** (t / dur)
        phase += 2 * math.pi * fr / SR
        if t < a:
            env = 1e-4 * (vol / 1e-4) ** (t / a)
        else:
            env = vol * (1e-4 / vol) ** ((t - a) / max(dur - a, 1e-6))
        s = math.sin(phase)
        if kind == 'square':
            s = 1.0 if s >= 0 else -1.0
        elif kind == 'triangle':
            s = math.asin(s) * 2 / math.pi
        buf[j] += s * env


def click():
    n = int(SR * 0.04)
    rnd = random.Random(7)
    noise = [(rnd.random() * 2 - 1) * math.exp(-i / (SR * 0.003)) for i in range(n)]
    # filtre passe-bande 3 kHz, Q = 0,7 (RBJ)
    w0 = 2 * math.pi * 3000 / SR
    alpha = math.sin(w0) / (2 * 0.7)
    b0, b2 = alpha, -alpha
    a0, a1, a2 = 1 + alpha, -2 * math.cos(w0), 1 - alpha
    x1 = x2 = y1 = y2 = 0.0
    out = []
    for x in noise:
        y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1 = x1, x
        y2, y1 = y1, y
        out.append(y)
    buf = new_buf(0.1)
    start = int(LEAD * SR)
    for i, v in enumerate(out):
        buf[start + i] += v
    return buf


def tick():
    buf = new_buf(0.12)
    tone(buf, 0, 1500, 0.05, 0.25, a=0.001, f2=700, kind='square')
    tone(buf, 0.002, 300, 0.06, 0.4, a=0.001)
    return buf


def drop():
    buf = new_buf(0.25)
    tone(buf, 0, 1200, 0.18, 0.6, a=0.003, f2=350)
    return buf


def beep():
    buf = new_buf(0.4)
    tone(buf, 0, 880, 0.35, 0.5, a=0.02)
    return buf


def gong():
    buf = new_buf(3.6)
    for f, k in ((196, 1), (392, .6), (588, .35), (790, .25), (1180, .12)):
        tone(buf, 0, f, 3.5, 0.45 * k, a=0.01)
    return buf


def bell():
    buf = new_buf(1.0)
    for i in range(3):
        tone(buf, i * 0.28, 1046, 0.2, 0.5, a=0.005, kind='triangle')
        tone(buf, i * 0.28, 2093, 0.2, 0.15, a=0.005)
    return buf


SOUNDS = {'click': click, 'tick': tick, 'drop': drop, 'beep': beep, 'gong': gong, 'bell': bell}


def save(path, buf):
    peak = max(abs(v) for v in buf) or 1.0
    g = 0.85 / peak
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v * g)) * 32767)) for v in buf))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(out, exist_ok=True)
    for name, fn in SOUNDS.items():
        p = os.path.join(out, f'snd_{name}.wav')
        save(p, fn())
        print('écrit', p)
