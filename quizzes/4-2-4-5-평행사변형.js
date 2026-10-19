// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-5-pgram",
 "title": "사각형 ⑤ 평행사변형",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 평행사변형을 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "short",
   "text": "마주 보는 두 쌍의 변이 서로 평행한 사각형을\n[ ]이라고 합니다.",
   "answer": [
    "평행사변형"
   ]
  },
  {
   "type": "choice",
   "text": "평행사변형을 모두 고르세요.",
   "answer": [
    1,
    3,
    4
   ],
   "multi": true,
   "options": [
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"20,85 110,85 140,25 50,25\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"20,90 140,90 110,25 50,25\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"25,30 135,30 135,85 25,85\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"80,10 120,55 80,100 40,55\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"25,85 140,95 115,20 55,40\"/>",
      "grid": 10
     }
    }
   ],
   "shuffle": true
  },
  {
   "type": "ox",
   "text": "평행사변형은 마주 보는 두 변의 길이가 같습니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "평행사변형에서 이웃한 두 각의 크기의 합은 90°입니다.",
   "answer": "X",
   "explain": "이웃한 두 각의 크기의 합은 180°예요."
  },
  {
   "gen": "geo.pgramSide"
  },
  {
   "gen": "geo.pgramAngle",
   "opts": {
    "kind": "adj"
   }
  },
  {
   "gen": "geo.pgramAngle",
   "opts": {
    "kind": "opp"
   }
  },
  {
   "gen": "geo.pgramPerim"
  },
  {
   "type": "choice",
   "text": "평행사변형이 되도록 나머지 한 꼭짓점을 찍으려고 합니다.\n어느 점에 찍어야 하나요?",
   "answer": 1,
   "figure": {
    "w": 340,
    "h": 180,
    "draw": "<line x1=\"60\" y1=\"140\" x2=\"220\" y2=\"140\"/><line x1=\"220\" y1=\"140\" x2=\"280\" y2=\"60\"/><circle cx=\"120\" cy=\"60\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"136\" y=\"54\" style=\"font-size:18px\">①</text><circle cx=\"80\" cy=\"40\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"96\" y=\"34\" style=\"font-size:18px\">②</text><circle cx=\"180\" cy=\"40\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"196\" y=\"34\" style=\"font-size:18px\">③</text><circle cx=\"60\" cy=\"80\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"76\" y=\"74\" style=\"font-size:18px\">④</text>",
    "grid": 20
   },
   "options": [
    {
     "label": "①"
    },
    {
     "label": "②"
    },
    {
     "label": "③"
    },
    {
     "label": "④"
    }
   ]
  },
  {
   "type": "number",
   "text": "평행사변형에서 이웃한 두 각의 크기의 합은 몇 도인가요?",
   "answer": 180,
   "unit": "°"
  },
  {
   "type": "choice",
   "text": "평행사변형에 대해 잘못 말한 친구는 누구인가요?",
   "answer": 4,
   "options": [
    "가온: 마주 보는 두 각의 크기가 같아.",
    "나래: 마주 보는 두 변의 길이가 같아.",
    "다온: 네 각의 크기의 합은 360°야.",
    "라희: 네 변의 길이가 항상 모두 같아."
   ],
   "shuffle": true
  },
  {
   "gen": "geo.pgramPerim",
   "opts": {
    "inverse": true
   },
   "points": 20
  }
 ]
};
