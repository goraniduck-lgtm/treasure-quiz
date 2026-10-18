# 기초 튼튼, 문해력 기르기 (태블릿 활동지)

- 학생: `/worksheet/` (번호 선택 → 활동지 → 풀기 → 제출 → 결과·코멘트)
- 교사: `/worksheet/teacher.html` (채점함 · 번호별 · 활동지별 · 통계 · 설정)
- 저장소: 보물 찾기 퀴즈와 같은 Firebase(quiz-bomool) Realtime Database의 `ws/` 아래
  - `ws/subs/{번호}/{활동지}` 제출 답안 · `ws/fb/{번호}/{활동지}` 교사 채점·코멘트
  - `ws/hist/…` 다시 풀게 한 이전 기록 · `ws/config/closed/{활동지}` 닫힌 활동지 · `ws/seen/…` 학생 확인 시각
- 문항 데이터: `data.js` (25장). 활동지를 고치려면 Claude에게 요청.
- 설정(한 번만): Firebase 콘솔 → Authentication에서 ‘익명’, ‘이메일/비밀번호’ 켜기 → 교사 계정(goraniduck@gmail.com) 추가 →
  Realtime Database 규칙에 저장소 루트의 `database.rules.json` 붙여넣고 게시
- `?demo=1` 을 주소 뒤에 붙이면 Firebase 없이 이 브라우저 안에서만 연습(시연) 모드로 동작
