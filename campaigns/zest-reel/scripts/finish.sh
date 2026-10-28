#!/usr/bin/env bash
# Renders the reel, then levels the mix to -14 LUFS / -1 dBTP (two-pass, linear) and trims to 30.0 s.
# Picture is stream-copied; only the audio is re-encoded.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${HYPERFRAMES_BROWSER_PATH:=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}"
export HYPERFRAMES_BROWSER_PATH
mkdir -p renders
npx -y hyperframes@0.8.211 render -o renders/zest-reel-review-raw.mp4 -f 30 -q looks

m=$(ffmpeg -hide_banner -i renders/zest-reel-review-raw.mp4 -af loudnorm=I=-14:TP=-1:LRA=7:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { python3 -I -c "import json,sys; print(json.load(sys.stdin)['$1'])" <<<"$m"; }
ffmpeg -v error -y -i renders/zest-reel-review-raw.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=7:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -t 30 -movflags +faststart renders/zest-reel-review.mp4
ffmpeg -hide_banner -i renders/zest-reel-review.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I:|Peak:)'
ffprobe -v error -show_entries format=duration -of csv=p=0 renders/zest-reel-review.mp4
