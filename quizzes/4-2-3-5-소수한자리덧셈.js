// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.
const QUIZ = {
 "id": "m42-3-5-add1",
 "title": "소수 ⑤ 소수 한 자리 수의 덧셈",
 "subtitle": "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈 · 소수 한 자리 수의 덧셈을 해요",
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
    "da": 1,
    "ipMax": 0,
    "carry": false
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "ipMax": 0,
    "carry": true
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "ipMax": 9
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "ipMax": 9,
    "carry": true
   }
  },
  {
   "gen": "dec.count01",
   "opts": {
    "op": "+"
   }
  },
  {
   "gen": "dec.op",
   "opts": {
    "op": "+",
    "da": 1,
    "vert": true,
    "carry": true
   }
  },
  {
   "gen": "dec.word",
   "opts": {
    "op": "+",
    "da": 1
   }
  },
  {
   "gen": "dec.word",
   "opts": {
    "op": "+",
    "da": 1
   }
  },
  {
   "gen": "dec.best",
   "opts": {
    "op": "+",
    "da": 1,
    "ipMax": 5
   }
  },
  {
   "gen": "dec.puzzle",
   "opts": {
    "op": "+"
   },
   "points": 20
  },
  {
   "gen": "dec.oxcalc",
   "opts": {
    "op": "+"
   }
  },
  {
   "gen": "dec.sum3",
   "opts": {
    "d": 1
   }
  }
 ]
};
