// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-9-review",
 "title": "사각형 ⑨ 단원 마무리",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 얼마나 알고 있나요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "short",
   "text": "직선 가와 직선 나가 서로 수직으로 만날 때,\n직선 나는 직선 가에 대한 [ ]입니다.",
   "answer": [
    "수선"
   ]
  },
  {
   "type": "number",
   "text": "직사각형에서 서로 수직인 두 변은 모두 몇 쌍인가요?",
   "answer": 4,
   "unit": "쌍",
   "figure": {
    "w": 300,
    "h": 160,
    "draw": "<polygon points=\"50,30 250,30 250,130 50,130\"/>"
   }
  },
  {
   "gen": "geo.gridDist"
  },
  {
   "gen": "geo.classify",
   "opts": {
    "ask": "para"
   }
  },
  {
   "gen": "geo.adjAngle"
  },
  {
   "gen": "geo.rhombPerim"
  },
  {
   "type": "ox",
   "text": "사다리꼴은 모두 평행사변형입니다.",
   "answer": "X"
  },
  {
   "type": "ox",
   "text": "정사각형은 직사각형입니다.",
   "answer": "O"
  },
  {
   "type": "choice",
   "text": "두 쌍의 마주 보는 변이 평행하고 네 각이 모두 직각이지만\n네 변의 길이가 모두 같지는 않은 사각형은?",
   "answer": 2,
   "options": [
    "정사각형",
    "직사각형",
    "마름모",
    "사다리꼴"
   ],
   "shuffle": true
  },
  {
   "gen": "geo.parSum",
   "opts": {
    "lines": 3
   }
  },
  {
   "gen": "geo.perpAngle",
   "points": 20
  },
  {
   "type": "short",
   "text": "마주 보는 두 쌍의 변이 서로 평행한 사각형을\n[ ]이라고 합니다.",
   "answer": [
    "평행사변형"
   ]
  }
 ]
};
