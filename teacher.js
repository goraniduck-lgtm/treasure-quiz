/* 교사 화면: 퀴즈 골라 방 만들기 → 접속 확인 → 문제 열기/넘기기 → 제출 현황 → 결과·순위 → 수업 끝내기 */
(function () {
  "use strict";
  const L = window.LQ, esc = L.esc;
  const app = document.getElementById("app");
  const B = L.makeBackend();
  const T_KEY = "live-quiz-teacher";

  let code = null, Q = null, R = null;  // 방 코드, 퀴즈, 방 전체 데이터
  let showMarks = false, showAns = false, confirmEnd = false, unsub = null;
  const studentUrl = () => location.href.replace(/[#?].*$/, "").replace(/teacher\.html$/, "");

  function banner() {
    if (B.kind === "demo") return `<div class="banner">연습(데모) 모드: 같은 컴퓨터의 다른 탭에서 학생 화면(${esc(studentUrl())})을 열어 시험해 볼 수 있어요. firebase-config.js에 설정을 넣으면 교실 태블릿끼리 연결돼요.</div>`;
    return "";
  }
  L.netBanner(B);

  // ---------- setup ----------
  async function viewSetup() {
    app.innerHTML = `<div class="t-wrap"><div class="setup card"><div class="hero">${L.CHEST}<h1>퀴즈 방 만들기</h1><p>불러오는 중…</p></div></div></div>`;
    const list = await L.loadQuizList().catch(() => []);
    const saved = L.store.get(T_KEY);
    let resume = "";
    if (saved && saved.code) {
      const r = await B.get("rooms/" + saved.code).catch(() => null);
      if (r && r.quiz) resume = `<div class="banner">진행 중인 방 <b>${esc(saved.code)}</b> (${esc(r.title || r.quiz)})이 있어요. <button class="go ghost" id="resume" style="margin-left:8px">이어서 진행</button></div>`;
    }
    const items = list.map((it, i) => `<label><input type="radio" name="qz" value="${esc(it.file)}" ${i === 0 ? "checked" : ""}><span><span class="qt">${esc(it.title)}</span><br><span class="qs">${esc(it.subtitle || "")}${it.count ? ` · ${it.count}문제` : ""}</span></span></label>`).join("");
    app.innerHTML = `<div class="t-wrap">${banner()}
      <div class="setup card">
        <div class="hero">${L.CHEST}<h1>퀴즈 방 만들기</h1><p>오늘 할 퀴즈를 고르고 방을 열어요. 학생은 방 코드로 들어와요.</p></div>
        ${resume}
        <div class="qpick">${items || `<p class="err-text">quizzes/index.json에 퀴즈가 없어요.</p>`}</div>
        <button class="go" id="mk" ${list.length ? "" : "disabled"}>방 열기</button>
      </div></div>`;
    const rb = document.getElementById("resume");
    if (rb) rb.addEventListener("click", () => openRoom(saved.code));
    document.getElementById("mk").addEventListener("click", async e => {
      e.target.disabled = true; e.target.textContent = "여는 중…";
      const file = (app.querySelector("input[name=qz]:checked") || {}).value;
      try {
        const quiz = await L.loadQuiz(file);
        let c;
        for (let i = 0; i < 20; i++) { c = String(1000 + Math.floor(Math.random() * 9000)); if (!(await B.get("rooms/" + c + "/quiz"))) break; }
        await B.set("rooms/" + c, { quiz: file, title: quiz.title, createdAt: B.now(), state: { phase: "lobby", q: 0 } });
        openRoom(c);
      } catch (err) {
        const msg = /permission/i.test(String(err && (err.code || err.message)))
          ? "Firebase가 저장을 거절했어요. Realtime Database의 '규칙' 탭에 database.rules.json 내용을 붙여 넣고 '게시'했는지 확인해 주세요."
          : "방을 열지 못했어요: " + (err && err.message ? err.message : err);
        e.target.insertAdjacentHTML("beforebegin", `<div class="banner err">${esc(msg)}</div>`);
        e.target.disabled = false; e.target.textContent = "방 열기";
      }
    });
  }

  async function openRoom(c) {
    const r = await B.get("rooms/" + c);
    if (!r) { L.store.del(T_KEY); viewSetup(); return; }
    code = c; L.store.set(T_KEY, { code });
    Q = await L.loadQuiz(r.quiz);
    document.title = Q.title + " · 교사";
    if (unsub) unsub();
    unsub = B.on("rooms/" + code, v => { if (!v) { R = null; L.store.del(T_KEY); viewSetup(); return; } R = v; render(); });
  }

  // ---------- control ----------
  const setState = s => B.set("rooms/" + code + "/state", s);
  function go(phase, q) { showAns = false; confirmEnd = false; setState({ phase, q, at: B.now() }); }

  // ---------- main view ----------
  function render() {
    if (!R || !Q) return;
    const st = R.state || { phase: "lobby", q: 0 };
    const students = Object.entries(R.students || {}).map(([id, s]) => Object.assign({ id }, s)).filter(s => s.name);
    students.sort((a, b) => String(a.name).localeCompare(String(b.name), "ko", { numeric: true }));
    const online = students.filter(s => s.online).length;
    const n = Q.questions.length;
    const qa = st.phase === "q" ? (R.answers || {})["q" + st.q] || {} : {};
    const submitted = students.filter(s => qa[s.id]).length;

    const top = `<div class="t-top">
        <div><div class="t-code">방 코드 <b>${esc(code)}</b></div><div class="t-url">학생 주소: ${esc(studentUrl())}</div></div>
        <div class="t-stat">
          <span class="t-pill"><span class="live"></span>접속 ${online}명</span>
          ${st.phase === "q" ? `<span class="t-pill">문제 ${st.q + 1} / ${n}</span><span class="t-pill">제출 ${submitted} / ${online || students.length}</span>` : ""}
        </div></div>`;

    let left = "", ctrl = "";
    if (st.phase === "lobby") {
      left = `<div class="card wait">${L.CHEST}<h2>${esc(Q.title)}</h2><p>${esc(Q.subtitle || "")}</p>
        <div class="meta"><span class="chip">문제 ${n}개</span><span class="chip">정답 만점 ${L.maxBase(Q)}점</span><span class="chip">보물 1개 +${Q.set.treasureBonus}점</span></div>
        <p>학생들이 방 코드 <b>${esc(code)}</b>로 들어오면 오른쪽에 이름이 나타나요.</p></div>`;
      ctrl = `<button class="go" id="start" ${students.length ? "" : "disabled"}>문제 1 열기</button>`;
    } else if (st.phase === "q") {
      const q = Q.questions[st.q];
      const right = students.filter(s => qa[s.id] && qa[s.id].correct).length;
      left = `<div class="card">${L.questionHead(Q, q, st.q + 1)}<div>${L.answerArea(q, showAns && q.type !== "short" && q.type !== "number" ? String(L.answersOf(q)[0]) : "", { preview: true })}</div>
        ${showAns ? `<div class="t-ans">정답: ${esc(L.showAns(q))} · 맞힌 학생 ${right}명 / 제출 ${submitted}명</div>${q.explain ? `<p class="small">${L.fmt(q.explain)}</p>` : ""}` : ""}
        <div class="meter" aria-label="제출 비율"><i style="width:${(online || students.length) ? Math.round(100 * submitted / (online || students.length)) : 0}%"></i></div></div>`;
      ctrl = `<button class="go ghost" id="prev">${st.q === 0 ? "처음 화면" : "◀ 이전 문제"}</button>
        <button class="go ghost" id="reveal">${showAns ? "정답 가리기" : "정답 보기"}</button>
        <button class="go" id="next">${st.q + 1 < n ? `문제 ${st.q + 2} 열기 ▶` : "결과 보기 ▶"}</button>`;
    } else {
      left = leaderboard(students);
      ctrl = confirmEnd
        ? `<span>기록이 모두 지워지고 학생 화면도 처음으로 돌아가요.</span><button class="go danger" id="endyes">수업 끝내기</button><button class="go ghost" id="endno">취소</button>`
        : `<button class="go ghost" id="back">◀ 마지막 문제로</button><button class="go ghost" id="end">수업 끝내기 (기록 지우기)</button>`;
    }

    const roster = students.map(s => {
      const r = qa[s.id];
      let cls = "", stTxt = "";
      if (st.phase === "q") {
        if (!r) stTxt = "푸는 중";
        else if (showMarks) { cls = r.correct ? "ok" : "no"; stTxt = (r.correct ? "정답" : "오답") + (r.treasure ? " " + L.GEM : ""); }
        else { cls = "sub"; stTxt = "제출"; }
      } else stTxt = "대기";
      const score = showMarks ? `<b>${L.scoreOf(R.answers, s.id)}점</b>` : "";
      return `<div class="stu ${s.online ? "" : "off"} ${cls}"><div class="nm"><i class="on"></i><span>${esc(s.name)}</span></div><div class="st"><span>${stTxt}</span>${score}</div></div>`;
    }).join("");

    app.innerHTML = `<div class="t-wrap">${banner()}${top}
      <div class="t-main">
        <div style="display:grid;gap:16px;min-width:0">${left}<div class="t-ctrl">${ctrl}</div></div>
        <div class="card" style="align-content:start">
          <div class="roster-head"><h2>학생 ${students.length}명</h2>
            <label class="toggle"><input type="checkbox" id="marks" ${showMarks ? "checked" : ""}>정답 여부·점수 보기</label></div>
          <p class="small" style="text-align:left">초록 점: 접속 중 · 흐린 칸: 연결 끊김${st.phase === "q" ? " · 파란 칸: 제출함" : ""}</p>
          <div class="roster">${roster || `<p class="small">아직 들어온 학생이 없어요.</p>`}</div>
        </div>
      </div></div>`;

    bind(st, n);
  }

  function leaderboard(students) {
    const rows = students.map(s => {
      const list = Object.values(R.answers || {}).map(qa => qa && qa[s.id]).filter(Boolean);
      return { s, score: L.scoreOf(R.answers, s.id), right: list.filter(r => r.correct).length, gems: list.filter(r => r.treasure).length };
    }).sort((a, b) => b.score - a.score);
    let rank = 0, prev = null;
    const html = rows.map((x, i) => {
      if (x.score !== prev) { rank = i + 1; prev = x.score; }
      return `<div class="row"><span class="rank">${rank}</span><span class="q" style="color:var(--ink)">${esc(x.s.name)}</span><span>${x.right}/${Q.questions.length} 정답 · 보물 ${x.gems}</span><span class="p">${x.score}점</span></div>`;
    }).join("");
    const avg = rows.length ? Math.round(rows.reduce((a, x) => a + x.score, 0) / rows.length) : 0;
    const perQ = Q.questions.map((q, i) => {
      const qa = (R.answers || {})["q" + i] || {}, sub = Object.values(qa).length, ok = Object.values(qa).filter(r => r.correct).length;
      return `<span class="chip">${i + 1}번 ${sub ? Math.round(100 * ok / sub) : 0}%</span>`;
    }).join("");
    return `<div class="card"><div class="final"><div class="nm">${esc(Q.title)} 결과</div><div class="tsub">평균 ${avg}점</div></div>
      ${showMarks ? `<div class="lead">${html}</div>` : `<p class="small">순위는 오른쪽 위 ‘정답 여부·점수 보기’를 켜면 보여요.</p>`}
      <div><p class="small" style="margin-bottom:6px">문항별 정답률</p><div class="meta">${perQ}</div></div></div>`;
  }

  function bind(st, n) {
    const on = (id, f) => { const el = document.getElementById(id); if (el) el.addEventListener("click", f); };
    on("start", () => go("q", 0));
    on("next", () => (st.q + 1 < n ? go("q", st.q + 1) : go("end", st.q)));
    on("prev", () => (st.q === 0 ? go("lobby", 0) : go("q", st.q - 1)));
    on("reveal", () => { showAns = !showAns; render(); });
    on("back", () => go("q", n - 1));
    on("end", () => { confirmEnd = true; render(); });
    on("endno", () => { confirmEnd = false; render(); });
    on("endyes", async () => { const c = code; if (unsub) unsub(); unsub = null; R = null; L.store.del(T_KEY); await B.remove("rooms/" + c); viewSetup(); });
    const m = document.getElementById("marks");
    if (m) m.addEventListener("change", () => { showMarks = m.checked; render(); });
  }

  viewSetup();
})();
