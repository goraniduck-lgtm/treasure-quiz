// 수학 4-2 · 4. 사각형 · 평행과 평행선 (86~87쪽) — 원본: 아이스크림 보물 찾기 게임 PPT
const QUIZ = {
  id: "math4-2-4-parallel",          // 퀴즈마다 다르게 (태블릿에 진행 상황 저장할 때 쓰는 이름)
  title: "평행선 보물 찾기",
  subtitle: "수학 4학년 2학기 · 4. 사각형 · 평행과 평행선 (86~87쪽)",

  settings: {
    points: 10,          // 문항 기본 배점 (문항에 points가 있으면 그 값)
    cards: 4,            // 보물 번호 카드 수
    treasures: 2,        // 카드 중 보물 개수
    treasureBonus: 5,    // 보물 1개 점수
    showAnswer: true,    // 틀렸을 때 정답 보여주기
    shuffle: false       // 문항 순서 섞기
  },

  questions: [
    {
      type: "ox",
      text: "한 직선에 수직인 두 직선을 그었을 때,\n그 두 직선은 서로 만나지 않습니다.",
      answer: "O"
    },
    {
      type: "short",
      text: "빈칸에 들어가는 말은 무엇일까요?\n서로 만나지 않는 두 직선을 [ ]하다고 합니다.",
      answer: ["평행"]
    },
    {
      type: "choice",
      text: "서로 만나지 않는 두 직선을 찾아 기호를 골라 보세요.",
      options: [
        { label: "가", figure: { w: 160, h: 110, grid: 10, draw: '<line x1="15" y1="20" x2="145" y2="52"/><line x1="15" y1="85" x2="145" y2="85"/>' } },
        { label: "나", figure: { w: 160, h: 110, grid: 10, draw: '<line x1="15" y1="35" x2="145" y2="35"/><line x1="15" y1="80" x2="145" y2="80"/>' } },
        { label: "다", figure: { w: 160, h: 110, grid: 10, draw: '<line x1="15" y1="70" x2="145" y2="70"/><line x1="80" y1="10" x2="80" y2="100"/>' } }
      ],
      answer: 2
    },
    {
      type: "number",
      text: "도형에서 서로 평행한 변은 모두 몇 쌍인가요?",
      figure: { w: 320, h: 160, grid: 20, draw: '<polygon points="100,30 220,30 280,130 40,130"/>' },
      answer: 1,
      unit: "쌍"
    },
    {
      type: "number",
      text: "도형에서 서로 평행한 변은 모두 몇 쌍인가요?",
      figure: { w: 320, h: 160, grid: 20, draw: '<polygon points="80,30 240,30 240,130 80,130"/>' },
      answer: 2,
      unit: "쌍"
    },
    {
      type: "ox",
      text: "평행한 두 직선을 수선이라고 합니다.",
      answer: "X",
      explain: "평행한 두 직선은 평행선이에요. 수선은 서로 수직인 두 직선이에요."
    },
    {
      type: "short",
      text: "다음 도형에서 변 ㄱㄴ과 평행한 변은 무엇인가요?",
      figure: { w: 320, h: 170, draw: '<rect x="50" y="30" width="220" height="110"/><text x="34" y="26">ㄱ</text><text x="286" y="26">ㄹ</text><text x="34" y="160">ㄴ</text><text x="286" y="160">ㄷ</text>' },
      answer: ["변ㄹㄷ", "ㄹㄷ", "변ㄷㄹ", "ㄷㄹ"],
      hint: "예) 변 ㅁㅂ"
    },
    {
      type: "choice",
      text: "다음 중 평행선을 찾아 보세요.",
      options: [
        { figure: { w: 160, h: 100, draw: '<line x1="20" y1="80" x2="140" y2="80"/><line x1="20" y1="80" x2="140" y2="34"/>' } },
        { figure: { w: 160, h: 100, draw: '<line x1="20" y1="50" x2="140" y2="50"/><line x1="80" y1="10" x2="80" y2="90"/>' } },
        { figure: { w: 160, h: 100, draw: '<line x1="25" y1="18" x2="135" y2="84"/><line x1="25" y1="84" x2="135" y2="18"/>' } },
        { figure: { w: 160, h: 100, draw: '<line x1="20" y1="34" x2="140" y2="34"/><line x1="20" y1="70" x2="140" y2="70"/>' } }
      ],
      answer: 4
    },
    {
      type: "ox",
      text: "직각으로 만나는 두 직선은 서로 평행합니다.",
      answer: "X",
      explain: "직각으로 만나는 두 직선은 서로 수직이에요."
    },
    {
      type: "number",
      text: "서로 평행한 직선은 모두 몇 쌍인가요?",
      figure: { w: 420, h: 205, draw:
        '<line x1="40" y1="62" x2="410" y2="62"/><line x1="40" y1="152" x2="410" y2="152"/>' +
        '<line x1="62" y1="28" x2="172" y2="198"/><line x1="232" y1="28" x2="182" y2="198"/>' +
        '<line x1="292" y1="28" x2="292" y2="198"/><line x1="322" y1="28" x2="382" y2="198"/>' +
        '<line x1="392" y1="28" x2="392" y2="198"/>' +
        '<text x="22" y="68">가</text><text x="22" y="158">나</text><text x="62" y="20">다</text>' +
        '<text x="232" y="20">라</text><text x="292" y="20">마</text><text x="322" y="20">바</text><text x="392" y="20">사</text>' },
      answer: 2,
      unit: "쌍"
    }
  ]
};
