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
    const items = list.map((it, i) => `<label><input type="checkbox" name="qz" value="${esc(it.file)}" data-n="${it.count || 0}" ${i === 0 ? "checked" : ""}><span><span class="qt">${esc(it.title)}</span><br><span class="qs">${esc(it.subtitle || "")}${it.count ? ` · ${it.count}문제` : ""}</span></span></label>`).join("");
    const seg = (name, opts, def) => `<div class="seg">${opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}" ${v === def ? "checked" : ""}>${t}</label>`).join("")}</div>`;
    app.innerHTML = `<div class="t-wrap">${banner()}
      <div class="setup card">
        <div class="hero">${L.CHEST}<h1>퀴즈 방 만들기</h1><p>진행 방식과 문제(차시)를 고르고 방을 열어요. 학생은 방 코드로 들어와요.</p></div>
        ${resume}
        <div class="opts">
          <fieldset><legend>진행 방식</legend>${seg("mode", [["teacher", "① 선생님이 한 문제씩 넘기기"], ["self", "② 학생 스스로 풀기 (제한 시간)"]], "teacher")}</fieldset>
          <fieldset><legend>문제 (여러 개 고르면 합쳐져요)</legend><div class="qpick">${items || `<p class="err-text">quizzes/index.json에 퀴즈가 없어요.</p>`}</div>
            <p class="small" id="picked" style="text-align:left"></p></fieldset>
          <fieldset><legend>문항 수</legend>${seg("cnt", [["all", "전부"], ["5", "5개"], ["10", "10개"], ["15", "15개"], ["20", "20개"]], "all")}
            <p class="small" style="text-align:left">개수를 고르면 고른 문제 중에서 무작위로 뽑아요.</p></fieldset>
          <div id="selfopts" hidden class="opts">
            <fieldset><legend>제한 시간</legend>${seg("time", [["180", "3분"], ["300", "5분"], ["420", "7분"], ["600", "10분"], ["900", "15분"]], "300")}</fieldset>
            <fieldset><legend>맞히면 나오는 카드</legend><div class="seg">${L.EFFECT_KEYS.map(k => `<label><input type="checkbox" name="eff" value="${k}" checked>${L.EFFECTS[k].name}</label>`).join("")}</div>
              <p class="small" style="text-align:left">점수 추가 10~30점 · 감점 10~20점 · 일부 가져오기 30% · 전부 가져오기 · 점수 바꾸기</p></fieldset>
          </div>
        </div>
        <button class="go" id="mk" ${list.length ? "" : "disabled"}>방 열기</button>
      </div></div>`;
    const rb = document.getElementById("resume");
    if (rb) rb.addEventListener("click", () => openRoom(saved.code));
    const val = n => (app.querySelector(`input[name=${n}]:checked`) || {}).value;
    const upd = () => {
      document.getElementById("selfopts").hidden = val("mode") !== "self";
      const ch = Array.from(app.querySelectorAll("input[name=qz]:checked"));
      const tot = ch.reduce((a, x) => a + Number(x.dataset.n || 0), 0);
      document.getElementById("picked").textContent = ch.length ? `고른 문제: ${ch.length}개 묶음 · 모두 ${tot}문제` : "문제를 하나 이상 골라요.";
      document.getElementById("mk").disabled = !ch.length;
    };
    app.querySelectorAll("input").forEach(x => x.addEventListener("change", upd)); upd();
    document.getElementById("mk").addEventListener("click", async e => {
      e.target.disabled = true; e.target.textContent = "여는 중…";
      const files = Array.from(app.querySelectorAll("input[name=qz]:checked")).map(x => x.value);
      const mode = val("mode"), cnt = val("cnt");
      try {
        const Qs = await L.loadRoomQuiz({ quiz: files });
        const total = Qs.allQuestions.length;
        let order = Array.from({ length: total }, (_, k) => k);
        if (cnt !== "all" && Number(cnt) < total) {
          for (let k = total - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
          order = order.slice(0, Number(cnt)).sort((a, b) => a - b);
        }
        let c;
        for (let k = 0; k < 20; k++) { c = String(1000 + Math.floor(Math.random() * 9000)); if (!(await B.get("rooms/" + c + "/quiz"))) break; }
        const title = files.length > 1 ? `${Qs.title.replace(/ 보물 찾기$/, "")} 외 ${files.length - 1}개` : Qs.title;
        const room = { quiz: files, title, order, mode, seed: L.rid(8), createdAt: B.now(), state: { phase: "lobby", q: 0 } };
        if (mode === "self") {
          const effects = {}; L.EFFECT_KEYS.forEach(k => (effects[k] = !!app.querySelector(`input[name=eff][value=${k}]:checked`)));
          if (!Object.values(effects).some(Boolean)) effects.add = true;
          room.settings = { timeLimit: Number(val("time")), effects, showAnswer: Qs.set.showAnswer !== false };
        }
        await B.set("rooms/" + c, room);
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
    Q = await L.loadRoomQuiz(r);
    document.title = Q.title + " · 교사";
    if (unsub) unsub();
    if (r.mode === "self") {   // 2번: 학생 스스로 진행
      unsub = L.selfTeacher({ app, B, code, Q, banner, studentUrl, onClose: () => { unsub = null; L.store.del(T_KEY); viewSetup(); } });
      return;
    }
    unsub = B.on("rooms/" + code, v => { if (!v) { R = null; L.store.del(T_KEY); viewSetup(); return; } R = v; render(); });
  }

  // ---------- control ----------
  const setState = s => B.set("rooms/" + code + "/state", s);
  async function newBoard(qi) {
    const old = R && R.boards && R.boards["q" + qi];
    await B.set("rooms/" + code + "/boards/q" + qi, { cards: L.makeBoard(Q, Q.questions[qi]), v: ((old && old.v) || 0) + 1 });
  }
  async function go(phase, q) {
    showAns = false; confirmEnd = false;
    if (phase === "q" && !(R && R.boards && R.boards["q" + q])) await newBoard(q);   // 문제를 처음 열 때 보물판 만들기
    setState({ phase, q, at: B.now() });
  }
  let flash = "", flashTimer = null;
  function say(msg) { flash = msg; render(); clearTimeout(flashTimer); flashTimer = setTimeout(() => { flash = ""; render(); }, 2500); }

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
        <div class="meta"><span class="chip">문제 ${n}개</span><span class="chip">정답 만점 ${L.maxBase(Q)}점</span><span class="chip">보물 ${L.treasureRange(Q)}</span></div>
        <img src="qr-student.svg" alt="학생 주소 QR 코드" style="width:min(240px,60%);height:auto">
        <p>QR을 찍거나 학생 주소로 들어와 방 코드 <b>${esc(code)}</b>를 입력하면 오른쪽에 이름이 나타나요.</p></div>`;
      ctrl = `<button class="go" id="start" ${students.length ? "" : "disabled"}>문제 1 열기</button>`;
    } else if (st.phase === "q") {
      const q = Q.questions[st.q];
      const right = students.filter(s => qa[s.id] && qa[s.id].correct).length;
      left = `<div class="card">${L.questionHead(Q, q, st.q + 1)}<div>${L.answerArea(q, showAns && q.type !== "short" && q.type !== "number" ? String(L.answersOf(q)[0]) : "", { preview: true })}</div>
        ${showAns ? `<div class="t-ans">정답: ${esc(L.showAns(q))} · 맞힌 학생 ${right}명 / 제출 ${submitted}명</div>${q.explain ? `<p class="small">${L.fmt(q.explain)}</p>` : ""}` : ""}
        <div class="meter" aria-label="제출 비율"><i style="width:${(online || students.length) ? Math.round(100 * submitted / (online || students.length)) : 0}%"></i></div>
        ${boardPreview(st.q)}</div>`;
      ctrl = `<button class="go ghost" id="prev">${st.q === 0 ? "처음 화면" : "◀ 이전 문제"}</button>
        <button class="go ghost" id="reveal">${showAns ? "정답 가리기" : "정답 보기"}</button>
        <button class="go ghost" id="shuffle">보물 섞기</button>
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
        else if (showMarks) { cls = r.correct ? "ok" : "no"; stTxt = (r.correct ? "정답" : "오답") + (r.treasure && r.item ? " " + L.icon(r.item.icon) : ""); }
        else { cls = "sub"; stTxt = "제출"; }
      } else stTxt = "대기";
      const score = showMarks ? `<b>${L.scoreOf(R.answers, s.id)}점</b>` : "";
      return `<div class="stu ${s.online ? "" : "off"} ${cls}"><div class="nm"><i class="on"></i><span>${esc(s.name)}</span></div><div class="st"><span>${stTxt}</span>${score}</div></div>`;
    }).join("");

    app.innerHTML = `<div class="t-wrap">${banner()}${top}
      <div class="t-main">
        <div style="display:grid;gap:16px;min-width:0">${left}<div class="t-ctrl">${ctrl}</div>${flash ? `<div class="banner">${esc(flash)}</div>` : ""}</div>
        <div class="card" style="align-content:start">
          <div class="roster-head"><h2>학생 ${students.length}명</h2>
            <label class="toggle"><input type="checkbox" id="marks" ${showMarks ? "checked" : ""}>정답 여부·점수 보기</label></div>
          <p class="small" style="text-align:left">초록 점: 접속 중 · 흐린 칸: 연결 끊김${st.phase === "q" ? " · 파란 칸: 제출함" : ""}</p>
          <div class="roster">${roster || `<p class="small">아직 들어온 학생이 없어요.</p>`}</div>
        </div>
      </div></div>`;

    bind(st, n);
  }

  // 보물판 미리보기: '정답 여부·점수 보기'를 켰을 때만 (TV에 띄운 화면에서 보물 위치가 보이지 않게)
  function boardPreview(qi) {
    const b = R.boards && R.boards["q" + qi];
    if (!b || !Array.isArray(b.cards)) return "";
    if (!showMarks) return `<p class="small">보물판 준비됨 · 섞은 횟수 ${Math.max(0, (b.v || 1) - 1)}번</p>`;
    return `<div class="bprev">${b.cards.map((c, i) => `<span class="bp ${c.points > 0 ? "has" : ""}"><b>${i + 1}</b>${L.icon(c.icon)}<small>${c.points > 0 ? "+" + c.points : "꽝"}</small></span>`).join("")}</div>`;
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
    on("shuffle", async () => { await newBoard(st.q); say("보물 위치와 종류를 새로 섞었어요. 지금부터 고르는 학생에게 적용돼요."); });
    on("back", () => go("q", n - 1));
    on("end", () => { confirmEnd = true; render(); });
    on("endno", () => { confirmEnd = false; render(); });
    on("endyes", async () => { const c = code; if (unsub) unsub(); unsub = null; R = null; L.store.del(T_KEY); await B.remove("rooms/" + c); viewSetup(); });
    const m = document.getElementById("marks");
    if (m) m.addEventListener("change", () => { showMarks = m.checked; render(); });
  }

  viewSetup();
})();
