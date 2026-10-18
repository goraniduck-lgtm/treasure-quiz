/* 교사 화면: 채점함 · 번호별 · 활동지별 · 통계 · 설정 */
(function () {
  "use strict";
  const { esc, nl, store, SHEETS, backend } = WS;
  const N = WS.N_STUDENTS;
  const app = document.getElementById("app");
  const T = { subs: {}, fb: {}, closed: {}, seen: {}, view: "inbox", arg: null, ready: 0, statSheet: 1 };
  let unsubs = [], grade = null;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  function toast(msg, ms = 2400) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms); }
  function modal(html, buttons) {
    const o = $("#overlay"); o.innerHTML = `<div class="modal">${html}<div class="mbtns"></div></div>`; o.classList.add("show");
    buttons.forEach((b) => { const el = document.createElement("button"); el.className = "btn " + (b.cls || ""); el.textContent = b.t; el.onclick = () => { o.classList.remove("show"); o.innerHTML = ""; b.fn && b.fn(); }; $(".mbtns", o).appendChild(el); });
  }
  const sub = (st, n) => T.subs && T.subs[st] && T.subs[st][n];
  const fbOf = (st, n) => T.fb && T.fb[st] && T.fb[st][n];
  const res = (st, n) => WS.scoreSheet(SHEETS[n - 1], sub(st, n), fbOf(st, n));
  const pct = (v) => (v == null ? "-" : Math.round(v) + "%");

  /* ---------- 로그인 ---------- */
  async function boot() {
    app.innerHTML = `<div class="center"><div class="spin"></div><p>불러오는 중…</p></div>`;
    try { await WS.ready; } catch (e) { app.innerHTML = `<div class="card errbox"><h2>연결 실패</h2><p class="small">${esc(e.message)}</p></div>`; return; }
    backend.onAuth((u) => { if (u && backend.isTeacher()) start(); else viewLogin(); });
  }
  function viewLogin(msg) {
    unsubs.forEach((u) => u()); unsubs = [];
    app.innerHTML = `<div class="wrap narrow"><div class="brand"><div class="logo">👩‍🏫</div><h1>교사용 · 활동지 채점</h1><p>선생님 계정으로 로그인해 주세요</p></div>
      <form class="card loginbox" id="lf"><label>이메일<input id="em" type="email" value="${esc(WS.TEACHER_EMAIL)}" autocomplete="username"></label>
      <label>비밀번호<input id="pw" type="password" autocomplete="current-password"></label>
      <div class="err" id="lerr">${esc(msg || "")}</div><button class="btn primary big" type="submit">로그인</button>
      ${WS.demo ? "<p class='small'>시연 모드: 비밀번호는 아무거나 괜찮아요.</p>" : ""}</form></div>`;
    $("#lf").onsubmit = async (e) => {
      e.preventDefault(); $("#lerr").textContent = "";
      try { await backend.signInTeacher($("#em").value.trim(), $("#pw").value); }
      catch (er) {
        const c = er.code || "";
        $("#lerr").textContent = c === "auth/operation-not-allowed" ? "Firebase 콘솔에서 ‘이메일/비밀번호’ 로그인을 켜 주세요." : c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found" ? "이메일이나 비밀번호가 맞지 않아요." : "로그인 실패: " + (c || er.message);
      }
    };
  }

  /* ---------- 데이터 구독 ---------- */
  function start() {
    if (unsubs.length) return;
    const err = (e) => { console.error(e); T.error = e.code || e.message; if (T.shell) renderShell(); };
    const sync = (k) => (v) => { T[k] = v || {}; T.ready++; if (T.view !== "grade") render(); };
    unsubs.push(backend.on("ws/subs", sync("subs"), err));
    unsubs.push(backend.on("ws/fb", sync("fb"), err));
    unsubs.push(backend.on("ws/config/closed", sync("closed"), err));
    unsubs.push(backend.on("ws/seen", sync("seen"), err));
    T.shell = false; renderShell();
  }
  const TABS = [["inbox", "채점함"], ["students", "번호별"], ["sheets", "활동지별"], ["stats", "통계"], ["settings", "설정"]];
  function renderShell() {
    T.shell = true;
    app.innerHTML = `<div class="tshell"><nav class="tnav"><div class="tbrand">📝 활동지 <small>교사용</small></div>
      ${TABS.map(([k, t]) => `<button class="tab" data-t="${k}">${t}<span class="badge" id="b-${k}"></span></button>`).join("")}
      <span class="sp"></span><button class="tab out" id="out">로그아웃</button></nav>
      <div id="err" class="errbar"></div><main id="main"></main></div>`;
    $$(".tab[data-t]").forEach((b) => (b.onclick = () => go(b.dataset.t)));
    $("#out").onclick = () => backend.signOut();
    render();
  }
  function go(view, arg) { T.view = view; T.arg = arg == null ? null : arg; render(); window.scrollTo(0, 0); }
  function pendingList() {
    const out = [];
    for (let st = 1; st <= N; st++) for (const sh of SHEETS) {
      const s = sub(st, sh.n); if (!s) continue;
      const f = fbOf(st, sh.n); if (f && f.done) continue;
      out.push({ st, n: sh.n, at: s.at || 0, r: res(st, sh.n) });
    }
    return out.sort((a, b) => a.at - b.at);
  }
  function render() {
    if (!T.shell) return;
    const main = $("#main"); if (!main) return;
    $("#err").textContent = T.error ? "⚠️ 자료를 읽지 못했어요: " + T.error + (/permission/i.test(T.error) ? " — Firebase 규칙을 게시했는지 확인해 주세요." : "") : "";
    const base = T.view === "studentDetail" ? "students" : T.view === "sheetDetail" ? "sheets" : T.view === "grade" ? T.back || "inbox" : T.view;
    $$(".tab[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === base));
    const pend = pendingList();
    $("#b-inbox").textContent = pend.length || "";
    ({ inbox: () => vInbox(main, pend), students: () => vStudents(main), studentDetail: () => vStudentDetail(main, T.arg), sheets: () => vSheets(main), sheetDetail: () => vSheetDetail(main, T.arg), stats: () => vStats(main), settings: () => vSettings(main), grade: () => {} }[T.view] || (() => {}))();
  }

  /* ---------- 채점함 ---------- */
  function vInbox(main, pend) {
    const doneN = WS.collect(T.subs, T.fb).filter((r) => r.res.done).length;
    main.innerHTML = `<h2 class="h">채점 기다리는 활동지 <span class="pill">${pend.length}</span></h2>
      <p class="sub">제출 순서대로 보여요. 눌러서 채점하고 ‘채점 완료’를 누르면 학생이 결과와 코멘트를 볼 수 있어요. (채점 완료 ${doneN}건)</p>
      ${pend.length ? `<div class="list">${pend.map((p) => {
        const sh = SHEETS[p.n - 1];
        return `<button class="lrow" data-st="${p.st}" data-n="${p.n}"><span class="who">${p.st}번</span><span class="what" style="--cat:${WS.CAT_COLOR[sh.cat]}"><i>No.${pad(p.n)} ${esc(sh.cat)}</i> ${esc(sh.title)}</span>
          <span class="meta">${WS.fmtTime(p.at)}</span><span class="chip2">${p.r.pending ? `확인할 문항 ${p.r.pending}` : "바로 완료 가능"}</span></button>`;
      }).join("")}</div>` : `<div class="empty">채점할 활동지가 없어요 🎉</div>`}`;
    $$(".lrow", main).forEach((b) => (b.onclick = () => { T.back = "inbox"; openGrade(+b.dataset.st, +b.dataset.n); }));
  }

  /* ---------- 번호별 ---------- */
  function studentSummary(st) {
    const rows = WS.collect(T.subs, T.fb).filter((r) => r.st === st);
    const p = rows.map((r) => r.res.pct);
    return { rows, k: rows.length, avg: WS.avg(p), pending: rows.filter((r) => !r.res.done).length };
  }
  function vStudents(main) {
    const all = WS.collect(T.subs, T.fb);
    main.innerHTML = `<h2 class="h">번호별 보기</h2><p class="sub">번호를 누르면 그 학생의 학습 기록(포트폴리오)을 볼 수 있어요.</p>
      <div class="stgrid">${Array.from({ length: N }, (_, i) => {
        const st = i + 1; const rows = all.filter((r) => r.st === st); const avg = WS.avg(rows.map((r) => r.res.pct));
        const pn = rows.filter((r) => !r.res.done).length;
        return `<button class="stcard" data-st="${st}"><b>${st}번</b><span>제출 ${rows.length}/${SHEETS.length}</span><span class="avg">${pct(avg)}</span>${pn ? `<em class="pill">채점 ${pn}</em>` : ""}
          <div class="mini"><i style="width:${(rows.length / SHEETS.length) * 100}%"></i></div></button>`;
      }).join("")}</div>`;
    $$(".stcard", main).forEach((b) => (b.onclick = () => go("studentDetail", +b.dataset.st)));
  }
  function bars(map, order, fmt) {
    return order.map((k) => {
      const v = map[k]; const w = v == null ? 0 : v;
      return `<div class="bar"><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${w}%"></i></span><span class="bv">${v == null ? "-" : fmt ? fmt(v) : Math.round(v) + "%"}</span></div>`;
    }).join("");
  }
  function areaPct(rows) {
    const acc = {}; WS.AREAS.forEach((a) => (acc[a] = { pt: 0, max: 0 }));
    rows.forEach((r) => r.res.items.forEach((x) => { if (x.st === "m") return; const a = acc[x.item.area]; a.max += 1; a.pt += x.pt; }));
    const out = {}; WS.AREAS.forEach((a) => (out[WS.AREA_LABEL[a]] = acc[a].max ? (acc[a].pt / acc[a].max) * 100 : null));
    return out;
  }
  function tagStats(rows) {
    const t = {};
    rows.forEach((r) => r.res.items.forEach((x) => {
      if (!x.item.tag || x.st === "m") return;
      const k = x.item.tag; t[k] = t[k] || { k, g: x.item.grade, ok: 0, n: 0 };
      t[k].n++; if (x.st === "o") t[k].ok++;
    }));
    return Object.values(t).map((v) => ({ ...v, p: (v.ok / v.n) * 100 }));
  }
  function vStudentDetail(main, st) {
    const sm = studentSummary(st);
    const ap = areaPct(sm.rows);
    const weak = tagStats(sm.rows).filter((t) => t.n >= 1 && t.p < 100).sort((a, b) => a.p - b.p || b.n - a.n).slice(0, 5);
    const hist = sm.rows.slice().sort((a, b) => a.sub.at - b.sub.at);
    main.innerHTML = `<div class="crumb"><button class="btn ghost sm" id="bk">← 번호별</button>
      <span class="sp"></span><button class="btn ghost sm" onclick="window.print()">🖨 인쇄/PDF</button>
      <button class="btn ghost sm" id="nx">이전 번호</button><button class="btn ghost sm" id="nx2">다음 번호</button></div>
      <div class="printhead"><h2 class="h">${st}번 학습 기록</h2></div>
      <div class="kpis"><div class="kpi"><b>${sm.k}/${SHEETS.length}</b><span>제출</span></div><div class="kpi"><b>${pct(sm.avg)}</b><span>평균 점수</span></div><div class="kpi"><b>${sm.pending}</b><span>채점 대기</span></div></div>
      <div class="two"><section class="card"><h3>영역별 정답률</h3>${bars(ap, Object.keys(ap))}</section>
      <section class="card"><h3>다시 연습하면 좋은 맞춤법</h3>${weak.length ? weak.map((w) => `<div class="weak"><b>${esc(w.k)}</b> <small>${w.g}급</small><span>${w.ok}/${w.n}</span></div>`).join("") : "<p class='sub'>아직 틀린 맞춤법이 없어요.</p>"}</section></div>
      <section class="card"><h3>제출 흐름 <small>(활동지 순서대로 점수)</small></h3><div class="spark">${hist.map((r) => `<div class="sp1" title="No.${pad(r.sh.n)} ${esc(r.sh.title)} ${r.res.pct}%"><i style="height:${Math.max(4, r.res.pct)}%"></i><small>${r.sh.n}</small></div>`).join("") || "<p class='sub'>제출한 활동지가 없어요.</p>"}</div></section>
      <section class="card"><h3>활동지별 기록</h3><div class="table"><div class="tr th"><span>활동지</span><span>점수</span><span>맞춤법</span><span>어휘</span><span>독해</span><span>상태</span><span>코멘트</span></div>
      ${SHEETS.map((sh) => {
        const r = sm.rows.find((x) => x.sh.n === sh.n);
        if (!r) return `<div class="tr dim"><span>No.${pad(sh.n)} ${esc(sh.title)}</span><span>-</span><span>-</span><span>-</span><span>-</span><span>미제출</span><span></span></div>`;
        const b = r.res.byArea; const rd = b["사실"].pt + b["추론"].pt + b["의견"].pt, rdm = b["사실"].max + b["추론"].max + b["의견"].max;
        return `<button class="tr rowbtn" data-n="${sh.n}"><span>No.${pad(sh.n)} ${esc(sh.title)}</span><span><b>${WS.pctText(r.res)}</b></span><span>${b["맞춤법"].pt}/${b["맞춤법"].max}</span><span>${b["어휘"].pt}/${b["어휘"].max}</span><span>${rd}/${rdm}</span><span>${r.res.done ? "완료" : "<em class='pill'>대기</em>"}</span><span class="cm">${esc((r.fb && r.fb.c) || "")}</span></button>`;
      }).join("")}</div></section>`;
    $("#bk").onclick = () => go("students");
    $("#nx").onclick = () => go("studentDetail", st > 1 ? st - 1 : N); $("#nx2").onclick = () => go("studentDetail", st < N ? st + 1 : 1);
    $$(".rowbtn", main).forEach((b) => (b.onclick = () => { T.back = "studentDetail"; T.backArg = st; openGrade(st, +b.dataset.n); }));
  }

  /* ---------- 활동지별 ---------- */
  function vSheets(main) {
    const all = WS.collect(T.subs, T.fb);
    main.innerHTML = `<h2 class="h">활동지별 보기</h2><p class="sub">활동지 번호(차수)를 누르면 25명의 제출·점수를 한눈에 볼 수 있어요.</p>
      <div class="shgrid">${SHEETS.map((sh) => {
        const rows = all.filter((r) => r.sh.n === sh.n); const avg = WS.avg(rows.map((r) => r.res.pct)); const pn = rows.filter((r) => !r.res.done).length;
        return `<button class="shcard" data-n="${sh.n}" style="--cat:${WS.CAT_COLOR[sh.cat]}"><span class="sno">No.${pad(sh.n)} · ${esc(sh.cat)}</span><b>${esc(sh.title)}</b>
          <span>제출 ${rows.length}/${N} · 평균 ${pct(avg)}</span><div class="mini"><i style="width:${(rows.length / N) * 100}%"></i></div>${pn ? `<em class="pill">채점 ${pn}</em>` : ""}${T.closed[sh.n] ? `<em class="pill gray">닫힘</em>` : ""}</button>`;
      }).join("")}</div>`;
    $$(".shcard", main).forEach((b) => (b.onclick = () => go("sheetDetail", +b.dataset.n)));
  }
  function vSheetDetail(main, n) {
    const sh = SHEETS[n - 1];
    const rows = WS.collect(T.subs, T.fb).filter((r) => r.sh.n === n);
    const items = sh.A.concat(sh.B);
    const acc = items.map((it) => { let ok = 0, tot = 0; rows.forEach((r) => { const x = r.res.items.find((y) => y.item.id === it.id); if (x.st === "m") return; tot++; if (x.st === "o" || x.st === "g") ok += x.pt; }); return { it, p: tot ? (ok / tot) * 100 : null, tot }; });
    main.innerHTML = `<div class="crumb"><button class="btn ghost sm" id="bk">← 활동지별</button><span class="sp"></span>
      <button class="btn ghost sm" id="pv">이전</button><button class="btn ghost sm" id="nv">다음</button></div>
      <h2 class="h">No.${pad(n)} ${esc(sh.title)} <small style="color:${WS.CAT_COLOR[sh.cat]}">${esc(sh.cat)}</small></h2>
      <div class="row"><label class="sw"><input type="checkbox" id="open" ${T.closed[n] ? "" : "checked"}> 학생에게 열려 있음</label>
      <span class="sub">제출 ${rows.length}/${N} · 평균 ${pct(WS.avg(rows.map((r) => r.res.pct)))}</span></div>
      <section class="card"><h3>문항별 정답률</h3>${acc.map((a) => `<div class="bar"><span class="bl w2">${a.it.id} <small>${esc(a.it.tag || WS.AREA_LABEL[a.it.area])}</small></span><span class="bt"><i style="width:${a.p || 0}%"></i></span><span class="bv">${a.p == null ? "-" : Math.round(a.p) + "%"}</span></div>`).join("")}</section>
      <section class="card"><h3>학생별</h3><div class="table"><div class="tr th s7"><span>번호</span><span>점수</span><span>맞춤법</span><span>어휘</span><span>독해</span><span>상태</span><span>제출</span></div>
      ${Array.from({ length: N }, (_, i) => {
        const st = i + 1; const r = rows.find((x) => x.st === st);
        if (!r) return `<div class="tr s7 dim"><span>${st}번</span><span>-</span><span>-</span><span>-</span><span>-</span><span>미제출</span><span></span></div>`;
        const b = r.res.byArea; const rd = b["사실"].pt + b["추론"].pt + b["의견"].pt, rdm = b["사실"].max + b["추론"].max + b["의견"].max;
        return `<button class="tr s7 rowbtn" data-st="${st}"><span><b>${st}번</b></span><span><b>${WS.pctText(r.res)}</b></span><span>${b["맞춤법"].pt}/${b["맞춤법"].max}</span><span>${b["어휘"].pt}/${b["어휘"].max}</span><span>${rd}/${rdm}</span><span>${r.res.done ? "완료" : "<em class='pill'>대기</em>"}</span><span>${WS.fmtTime(r.sub.at)}</span></button>`;
      }).join("")}</div></section>`;
    $("#bk").onclick = () => go("sheets");
    $("#pv").onclick = () => go("sheetDetail", n > 1 ? n - 1 : SHEETS.length); $("#nv").onclick = () => go("sheetDetail", n < SHEETS.length ? n + 1 : 1);
    $("#open").onchange = (e) => backend.set(`ws/config/closed/${n}`, e.target.checked ? null : true).catch((er) => toast("저장 실패: " + er.code));
    $$(".rowbtn", main).forEach((b) => (b.onclick = () => { T.back = "sheetDetail"; T.backArg = n; openGrade(+b.dataset.st, n); }));
  }

  /* ---------- 통계 ---------- */
  function vStats(main) {
    const all = WS.collect(T.subs, T.fb);
    if (!all.length) { main.innerHTML = `<h2 class="h">통계</h2><div class="empty">아직 제출된 활동지가 없어요.</div>`; return; }
    const ap = areaPct(all);
    const tags = tagStats(all).sort((a, b) => a.p - b.p);
    const bySheet = {}; SHEETS.forEach((s) => { const r = all.filter((x) => x.sh.n === s.n); if (r.length) bySheet["No." + pad(s.n) + " " + s.title] = WS.avg(r.map((x) => x.res.pct)); });
    const subRate = {}; SHEETS.forEach((s) => { subRate["No." + pad(s.n)] = (all.filter((x) => x.sh.n === s.n).length / N) * 100; });
    const stu = Array.from({ length: N }, (_, i) => { const sm = studentSummary(i + 1); return { st: i + 1, ...sm }; });
    const low = stu.filter((s) => s.k).sort((a, b) => a.avg - b.avg).slice(0, 5);
    const none = stu.filter((s) => !s.k).map((s) => s.st + "번");
    const pend = all.filter((r) => !r.res.done).length;
    // 문항 유형별
    main.innerHTML = `<h2 class="h">통계</h2>
      <div class="kpis"><div class="kpi"><b>${all.length}</b><span>제출 건수</span></div><div class="kpi"><b>${pct(WS.avg(all.map((r) => r.res.pct)))}</b><span>전체 평균</span></div><div class="kpi"><b>${pend}</b><span>채점 대기</span></div><div class="kpi"><b>${stu.filter((s) => s.k).length}/${N}</b><span>참여 학생</span></div></div>
      <div class="two"><section class="card"><h3>영역별 평균 정답률</h3>${bars(ap, Object.keys(ap))}<p class="sub">채점 전인 서술형·긴 단답은 제외하고 계산해요.</p></section>
      <section class="card"><h3>맞춤법 포인트별 정답률 <small>(낮은 순)</small></h3>${tags.map((t) => `<div class="bar"><span class="bl w2">${esc(t.k)} <small>${t.g}급</small></span><span class="bt ${t.p < 60 ? "low" : ""}"><i style="width:${t.p}%"></i></span><span class="bv">${Math.round(t.p)}% <small>(${t.ok}/${t.n})</small></span></div>`).join("")}</section></div>
      <div class="two"><section class="card"><h3>활동지별 평균 점수</h3>${bars(bySheet, Object.keys(bySheet))}</section>
      <section class="card"><h3>활동지별 제출률</h3>${bars(subRate, Object.keys(subRate))}</section></div>
      <div class="two"><section class="card"><h3>살펴볼 학생 <small>(평균 낮은 순)</small></h3>${low.map((s) => `<button class="weak rowbtn" data-st="${s.st}"><b>${s.st}번</b><span>평균 ${pct(s.avg)} · 제출 ${s.k}장</span></button>`).join("")}
      <p class="sub">미제출 학생: ${none.length ? none.join(", ") : "없음"}</p></section>
      <section class="card"><h3>가장 많이 틀린 문항 TOP 8</h3>${worstItems(all).map((w) => `<div class="weak"><b>No.${pad(w.n)} ${w.id}</b> <small>${esc(w.label)}</small><span>${Math.round(w.p)}% (${w.ok}/${w.tot})</span></div>`).join("")}</section></div>`;
    $$(".rowbtn[data-st]", main).forEach((b) => (b.onclick = () => go("studentDetail", +b.dataset.st)));
  }
  function worstItems(all) {
    const m = {};
    all.forEach((r) => r.res.items.forEach((x) => { if (x.st === "m") return; const k = r.sh.n + "-" + x.item.id; m[k] = m[k] || { n: r.sh.n, id: x.item.id, label: x.item.tag || x.item.prompt.slice(0, 18), ok: 0, tot: 0 }; m[k].tot++; if (x.st === "o" || x.st === "g") m[k].ok += x.pt; }));
    return Object.values(m).filter((v) => v.tot >= 2).map((v) => ({ ...v, p: (v.ok / v.tot) * 100 })).sort((a, b) => a.p - b.p).slice(0, 8);
  }

  /* ---------- 설정 ---------- */
  function vSettings(main) {
    main.innerHTML = `<h2 class="h">설정</h2>
      <section class="card"><h3>활동지 열기 · 닫기</h3><p class="sub">닫힌 활동지는 학생 화면에서 눌러도 열리지 않아요. 이미 제출한 학생은 결과를 계속 볼 수 있어요.</p>
      <div class="row"><button class="btn ghost" id="openall">전체 열기</button><button class="btn ghost" id="closeall">전체 닫기</button></div>
      <div class="chips">${SHEETS.map((s) => `<button class="chip3 ${T.closed[s.n] ? "off" : "on"}" data-n="${s.n}">${s.n}</button>`).join("")}</div></section>
      <section class="card"><h3>포트폴리오 내려받기 (CSV)</h3><p class="sub">엑셀에서 열 수 있어요. 학생은 번호로만 기록돼요.</p>
      <div class="row"><button class="btn" id="csv1">활동지별 점수표</button><button class="btn" id="csv2">문항별 상세 기록</button></div></section>
      <section class="card"><h3>다시 풀게 하기</h3><p class="sub">채점 화면 아래쪽 ‘다시 풀게 하기’ 버튼으로 해당 학생의 제출을 기록 보관함으로 옮기고 다시 풀 수 있게 해요.</p></section>
      ${WS.demo ? `<section class="card"><h3>시연 모드</h3><div class="row"><button class="btn ghost" id="seed">샘플 제출 만들기</button><button class="btn ghost" id="wipe">시연 데이터 지우기</button></div></section>` : ""}`;
    $("#openall").onclick = () => backend.remove("ws/config/closed");
    $("#closeall").onclick = () => { const o = {}; SHEETS.forEach((s) => (o[s.n] = true)); backend.set("ws/config/closed", o); };
    $$(".chip3", main).forEach((b) => (b.onclick = () => backend.set(`ws/config/closed/${b.dataset.n}`, T.closed[b.dataset.n] ? null : true)));
    $("#csv1").onclick = () => download("활동지_점수표.csv", sheetCSV());
    $("#csv2").onclick = () => download("활동지_문항별_기록.csv", itemCSV());
    if (WS.demo) {
      $("#seed").onclick = seedDemo;
      $("#wipe").onclick = async () => { await backend.remove("ws"); toast("지웠어요"); };
    }
  }
  const csvCell = (v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  function download(name, text) {
    const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function sheetCSV() {
    const head = ["번호", "활동지", "분야", "제목", "제출시각", "맞춤법", "어휘", "사실", "추론", "의견", "총점", "백분율", "상태", "교사 코멘트"];
    const lines = [head];
    WS.collect(T.subs, T.fb).forEach((r) => {
      const b = r.res.byArea;
      lines.push([r.st, r.sh.n, r.sh.cat, r.sh.title, WS.fmtTime(r.sub.at), ...WS.AREAS.map((a) => `${b[a].pt}/${b[a].max}`), r.res.total, r.res.pct + "%", r.res.done ? "채점완료" : "채점대기", (r.fb && r.fb.c) || ""]);
    });
    return lines.map((l) => l.map(csvCell).join(",")).join("\n");
  }
  function itemCSV() {
    const lines = [["번호", "활동지", "문항", "영역", "맞춤법 포인트", "학생 답", "정답(예시)", "결과", "점수", "교사 코멘트"]];
    const R = { o: "맞음", x: "틀림", r: "틀림", m: "채점필요", g: "채점됨", n: "무응답" };
    WS.collect(T.subs, T.fb).forEach((r) => r.res.items.forEach((x) => {
      const it = x.item; const a = x.a;
      const stu = a == null ? "" : it.kind === "pick" ? String(a).replace(/\|/g, ", ") : it.kind === "voc" || it.kind === "choice" ? WS.CIRC[a] + " " + it.options[a] : a;
      const cor = it.kind === "pick" ? it.ans.join(", ") : it.kind === "voc" || it.kind === "choice" ? WS.CIRC[it.ans] + " " + it.options[it.ans] : it.kind === "write" ? it.sample : it.ans;
      lines.push([r.st, r.sh.n, it.id, WS.AREA_LABEL[it.area], it.tag || "", stu, cor, R[x.st] + (x.lv ? " " + WS.LEVEL[x.lv].icon : ""), x.pt, (r.fb && r.fb.ic && r.fb.ic[it.id]) || ""]);
    }));
    return lines.map((l) => l.map(csvCell).join(",")).join("\n");
  }
  async function seedDemo() {
    const picks = (it, ok) => it.kind === "pick" ? it.ans.map((v, i) => (ok ? v : it.groups[i].find((g) => g !== v))).join("|") : it.kind === "fix" ? (ok ? it.ans : "틀림") : it.kind === "short" ? (ok ? it.ans : "모르겠어요") : it.kind === "write" ? "저는 이렇게 생각해요. 왜냐하면 그렇게 하면 모두가 기뻐하기 때문이에요." : ok ? it.ans : (it.ans + 1) % it.options.length;
    const w = {};
    for (let st = 1; st <= 6; st++) for (let n = 1; n <= (st % 3) + 3; n++) {
      const sh = SHEETS[n - 1]; const a = {};
      sh.A.concat(sh.B).forEach((it, i) => { a[it.id] = picks(it, (i + st + n) % 3 !== 0); });
      w[`${st}/${n}`] = { a, at: Date.now() - (st * 7 + n) * 3600000, v: 1 };
    }
    for (const k of Object.keys(w)) await backend.set(`ws/subs/${k}`, w[k]);
    toast("샘플을 만들었어요");
  }

  /* ---------- 채점 화면 ---------- */
  function openGrade(st, n) {
    const s = sub(st, n); if (!s) { toast("제출 기록이 없어요"); return; }
    const f = fbOf(st, n) || {};
    grade = { st, n, ov: { ...(f.ov || {}) }, lv: { ...(f.lv || {}) }, ic: { ...(f.ic || {}) }, c: f.c || "", done: !!f.done };
    T.view = "grade"; viewGrade();
  }
  function viewGrade() {
    const { st, n } = grade; const sh = SHEETS[n - 1]; const s = sub(st, n);
    const fb = { ov: grade.ov, lv: grade.lv };
    const r = WS.scoreSheet(sh, s, fb);
    const main = $("#main");
    const QUICK = ["참 잘했어요! 👏", "맞춤법을 한 번 더 살펴봐요.", "글을 조금 더 자세히 써 보면 좋겠어요.", "생각이 멋져요!", "낱말 뜻을 사전에서 찾아봐요."];
    const rows = r.items.map((x) => {
      const it = x.item; const a = x.a;
      const stu = a == null || a === "" ? "<i class='none'>(답 없음)</i>" : it.kind === "pick" ? esc(String(a).split("|").map((v) => v || "?").join(", ")) : it.kind === "voc" || it.kind === "choice" ? esc(WS.CIRC[a] + " " + it.options[a]) : nl(a);
      const cor = it.kind === "pick" ? it.ans.join(", ") : it.kind === "voc" || it.kind === "choice" ? WS.CIRC[it.ans] + " " + it.options[it.ans] : it.kind === "write" ? "예시: " + it.sample : it.ans;
      const stCls = { o: "ok", x: "no", r: "no", m: "wait", g: "ok", n: "none" }[x.st];
      const stTxt = { o: "맞음", x: "틀림", r: "오답(확인)", m: "채점 필요", g: "채점됨", n: "무응답" }[x.st];
      const ctrl = it.kind === "write"
        ? `<div class="lvs">${["a", "b", "c"].map((k) => `<button class="lv ${grade.lv[it.id] === k ? "on" : ""}" data-id="${it.id}" data-k="${k}">${WS.LEVEL[k].icon}<small>${WS.LEVEL[k].t}</small></button>`).join("")}</div>`
        : `<div class="ox"><button class="o ${grade.ov[it.id] === "o" ? "on" : ""}" data-id="${it.id}" data-k="o">○</button><button class="x ${grade.ov[it.id] === "x" ? "on" : ""}" data-id="${it.id}" data-k="x">✕</button></div>`;
      return `<div class="grow ${stCls}"><div class="gh"><span class="atag a-${it.area}">${it.id} · ${WS.AREA_LABEL[it.area]}</span><b>${esc(it.prompt)}</b><span class="stb ${stCls}">${stTxt}${x.teacher ? " ✓" : ""}</span></div>
        ${it.kind === "pick" ? `<div class="gstem">${esc(it.stem.map((t, k) => t + (k < it.groups.length ? "(   )" : "")).join(""))}</div>` : ""}
        ${it.kind === "fix" ? `<div class="gstem">${esc(it.sentence).replace(/〈(.+?)〉/g, "<u>$1</u>")}</div>` : ""}
        <div class="gcols"><div><small>학생 답</small><div class="stuans">${stu}</div></div><div><small>${it.kind === "write" || (it.kind === "short" && !it.auto) ? "예시 답" : "정답"}</small><div class="corr">${esc(cor)}</div></div><div class="gctl">${ctrl}</div></div>
        ${it.kind === "write" || it.kind === "short" || grade.ic[it.id] ? `<input class="icm" data-id="${it.id}" placeholder="이 문항에 코멘트 (학생에게 보여요)" value="${esc(grade.ic[it.id] || "")}">` : `<button class="lnk addc" data-id="${it.id}">+ 코멘트</button>`}</div>`;
    }).join("");
    main.innerHTML = `<div class="crumb"><button class="btn ghost sm" id="gb">← 돌아가기</button><span class="sp"></span><span class="sub">${WS.fmtTime(s.at)} 제출</span></div>
      <h2 class="h">${st}번 · No.${pad(n)} ${esc(sh.title)} <span class="pill ${grade.done ? "" : "gray"}">${grade.done ? "채점 완료" : "채점 중"}</span></h2>
      <div class="scorebar"><b id="sc">${WS.pctText(r)}</b><span>${r.pct}%</span><small>${r.pending ? `확인할 문항 ${r.pending}개` : "모두 확인했어요"}</small></div>
      <details class="reread"><summary>지문 보기</summary><div class="passage mini"><h2>${esc(sh.title)}</h2>${sh.paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div></details>
      <div class="glist">${rows}</div>
      <section class="card"><h3>선생님 한마디 <small>(학생 결과 화면 맨 위에 보여요)</small></h3>
      <div class="chips">${QUICK.map((q) => `<button class="chip3 q" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <textarea id="oc" rows="3" placeholder="전체 코멘트를 써 주세요">${esc(grade.c)}</textarea></section>
      <div class="gfoot"><button class="btn ghost" id="retry">다시 풀게 하기</button><span class="sp"></span><button class="btn" id="save">저장만 하기</button><button class="btn primary" id="finish">채점 완료 ✔</button></div>`;
    $("#gb").onclick = () => { if (dirty()) modal("<h2>저장하지 않은 채점이 있어요</h2><p>그냥 나갈까요?</p>", [{ t: "계속 채점", cls: "ghost" }, { t: "저장 안 하고 나가기", fn: leave }]); else leave(); };
    $$(".ox button", main).forEach((b) => (b.onclick = () => { const id = b.dataset.id; if (grade.ov[id] === b.dataset.k) delete grade.ov[id]; else grade.ov[id] = b.dataset.k; keepRender(); }));
    $$(".lv", main).forEach((b) => (b.onclick = () => { const id = b.dataset.id; if (grade.lv[id] === b.dataset.k) delete grade.lv[id]; else grade.lv[id] = b.dataset.k; keepRender(); }));
    $$(".icm", main).forEach((el) => (el.oninput = () => { if (el.value.trim()) grade.ic[el.dataset.id] = el.value; else delete grade.ic[el.dataset.id]; }));
    $$(".addc", main).forEach((b) => (b.onclick = () => { const i = document.createElement("input"); i.className = "icm"; i.dataset.id = b.dataset.id; i.placeholder = "이 문항에 코멘트"; i.oninput = () => { if (i.value.trim()) grade.ic[i.dataset.id] = i.value; else delete grade.ic[i.dataset.id]; }; b.replaceWith(i); i.focus(); }));
    $("#oc").oninput = (e) => (grade.c = e.target.value);
    $$(".q", main).forEach((b) => (b.onclick = () => { const t = $("#oc"); t.value = (t.value ? t.value + " " : "") + b.dataset.q; grade.c = t.value; t.focus(); }));
    $("#save").onclick = () => saveGrade(false); $("#finish").onclick = () => saveGrade(true);
    $("#retry").onclick = () => modal(`<h2>다시 풀게 할까요?</h2><p>${st}번의 No.${pad(n)} 제출은 ‘기록 보관함’으로 옮겨지고, 학생이 새로 풀 수 있어요.</p>`, [{ t: "취소", cls: "ghost" }, { t: "다시 풀게 하기", cls: "primary", fn: retry }]);
    window.scrollTo(0, 0);
  }
  function keepRender() { const y = window.scrollY; const oc = grade.c; viewGrade(); window.scrollTo(0, y); }
  function dirty() {
    const f = fbOf(grade.st, grade.n) || {};
    const j = (o) => JSON.stringify(Object.keys(o || {}).sort().map((k) => [k, o[k]]));
    return j(f.ov) !== j(grade.ov) || j(f.lv) !== j(grade.lv) || j(f.ic) !== j(grade.ic) || (f.c || "") !== grade.c;
  }
  function leave() {
    const v = T.back || "inbox";
    T.view = v; T.arg = T.backArg == null ? null : T.backArg; grade = null; render(); window.scrollTo(0, 0);
  }
  async function saveGrade(done) {
    const rec = { at: backend.now() };
    if (Object.keys(grade.ov).length) rec.ov = grade.ov;
    if (Object.keys(grade.lv).length) rec.lv = grade.lv;
    if (Object.keys(grade.ic).length) rec.ic = grade.ic;
    if (grade.c.trim()) rec.c = grade.c.trim();
    rec.done = !!done;
    try {
      await backend.set(`ws/fb/${grade.st}/${grade.n}`, rec);
      toast(done ? "채점 완료! 학생이 볼 수 있어요" : "저장했어요");
      if (done) {
        const cur = { st: grade.st, n: grade.n };
        T.fb[cur.st] = T.fb[cur.st] || {}; T.fb[cur.st][cur.n] = { ...rec, at: Date.now() };
        const next = pendingList().find((p) => !(p.st === cur.st && p.n === cur.n));
        if (T.back === "inbox" && next) { openGrade(next.st, next.n); return; }
        leave();
      } else { grade.done = false; }
    } catch (e) { console.error(e); modal(`<h2>저장이 안 됐어요</h2><p class="small">${esc(e.code || e.message)}</p>`, [{ t: "확인", cls: "primary" }]); }
  }
  async function retry() {
    const { st, n } = grade; const s = sub(st, n), f = fbOf(st, n);
    try {
      const k = backend.key(`ws/hist/${st}/${n}`);
      await backend.set(`ws/hist/${st}/${n}/${k}`, { sub: s, fb: f || null, movedAt: backend.now() });
      await backend.remove(`ws/fb/${st}/${n}`); await backend.remove(`ws/subs/${st}/${n}`); await backend.remove(`ws/seen/${st}/${n}`);
      toast("다시 풀 수 있게 했어요"); grade = null; T.view = T.back || "inbox"; T.arg = T.backArg == null ? null : T.backArg;
      if (T.view === "studentDetail" || T.view === "sheetDetail") {} render();
    } catch (e) { modal(`<h2>실패했어요</h2><p class="small">${esc(e.code || e.message)}</p>`, [{ t: "확인", cls: "primary" }]); }
  }

  boot();
})();
