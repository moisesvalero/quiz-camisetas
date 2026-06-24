#!/usr/bin/env bash
cd /home/moi6/webs/quiz-camisetas || exit 1
ls -la public/shirts/*.png 2>/dev/null | wc -l
for i in $(seq 1 50); do
  [ -f "public/shirts/$i.png" ] || echo "missing:$i"
done
