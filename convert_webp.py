#!/usr/bin/env python3
from pathlib import Path
import subprocess

src = Path('/home/moi6/webs/quiz-camisetas/public/shirts')
dst = Path('/home/moi6/webs/quiz-camisetas/public/shirts-webp')
dst.mkdir(exist_ok=True)

for jpg in sorted(src.glob('*.jpg')):
    out = dst / (jpg.stem + '.webp')
    subprocess.run(['cwebp', '-q', '82', str(jpg), '-o', str(out)], capture_output=True)
    size_kb = out.stat().st_size // 1024
    orig_kb = jpg.stat().st_size // 1024
    print(f'{jpg.name}: {orig_kb}KB -> {size_kb}KB')

print('Done!')
