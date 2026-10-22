# 우리 마을 문제 해결단 (4학년 사회 · 지역 문제 해결)

- 학생: `/maeul/` → 반 고르기 → 동물마을 문제 뽑기 → 문제 확인 → 원인 조사 → 방안 탐색(힌트·설계도) → 실천(발표·게시판에 올리기)
- 교사: `/maeul/teacher.html` → 로그인(문해력 활동지와 같은 계정) → 반별 결과 보기 · 자세히 · 발표 화면 · 지우기 · 엑셀(CSV) 내려받기
- 저장소: 보물 찾기 퀴즈와 같은 Firebase(quiz-bomool) Realtime Database의 `maeul/` 아래
  - `maeul/classes/{학년-반}` 반 목록 (예: `4-2`)
  - `maeul/posts/{학년-반}/{글}` 모둠이 올린 결과 (설계도 그림은 작은 JPEG로 함께 저장)
  - `maeul/likes/{학년-반}/{글}/{학생}` 칭찬 별
- 학생은 같은 반 게시판만 보고, 자기 태블릿에서 올린 글만 지울 수 있어요. 교사는 모든 반을 보고 지울 수 있어요.
- 설정(한 번만): Firebase 콘솔 → Realtime Database → 규칙에 저장소 루트의 `database.rules.json`을 붙여넣고 게시
- 문제 이야기 21개와 그림: `index.html` 안의 `SCEN`, 그림은 `img/{이야기}-{scene|interview|observe}.jpg`
- `?demo=1` 을 주소 뒤에 붙이면 Firebase 없이 이 브라우저 안에서만 연습(시연) 모드로 동작
