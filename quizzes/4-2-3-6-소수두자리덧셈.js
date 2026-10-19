// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.
const QUIZ = {
 "id": "m42-3-6-add2",
 "title": "소수 ⑥ 소수 두 자리 수의 덧셈",
 "subtitle": "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈 · 소수 두 자리 수의 덧셈을 해요",
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
    "op": "+",
    "da": 2,
    "ipMax": 0,
    "carry": false
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 2,
    "ipMax": 0,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 2,
    "ipMax": 9,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "db": 2,
    "ipMax": 9
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 2,
    "vert": true,
    "carry": true
   }
  },
  {
   "gen": "dec.word",
   "opts": {
    "op": "+",
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
   "opts": {
    "kinds": [
     "minusBox"
    ]
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 2,
    "db": 1,
    "vert": true
   }
  },
  {
   "gen": "dec.best",
   "opts": {
    "op": "+",
    "da": 2,
    "db": 1,
    "ipMax": 4
   }
  },
  {
   "gen": "dec.inverse",
   "opts": {
    "kinds": [
     "plusBox"
    ]
   }
  },
  {
   "gen": "dec.sum3",
   "opts": {
    "d": 2
   },
   "points": 20
  }
 ]
};
