// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-6-rhomb",
 "title": "사각형 ⑥ 마름모",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 마름모를 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "short",
   "text": "네 변의 길이가 모두 같은 사각형을 [ ]라고 합니다.",
   "answer": [
    "마름모"
   ]
  },
  {
   "type": "choice",
   "text": "모눈종이에 그린 도형 중 마름모를 모두 고르세요.",
   "answer": [
    1,
    2
   ],
   "multi": true,
   "options": [
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"80,10 110,55 80,100 50,55\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"80,10 125,55 80,100 35,55\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"20,90 110,90 140,30 50,30\"/>",
      "grid": 10
     }
    },
    {
     "figure": {
      "w": 160,
      "h": 110,
      "draw": "<polygon points=\"30,25 130,25 130,85 30,85\"/>",
      "grid": 10
     }
    }
   ],
   "explain": "정사각형도 네 변의 길이가 모두 같으니 마름모예요."
  },
  {
   "type": "ox",
   "text": "마름모는 마주 보는 꼭짓점끼리 이은 두 선분이\n서로 수직으로 만납니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "마름모는 마주 보는 두 각의 크기가 다릅니다.",
   "answer": "X",
   "explain": "마름모는 마주 보는 두 각의 크기가 같아요."
  },
  {
   "type": "number",
   "text": "마름모의 네 변의 길이의 합은 몇 cm인가요?",
   "answer": 20,
   "unit": "cm",
   "figure": {
    "w": 320,
    "h": 228,
    "draw": "<polygon points=\"160,34 60,114 160,194 260,114\"/><text x=\"90\" y=\"64\" style=\"font-size:17px\">5 cm</text>"
   }
  },
  {
   "type": "number",
   "text": "마름모 ㄱㄴㄷㄹ에서 각 ㄱㄴㄷ이 80°입니다.\n각 ㄴㄱㄹ은 몇 도인가요?",
   "answer": 100,
   "unit": "°",
   "figure": {
    "w": 320,
    "h": 228,
    "draw": "<polygon points=\"160,34 60,114 160,194 260,114\"/><text x=\"160\" y=\"24\">ㄱ</text><text x=\"44\" y=\"120\">ㄴ</text><text x=\"160\" y=\"216\">ㄷ</text><text x=\"276\" y=\"120\">ㄹ</text><text x=\"94\" y=\"120\" style=\"font-size:16px\">80°</text>"
   }
  },
  {
   "type": "number",
   "text": "마름모의 마주 보는 꼭짓점끼리 이었습니다.\n각 ㄱㅇㄹ은 몇 도인가요?",
   "answer": 90,
   "unit": "°",
   "figure": {
    "w": 320,
    "h": 228,
    "draw": "<polygon points=\"160,34 60,114 160,194 260,114\"/><line x1=\"160\" y1=\"34\" x2=\"160\" y2=\"194\"/><line x1=\"60\" y1=\"114\" x2=\"260\" y2=\"114\"/><text x=\"160\" y=\"24\">ㄱ</text><text x=\"44\" y=\"120\">ㄴ</text><text x=\"160\" y=\"216\">ㄷ</text><text x=\"276\" y=\"120\">ㄹ</text><text x=\"174\" y=\"136\" style=\"font-size:17px\">ㅇ</text>"
   }
  },
  {
   "type": "number",
   "text": "마름모에서 선분 ㄱㄷ의 길이는 10 cm입니다.\n선분 ㄱㅇ은 몇 cm인가요?",
   "answer": 5,
   "unit": "cm",
   "points": 20,
   "figure": {
    "w": 320,
    "h": 228,
    "draw": "<polygon points=\"160,34 60,114 160,194 260,114\"/><line x1=\"160\" y1=\"34\" x2=\"160\" y2=\"194\"/><line x1=\"60\" y1=\"114\" x2=\"260\" y2=\"114\"/><text x=\"160\" y=\"24\">ㄱ</text><text x=\"44\" y=\"120\">ㄴ</text><text x=\"160\" y=\"216\">ㄷ</text><text x=\"276\" y=\"120\">ㄹ</text><text x=\"174\" y=\"136\" style=\"font-size:17px\">ㅇ</text>"
   },
   "explain": "마주 보는 꼭짓점끼리 이은 선분은 서로를 똑같이 둘로 나눠요."
  },
  {
   "type": "choice",
   "text": "마름모에 대한 설명으로 옳은 것을 모두 고르세요.",
   "answer": [
    1,
    2,
    4
   ],
   "multi": true,
   "options": [
    "네 변의 길이가 모두 같습니다.",
    "두 쌍의 마주 보는 변이 서로 평행합니다.",
    "네 각이 항상 모두 직각입니다.",
    "이웃한 두 각의 크기의 합이 180°입니다."
   ]
  },
  {
   "type": "ox",
   "text": "마름모는 평행사변형이라고 할 수 있습니다.",
   "answer": "O"
  },
  {
   "type": "choice",
   "text": "크기가 같은 정삼각형 2개를 겹치지 않게 이어 붙이면\n어떤 사각형이 되나요?",
   "answer": 2,
   "figure": {
    "w": 300,
    "h": 150,
    "draw": "<polygon points=\"40,130 160,130 100,26\"/><polygon points=\"160,130 220,26 100,26\"/>"
   },
   "options": [
    "직사각형",
    "마름모",
    "정사각형",
    "삼각형"
   ]
  },
  {
   "type": "number",
   "text": "마름모의 네 변의 길이의 합이 36 cm입니다.\n한 변의 길이는 몇 cm인가요?",
   "answer": 9,
   "unit": "cm"
  }
 ]
};
