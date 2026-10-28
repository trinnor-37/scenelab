#!/usr/bin/env python3
"""Tightens the approved voice take (Ollie B) and writes word timings for the captions.

Only silences are shortened: every speech chunk is kept whole, and each cut sits inside a
pause with an 8 ms fade, so no word is clipped or retimed. The chunks were mapped to the
script by matching the take's pauses to the script's sentences (no speech model is
available in this environment), and word times inside a chunk are spread by syllable
count, so caption timing is approximate to within a syllable.

Usage: python3 -I scripts/vo_edit.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAKE = ROOT / "assets/vo/takes/ollie-B.mp3"
OUT_WAV = ROOT / "assets/vo/vo.wav"
OUT_JSON = ROOT / "assets/vo/vo-timing.json"
LEAD_IN = 0.15  # VO starts this far into the film (the hook moves from frame 0)

# Words of each speech chunk, in order. Chunk boundaries are the take's own pauses.
CHUNKS = [
    "Crack open real grapefruit.",
    "Meet Zest.",
    "Pink grapefruit sparkling water,", "made with real fruit.",
    "Pop the tab", "and hear that fizz.",
    "Cold,", "bright,", "and", "bursting with grapefruit.",
    "Real fruit.",
    "Naturally flavoured.",
    "And low sugar.",
    "Pour it over ice", "and watch it sparkle.",
    "Why the name?",
    "Zest is the fruit's bright, citrusy peel.",
    "Crack one open.",
    "Follow for more", "Zest.",
]
# Target pause after each chunk (s): ~0.2 inside a sentence, ~0.3 between sentences,
# 0.42 at a section change (the cut points of the film).
GAPS = [0.42, 0.30, 0.22, 0.42, 0.15, 0.30, 0.22, 0.22, 0.16, 0.42,
        0.22, 0.32, 0.42, 0.20, 0.42, 0.40, 0.42, 0.35, 0.30]
# Script section each chunk opens, for the film's cut points.
SECTION_STARTS = {0: "hook", 1: "meet", 4: "fizz", 10: "proofs", 13: "pour", 15: "why", 17: "cta"}

SYLLABLES = {
    "crack": 1, "open": 2, "real": 1, "grapefruit": 2, "meet": 1, "zest": 1, "pink": 1,
    "sparkling": 2, "water": 2, "made": 1, "with": 1, "fruit": 1, "pop": 1, "the": 1, "tab": 1,
    "and": 1, "hear": 1, "that": 1, "fizz": 1, "cold": 1, "bright": 1, "bursting": 2,
    "naturally": 4, "flavoured": 2, "low": 1, "sugar": 2, "pour": 1, "it": 1, "over": 2,
    "ice": 1, "watch": 1, "sparkle": 2, "why": 1, "name": 1, "is": 1, "fruit's": 1,
    "citrusy": 3, "peel": 1, "one": 1, "follow": 2, "for": 1, "more": 1,
}


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                                capture_output=True, text=True, check=True).stdout)


def speech_chunks(path):
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=n=-42dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    edges = [0.0] + [v for pair in zip(starts, ends) for v in pair] + [duration(path)]
    return [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)]


def main():
    chunks = speech_chunks(TAKE)
    assert len(chunks) == len(CHUNKS), f"take has {len(chunks)} chunks, script map has {len(CHUNKS)}"

    # Keep each chunk plus half its new pause on either side, taken from the real silence.
    pieces = []
    for i, (a, b) in enumerate(chunks):
        pre = 0.0 if i == 0 else min(GAPS[i - 1], chunks[i][0] - chunks[i - 1][1]) / 2
        post = 0.06 if i == len(chunks) - 1 else min(GAPS[i], chunks[i + 1][0] - b) / 2
        pieces.append((a - pre, b + post if i < len(chunks) - 1 else duration(TAKE), pre))

    graph, labels = [], []
    for i, (a, b, _) in enumerate(pieces):
        graph.append(f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,"
                     f"afade=t=out:st={max(0, b - a - 0.008):.4f}:d=0.008[p{i}]")
        labels.append(f"[p{i}]")
    graph.append(f"anullsrc=r=44100:cl=mono,atrim=0:{LEAD_IN}[lead]")
    graph.append("[lead]" + "".join(labels) + f"concat=n={len(pieces) + 1}:v=0:a=1,"
                 "aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=7[out]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(TAKE), "-filter_complex", ";".join(graph),
                    "-map", "[out]", "-ar", "48000", "-ac", "1", str(OUT_WAV)], check=True)

    # New time of each chunk, then words spread by syllables inside it.
    t = LEAD_IN
    words, sections, out_chunks = [], {}, []
    for i, ((a, b), (pa, pb, pre)) in enumerate(zip(chunks, pieces)):
        start = t + pre
        end = start + (b - a)
        if i in SECTION_STARTS:
            sections[SECTION_STARTS[i]] = round(start, 3)
        toks = CHUNKS[i].split()
        syl = [SYLLABLES[re.sub(r"[^a-z']", "", w.lower())] for w in toks]
        tw = start
        for w, s in zip(toks, syl):
            dw = (end - start) * s / sum(syl)
            words.append({"text": w, "start": round(tw, 3), "end": round(tw + dw, 3), "chunk": i})
            tw += dw
        out_chunks.append({"text": CHUNKS[i], "start": round(start, 3), "end": round(end, 3)})
        t += pb - pa
    total = duration(OUT_WAV)
    OUT_JSON.write_text(json.dumps({"source": TAKE.name, "lead_in": LEAD_IN, "duration": round(total, 3),
                                    "sections": sections, "chunks": out_chunks, "words": words}, indent=1))
    (ROOT / "assets/vo/vo-timing.js").write_text("window.VO = " + OUT_JSON.read_text() + ";\n")
    print(f"{OUT_WAV.name}: {total:.2f}s (take was {duration(TAKE):.2f}s); VO ends at {out_chunks[-1]['end']:.2f}s")
    for k, v in sections.items():
        print(f"  {k:7s} {v:6.2f}s")


if __name__ == "__main__":
    main()
