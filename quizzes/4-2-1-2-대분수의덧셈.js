// 자동 생성: tools/pools_4-2-1.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-1-2-addm",
 "title": "분수 ② 대분수의 덧셈",
 "subtitle": "수학 4학년 2학기 · 1. 분수의 덧셈과 뺄셈 · 분수의 덧셈을 해요 (2)",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "gen": "fr.convert",
   "opts": {
    "to": "improper"
   }
  },
  {
   "gen": "fr.convert",
   "opts": {
    "to": "mixed"
   }
  },
  {
   "gen": "fr.calc",
   "opts": {
    "op": "+",
    "kind": "mixed",
    "carry": false
   }
  },
  {
   "gen": "fr.calc",
   "opts": {
    "op": "+",
    "kind": "mixed",
    "carry": false
   }
  },
  {
   "gen": "fr.calc",
   "opts": {
    "op": "+",
    "kind": "mixed",
    "carry": true
   }
  },
  {
   "gen": "fr.calc",
   "opts": {
    "op": "+",
    "kind": "mixed",
    "carry": true
   }
  },
  {
   "gen": "fr.word",
   "opts": {
    "op": "+",
    "kind": "mixed"
   }
  },
  {
   "gen": "fr.word",
   "opts": {
    "op": "+",
    "kind": "mixed",
    "carry": true
   }
  },
  {
   "gen": "fr.blank",
   "opts": {
    "op": "+",
    "kind": "mixed"
   }
  },
  {
   "gen": "fr.mistake",
   "opts": {
    "kind": "addMixed"
   }
  },
  {
   "gen": "fr.cmp",
   "opts": {
    "op": "+",
    "kind": "mixed"
   }
  },
  {
   "gen": "fr.best",
   "opts": {
    "op": "+",
    "kind": "mixed"
   },
   "points": 20
  }
 ]
};
