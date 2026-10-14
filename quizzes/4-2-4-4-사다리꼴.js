// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-4-trap",
 "title": "사각형 ④ 사다리꼴",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 사다리꼴을 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "short",
   "text": "평행한 변이 한 쌍이라도 있는 사각형을\n[ ]이라고 합니다.",
   "answer": [
    "사다리꼴"
   ]
  },
  {
   "type": "choice",
   "text": "사다리꼴을 모두 고르세요.",
   "answer": [
    1,
    3,
    5
   ],
   "multi": true,
   "options": [
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
      "draw": "<polygon points=\"25,85 140,95 115,20 55,40\"/>",
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
      "draw": "<polygon points=\"20,90 140,90 90,20\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"20,85 110,85 140,25 50,25\"/>",
      "grid": 10
     }
    }
   ],
   "explain": "평행한 변이 한 쌍이라도 있으면 사다리꼴이에요. 직사각형과 평행사변형도 사다리꼴이에요."
  },
  {
   "type": "ox",
   "text": "직사각형은 사다리꼴이라고 할 수 있습니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "사다리꼴은 평행한 변이 반드시 두 쌍입니다.",
   "answer": "X",
   "explain": "평행한 변이 한 쌍만 있어도 사다리꼴이에요."
  },
  {
   "type": "number",
   "text": "사다리꼴에서 서로 평행한 변은 몇 쌍인가요?",
   "answer": 1,
   "unit": "쌍",
   "figure": {
    "w": 320,
    "h": 160,
    "draw": "<polygon points=\"40,130 280,130 220,40 120,40\"/>",
    "grid": 20
   }
  },
  {
   "type": "choice",
   "text": "두 선분을 변으로 하는 사다리꼴을 그리려고 합니다.\n나머지 한 꼭짓점은 어디에 찍어야 하나요?",
   "answer": 1,
   "figure": {
    "w": 260,
    "h": 180,
    "draw": "<line x1=\"40\" y1=\"140\" x2=\"200\" y2=\"140\"/><line x1=\"200\" y1=\"140\" x2=\"160\" y2=\"60\"/><circle cx=\"60\" cy=\"60\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"76\" y=\"54\" style=\"font-size:18px\">①</text><circle cx=\"100\" cy=\"40\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"116\" y=\"34\" style=\"font-size:18px\">②</text><circle cx=\"120\" cy=\"100\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"136\" y=\"94\" style=\"font-size:18px\">③</text><circle cx=\"20\" cy=\"80\" r=\"4\" style=\"fill:#1D2A44;stroke:none\"/><text x=\"22\" y=\"104\" style=\"font-size:18px\">④</text>",
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
   "type": "choice",
   "text": "사다리꼴에 대한 설명으로 옳은 것을 모두 고르세요.",
   "answer": [
    1,
    3
   ],
   "multi": true,
   "options": [
    "마주 보는 변이 한 쌍 이상 평행합니다.",
    "네 변의 길이가 모두 같습니다.",
    "변이 4개인 사각형입니다.",
    "네 각이 모두 직각입니다."
   ]
  },
  {
   "type": "number",
   "text": "직사각형 모양의 종이띠를 선을 따라 잘랐습니다.\n잘라 낸 도형 중 사다리꼴은 모두 몇 개인가요?",
   "answer": 5,
   "unit": "개",
   "points": 20,
   "figure": {
    "w": 400,
    "h": 160,
    "draw": "<polygon points=\"20,40 380,40 380,120 20,120\"/><line x1=\"80\" y1=\"40\" x2=\"110\" y2=\"120\"/><line x1=\"180\" y1=\"40\" x2=\"180\" y2=\"120\"/><line x1=\"250\" y1=\"40\" x2=\"220\" y2=\"120\"/><line x1=\"300\" y1=\"40\" x2=\"340\" y2=\"120\"/>"
   },
   "explain": "종이띠의 위아래 변이 평행해서 잘라 낸 사각형 5개가 모두 사다리꼴이에요."
  },
  {
   "type": "ox",
   "text": "평행사변형도 사다리꼴입니다.",
   "answer": "O"
  },
  {
   "type": "choice",
   "text": "다음 도형이 사다리꼴이 아닌 까닭은 무엇인가요?",
   "answer": 1,
   "figure": {
    "w": 300,
    "h": 170,
    "draw": "<polygon points=\"50,140 250,150 220,40 110,60\"/>"
   },
   "options": [
    "평행한 변이 없기 때문에",
    "네 변의 길이가 다르기 때문에",
    "직각이 없기 때문에",
    "꼭짓점이 4개이기 때문에"
   ]
  }
 ]
};
