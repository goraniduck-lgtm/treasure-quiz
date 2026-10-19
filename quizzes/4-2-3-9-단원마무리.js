// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.
const QUIZ = {
 "id": "m42-3-9-review",
 "title": "소수 ⑨ 단원 마무리",
 "subtitle": "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈 · 얼마나 알고 있나요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "gen": "dec.grid"
  },
  {
   "gen": "dec.read",
   "opts": {
    "d": 3
   }
  },
  {
   "gen": "dec.value",
   "opts": {
    "d": 3
   }
  },
  {
   "gen": "dec.times"
  },
  {
   "gen": "dec.times",
   "opts": {
    "ops": [
     "/100"
    ]
   }
  },
  {
   "gen": "dec.cmp"
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 2,
    "db": 1
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "-",
    "da": 1,
    "db": 2,
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
    "op": "+",
    "da": 2
   }
  },
  {
   "gen": "dec.inverse",
   "points": 20
  }
 ]
};
