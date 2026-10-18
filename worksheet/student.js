/* 학생 화면: 번호 선택 → 활동지 고르기 → 풀기(버튼·입력) → 제출 → 결과·선생님 코멘트 */
(function () {
  "use strict";
  const { esc, nl, store, SHEETS, backend } = WS;
  const app = document.getElementById("app");
  const S = { num: store.get("ws-num"), subs: {}, fb: {}, closed: {}, view: "boot", sheet: null };
  let unsubs = [];
  let solve = null; // 풀이 중 상태

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  function toast(msg, ms = 2400) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }
  function modal(html, buttons) {
    const o = $("#overlay"); o.innerHTML = `<div class="modal">${html}<div class="mbtns"></div></div>`; o.classList.add("show");
    const box = $(".mbtns", o);
    buttons.forEach((b) => {
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || ""); el.textContent = b.t;
      el.onclick = () => { o.classList.remove("show"); o.innerHTML = ""; b.fn && b.fn(); };
      box.appendChild(el);
    });
  }
  const fontScale = () => store.get("ws-font") || 1;

  /* ---------- 시작 ---------- */
  async function boot() {
    app.innerHTML = `<div class="center"><div class="spin"></div><p>불러오는 중…</p></div>`;
    try {
      await WS.ready;
      await backend.signInAnon();
    } catch (e) {
      console.error(e);
      const code = (e && e.code) || "";
      app.innerHTML = `<div class="card errbox"><h2>연결이 안 돼요 😢</h2>
        <p>선생님께 알려 주세요.</p>
        <p class="small">${esc(code || e.message || "")}</p>
        ${code === "auth/operation-not-allowed" ? "<p class='small'>(교사용: Firebase 콘솔 → Authentication → 로그인 방법에서 ‘익명’을 사용 설정해 주세요.)</p>" : ""}
        <button class="btn" onclick="location.reload()">다시 해 보기</button></div>`;
      return;
    }
    backend.onConnection((ok) => $("#offline").classList.toggle("show", !ok));
    if (!S.num) viewNumber(); else enter(S.num);
  }

  function enter(num) {
    S.num = num; store.set("ws-num", num);
    unsubs.forEach((u) => u()); unsubs = [];
    S.subs = {}; S.fb = {};
    const onErr = (e) => { console.error(e); toast("자료를 읽지 못했어요: " + (e.code || e.message)); };
    unsubs.push(backend.on(`ws/subs/${num}`, (v) => { S.subs = v || {}; refresh(); }, onErr));
    unsubs.push(backend.on(`ws/fb/${num}`, (v) => { S.fb = v || {}; refresh(); }, onErr));
    unsubs.push(backend.on(`ws/config/closed`, (v) => { S.closed = v || {}; refresh(); }, onErr));
    viewList();
  }
  function refresh() {
    if (S.view === "list") viewList(true);
    else if (S.view === "result") viewResult(S.sheet, true);
  }

  /* ---------- 번호 고르기 ---------- */
  function viewNumber() {
    S.view = "number";
    app.innerHTML = `<div class="wrap narrow">
      <div class="brand"><div class="logo">📝</div><h1>기초 튼튼, 문해력 기르기</h1><p>내 번호를 눌러 주세요</p></div>
      <div class="numgrid">${Array.from({ length: WS.N_STUDENTS }, (_, i) => `<button class="numbtn" data-n="${i + 1}">${i + 1}</button>`).join("")}</div>
    </div>`;
    $$(".numbtn").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.n;
      modal(`<h2>${n}번이 맞나요?</h2><p>다른 친구 번호를 누르면 그 친구의 기록에 저장돼요.</p>`, [
        { t: "아니요", cls: "ghost" }, { t: `네, ${n}번이에요`, cls: "primary", fn: () => enter(n) },
      ]);
    }));
  }

  /* ---------- 활동지 목록 ---------- */
  function cardState(sh) {
    const sub = S.subs[sh.n], fb = S.fb[sh.n];
    const closed = !!S.closed[sh.n];
    if (sub) {
      const res = WS.scoreSheet(sh, sub, fb);
      const seen = store.get(`ws-seen-${S.num}-${sh.n}`) || 0;
      const fresh = fb && fb.at && fb.at > seen;
      return res.done
        ? { cls: "done", label: `채점 완료 · ${WS.pctText(res)}`, fresh }
        : { cls: "wait", label: "제출했어요 · 채점 기다려요", fresh: false };
    }
    if (closed) return { cls: "closed", label: "아직 열리지 않았어요" };
    const has = store.get(`ws-draft-${S.num}-${sh.n}`);
    return { cls: "todo", label: has ? "풀던 문제가 있어요" : "풀어 보세요" };
  }
  function viewList(keepScroll) {
    S.view = "list";
    const y = window.scrollY;
    const doneN = SHEETS.filter((s) => S.subs[s.n]).length;
    app.innerHTML = `<div class="wrap">
      <header class="top"><div><h1>${S.num}번 친구의 활동지</h1><p>${doneN} / ${SHEETS.length}장 제출했어요</p></div>
      <button class="btn ghost" id="chg">번호 바꾸기</button></header>
      <div class="sheetgrid">${SHEETS.map((sh) => {
        const st = cardState(sh);
        return `<button class="sheetcard ${st.cls}" data-n="${sh.n}" style="--cat:${WS.CAT_COLOR[sh.cat]}" ${st.cls === "closed" ? "disabled" : ""}>
          <span class="sno">No.${String(sh.n).padStart(2, "0")}</span><span class="scat">${esc(sh.cat)}</span>
          <span class="stitle">${esc(sh.title)}</span>
          <span class="sstate">${st.fresh ? "💬 " : ""}${esc(st.label)}</span></button>`;
      }).join("")}</div></div>`;
    $("#chg").onclick = () => modal("<h2>번호를 바꿀까요?</h2>", [{ t: "취소", cls: "ghost" }, { t: "바꾸기", cls: "primary", fn: () => { unsubs.forEach((u) => u()); unsubs = []; store.del("ws-num"); S.num = null; viewNumber(); } }]);
    $$(".sheetcard").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.n;
      if (S.subs[n]) viewResult(n); else viewSolve(n);
    }));
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }

  /* ---------- 풀기 ---------- */
  function stemHtml(it) {
    if (it.kind === "pick") {
      let h = "";
      it.stem.forEach((t, i) => {
        h += esc(t);
        if (i < it.groups.length) {
          h += `<span class="grp" data-g="${i}">(` + it.groups[i].map((o) => `<button type="button" class="chip" data-v="${esc(o)}">${esc(o)}</button>`).join('<i>/</i>') + `)</span>`;
        }
      });
      return `<div class="stem">${h}</div>`;
    }
    if (it.kind === "fix") return `<div class="stem">${esc(it.sentence).replace(/〈(.+?)〉/g, "<u><b>$1</b></u>")}</div><input class="inp" data-id="${it.id}" placeholder="바르게 고쳐 써요" autocomplete="off" autocapitalize="off" spellcheck="false">`;
    if (it.kind === "voc" || it.kind === "choice") {
      return `<div class="opts">${it.options.map((o, i) => `<button type="button" class="opt" data-i="${i}"><b>${WS.CIRC[i]}</b><span>${esc(o)}</span></button>`).join("")}</div>`;
    }
    if (it.kind === "short") return `<input class="inp" data-id="${it.id}" placeholder="짧게 써요" autocomplete="off" spellcheck="false">`;
    return `<textarea class="txa" data-id="${it.id}" rows="5" maxlength="400" placeholder="여기를 눌러 글을 써요"></textarea><div class="cnt"><span class="c">0</span> / 400자</div>`;
  }
  function qHtml(it, no) {
    const tag = it.area === "사실" || it.area === "추론" || it.area === "의견" ? `<em class="atag a-${it.area}">${it.area}</em>` : "";
    return `<div class="q" data-id="${it.id}"><div class="qhead"><span class="qno">${no}</span>${tag}<span class="qp">${esc(it.prompt)}</span></div>${stemHtml(it)}</div>`;
  }
  function viewSolve(n) {
    const sh = SHEETS[n - 1];
    S.view = "solve"; S.sheet = n;
    const key = `ws-draft-${S.num}-${n}`;
    const ans = store.get(key) || {};
    solve = { sh, ans, key };
    const f = fontScale();
    app.innerHTML = `<div class="solve" style="--fs:${f}">
      <header class="sbar"><button class="btn ghost" id="back">← 목록</button>
        <div class="sbt"><b>No.${String(n).padStart(2, "0")}</b> <span style="color:${WS.CAT_COLOR[sh.cat]}">${esc(sh.cat)}</span></div>
        <div class="fsz"><button class="btn ghost sm" id="fm">가-</button><button class="btn ghost sm" id="fp">가+</button></div></header>
      <div class="cols">
        <section class="passage"><h2>${esc(sh.title)}</h2>${sh.paras.map((p) => `<p>${esc(p)}</p>`).join("")}</section>
        <section class="qs">
          <div class="qgroup g1"><h3><span>1</span> 맞춤법·어휘 튼튼 <small>낱말을 바르게 써요</small></h3>${sh.A.map((it, i) => qHtml(it, i + 1)).join("")}</div>
          <div class="qgroup g2"><h3><span>2</span> 독해 튼튼 <small>글을 읽고 답해요</small></h3>${sh.B.map((it, i) => qHtml(it, i + 1)).join("")}</div>
          <div class="submitbar"><div id="prog"></div><button class="btn primary big" id="submit">제출하기</button></div>
        </section></div></div>`;
    // 저장된 답 복원
    sh.A.concat(sh.B).forEach((it) => restore(it));
    updateProg();
    $("#back").onclick = () => { persist(); viewList(); };
    $("#fm").onclick = () => setFont(-0.1); $("#fp").onclick = () => setFont(0.1);
    // 이벤트
    $$(".grp .chip").forEach((b) => (b.onclick = () => {
      const q = b.closest(".q"), it = findItem(q.dataset.id), g = +b.closest(".grp").dataset.g;
      const cur = String(ans[it.id] || "").split("|"); while (cur.length < it.groups.length) cur.push("");
      cur[g] = cur[g] === b.dataset.v ? "" : b.dataset.v;
      ans[it.id] = cur.join("|"); restore(it); changed();
    }));
    $$(".opt").forEach((b) => (b.onclick = () => {
      const it = findItem(b.closest(".q").dataset.id), i = +b.dataset.i;
      if (ans[it.id] === i) delete ans[it.id]; else ans[it.id] = i;
      restore(it); changed();
    }));
    $$(".inp,.txa").forEach((el) => (el.oninput = () => {
      const v = el.value; if (v.trim()) ans[el.dataset.id] = v; else delete ans[el.dataset.id];
      if (el.classList.contains("txa")) el.parentElement.querySelector(".c").textContent = v.length;
      changed();
    }));
    $("#submit").onclick = submit;
    window.scrollTo(0, 0);
  }
  function findItem(id) { return solve.sh.A.concat(solve.sh.B).find((x) => x.id === id); }
  function restore(it) {
    const q = $(`.q[data-id="${it.id}"]`); const a = solve.ans[it.id];
    if (it.kind === "pick") {
      const cur = String(a || "").split("|");
      $$(".grp", q).forEach((g, gi) => $$(".chip", g).forEach((c) => c.classList.toggle("on", cur[gi] === c.dataset.v)));
    } else if (it.kind === "voc" || it.kind === "choice") {
      $$(".opt", q).forEach((o) => o.classList.toggle("on", a === +o.dataset.i));
    } else {
      const el = $(".inp,.txa", q); if (el && el.value !== (a || "")) { el.value = a || ""; const c = q.querySelector(".c"); if (c) c.textContent = (a || "").length; }
    }
  }
  const answered = (it, a) => WS.judge(it, a) !== "n";
  function updateProg() {
    const all = solve.sh.A.concat(solve.sh.B);
    const k = all.filter((it) => answered(it, solve.ans[it.id])).length;
    $("#prog").innerHTML = `<b>${k}</b> / ${all.length} 문제에 답했어요`;
    all.forEach((it) => $(`.q[data-id="${it.id}"]`).classList.toggle("ok", answered(it, solve.ans[it.id])));
  }
  let saveT;
  function persist() { store.set(solve.key, solve.ans); }
  function changed() { updateProg(); clearTimeout(saveT); saveT = setTimeout(persist, 400); }
  function setFont(d) {
    const f = Math.min(1.5, Math.max(0.8, Math.round((fontScale() + d) * 10) / 10));
    store.set("ws-font", f); $(".solve").style.setProperty("--fs", f);
  }
  function submit() {
    persist();
    const all = solve.sh.A.concat(solve.sh.B);
    const blank = all.filter((it) => !answered(it, solve.ans[it.id])).length;
    const msg = blank ? `<h2>아직 답하지 않은 문제가 ${blank}개 있어요</h2><p>이대로 제출하면 고칠 수 없어요. 그래도 제출할까요?</p>` : `<h2>제출할까요?</h2><p>제출하면 고칠 수 없어요. 답을 한 번 더 살펴봤나요?</p>`;
    modal(msg, [{ t: "더 풀래요", cls: "ghost" }, { t: "제출할게요", cls: "primary", fn: doSubmit }]);
  }
  async function doSubmit() {
    const btn = $("#submit"); btn.disabled = true; btn.textContent = "보내는 중…";
    const n = solve.sh.n;
    const a = {}; Object.keys(solve.ans).forEach((k) => { const v = solve.ans[k]; if (v !== "" && v != null) a[k] = typeof v === "string" ? v.trim() : v; });
    try {
      await backend.set(`ws/subs/${S.num}/${n}`, { a, at: backend.now(), v: 1 });
      store.del(solve.key);
      toast("제출했어요! 👏");
      viewResult(n);
    } catch (e) {
      console.error(e); btn.disabled = false; btn.textContent = "제출하기";
      modal(`<h2>제출이 안 됐어요</h2><p>인터넷을 확인하고 다시 눌러 주세요. 풀던 답은 저장돼 있어요.</p><p class="small">${esc(e.code || e.message || "")}</p>`, [{ t: "확인", cls: "primary" }]);
    }
  }

  /* ---------- 결과 ---------- */
  const MARK = { o: ["⭕", "맞았어요", "ok"], x: ["❌", "틀렸어요", "no"], r: ["❌", "틀렸어요 (선생님이 다시 봐 줘요)", "no"], m: ["⏳", "선생님이 채점해요", "wait"], g: ["⭐", "", "ok"], n: ["➖", "답하지 않았어요", "none"] };
  function ansText(it, a) {
    if (a == null || a === "") return "(답 없음)";
    if (it.kind === "pick") return String(a).split("|").map((x) => x || "?").join(", ");
    if (it.kind === "voc" || it.kind === "choice") return `${WS.CIRC[a]} ${it.options[a]}`;
    return String(a);
  }
  function corrText(it) {
    if (it.kind === "pick") return it.ans.join(", ");
    if (it.kind === "voc" || it.kind === "choice") return `${WS.CIRC[it.ans]} ${it.options[it.ans]}`;
    if (it.kind === "write") return "예시: " + it.sample;
    return it.ans;
  }
  function viewResult(n, keep) {
    const sh = SHEETS[n - 1];
    const sub = S.subs[n];
    if (!sub) { if (!keep) viewList(); return; }
    S.view = "result"; S.sheet = n;
    const fb = S.fb[n]; const res = WS.scoreSheet(sh, sub, fb);
    if (fb && fb.at) { store.set(`ws-seen-${S.num}-${n}`, fb.at); if (res.done && !S._marked) { S._marked = 1; backend.set(`ws/seen/${S.num}/${n}`, backend.now()).catch(() => {}); } }
    const y = window.scrollY;
    const autoItems = res.items.filter((x) => x.item.kind !== "write" && (x.item.kind !== "short" || x.item.auto));
    const autoOk = autoItems.filter((x) => x.st === "o").length;
    const head = res.done
      ? `<div class="score done"><div class="big">${WS.pctText(res)}</div><div>채점이 끝났어요!</div></div>`
      : `<div class="score"><div class="big">${autoOk} / ${autoItems.length}</div><div>자동 채점 맞힌 개수<br><small>서술형과 긴 답은 선생님이 채점해 줘요 ⏳</small></div></div>`;
    const rows = res.items.map((x, i) => {
      const it = x.item; const mk = MARK[x.st] || MARK.n;
      const area = WS.AREA_LABEL[it.area];
      const lv = x.lv ? WS.LEVEL[x.lv] : null;
      const ic = fb && fb.ic && fb.ic[it.id];
      const showCorr = it.kind !== "write" && (x.st === "x" || x.st === "r" || x.st === "n" || x.st === "m" || it.kind === "short");
      return `<div class="rrow ${mk[2]}"><div class="rmark">${mk[0]}</div><div class="rbody">
        <div class="rtitle"><span class="atag a-${it.area}">${area}</span> ${esc(it.prompt)}</div>
        ${it.kind === "pick" ? `<div class="rstem">${esc(it.stem.map((t, k) => t + (k < it.groups.length ? "(   )" : "")).join(""))}</div>` : ""}
        ${it.kind === "fix" ? `<div class="rstem">${esc(it.sentence).replace(/〈(.+?)〉/g, "<u>$1</u>")}</div>` : ""}
        <div class="rans"><b>내 답</b> ${nl(ansText(it, x.a))}</div>
        ${showCorr && x.st !== "o" ? `<div class="rcorr"><b>${it.kind === "short" && !it.auto ? "예시 답" : "정답"}</b> ${esc(corrText(it))}</div>` : ""}
        ${it.kind === "write" ? `<div class="rcorr"><b>예시</b> ${esc(it.sample)}</div>` : ""}
        ${it.why && (x.st === "x" || x.st === "r" || x.st === "n") ? `<div class="rwhy">💡 ${esc(it.why)}</div>` : ""}
        ${lv ? `<div class="rlv">${lv.icon} ${lv.t}</div>` : ""}
        ${ic ? `<div class="rcom">👩‍🏫 ${nl(ic)}</div>` : ""}
        ${it.kind !== "write" && x.st !== "n" ? `<div class="rst">${mk[1]}${x.teacher ? " (선생님 확인)" : ""}</div>` : ""}
        </div></div>`;
    }).join("");
    app.innerHTML = `<div class="wrap narrow">
      <header class="top"><div><h1>No.${String(n).padStart(2, "0")} ${esc(sh.title)}</h1><p>${S.num}번 · ${esc(sh.cat)} · ${WS.fmtTime(sub.at)} 제출</p></div>
      <button class="btn ghost" id="back">← 목록</button></header>
      ${head}
      ${fb && fb.c ? `<div class="teachercom"><div class="tc-h">👩‍🏫 선생님 한마디</div><p>${nl(fb.c)}</p></div>` : ""}
      <div class="rlist">${rows}</div>
      <details class="reread"><summary>다시 읽어 보기 (지문)</summary><div class="passage mini"><h2>${esc(sh.title)}</h2>${sh.paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div></details>
      <button class="btn big" id="back2">← 목록으로</button></div>`;
    $("#back").onclick = $("#back2").onclick = () => { S._marked = 0; viewList(); };
    if (keep) window.scrollTo(0, y); else window.scrollTo(0, 0);
  }

  window.addEventListener("beforeunload", () => { if (S.view === "solve" && solve) persist(); });
  boot();
})();
