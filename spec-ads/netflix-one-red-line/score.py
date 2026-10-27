#!/usr/bin/env python3
"""Original synthesized score for 'One red line', locked to the film's timeline.

D minor, 120 BPM. A sub drone and a glassy shimmer while the line is drawn; a muted pluck
arpeggio that builds scene by scene; whoosh + sub drop on every handover; ticks on focus
hops; a rising tone that tracks the download, then a chime; the arp drops out for a
lub-dub heartbeat; everything risers into one wide hit on the N with a long tail.

  python score.py            # writes out/score.wav and muxes it into the out/*.mp4 files
  python score.py --wav-only
"""
from __future__ import annotations

import argparse
import glob
import os
import subprocess

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
DUR = 21.0
N = int(SR * DUR)
T = np.arange(N) / SR
HANDOVERS = [2.4, 5.6, 9.0, 12.2, 15.2, 17.6]
HEARTBEATS = [12.2 + b for b in (0.3, 1.0, 1.6, 2.1, 2.5)]
HOPS = [5.6 + 1.45, 5.6 + 2.45]           # focus ring lands on the next tile
DL_DONE, DL_CHECK = 9.0 + 1.95, 9.0 + 2.45
N_HIT = 18.45
BEAT = 0.5                                # 120 BPM
rng = np.random.default_rng(11)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a, d, s, r, sus_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    hold = max(int(sus_len * SR) - a - d, 0)
    e = np.concatenate([np.linspace(0, 1, a, endpoint=False), np.linspace(1, s, d, endpoint=False),
                        np.full(hold, s), np.linspace(s, 0, r)])
    return np.pad(e, (0, max(n - len(e), 0)))[:n]


