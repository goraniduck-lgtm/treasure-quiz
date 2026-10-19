#!/usr/bin/env python3
"""수학 4-2 · 3. 소수의 덧셈과 뺄셈 — 차시별 '문제 틀' 목록.
각 줄은 generators.js 의 문제 틀 이름과 옵션. 숫자는 방·학생·시도마다 새로 뽑힌다.
고친 뒤:  python3 tools/pools_4-2-3.py  →  python3 make_index.py  →  node tools/check_gens.js
"""
import json, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "quizzes"
SET = {"points": 10, "cards": 4, "treasures": 2, "showAnswer": True}
SUB = "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈"
def g(name, points=None, **opts):
    t = {"gen": name}
    if opts: t["opts"] = opts
    if points: t["points"] = points
    return t

pools = [
 ("4-2-3-1-소수두자리수.js", "m42-3-1-dec2", "소수 ① 소수 두 자리 수", "소수 두 자리 수를 알아봐요", [
    g("dec.grid"), g("dec.frac", d=2), g("dec.read", d=2), g("dec.place", d=2), g("dec.value", d=2),
    g("dec.compose", d=2), g("dec.count", d=2), g("dec.numline", d=2), g("dec.unit", d=2), g("dec.write", d=2),
    g("dec.step"), g("dec.find", 20, d=2)]),
 ("4-2-3-2-소수세자리수.js", "m42-3-2-dec3", "소수 ② 소수 세 자리 수", "소수 세 자리 수를 알아봐요", [
    g("dec.frac", d=3), g("dec.read", d=3), g("dec.value", d=3), g("dec.place", d=3), g("dec.compose", d=3),
    g("dec.count", d=3), g("dec.numline", d=3), g("dec.unit", d=3), g("dec.least"), g("dec.write", d=3),
    g("dec.value", d=3), g("dec.find", 20, d=3)]),
 ("4-2-3-3-소수사이관계.js", "m42-3-3-rel", "소수 ③ 소수 사이의 관계", "소수 사이의 관계를 알아봐요", [
    g("dec.times", ops=["x10"]), g("dec.times", ops=["x100", "x1000"]), g("dec.times", ops=["/10"]), g("dec.times", ops=["/100"]),
    g("dec.times"), g("dec.times"), g("dec.shift"), g("dec.times", ops=["x10", "/10"]), g("dec.ratio"), g("dec.oddone"),
    g("dec.timesword"), g("dec.mistake10", 20)]),
 ("4-2-3-4-소수크기비교.js", "m42-3-4-cmp", "소수 ④ 소수의 크기 비교", "소수의 크기를 비교해요", [
    g("dec.cmp"), g("dec.cmp"), g("dec.cmp"), g("dec.cmp"), g("dec.extreme", which="max"), g("dec.extreme", which="min"),
    g("dec.gridcmp"), g("dec.wordcmp"), g("dec.extreme"), g("dec.cmp"), g("dec.blank", 20), g("dec.cards")]),
 ("4-2-3-5-소수한자리덧셈.js", "m42-3-5-add1", "소수 ⑤ 소수 한 자리 수의 덧셈", "소수 한 자리 수의 덧셈을 해요", [
    g("dec.op", op="+", da=1, ipMax=0, carry=False), g("dec.op", op="+", da=1, ipMax=0, carry=True), g("dec.op", op="+", da=1, ipMax=9),
    g("dec.op", op="+", da=1, ipMax=9, carry=True), g("dec.count01", op="+"), g("dec.op", op="+", da=1, vert=True, carry=True),
    g("dec.word", op="+", da=1), g("dec.word", op="+", da=1), g("dec.best", op="+", da=1, ipMax=5),
    g("dec.puzzle", 20, op="+"), g("dec.oxcalc", op="+"), g("dec.sum3", d=1)]),
 ("4-2-3-6-소수두자리덧셈.js", "m42-3-6-add2", "소수 ⑥ 소수 두 자리 수의 덧셈", "소수 두 자리 수의 덧셈을 해요", [
    g("dec.op", op="+", da=2, ipMax=0, carry=False), g("dec.op", op="+", da=2, ipMax=0, carry=True), g("dec.op", op="+", da=2, ipMax=9, carry=True),
    g("dec.op", op="+", da=1, db=2, ipMax=9), g("dec.op", op="+", da=2, vert=True, carry=True), g("dec.word", op="+", da=2, db=1),
    g("dec.word", op="+", da=2), g("dec.inverse", kinds=["minusBox"]), g("dec.op", op="+", da=2, db=1, vert=True),
    g("dec.best", op="+", da=2, db=1, ipMax=4), g("dec.inverse", kinds=["plusBox"]), g("dec.sum3", 20, d=2)]),
 ("4-2-3-7-소수한자리뺄셈.js", "m42-3-7-sub1", "소수 ⑦ 소수 한 자리 수의 뺄셈", "소수 한 자리 수의 뺄셈을 해요", [
    g("dec.op", op="-", da=1, ipMax=0), g("dec.op", op="-", da=1, ipMax=1, carry=True), g("dec.op", op="-", da=1, ipMax=9, carry=True),
    g("dec.op", op="-", da=1, db=1, wholeA=True), g("dec.op", op="-", da=1, vert=True, carry=True), g("dec.word", op="-", da=1),
    g("dec.word", op="-", da=1), g("dec.count01", op="-", ipMax=1), g("dec.best", op="-", da=1, ipMax=7),
    g("dec.puzzle", 20, op="-"), g("dec.oxcalc", op="-", ipMax=1), g("dec.inverse", kinds=["addTo"], da=1)]),
 ("4-2-3-8-소수두자리뺄셈.js", "m42-3-8-sub2", "소수 ⑧ 소수 두 자리 수의 뺄셈", "소수 두 자리 수의 뺄셈을 해요", [
    g("dec.op", op="-", da=2, ipMax=0), g("dec.op", op="-", da=2, ipMax=1, carry=True), g("dec.op", op="-", da=2, ipMax=9, carry=True),
    g("dec.op", op="-", da=1, db=2, ipMax=9, carry=True), g("dec.op", op="-", da=2, vert=True, carry=True), g("dec.word", op="-", da=2, db=1),
    g("dec.word", op="-", da=2), g("dec.best", op="-", da=2, ipMax=6), g("dec.op", op="-", da=2, wholeA=True),
    g("dec.wrongop", 20), g("dec.diffext"), g("dec.oxcalc", op="-", ipMax=1)]),
 ("4-2-3-9-단원마무리.js", "m42-3-9-review", "소수 ⑨ 단원 마무리", "얼마나 알고 있나요", [
    g("dec.grid"), g("dec.read", d=3), g("dec.value", d=3), g("dec.times"), g("dec.times", ops=["/100"]), g("dec.cmp"),
    g("dec.op", op="+", da=1, carry=True), g("dec.op", op="+", da=2, db=1), g("dec.op", op="-", da=1, db=2, carry=True),
    g("dec.word", op="-", da=2, db=1), g("dec.word", op="+", da=2), g("dec.inverse", 20)]),
]
for fname, qid, title, sub, qs in pools:
    meta = {"id": qid, "title": title, "subtitle": f"{SUB} · {sub}", "settings": SET, "questions": qs}
    js = "// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.\nconst QUIZ = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n"
    (OUT / fname).write_text(js, encoding="utf-8")
    print(fname, len(qs))
