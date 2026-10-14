#!/usr/bin/env python3
"""quizzes/*.js 를 훑어 교사 화면의 퀴즈 목록(quizzes/index.json)을 만든다.
새 퀴즈 파일을 넣거나 지운 뒤 한 번 실행:  python3 make_index.py"""
import json, pathlib, re, subprocess
root = pathlib.Path(__file__).resolve().parent / "quizzes"
items = []
for p in sorted(root.glob("*.js")):
    t = p.read_text(encoding="utf-8")
    g = lambda k: (m.group(2) if (m := re.search(k + r"""\s*:\s*(["'`])(.+?)\1""", t)) else "")
    count = 0
    try:  # node가 있으면 문항 수를 정확히 센다
        count = int(subprocess.run(["node", "-e", t + "\nconsole.log(QUIZ.questions.length)"], capture_output=True, text=True, timeout=10).stdout.strip() or 0)
    except Exception:
        pass
    items.append({"file": p.name, "title": g("title") or p.stem, "subtitle": g("subtitle"), "count": count})
(root / "index.json").write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"퀴즈 {len(items)}개 → quizzes/index.json")
for it in items: print(" -", it["file"], it["title"], it["count"], "문제")
