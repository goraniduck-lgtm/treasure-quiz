#!/usr/bin/env python3
"""수학 4-2 · 1. 분수의 덧셈과 뺄셈 — 차시별 '문제 틀' 목록 (교과서 2~7차시 + 단원 마무리).
숫자·글은 방·학생·시도마다 새로 뽑힌다. 분수 답은 학생이 자연수·분자·분모 칸에 넣는다(가분수·대분수 모두 정답).
고친 뒤:  python3 tools/pools_4-2-1.py  →  python3 make_index.py  →  node tools/check_gens.js
"""
import json, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "quizzes"
SET = {"points": 10, "cards": 4, "treasures": 2, "showAnswer": True}
SUB = "수학 4학년 2학기 · 1. 분수의 덧셈과 뺄셈"
def g(name, points=None, **opts):
    t = {"gen": name}
    if opts: t["opts"] = opts
    if points: t["points"] = points
    return t
P, M, ONE, WH = "proper", "mixed", "one", "whole"
pools = [
 ("4-2-1-1-진분수의덧셈.js", "m42-1-1-addp", "분수 ① 진분수의 덧셈", "분수의 덧셈을 해요 (1)", [
    g("fr.unit", mode="count"), g("fr.unit", mode="make"), g("fr.pic", op="+"), g("fr.calc", op="+", kind=P, carry=False),
    g("fr.calc", op="+", kind=P, carry=False), g("fr.calc", op="+", kind=P, carry=True), g("fr.calc", op="+", kind=P, carry=True),
    g("fr.word", op="+", kind=P), g("fr.blank", op="+", kind=P), g("fr.mistake", kind="add"), g("fr.best", op="+", kind=P),
    g("fr.sum3", 20)]),
 ("4-2-1-2-대분수의덧셈.js", "m42-1-2-addm", "분수 ② 대분수의 덧셈", "분수의 덧셈을 해요 (2)", [
    g("fr.convert", to="improper"), g("fr.convert", to="mixed"), g("fr.calc", op="+", kind=M, carry=False),
    g("fr.calc", op="+", kind=M, carry=False), g("fr.calc", op="+", kind=M, carry=True), g("fr.calc", op="+", kind=M, carry=True),
    g("fr.word", op="+", kind=M), g("fr.word", op="+", kind=M, carry=True), g("fr.blank", op="+", kind=M),
    g("fr.mistake", kind="addMixed"), g("fr.cmp", op="+", kind=M), g("fr.best", 20, op="+", kind=M)]),
 ("4-2-1-3-진분수의뺄셈.js", "m42-1-3-subp", "분수 ③ 진분수의 뺄셈", "분수의 뺄셈을 해요 (1) · 진분수의 뺄셈, 1 − 진분수", [
    g("fr.unit", mode="whole"), g("fr.pic", op="-"), g("fr.calc", op="-", kind=P), g("fr.calc", op="-", kind=P),
    g("fr.calc", op="-", kind=ONE), g("fr.calc", op="-", kind=ONE), g("fr.word", op="-", kind=P), g("fr.word", op="-", kind=ONE),
    g("fr.blank", op="-", kind=P), g("fr.cmp", op="-", kind=P), g("fr.best", op="-", kind=P), g("fr.blank", 20, op="-", kind=ONE)]),
 ("4-2-1-4-대분수의뺄셈.js", "m42-1-4-subm", "분수 ④ 받아내림이 없는 대분수의 뺄셈", "분수의 뺄셈을 해요 (2)", [
    g("fr.unit", mode="mixedcount"), g("fr.calc", op="-", kind=M, borrow=False), g("fr.calc", op="-", kind=M, borrow=False),
    g("fr.calc", op="-", kind=M, borrow=False), g("fr.word", op="-", kind=M, borrow=False), g("fr.word", op="-", kind=M, borrow=False),
    g("fr.blank", op="-", kind=M, borrow=False), g("fr.cmp", op="-", kind=M, borrow=False), g("fr.best", op="-", kind=M, borrow=False),
    g("fr.calc", op="+", kind=M), g("fr.diffext"), g("fr.blank", 20, op="+", kind=M)]),
 ("4-2-1-5-자연수와분수의뺄셈.js", "m42-1-5-subw", "분수 ⑤ 자연수와 분수의 뺄셈", "분수의 뺄셈을 해요 (3)", [
    g("fr.unit", mode="whole"), g("fr.calc", op="-", kind=WH), g("fr.calc", op="-", kind=WH), g("fr.calc", op="-", kind=WH),
    g("fr.calc", op="-", kind=WH), g("fr.word", op="-", kind=WH), g("fr.word", op="-", kind=WH), g("fr.blank", op="-", kind=WH),
    g("fr.mistake", kind="whole"), g("fr.cmp", op="-", kind=WH), g("fr.best", op="-", kind=WH), g("fr.convert", 20, to="improper")]),
 ("4-2-1-6-받아내림대분수뺄셈.js", "m42-1-6-subb", "분수 ⑥ 받아내림이 있는 대분수의 뺄셈", "분수의 뺄셈을 해요 (4)", [
    g("fr.convert", to="improper"), g("fr.calc", op="-", kind=M, borrow=True), g("fr.calc", op="-", kind=M, borrow=True),
    g("fr.calc", op="-", kind=M, borrow=True), g("fr.calc", op="-", kind=M, borrow=True), g("fr.word", op="-", kind=M, borrow=True),
    g("fr.word", op="-", kind=M, borrow=True), g("fr.blank", op="-", kind=M, borrow=True), g("fr.mistake", kind="borrow"),
    g("fr.cmp", op="-", kind=M, borrow=True), g("fr.diffext"), g("fr.best", 20, op="-", kind=M, borrow=True)]),
 ("4-2-1-9-단원마무리.js", "m42-1-9-review", "분수 ⑨ 단원 마무리", "얼마나 알고 있나요 · 문제 해결", [
    g("fr.calc", op="+", kind=P, carry=True), g("fr.calc", op="+", kind=M, carry=True), g("fr.calc", op="-", kind=ONE),
    g("fr.calc", op="-", kind=WH), g("fr.calc", op="-", kind=M, borrow=True), g("fr.word", op="+", kind=M),
    g("fr.word", op="-", kind=M), g("fr.word", op="-", kind=WH), g("fr.blank", op="-", kind=M), g("fr.mistake"),
    g("fr.cards", 20), g("fr.diffext", 20)]),
]
for fname, qid, title, sub, qs in pools:
    meta = {"id": qid, "title": title, "subtitle": SUB + " · " + sub, "settings": SET, "questions": qs}
    (OUT / fname).write_text("// 자동 생성: tools/pools_4-2-1.py 를 고쳐서 다시 만드세요\nconst QUIZ = " + json.dumps(meta, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(fname, len(qs))
