// 자동 생성: tools/gen_4-2-4.py 를 고쳐서 다시 만드세요
const QUIZ = {
 "id": "m42-4-7-quads",
 "title": "사각형 ⑦ 여러 가지 사각형",
 "subtitle": "수학 4학년 2학기 · 4. 사각형 · 여러 가지 사각형을 알아봐요",
 "settings": {
  "points": 10,
  "cards": 4,
  "treasures": 2,
  "showAnswer": true
 },
 "questions": [
  {
   "type": "ox",
   "text": "정사각형은 마름모입니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "마름모는 모두 정사각형입니다.",
   "answer": "X",
   "explain": "네 각이 직각인 마름모만 정사각형이에요."
  },
  {
   "type": "ox",
   "text": "직사각형은 평행사변형입니다.",
   "answer": "O"
  },
  {
   "type": "ox",
   "text": "평행사변형은 모두 직사각형입니다.",
   "answer": "X"
  },
  {
   "type": "choice",
   "text": "정사각형을 부를 수 있는 이름을 모두 고르세요.",
   "answer": [
    1,
    2,
    3,
    4
   ],
   "multi": true,
   "points": 20,
   "options": [
    "사다리꼴",
    "평행사변형",
    "마름모",
    "직사각형"
   ],
   "explain": "정사각형은 사다리꼴, 평행사변형, 마름모, 직사각형의 성질을 모두 가지고 있어요.",
   "shuffle": true
  },
  {
   "type": "choice",
   "text": "직사각형의 성질을 모두 고르세요.",
   "answer": [
    1,
    2,
    4
   ],
   "multi": true,
   "options": [
    "네 각이 모두 직각입니다.",
    "마주 보는 두 변의 길이가 같습니다.",
    "네 변의 길이가 항상 모두 같습니다.",
    "두 쌍의 마주 보는 변이 서로 평행합니다."
   ],
   "shuffle": true
  },
  {
   "gen": "geo.classify",
   "opts": {
    "ask": "para"
   }
  },
  {
   "gen": "geo.classify",
   "opts": {
    "ask": "rhomb"
   }
  },
  {
   "gen": "geo.classify",
   "opts": {
    "ask": "rect"
   }
  },
  {
   "gen": "geo.classify",
   "opts": {
    "ask": "trap"
   },
   "points": 20
  },
  {
   "gen": "geo.squarePerim"
  },
  {
   "type": "ox",
   "text": "네 각이 모두 직각이고 네 변의 길이가 모두 같은 사각형은\n정사각형입니다.",
   "answer": "O"
  }
 ]
};
