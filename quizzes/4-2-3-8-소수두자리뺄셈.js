// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.
const QUIZ = {
 "id": "m42-3-8-sub2",
 "title": "소수 ⑧ 소수 두 자리 수의 뺄셈",
 "subtitle": "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈 · 소수 두 자리 수의 뺄셈을 해요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 2,
    "ipMax": 0
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 2,
    "ipMax": 1,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 2,
    "ipMax": 9,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 1,
    "db": 2,
    "ipMax": 9,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 2,
    "vert": true,
    "carry": true
   }
  },
  {
   "gen": "dec.word",
   "opts": {
    "op": "-",
    "da": 2,
    "db": 1
   }
  },
  {
   "gen": "dec.word",
   "opts": {
    "op": "-",
    "da": 2
   }
  },
  {
   "gen": "dec.best",
   "opts": {
    "op": "-",
    "da": 2,
    "ipMax": 6
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 2,
    "wholeA": true
   }
  },
  {
   "gen": "dec.wrongop",
   "points": 20
  },
  {
   "gen": "dec.diffext"
  },
  {
   "gen": "dec.oxcalc",
   "opts": {
    "op": "-",
    "ipMax": 1
   }
  }
 ]
};