def lowpass(x, cutoff):
    """One-pole lowpass; cutoff may be a per-sample array."""
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def lp_fast(x, cutoff, order=2):
    """Static-cutoff lowpass via FFT (brick-ish with a soft knee) for long buffers."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** (2 * order))
    return np.fft.irfft(X, len(x))


def hp_fast(x, cutoff, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** (2 * order))
    return np.fft.irfft(X, len(x))


def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s0 = max(0, -i)
    j = min(len(buf), i + len(sig))
    buf[max(i, 0):j] += sig[s0:j - i] * gain


def saw(f, n, phase=0.0):
    p = (phase + np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR) % 1.0
    return 2 * p - 1


def reverb(x, seconds=3.2, mix=0.3, seed=0):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-tt * 6.9 / seconds)[:, None]
    ir[:, 0] = lp_fast(ir[:, 0], 6000)
    ir[:, 1] = lp_fast(ir[:, 1], 6000)
    ir /= np.sqrt((ir ** 2).sum(0))
    L = len(x) + n
    nf = 1 << (L - 1).bit_length()
    out = np.zeros((len(x), 2))
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[:, c], nf) * np.fft.rfft(ir[:, c], nf), nf)[:len(x)]
        out[:, c] = y
    return x * (1 - mix) + out * mix


# --------------------------------------------------------------------------- voices

def drone():
    """D1 + D2 + A2 sub drone, slowly breathing, swelling with the film."""
    level = np.interp(T, [0, 1.5, 2.4, 12.2, 15.0, 17.6, 18.4, 18.45, 21.0],
                      [0.0, 0.5, 0.55, 0.65, 0.8, 0.95, 1.0, 0.7, 0.0])
    sig = np.zeros(N)
    for m, g in ((26, 1.0), (38, 0.45), (45, 0.18)):
        f = hz(m) * (1 + 0.0015 * np.sin(2 * np.pi * 0.11 * T + m))
        sig += g * np.sin(2 * np.pi * np.cumsum(f) / SR)
    sig *= 1 + 0.12 * np.sin(2 * np.pi * 0.25 * T)
    return np.stack([sig, sig], 1) * level[:, None] * 0.24


def shimmer():
    """Glassy partials that rise while the spark draws the line (0.3–1.6 s)."""
    out = np.zeros((N, 2))
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    sweep = np.interp(tt, [0, 0.3, 1.6, 3.0], [0.0, 0.0, 1.0, 1.0])
    e = np.interp(tt, [0, 0.12, 1.6, 2.4, 3.0], [0, 0.6, 1.0, 0.35, 0.0])
    for k, m in enumerate((74, 81, 86, 93)):
        f = hz(m - 12) * 2 ** (sweep)
        ph = np.cumsum(f) / SR
        trem = 1 + 0.3 * np.sin(2 * np.pi * (5 + k) * tt)
        s = np.sin(2 * np.pi * ph) * trem * e / (k + 1.5)
        pan = (k % 2) * 2 - 1
        place(out[:, 0], s * (0.6 - 0.25 * pan), 0.0)
        place(out[:, 1], s * (0.6 + 0.25 * pan), 0.0)
    return out * 0.16


def pluck(f, length=0.32, bright=1800.0):
    n = int(length * SR)
    s = saw(f, n) * 0.6 + saw(f * 1.004, n, 0.3) * 0.4
    tt = np.arange(n) / SR
    cut = 300 + bright * np.exp(-tt * 18)
    s = lowpass(s, cut)
    return s * np.exp(-tt * 9) * np.minimum(tt * 400, 1)


def arp():
    """Muted pluck arpeggio. Density and brightness build per scene; out for the heartbeat."""
    out = np.zeros((N, 2))
    notes = [50, 53, 57, 62, 57, 53, 60, 57]      # D3 F3 A3 D4 A3 F3 C4 A3 (Dm7 colour)
    cache = {}
    t = 2.4
    i = 0
    while t < 18.45:
        in_beat = 12.2 <= t < 15.2
        step = BEAT / 4 if t >= 15.2 else BEAT / 2
        if not in_beat:
            m = notes[i % len(notes)] + (12 if t >= 15.2 and i % 4 == 3 else 0)
            bright = 900 + 2600 * np.interp(t, [2.4, 18.4], [0, 1])
            key = (m, int(bright / 200))
            if key not in cache:
                cache[key] = pluck(hz(m), bright=bright)
            g = np.interp(t, [2.4, 3.0, 12.0, 15.2, 18.4], [0.0, 0.7, 0.85, 0.75, 1.0])
            g *= 0.85 if i % 2 else 1.0
            pan = 0.35 * np.sin(i * 1.3)
            place(out[:, 0], cache[key], t, g * (1 - pan))
            place(out[:, 1], cache[key], t + 0.009, g * (1 + pan))
        t += step
        i += 1
    return out * 0.6


def pad():
    """Dm(add9) string-ish pad from the Screens scene into the hit."""
    chord = [50, 57, 62, 64, 65]
    e = np.interp(T, [0, 15.0, 16.4, 18.3, 18.45, 21.0], [0, 0, 0.6, 1.0, 0.0, 0.0])
    out = np.zeros((N, 2))
    for k, m in enumerate(chord):
        for c, det in enumerate((-0.004, 0.004)):
            out[:, c] += saw(hz(m) * (1 + det + 0.001 * k), N, k * 0.17)
    out[:, 0] = lp_fast(out[:, 0], 1400)
    out[:, 1] = lp_fast(out[:, 1], 1400)
    return out * e[:, None] * 0.09


def whoosh(t_center, length=1.1, gain=1.0, rise=0.75):
    n = int(length * SR)
    tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    pos = tt / length
    e = np.where(pos < rise, (pos / rise) ** 2.2, np.exp(-(pos - rise) * 14))
    cut = 400 + 6000 * e
    s = lowpass(noise, cut) * e
    st = np.stack([s * (1 - 0.4 * np.sin(np.pi * pos)), s * (0.6 + 0.4 * np.sin(np.pi * pos))], 1)
    out = np.zeros((N, 2))
    t0 = t_center - rise * length
    place(out[:, 0], st[:, 0], t0, gain)
    place(out[:, 1], st[:, 1], t0, gain)
    return out


def sub_drop(t0, f0=72.0, f1=34.0, length=1.4, gain=1.0):
    n = int(length * SR)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 7)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6) * np.minimum(tt * 300, 1)
    s = np.tanh(s * 1.6) / np.tanh(1.6)
    out = np.zeros((N, 2))
    place(out[:, 0], s, t0, gain)
    place(out[:, 1], s, t0, gain)
    return out


def tick(t0, f=2400.0, gain=1.0):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 70) + 0.3 * rng.standard_normal(n) * np.exp(-tt * 200)
    out = np.zeros((N, 2))
    place(out[:, 0], s, t0, gain * 0.8)
    place(out[:, 1], s, t0 + 0.004, gain)
    return out


def bell(t0, midis, length=2.2, gain=1.0):
    n = int(length * SR)
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for m in midis:
        f = hz(m)
        for ratio, g, dec in ((1, 1.0, 2.2), (2.76, 0.35, 5.0), (5.4, 0.15, 9.0)):
            s += g * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt * dec)
    s *= np.minimum(tt * 600, 1) / len(midis)
    out = np.zeros((N, 2))
    place(out[:, 0], s, t0, gain)
    place(out[:, 1], s, t0 + 0.012, gain)
    return out


def download_rise():
    """A soft tone that follows the download progress curve (9.3 → 10.95 s)."""
    ks = [(9.3, 0.0), (9.85, 0.38), (10.15, 0.47), (10.6, 0.84), (10.95, 1.0)]
    p = np.interp(T, [k[0] for k in ks], [k[1] for k in ks])
    e = np.interp(T, [0, 9.2, 9.5, 10.9, 11.05, 21], [0, 0, 0.5, 0.9, 0, 0])
    f = hz(69) * 2 ** (p * 1.0)
    s = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * e
    return np.stack([s, s], 1) * 0.08


def heartbeat():
    out = np.zeros((N, 2))
    for k, t0 in enumerate(HEARTBEATS):
        g = 0.32 + 0.05 * k
        for dt, gg, f0 in ((0.0, 1.0, 95.0), (0.17, 0.7, 80.0)):     # lub-dub
            out += sub_drop(t0 + dt, f0=f0, f1=42.0, length=0.45, gain=g * gg)
        out += tick(t0, f=180.0, gain=0.25 * g)
    return out


def hit():
    """The N: a sub boom, a wide Dm(add9) bloom and a falling noise tail."""
    out = sub_drop(N_HIT, f0=90.0, f1=30.0, length=2.6, gain=1.9)
    out += bell(N_HIT, [62, 69, 74, 76, 77, 81], length=3.0, gain=0.9)
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    tail = lowpass(rng.standard_normal(n), 300 + 3500 * np.exp(-tt * 2.2)) * np.exp(-tt * 2.0) * 0.5
    place(out[:, 0], tail, N_HIT)
    place(out[:, 1], tail * 0.95, N_HIT + 0.01)
    return out


def riser():
    """Pitched noise riser into the hit (16.9 → 18.45)."""
    n = int(1.55 * SR)
    tt = np.arange(n) / SR
    pos = tt / tt[-1]
    s = lowpass(rng.standard_normal(n), 300 + 7000 * pos ** 2) * pos ** 2.5
    s += 0.25 * np.sin(2 * np.pi * np.cumsum(hz(57) * 2 ** (pos * 1.0)) / SR) * pos ** 2
    out = np.zeros((N, 2))
    place(out[:, 0], s, N_HIT - 1.55, 0.55)
    place(out[:, 1], s, N_HIT - 1.55, 0.55)
    return out


# --------------------------------------------------------------------------- mix

def score():
    music = drone() + shimmer() + arp() + pad() + download_rise()
    fx = np.zeros((N, 2))
    for k, tb in enumerate(HANDOVERS):
        fx += whoosh(tb, gain=0.12 + 0.02 * k)
        if tb != 12.2:   # the heartbeat carries that handover
            fx += sub_drop(tb, gain=0.45)
    fx += tick(0.08, f=1800, gain=0.25)          # the spark
    for t0 in HOPS:
        fx += tick(t0, gain=0.4)
    fx += bell(DL_DONE, [81], length=1.4, gain=0.35)
    fx += bell(DL_CHECK, [86, 93], length=1.6, gain=0.3)
    fx += heartbeat() + riser() + hit()
    mix = reverb(music, 3.0, 0.32, seed=1) + reverb(fx, 2.2, 0.18, seed=2)
    mix = hp_fast(mix[:, 0], 22)[:, None] * [1, 0] + hp_fast(mix[:, 1], 22)[:, None] * [0, 1]
    fade = np.interp(T, [0, 0.02, 20.2, 21.0], [0, 1, 1, 0])
    mix *= fade[:, None]
    mix = np.tanh(mix * 1.4) / 1.4
    return mix / np.abs(mix).max() * 0.89


def write_wav(path, x):
    import wave
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def loudnorm_filter(wav, target=-14.0, tp=-1.0):
    """Two-pass linear loudnorm: measure first, then apply one static gain (no pumping)."""
    import json
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", f"loudnorm=I={target}:TP={tp}:LRA=11:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    return (f"loudnorm=I={target}:TP={tp}:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")


def mux(video, wav, out):
    """Copy the video stream, add the score as AAC normalised to -14 LUFS / -1 dBTP for social."""
    tmp = out + ".tmp.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", wav, "-map", "0:v:0", "-map", "1:a:0",
                    "-c:v", "copy", "-af", loudnorm_filter(wav), "-ar", "48000", "-c:a", "aac",
                    "-b:a", "256k", "-shortest", "-movflags", "+faststart", tmp], check=True)
    os.replace(tmp, out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(HERE, "out"))
    ap.add_argument("--wav-only", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    wav = os.path.join(a.out, "score.wav")
    write_wav(wav, score())
    print(wav)
    if a.wav_only:
        return
    for v in sorted(glob.glob(os.path.join(a.out, "*.mp4"))):
        mux(v, wav, v)
        print("muxed", v)


if __name__ == "__main__":
    main()
