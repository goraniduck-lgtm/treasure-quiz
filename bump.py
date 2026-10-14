#!/usr/bin/env python3
"""사이트를 고친 뒤 실행: index.html / teacher.html 의 css·js 주소에 새 버전 번호(?v=)를 붙여
브라우저가 예전 파일 대신 새 파일을 받게 한다."""
import pathlib, re, time
v = time.strftime("%Y%m%d%H%M%S")
root = pathlib.Path(__file__).resolve().parent
for name in ("index.html", "teacher.html"):
    p = root / name
    s = p.read_text(encoding="utf-8")
    s = re.sub(r'((?:src|href)="(?!https?:)[^"?]+\.(?:js|css))(?:\?v=\d+)?"', rf'\1?v={v}"', s)
    p.write_text(s, encoding="utf-8")
print("버전", v)
