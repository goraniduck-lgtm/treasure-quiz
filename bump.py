#!/usr/bin/env python3
"""사이트를 고친 뒤 실행: index.html / teacher.html 의 css·js 주소에 새 버전 번호(?v=)를 붙여
브라우저가 예전 파일 대신 새 파일을 받게 한다."""
import pathlib, re, time
v = time.strftime("%Y%m%d%H%M%S")
root = pathlib.Path(__file__).resolve().parent
for name in ("index.html", "teacher.html", "worksheet/index.html", "worksheet/teacher.html"):
    p = root / name
    s = p.read_text(encoding="utf-8")
    s = re.sub(r'((?:src|href)="(?!https?:)[^"?]+\.(?:js|css))(?:\?v=\d+)?"', rf'\1?v={v}"', s)
    p.write_text(s, encoding="utf-8")
# 앱 버전: 열려 있던 예전 화면이 새 버전을 알아채고 스스로 새로고침하게 한다
(root / "version.json").write_text('{"v": "%s"}\n' % v, encoding="utf-8")
c = root / "common.js"
c.write_text(re.sub(r'L\.APP_VERSION = "\d*";', f'L.APP_VERSION = "{v}";', c.read_text(encoding="utf-8")), encoding="utf-8")
print("버전", v)
