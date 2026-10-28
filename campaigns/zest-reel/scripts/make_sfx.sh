#!/usr/bin/env bash
# Placeholder SFX, synthesised with ffmpeg so the review cut has sound on every hit.
# Swap any file in assets/sfx/ for a pack sound of the same name; the composition is unchanged.
set -euo pipefail
cd "$(dirname "$0")/../assets/sfx"

gen() { # name duration expression [extra filters]
  ffmpeg -v error -y -f lavfi -i "aevalsrc='$3':s=48000:d=$2" -af "${4:-anull},aformat=channel_layouts=stereo" -ar 48000 "$1.wav"
}

# ring-pull crack: hard click + metallic ping + short burst of hiss
gen crack 0.45 "0.9*exp(-90*t)*(random(0)*2-1)+0.35*exp(-18*t)*sin(2*PI*3150*t)+0.25*exp(-25*t)*sin(2*PI*4720*t)" "highpass=f=180"
# pressurised hiss, fading
gen hiss 0.9 "0.5*(random(0)*2-1)*exp(-3.2*t)" "highpass=f=3000,lowpass=f=11000"
# slam / thump with a falling pitch
gen slam 0.5 "0.95*sin(2*PI*(78-46*t)*t)*exp(-7*t)+0.25*exp(-60*t)*(random(0)*2-1)" "lowpass=f=2400"
# small bubble pop, rising pitch
gen pop 0.09 "0.6*sin(2*PI*(380+5200*t)*t)*exp(-38*t)"
# whoosh: band-passed noise swelling in and out
gen whoosh 0.45 "0.7*(random(0)*2-1)*sin(PI*t/0.45)^2" "bandpass=f=1300:width_type=o:w=2.2"
# fizz bed: crackle of tiny pops
gen fizz 2.4 "0.45*(random(0)*2-1)*gt(random(1),0.985)*exp(-0.6*t)" "highpass=f=1800"
# pour: bubbly low-passed noise with a wobble
gen pour 2.2 "0.5*(random(0)*2-1)*(0.6+0.4*sin(2*PI*9*t))*min(1,t*6)*min(1,(2.2-t)*3)" "lowpass=f=2600,highpass=f=250"
# ice clink: two bright partials
gen clink 0.5 "0.4*exp(-9*t)*sin(2*PI*2630*t)+0.3*exp(-12*t)*sin(2*PI*3910*t)"
# sparkle: quick high shimmer
gen sparkle 0.7 "0.22*exp(-5*t)*(sin(2*PI*2960*t)+sin(2*PI*3950*t)*gt(t,0.08)+sin(2*PI*5270*t)*gt(t,0.16))"
# UI tap
gen tap 0.06 "0.8*exp(-110*t)*sin(2*PI*1900*t)"
# coral flood swell
gen swell 0.8 "0.5*(random(0)*2-1)*sin(PI*t/0.8)" "lowpass=f=700"
for f in *.wav; do printf '%s %s\n' "$f" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
