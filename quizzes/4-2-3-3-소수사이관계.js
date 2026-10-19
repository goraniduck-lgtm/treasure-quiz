// 자동 생성: tools/pools_4-2-3.py 를 고쳐서 다시 만드세요. 숫자는 generators.js 가 매번 새로 뽑아요.
const QUIZ = {
 "id": "m42-3-3-rel",
 "title": "소수 ③ 소수 사이의 관계",
 "subtitle": "수학 4학년 2학기 · 3. 소수의 덧셈과 뺄셈 · 소수 사이의 관계를 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "gen": "dec.times",
   "opts": {
    "ops": [
     "x10"
    ]
   }
  },
  {
   "gen": "dec.times",
   "opts": {
    "ops": [
     "x100",
     "x1000"
    ]
   }
  },
  {
   "gen": "dec.times",
   "opts": {
    "ops": [
     "/10"
    ]
   }
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
   "gen": "dec.times"
  },
  {
   "gen": "dec.times"
  },
  {
   "gen": "dec.shift"
  },
  {
   "gen": "dec.times",
   "opts": {
    "ops": [
     "x10",
     "/10"
    ]
   }
  },
  {
   "gen": "dec.ratio"
  },
  {
   "gen": "dec.oddone"
  },
  {
   "gen": "dec.timesword"
  },
  {
   "gen": "dec.mistake10",
   "points": 20
  }
 ]
};
