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
   "gen": "pick",
   "opts": {
    "items": [
     {
      "type": "short",
      "text": "두 직선이 만나서 이루는 각이 직각일 때,\n두 직선은 서로 [ ]이라고 합니다.",
      "answer": [
       "수직"
      ]
     },
     {
      "type": "short",
      "text": "두 직선이 서로 수직일 때,\n한 직선을 다른 직선에 대한 [ ]이라고 합니다.",
      "answer": [
       "수선"
      ]
     },
     {
      "type": "short",
      "text": "서로 만나지 않는 두 직선을 [ ]하다고 합니다.",
      "answer": [
       "평행"
      ]
     },
     {
      "type": "short",
      "text": "평행한 두 직선을 [ ]이라고 합니다.",
      "answer": [
       "평행선"
      ]
     },
     {
      "type": "short",
      "text": "평행한 변이 한 쌍이라도 있는 사각형을\n[ ]이라고 합니다.",
      "answer": [
       "사다리꼴"
      ]
     },
     {
      "type": "short",
      "text": "마주 보는 두 쌍의 변이 서로 평행한 사각형을\n[ ]이라고 합니다.",
      "answer": [
       "평행사변형"
      ]
     },
     {
      "type": "short",
      "text": "네 변의 길이가 모두 같은 사각형을 [ ]라고 합니다.",
      "answer": [
       "마름모"
      ]
     }
    ]
   }
  },
  {
   "gen": "geo.sidePairs",
   "opts": {
    "rel": "perp"
   }
  },
  {
   "gen": "geo.gridDist"
  },
  {
   "gen": "geo.classify"
  },
  {
   "gen": "geo.adjAngle"
  },
  {
   "gen": "geo.rhombPerim"
  },
  {
   "gen": "geo.inclusion"
  },
  {
   "gen": "geo.propsOf"
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
   "gen": "geo.pointPick"
  },
  {
   "gen": "geo.trapCut"
  }
 ]
};
