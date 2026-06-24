#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
UA='quiz-camisetas/1.0 (educational)'

download() {
  local id="$1" url="$2" ext="$3"
  local dest="public/shirts/${id}${ext}"
  if [[ -f "$dest" ]]; then echo "skip $id"; return; fi
  curl -fsSL -A "$UA" -o "$dest" "$url" && echo "ok $id" || echo "fail $id"
  sleep 1
}

download 15 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Bundesarchiv_Bild_183-N0614-0028%2C_Fu%C3%9Fball-WM%2C_Zaire_-_Schottland_0-2.jpg' .jpg
download 17 'https://upload.wikimedia.org/wikipedia/commons/3/30/Kit_body_fra78a.png' .png
download 25 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Kit_body_eng90a.png' .png
download 27 'https://upload.wikimedia.org/wikipedia/commons/2/24/Kit_body_col90a.png' .png
download 29 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Kit_body_ger94a.png' .png
download 30 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Kit_body_usa94a.png' .png
download 31 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Kit_body_nga94a.png' .png
download 32 'https://upload.wikimedia.org/wikipedia/commons/8/85/Kit_body_ita94a.png' .png
download 34 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Kit_body_cro98a.png' .png
download 36 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Kit_body_jam98a.png' .png
download 38 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Kit_body_cmr02a.png' .png
download 39 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Kit_body_sen02a.png' .png
download 40 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Kit_body_kor02a.png' .png
download 44 'https://upload.wikimedia.org/wikipedia/commons/3/37/Kit_body_ger06a.png' .png
download 47 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Kit_body_nga18a.png' .png

echo done
