/* 학생 화면: 방 코드 입력 → 대기 → (선생님이 연 문제) 풀기 → 보물 고르기 → 다음 문제 대기 → 결과 */
(function () {
  "use strict";
  const L = window.LQ, esc = L.esc;
  const app = document.getElementById("app");
  const B = L.makeBackend();
  const ME_KEY = "live-quiz-me";
  L.netBanner(B);

  let me = L.store.get(ME_KEY);      // {code, sid, name}
  let Q = null, room = null;          // 퀴즈, 방 정보 {quiz,title,state}
  let state = null, myAns = {};       // 진행 상태, 내 답 기록 {q0:{...}}
  let drafts = {};                    // 아직 안 낸 답
  let boards = {}, localBoards = {};  // 선생님이 정한 보물판 (q0: [...]) / 없을 때 쓰는 내 보물판
  let subs = [], stopPresence = null, lastKey = "", joinErr = "";

  function banner() {
    return B.kind === "demo"
      ? `<div class="banner">연습(데모) 모드: 이 컴퓨터의 다른 탭과만 연결돼요. Firebase 설정을 넣으면 교실 태블릿끼리 연결돼요.</div>` : "";
  }
  function bar() {
    const total = Object.values(myAns).reduce((a, r) => a + (r.pts || 0) + (r.bonus || 0), 0);
    const n = Q ? Q.questions.length : 0, cur = state && state.phase === "q" ? state.q : -1;
    const dots = Array.from({ length: n }, (_, i) => {
      const r = myAns["q" + i];
      return `<span class="dot ${r ? (r.correct ? "ok" : "no") : ""} ${i === cur ? "now" : ""}"></span>`;
    }).join("");
    return `<div class="bar"><div class="who">${esc(me.name)}</div><div class="progress">${dots}</div><div class="score">${L.COIN}<span>${total}점</span></div></div>`;
  }

  // ---------- join ----------
  function viewJoin() {
    lastKey = "join";
    app.innerHTML = `${banner()}
      <div class="card">
        <div class="hero">${L.CHEST}<h1>보물 찾기 퀴즈</h1><p>선생님이 알려 준 방 코드와 내 이름을 적어요.</p></div>
        <form class="namebox" id="jf">
          <label for="code">방 코드</label>
          <input id="code" class="codein" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" value="${esc((me && me.code) || "")}" placeholder="0000">
          <label for="nm">이름 또는 번호</label>
          <input id="nm" autocomplete="off" maxlength="20" value="${esc((me && me.name) || "")}" placeholder="예) 12번 김보물">
          <p class="err-text" id="je">${esc(joinErr)}</p>
          <button class="go" id="jb" type="submit">들어가기</button>
        </form>
      </div>`;
    const code = document.getElementById("code"), nm = document.getElementById("nm"), jb = document.getElementById("jb");
    const upd = () => { code.value = code.value.replace(/\D/g, ""); jb.disabled = code.value.length !== 4 || !nm.value.trim(); };
    code.addEventListener("input", upd); nm.addEventListener("input", upd); upd();
    document.getElementById("jf").addEventListener("submit", async e => {
      e.preventDefault(); if (jb.disabled) return;
      jb.disabled = true; jb.textContent = "찾는 중…";
      const c = code.value, name = nm.value.trim();
      let r = null, failed = false;
      try { r = await B.get("rooms/" + c + "/quiz"); } catch (err) { failed = true; }
      if (failed) { joinErr = "연결이 안 돼요. 와이파이를 확인하고 다시 눌러요."; viewJoin(); return; }
      if (!r) { joinErr = "그런 방이 없어요. 방 코드를 다시 확인해요."; viewJoin(); return; }
      const sid = me && me.code === c && me.sid ? me.sid : L.rid();
      me = { code: c, sid, name }; L.store.set(ME_KEY, me); joinErr = "";
      await B.update("rooms/" + c + "/students/" + sid, { name, joinedAt: B.now() });
      enter();
    });
  }

  // ---------- in room ----------
  async function enter() {
    app.innerHTML = `${banner()}<div class="card wait">${L.CHEST}<h2>방에 들어가는 중…</h2></div>`;
    const base = "rooms/" + me.code;
    room = await B.get(base).catch(() => null);
    if (!room || !room.quiz) { leave("그 방은 끝났어요. 새 방 코드를 받아요."); return; }
    try { Q = await L.loadRoomQuiz(room); } catch (e) { app.innerHTML = `<div class="banner err">${esc(e.message)}</div>`; return; }
    document.title = Q.title;
    // 이름이 지워졌으면 다시 등록 (선생님이 새로 연 방 등)
    await B.update(base + "/students/" + me.sid, { name: me.name });
    stopPresence = B.presence(base + "/students/" + me.sid + "/online");
    if (room.mode === "self") {        // 2번: 학생 스스로 진행 (selfmode.js)
      subs.push(L.selfStudent({ app, B, me, Q, base, banner, leave }));
      return;
    }
    subs.push(B.on(base + "/state", s => {
      if (s === null) { leave("선생님이 수업을 끝냈어요."); return; }
      state = s; render();
    }));
    subs.push(B.on(base + "/boards", b => { boards = b || {}; }));
    subs.push(B.on(base + "/answers", a => {
      const mine = {};
      Object.entries(a || {}).forEach(([k, v]) => { if (v && v[me.sid]) mine[k] = v[me.sid]; });
      myAns = mine; render();
    }));
  }

  function leave(msg) {
    subs.forEach(u => u()); subs = [];
    if (stopPresence) { stopPresence(); stopPresence = null; }
    joinErr = msg || ""; state = null; myAns = {}; Q = null;
    if (me) { me = { name: me.name }; L.store.set(ME_KEY, me); }
    viewJoin();
  }

  function render() {
    if (!Q || !state) return;
    const qk = "q" + state.q, r = myAns[qk];
    const key = state.phase + "|" + state.q + "|" + JSON.stringify(r || null) + "|" + Object.keys(myAns).length;
    if (key === lastKey) return;      // 다른 친구가 답을 낼 때 화면이 다시 그려지지 않게
    lastKey = key;
    if (state.phase === "lobby") viewWait("선생님이 문제를 열 때까지 기다려요", `${esc(Q.title)}`);
    else if (state.phase === "end") viewEnd();
    else if (!r) viewQuestion();
    else if (r.correct && r.card == null) viewPick(r);
    else viewAfter(r);
    window.scrollTo({ top: 0 });
  }

  function viewWait(title, sub, extra = "") {
    app.innerHTML = `${banner()}${bar()}
      <div class="card wait">${L.CHEST}<h2>${title}</h2>${extra}<p>${sub}</p></div>`;
  }

  function viewAfter(r) {
    const res = r.correct
      ? `<span class="lastres ok">정답 +${r.pts}점${r.item ? ` · ${L.icon(r.item.icon)} ${esc(r.item.name)}${r.treasure ? " +" + r.bonus : ""}` : ""}</span>`
      : `<span class="lastres no">아쉬워요, 0점</span>`;
    const q = Q.questions[state.q];
    let ans = "";
    if (!r.correct && Q.set.showAnswer) ans = `<p>정답은 <b>${esc(L.showAns(q))}</b>${q.explain ? `<br>${L.fmt(q.explain)}` : ""}</p>`;
    viewWait("다음 문제를 기다려요", `문제 ${state.q + 1} 끝!`, res + ans);
  }

  function viewQuestion() {
    const q = Q.questions[state.q], qk = "q" + state.q;
    const d = drafts[qk] || "";
    app.innerHTML = `${banner()}${bar()}
      <div class="card">
        ${L.questionHead(Q, q, state.q + 1)}
        <div id="ans">${L.answerArea(q, d)}</div>
        <button class="go" id="check" ${d === "" ? "disabled" : ""}>정답 확인</button>
      </div>`;
    const area = document.getElementById("ans"), check = document.getElementById("check");
    L.bindAnswer(area, q, () => drafts[qk] || "", v => { drafts[qk] = v; check.disabled = v === ""; }, submit);
    check.addEventListener("click", submit);
  }

  async function submit() {
    const qi = state.q, qk = "q" + qi, q = Q.questions[qi], given = drafts[qk];
    if (given == null || given === "" || myAns[qk]) return;
    const check = document.getElementById("check"); if (check) { check.disabled = true; check.textContent = "보내는 중…"; }
    const ok = L.isCorrect(q, given);
    const rec = { given: String(given), correct: ok, pts: ok ? L.ptsOf(Q, q) : 0, bonus: 0, treasure: false, at: B.now() };
    const path = "rooms/" + me.code + "/answers/" + qk + "/" + me.sid;
    const exists = await B.get(path).catch(() => null);
    if (exists) return;               // 이미 낸 답은 바꿀 수 없어요
    await B.set(path, rec);
  }

  function boardFor(qi) {
    const q = Q.questions[qi], k = "q" + qi;
    const b = boards[k] && Array.isArray(boards[k].cards) ? boards[k].cards : null;
    if (b) return b;
    if (!localBoards[k]) localBoards[k] = L.makeBoard(Q, q);   // 선생님 보물판이 없을 때
    return localBoards[k];
  }

  function viewPick(r) {
    const qi = state.q, q = Q.questions[qi], n = boardFor(qi).length;
    const hidden = boardFor(qi).filter(x => x.points > 0).length;
    app.innerHTML = `${banner()}${bar()}
      <div class="card">
        <div class="fb ok"><div class="big">정답이에요! +${r.pts}점</div></div>
        <h2 class="ttitle">번호를 하나 골라요</h2>
        <p class="tsub">카드 ${n}장 중 ${hidden}장에 보물이 숨어 있어요. 하나만 고를 수 있어요.</p>
        <div class="board" style="--n:${n}">${Array.from({ length: n }, (_, i) => `
          <button class="tcard" data-i="${i}" aria-label="${i + 1}번 카드"><span class="in">
            <span class="face front" style="background:${L.CARD_COLORS[i % L.CARD_COLORS.length]}">${i + 1}</span>
            <span class="face back"></span>
          </span></button>`).join("")}</div>
      </div>`;
    let done = false;
    app.querySelectorAll(".tcard").forEach(b => b.addEventListener("click", () => {
      if (done) return; done = true;
      const board = boardFor(qi);              // 누르는 순간의 보물판 (선생님이 섞었으면 섞인 판)
      const i = Number(b.dataset.i), item = board[i] || { icon: "rock", name: "돌멩이", points: 0 };
      app.querySelectorAll(".tcard").forEach((x, k) => {
        const it = board[k] || { icon: "rock", name: "돌멩이", points: 0 };
        x.querySelector(".back").innerHTML = it.points > 0
          ? `<span class="${x === b ? "sparkle" : ""}">${L.icon(it.icon)}</span><span class="lab">${esc(it.name)} +${it.points}</span>`
          : `${L.icon(it.icon)}<span class="lab">꽝</span>`;
        x.classList.add("open"); x.disabled = true; if (x !== b) x.classList.add("dim");
      });
      b.classList.add("pick");
      app.querySelector(".ttitle").textContent = item.points > 0 ? `보물 발견! ${item.name} +${item.points}점` : `${item.name}… 꽝! 다음 기회에`;
      setTimeout(() => {
        B.update("rooms/" + me.code + "/answers/q" + qi + "/" + me.sid, {
          card: i + 1, treasure: item.points > 0, bonus: item.points, item: { icon: item.icon, name: item.name, points: item.points }
        });
      }, 1800);
    }));
  }

  function viewEnd() {
    const rows = Q.questions.map((q, i) => {
      const r = myAns["q" + i];
      return `<div class="row"><span class="n">${i + 1}</span><span class="q">${esc(L.plain(q.text))}</span>
        <span class="m ${r && r.correct ? "ok" : "no"}">${r ? (r.correct ? "O" : "X") : "–"}</span>
        <span class="p">${r ? (r.pts || 0) + (r.bonus || 0) : 0}점${r && r.treasure && r.item ? L.icon(r.item.icon) : ""}</span></div>`;
    }).join("");
    const list = Object.values(myAns);
    const right = list.filter(r => r.correct).length, gems = list.filter(r => r.treasure).length;
    const base = list.reduce((a, r) => a + (r.pts || 0), 0), bonus = list.reduce((a, r) => a + (r.bonus || 0), 0);
    app.innerHTML = `${banner()}${bar()}
      <div class="card">
        <div class="final"><div class="nm">${esc(me.name)}</div><div class="pts-big">${base + bonus}<small>점</small></div><div class="tsub">${esc(Q.title)}</div></div>
        <div class="stats">
          <div class="stat"><b>${right}/${Q.questions.length}</b><span>맞힌 문제</span></div>
          <div class="stat"><b>${base}</b><span>정답 점수</span></div>
          <div class="stat"><b>${gems}개 · ${bonus}</b><span>보물 점수</span></div>
        </div>
        <div class="rows">${rows}</div>
      </div>`;
  }

  // ---------- start ----------
  if (me && me.code && me.sid && me.name) enter(); else viewJoin();
})();
