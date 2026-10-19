// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-3-dist",
 "title": "사각형 ③ 평행선 사이의 거리",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 평행선 사이의 거리를 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "choice",
   "text": "평행선 사이의 수선의 길이를 무엇이라고 하나요?",
   "answer": 2,
   "options": [
    "수선",
    "평행선 사이의 거리",
    "직각",
    "평행선"
   ],
   "shuffle": true
  },
  {
   "type": "choice",
   "text": "평행선 사이의 거리를 나타내는 선분을 고르세요.",
   "answer": 2,
   "figure": {
    "w": 400,
    "h": 190,
    "draw": "<line x1=\"20\" y1=\"40\" x2=\"380\" y2=\"40\"/><text x=\"16\" y=\"30\">가</text><line x1=\"20\" y1=\"150\" x2=\"380\" y2=\"150\"/><text x=\"16\" y=\"170\">나</text><line x1=\"70\" y1=\"40\" x2=\"130\" y2=\"150\"/><text x=\"84\" y=\"104\" style=\"font-size:18px\">㉠</text><line x1=\"200\" y1=\"40\" x2=\"200\" y2=\"150\"/><path d=\"M 210 150 L 210 140 L 200 140\" style=\"stroke-width:2\"/><text x=\"220\" y=\"104\" style=\"font-size:18px\">㉡</text><line x1=\"330\" y1=\"40\" x2=\"270\" y2=\"150\"/><text x=\"320\" y=\"104\" style=\"font-size:18px\">㉢</text>"
   },
   "options": [
    {
     "label": "㉠"
    },
    {
     "label": "㉡"
    },
    {
     "label": "㉢"
    }
   ]
  },
  {
   "gen": "geo.gridDist"
  },
  {
   "gen": "geo.rectDist"
  },
  {
   "gen": "geo.parSum",
   "opts": {
    "lines": 4
   },
   "points": 20
  },
  {
   "type": "ox",
   "text": "평행선 사이에 그은 선분 중에서\n수선의 길이가 가장 짧습니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "평행선 사이의 거리는 어느 곳에서 재어도 같습니다.",
   "answer": "O"
  },
  {
   "gen": "geo.pgramHeight"
  },
  {
   "gen": "geo.slantDist"
  },
  {
   "type": "short",
   "text": "평행선 사이의 거리를 잴 때는\n평행선에 [ ]인 선분의 길이를 잽니다.",
   "answer": [
    "수직"
   ]
  }
 ]
};
