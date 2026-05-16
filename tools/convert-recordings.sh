#!/usr/bin/env bash
# Convert recorder.html output (webm/m4a) → mp3 + loudness-normalize.
# If chant-full is missing, auto-build it from line-1..9 with 0.5s gaps.

set -euo pipefail

DST="$(cd "$(dirname "$0")/.." && pwd)/www/assets/audio"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Audio folder: $DST"
cd "$DST"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install via: brew install ffmpeg" >&2
  exit 1
fi

found=0
for i in 1 2 3 4 5 6 7 8 9 chant-full; do
  base=$([ "$i" = "chant-full" ] && echo "chant-full" || echo "line-$i")
  src=""
  for ext in webm m4a mp4 ogg; do
    if [ -f "$base.$ext" ]; then src="$base.$ext"; break; fi
  done
  if [ -z "$src" ]; then
    if [ "$i" = "chant-full" ]; then
      continue
    else
      echo "  ⚠️  $base.{webm,m4a} missing — skipping"
      continue
    fi
  fi
  echo "  → $src → $base.mp3 (mono 22.05kHz, loudnorm I=-18)"
  ffmpeg -loglevel error -y -i "$src" \
    -af "loudnorm=I=-18:TP=-1.5:LRA=11" \
    -c:a libmp3lame -q:a 5 -ar 22050 -ac 1 \
    "$TMP/$base.mp3"
  mv "$TMP/$base.mp3" "$base.mp3"
  rm -f "$src"
  found=$((found+1))
done

# Auto-build chant-full from 9 lines if not recorded.
if [ ! -f chant-full.mp3 ] || [ "$(ffprobe -v error -show_entries format=duration -of csv=p=0 chant-full.mp3)" = "0.500000" ] 2>/dev/null; then
  if [ -f line-1.mp3 ] && [ -f line-9.mp3 ]; then
    echo "  → auto-building chant-full.mp3 from line-1..9 (0.5s gaps)"
    ffmpeg -loglevel error -y -f lavfi -i anullsrc=r=22050:cl=mono -t 0.5 \
      -c:a libmp3lame -q:a 5 "$TMP/silence.mp3"
    {
      for i in 1 2 3 4 5 6 7 8 9; do
        echo "file '$DST/line-$i.mp3'"
        [ "$i" != "9" ] && echo "file '$TMP/silence.mp3'"
      done
    } > "$TMP/concat.list"
    ffmpeg -loglevel error -y -f concat -safe 0 -i "$TMP/concat.list" \
      -c:a libmp3lame -q:a 5 -ar 22050 -ac 1 "$TMP/chant-full.mp3"
    mv "$TMP/chant-full.mp3" chant-full.mp3
  fi
fi

echo ""
echo "Done. Files in $DST:"
ls -la *.mp3 2>/dev/null
echo ""
echo "Refresh http://localhost:8000/ to hear your voice in the puzzle."
