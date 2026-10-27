/* 2번 진행 방식: 학생 스스로 문제를 넘기며 제한 시간 동안 풀기.
   맞히면 효과 카드 3장 중 하나: 점수 추가 / 감점 / 일부 가져오기 / 전부 가져오기 / 점수 바꾸기.
   데이터: rooms/<코드>/log/<학생>/<n000> 답 기록, rooms/<코드>/ledger/<id> 점수 이동 기록 */
(function () {
  "use strict";
  const L = window.LQ, esc = L.esc;
  const CARDS = 3, STEAL_RATE = 0.3;
  const nkey = n => "n" + String(n).padStart(3, "0");
  const nameOf = (R, id) => (R.students && R.students[id] && R.students[id].name) || "친구";

  /** 효과 → 점수 변화 {학생id: 변화량}. scores = 지금 점수표 */
  function effectDelta(e, me, target, scores) {
    const m = scores[me] || 0, t = target ? Math.max(0, scores[target] || 0) : 0;
    if (e.k === "add") return { [me]: e.amount };
    if (e.k === "minus") { const a = Math.min(e.amount, Math.max(0, m)); return { [me]: -a }; }
    if (e.k === "stealSome") { const a = Math.floor(t * STEAL_RATE); return { [me]: a, [target]: -a }; }
    if (e.k === "stealAll") return { [me]: t, [target]: -t };
    if (e.k === "swap") return { [me]: t - m, [target]: m - t };
    if (e.k === "topMinus") { const a = Math.min(e.amount || L.TOP_MINUS, t); return a > 0 ? { [target]: -a } : {}; }
    if (e.k === "taxAll") {         // 모든 친구에게서 조금씩
      const d = { [me]: 0 };
      Object.keys(scores).forEach(id => { if (id === me) return; const a = Math.min(L.TAX, Math.max(0, scores[id] || 0)); if (a > 0) { d[id] = -a; d[me] += a; } });
      return d[me] > 0 ? d : {};
    }
    return {};
  }

  /** 소식 한 줄 */
  L.ledgerText = (R, x) => {
    const a = esc(nameOf(R, x.by)), b = x.target ? esc(nameOf(R, x.target)) : "", v = Math.abs((x.d || {})[x.by] || 0);
    switch (x.kind) {
      case "add": return `${a} 점수 추가 +${v}`;
      case "minus": return `${a} 감점 -${v}`;
      case "stealSome": return `${a} → ${b} 점수 ${v}점 가져가기`;
      case "stealAll": return `${a} → ${b} 점수 전부(${v}점) 가져가기`;
      case "swap": return `${a} ⇄ ${b} 점수 바꾸기`;
      case "topMinus": return `${a} → 1등 ${b} 감점 -${Math.abs((x.d || {})[x.target] || 0)}`;
      case "shield": return `${a} 방어막 3개 준비`;
      case "blocked": return `${b}의 방어막이 ${a}의 공격을 막음`;
      case "taxAll": return `${a} 모두에게서 조금씩 가져가기 +${v}`;
      default: return "";
    }
  };

  // =====================================================================
  // 학생 화면
  // =====================================================================
  L.selfStudent = ({ app, B, me, Q, base, banner, leave }) => {
    let R = null, lastKey = "", draft = "", showFb = null, toastTimer = null, seen = null, busy = false;
    // 카드·친구 고르기 제한 시간: 이 시간 안에 안 고르면 무작위로 골라 줌
    const CHOOSE_MS = 3000, deadlines = {};
    let cdTimer = null;
    function stopCountdown() { if (cdTimer) { clearInterval(cdTimer); cdTimer = null; } }
    function countdown(key, onExpire) {
      stopCountdown();
      const end = deadlines[key] || (deadlines[key] = Date.now() + CHOOSE_MS);
      const show = () => {
        const left = end - Date.now(), el = document.getElementById("cd");
        if (el) {
          el.querySelector("b").textContent = Math.max(0, Math.ceil(left / 1000));
          el.querySelector("i").style.width = Math.max(0, Math.min(100, (100 * left) / CHOOSE_MS)) + "%";
        }
        if (left <= 0) { stopCountdown(); onExpire(); }
      };
      show(); if (end > Date.now()) cdTimer = setInterval(show, 100);
    }
    const cdBox = what => `<div class="cd" id="cd"><span><b>3</b>초 안에 ${what}. 안 고르면 무작위로 골라져요.</span><div class="cdbar"><i></i></div></div>`;
    const SEQ_KEY = "self-seq:" + me.code + ":" + me.sid;
    const n = Q.questions.length;
    // 학생·시도마다 새 숫자 (문제 틀이 아닌 문항은 그대로)
    const qFor = (qi, count) => L.instantiate(Q.templates[qi], Q.seed + ":" + me.sid + ":" + count + ":" + qi);

    // 내 문제 순서: 한 바퀴마다 새로 섞음
    function seqAt(i) {
      let seq = L.store.get(SEQ_KEY) || [];
      while (seq.length <= i) {
        const r = Array.from({ length: n }, (_, k) => k);
        for (let k = n - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [r[k], r[j]] = [r[j], r[k]]; }
        if (seq.length && r[0] === seq[seq.length - 1] && n > 1) [r[0], r[1]] = [r[1], r[0]];
        seq = seq.concat(r);
      }
      L.store.set(SEQ_KEY, seq);
      return seq[i];
    }

    const myLog = () => (R.log && R.log[me.sid]) || {};
    const remain = () => (R.state && R.state.endsAt ? R.state.endsAt - B.serverNow() : 0);
    const running = () => R.state && R.state.phase === "run" && remain() > 0;
    function current() {
      const lg = myLog(), keys = Object.keys(lg).sort(), last = keys.length ? lg[keys[keys.length - 1]] : null;
      const lastK = keys[keys.length - 1];
      if (last && last.correct && Array.isArray(last.cards)) {
        if (last.pick == null) return { mode: "pick", e: last, k: lastK };
        const eff = last.cards[last.pick];
        if (!last.done && L.EFFECTS[eff.k] && L.EFFECTS[eff.k].target) return { mode: "target", e: last, k: lastK, eff };
        if (!last.done) return { mode: "apply", e: last, k: lastK, eff };
      }
      return { mode: "question", count: keys.length };
    }

    /** 지금까지 이어진 연속 정답 수 */
    function streakNow() {
      const lg = myLog(), keys = Object.keys(lg).sort(); let n = 0;
      for (let i = keys.length - 1; i >= 0 && lg[keys[i]] && lg[keys[i]].correct; i--) n++;
      return n;
    }
    function bar(sc) {
      const lg = Object.values(myLog()), right = lg.filter(e => e.correct).length, st = streakNow();
      return `<div class="bar"><div class="who">${esc(me.name)}</div>
        <div class="t-pill self-timer" id="timer">${R.state && R.state.phase === "run" ? L.fmtTime(remain()) : "–:––"}</div>
        <div class="score">${L.COIN}<span id="myscore">${Math.max(0, sc[me.sid] || 0)}점</span></div></div>
        <p class="small">푼 문제 ${lg.length}개 · 맞힌 문제 ${right}개${st >= 2 ? ` · <b class="combo">${st}연속 정답!</b>` : ""}${((R.shields || {})[me.sid] || 0) > 0 ? ` · <b class="shieldon">방어막 ${(R.shields || {})[me.sid]}개</b>` : ""}</p>`;
    }
    const wrap = (sc, inner) => `${banner()}<div id="toast" class="toast" hidden></div>${bar(sc)}${inner}`;

    function toast(msg) {
      const t = document.getElementById("toast"); if (!t) return;
      t.textContent = L.fixJosa ? L.fixJosa(msg) : msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
    }

    function render() {
      if (!R) return;
      const sc = L.selfScores(R), st = R.state || {};
      const cur = current();
      let key = [st.phase, running(), cur.mode, cur.count, cur.k, showFb].join("|");
      if (cur.mode === "target") key += "|" + JSON.stringify(sc);
      if (st.phase !== "run" || !running()) key += "|" + JSON.stringify(sc) + Object.keys(R.students || {}).length;
      const el = document.getElementById("myscore"); if (el) el.textContent = Math.max(0, sc[me.sid] || 0) + "점";
      if (key === lastKey) return;
      lastKey = key;
      stopCountdown();
      L.arm(app);
      if (st.phase === "lobby" || !st.phase) return viewLobby(sc);
      if (st.phase === "end" || !running()) return viewEnd(sc);
      if (showFb) return viewFeedback(sc);
      if (cur.mode === "pick") return viewPick(sc, cur);
      if (cur.mode === "target") return viewTarget(sc, cur);
      if (cur.mode === "apply") { apply(cur, null); return; }
      try { viewQuestion(sc, cur.count); }
      catch (e) {                                   // 문제를 그리지 못하면 빈 화면 대신 안내
        app.innerHTML = wrap(sc, `<div class="card wait"><h2>문제를 불러오지 못했어요</h2><p class="small">${esc(String(e && e.message || e))}</p>
          <button class="go" id="rl">다시 불러오기</button></div>`);
        document.getElementById("rl").addEventListener("click", () => location.replace(location.pathname + "?r=" + Date.now()));
      }
    }

    function viewLobby(sc) {
      const ef = (R.settings && R.settings.effects) || {};
      const list = L.EFFECT_KEYS.filter(k => ef[k] !== false).map(k => `<li>${L.icon(L.EFFECT_ICON[k])}<span><b>${L.EFFECTS[k].name}</b> ${L.EFFECTS[k].desc(k === "add" ? "10~30" : k === "minus" ? "10~20" : 0)}${L.EFFECTS[k].leaderOnly ? " <small>(1등일 때만)</small>" : ""}${L.BIG_EFFECTS.includes(k) ? " <small>(5문제 이상 풀고 3개 이상 맞힌 뒤, 마지막 1분 제외" + (k === "swap" ? ", 등수가 위쪽 절반일 때만" : "") + ")</small>" : ""}</span></li>`).join("");
      app.innerHTML = wrap(sc, `<div class="card wait">${L.CHEST}<h2>선생님이 시작하면 문제가 나와요</h2>
        <p>${esc(Q.title)} · 제한 시간 ${Math.round(((R.settings && R.settings.timeLimit) || 300) / 60)}분</p>
        <p>문제를 스스로 넘기며 풀어요. 맞히면 카드 ${CARDS}장 중 하나를 골라요.</p>
        <ul class="efflist">${list}</ul><p class="small">연속 정답 콤보: ${L.COMBO_TEXT}</p>
        <button class="go ghost" id="leaveRoom">다른 방으로 가기</button></div>`);
      document.getElementById("leaveRoom").addEventListener("click", () => { B.remove(base + "/students/" + me.sid); leave("", true); });
    }

    function viewQuestion(sc, count) {
      let qi = seqAt(count);
      if (!Q.templates[qi]) { L.store.del(SEQ_KEY); qi = seqAt(count); }      // 예전 방의 순서가 남아 있으면 새로
      const q = qFor(qi, count);
      if (!q || !q.text) throw new Error("문제 " + (qi + 1) + "번을 만들 수 없어요");
      draft = "";
      app.innerHTML = wrap(sc, `<div class="card">
        ${L.questionHead(Q, q, count + 1)}
        <div id="ans">${L.answerArea(q, "")}</div>
        <button class="go" id="check" disabled>정답 확인</button></div>`);
      const area = document.getElementById("ans"), check = document.getElementById("check");
      const submit = () => send(count, qi);
      L.bindAnswer(area, q, () => draft, v => { draft = v; check.disabled = v === ""; }, submit);
      check.addEventListener("click", submit);
    }

    async function send(count, qi) {
      if (busy || draft === "" || !running()) return; busy = true;
      try { await sendInner(count, qi); } finally { busy = false; }
      render();
    }
    async function sendInner(count, qi) {
      const q = qFor(qi, count), ok = L.isCorrect(q, draft);
      const ent = { qi, given: String(draft), correct: ok, pts: ok ? L.ptsOf(Q, q) : 0, at: B.now() };
      if (ok) { const st = streakNow() + 1, cb = L.comboBonus(st); if (cb) { ent.combo = cb; ent.streak = st; } }
      if (ok) {
        const sc = L.selfScores(R), mine = sc[me.sid] || 0;
        const leader = mine > 0 && Object.keys(R.students || {}).every(id => id === me.sid || (sc[id] || 0) <= mine);   // 지금 1등이면 1등 전용 카드도
        const past = Object.values(myLog()), BR = L.BIG_RULE;
        const allowBig = past.length + 1 >= BR.minSolved && past.filter(e => e.correct).length + 1 >= BR.minCorrect && remain() > BR.lastMs;
        const ids = Object.keys(R.students || {}), rank = 1 + ids.filter(id => id !== me.sid && (sc[id] || 0) > mine).length;
        const allowSwap = rank <= ids.length / 2;          // 25명이면 12등까지만 점수 바꾸기
        ent.cards = Array.from({ length: CARDS }, () => L.drawEffect(R.settings && R.settings.effects, { leader, allowBig, allowSwap }));
      }
      if (!ok) showFb = { qi, count, given: draft };
      await B.set(base + "/log/" + me.sid + "/" + nkey(count), ent);
    }

    function viewFeedback(sc) {
      const q = qFor(showFb.qi, showFb.count);
      app.innerHTML = wrap(sc, `<div class="card">
        <div class="fb no"><div class="big">아쉬워요!</div>
          ${R.settings && R.settings.showAnswer === false ? "" : `<div class="sub">정답은 <b>${esc(L.showAns(q))}</b></div>`}
          ${q.explain ? `<div class="sub">${L.fmt(q.explain)}</div>` : ""}</div>
        <button class="go" id="nx">다음 문제</button></div>`);
      document.getElementById("nx").addEventListener("click", () => { showFb = null; render(); });
    }

    function viewPick(sc, cur) {
      const cards = cur.e.cards;
      app.innerHTML = wrap(sc, `<div class="card">
        <div class="fb ok"><div class="big">정답이에요! +${cur.e.pts}점</div>
          ${cur.e.combo ? `<div class="combo-big">${cur.e.streak}연속 정답! 콤보 보너스 +${cur.e.combo}점</div>` : ""}</div>
        <h2 class="ttitle">카드를 하나 골라요</h2>
        <p class="tsub">점수가 늘어날 수도, 줄어들 수도, 친구 점수를 가져올 수도 있어요.</p>
        ${cdBox("카드를 골라요")}
        <div class="board" style="--n:${cards.length}">${cards.map((c, i) => `
          <button class="tcard" data-i="${i}" aria-label="${i + 1}번 카드"><span class="in">
            <span class="face front" style="background:${L.CARD_COLORS[i % L.CARD_COLORS.length]}">${i + 1}</span>
            <span class="face back"><span>${L.icon(c.icon)}</span><span class="lab">${esc(L.EFFECTS[c.k].name)}<br><small>${esc(L.EFFECTS[c.k].desc(c.amount))}</small></span></span>
          </span></button>`).join("")}</div></div>`);
      let done = false;
      const choose = b => {
        if (done) return; done = true; stopCountdown();
        const cd = document.getElementById("cd"); if (cd) cd.hidden = true;
        const i = Number(b.dataset.i);
        app.querySelectorAll(".tcard").forEach(x => { x.classList.add("open"); x.disabled = true; if (x !== b) x.classList.add("dim"); });
        b.classList.add("pick"); b.querySelector(".back > span").classList.add("sparkle");
        app.querySelector(".ttitle").textContent = L.EFFECTS[cards[i].k].name + "!";
        setTimeout(() => B.update(base + "/log/" + me.sid + "/" + cur.k, { pick: i }), 1500);
      };
      const btns = Array.from(app.querySelectorAll(".tcard"));
      btns.forEach(b => b.addEventListener("click", () => choose(b)));
      countdown("pick-" + cur.k, () => choose(btns[Math.floor(Math.random() * btns.length)]));
    }

    function viewTarget(sc, cur) {
      const others = Object.entries(R.students || {}).filter(([id, s]) => id !== me.sid && s && s.name)
        .map(([id, s]) => ({ id, name: s.name, score: Math.max(0, sc[id] || 0) })).sort((a, b) => b.score - a.score);
      const verb = cur.eff.k === "swap" ? "누구와 점수를 바꿀까요?" : cur.eff.k === "stealAll" ? "누구의 점수를 전부 가져올까요?" : "누구의 점수 30%를 가져올까요?";
      app.innerHTML = wrap(sc, `<div class="card">
        <div class="hero">${L.icon(cur.eff.icon)}<h2 class="ttitle">${verb}</h2><p class="tsub">내 점수 ${Math.max(0, sc[me.sid] || 0)}점</p></div>
        ${others.length ? cdBox("친구를 골라요") : ""}
        <div class="targets">${others.map(o => `<button class="tgt" data-id="${esc(o.id)}"><span>${esc(o.name)}</span><b>${o.score}점</b></button>`).join("") || `<p class="small">함께하는 친구가 없어요.</p>`}</div>
        ${others.length ? "" : `<button class="go" id="skip">다음 문제</button>`}</div>`);
      const choose = id => { stopCountdown(); app.querySelectorAll(".tgt").forEach(x => (x.disabled = true)); apply(cur, id); };
      app.querySelectorAll(".tgt").forEach(b => b.addEventListener("click", () => choose(b.dataset.id)));
      const sk = document.getElementById("skip"); if (sk) sk.addEventListener("click", () => apply(cur, null));
      if (others.length) countdown("tgt-" + cur.k, () => choose(others[Math.floor(Math.random() * others.length)].id));
      else countdown("tgt-" + cur.k, () => apply(cur, null));
    }

    async function apply(cur, target) {
      if (busy) { setTimeout(() => { lastKey = ""; render(); }, 400); return; }   // 다른 저장이 끝나면 다시
      busy = true;
      try {
        const sc = L.selfScores(R);
        if (cur.eff.k === "topMinus") {      // 나를 뺀 1등
          const others = Object.keys(R.students || {}).filter(id => id !== me.sid).sort((a, b) => (sc[b] || 0) - (sc[a] || 0));
          target = others.length && (sc[others[0]] || 0) > 0 ? others[0] : null;
        }
        const k = cur.eff.k, shields = R.shields || {}, id = me.sid + "-" + cur.k;
        let d = {}, kind = k, msg;
        if (k === "shield") {
          await B.set(base + "/shields/" + me.sid, (shields[me.sid] || 0) + 3);
          msg = "방어막 3개가 생겼어요! 공격을 3번 막아요.";
        } else if (target && L.ATTACKS.includes(k) && (shields[target] || 0) > 0) {
          await B.set(base + "/shields/" + target, shields[target] - 1);          // 상대 방어막 하나 소모
          kind = "blocked"; msg = `${nameOf(R, target)}의 방어막에 막혔어요!`;
        } else {
          d = effectDelta(cur.eff, me.sid, target, sc);
          const v = d[me.sid] || 0;
          msg = k === "swap" ? `${nameOf(R, target)}와(과) 점수를 바꿨어요 (${v >= 0 ? "+" : ""}${v}점)`
            : k === "topMinus" ? (target ? `1등 ${nameOf(R, target)}의 점수 ${-(d[target] || 0)}점이 줄었어요!` : "아직 점수가 있는 친구가 없어요.")
            : k === "taxAll" ? (v ? `모든 친구에게서 조금씩, 모두 ${v}점을 가져왔어요!` : "아직 점수가 있는 친구가 없어요.")
            : v >= 0 ? `+${v}점!` : `${v}점…`;
        }
        if (Object.keys(d).length || kind === "shield" || kind === "blocked")
          await B.set(base + "/ledger/" + id, { by: me.sid, target: target || null, kind, card: k, d, at: B.now() });
        await B.update(base + "/log/" + me.sid + "/" + cur.k, { done: true, target: target || null });
        toast(msg);
      } finally { busy = false; lastKey = ""; render(); }
    }

    function viewEnd(sc) {
      const lg = Object.values(myLog()), right = lg.filter(e => e.correct).length;
      const ranked = Object.keys(R.students || {}).map(id => sc[id] || 0).sort((a, b) => b - a);
      const mine = Math.max(0, sc[me.sid] || 0), rank = ranked.findIndex(v => v <= (sc[me.sid] || 0)) + 1;
      const done = R.state && R.state.phase === "end";
      app.innerHTML = wrap(sc, `<div class="card">
        <div class="final"><div class="nm">${esc(me.name)}</div><div class="pts-big">${mine}<small>점</small></div>
          <div class="tsub">${done ? `${ranked.length}명 중 ${rank}등` : "시간이 끝났어요! 선생님이 결과를 정리하는 중이에요."}</div></div>
        <div class="stats">
          <div class="stat"><b>${lg.length}</b><span>푼 문제</span></div>
          <div class="stat"><b>${right}</b><span>맞힌 문제</span></div>
          <div class="stat"><b>${lg.length ? Math.round(100 * right / lg.length) : 0}%</b><span>정답률</span></div>
        </div></div>`);
    }

    // 다른 친구가 내 점수를 가져가면 알림
    function notify() {
      const L2 = R.ledger || {};
      if (!seen) { seen = new Set(Object.keys(L2)); return; }
      Object.entries(L2).forEach(([id, x]) => {
        if (seen.has(id)) return; seen.add(id);
        if (x && x.kind === "blocked" && x.target === me.sid) { toast(`방어막이 ${nameOf(R, x.by)}의 공격을 막았어요!`); return; }
        if (x && x.by !== me.sid && x.d && x.d[me.sid]) {
          const v = x.d[me.sid];
          toast(x.kind === "swap" ? `${nameOf(R, x.by)}이(가) 나와 점수를 바꿨어요 (${v >= 0 ? "+" : ""}${v}점)`
            : x.kind === "topMinus" ? `${nameOf(R, x.by)}이(가) 1등 감점 카드를 썼어요! 내 점수 ${v}점`
            : x.kind === "taxAll" ? `1등 ${nameOf(R, x.by)}이(가) 모두에게서 조금씩 가져갔어요 (${v}점)`
            : `${nameOf(R, x.by)}이(가) 내 점수 ${-v}점을 가져갔어요!`);
        }
      });
    }

    const unsub = B.on(base, v => {
      if (!v || !v.state) { leave("선생님이 수업을 끝냈어요.", true); return; }
      R = v; notify(); render();
    });
    const tick = setInterval(() => {
      if (!R) return;
      const t = document.getElementById("timer");
      if (t && R.state && R.state.phase === "run") t.textContent = L.fmtTime(remain());
      if (R.state && R.state.phase === "run" && remain() <= 0) render();
    }, 500);
    return () => { unsub(); clearInterval(tick); };
  };

  // =====================================================================
  // 교사 화면
  // =====================================================================
  L.selfTeacher = ({ app, B, code, Q, banner, studentUrl, onClose }) => {
    let R = null, showNames = true, confirmEnd = false, confirmReset = false;
    const base = "rooms/" + code;
    const remain = () => (R.state && R.state.endsAt ? R.state.endsAt - B.serverNow() : 0);

    function render() {
      if (!R) return;
      const st = R.state || { phase: "lobby" }, sc = L.selfScores(R);
      const students = Object.entries(R.students || {}).map(([id, s]) => Object.assign({ id }, s)).filter(s => s.name);
      const online = students.filter(s => s.online).length;
      const set = R.settings || {}, mins = Math.round((set.timeLimit || 300) / 60);
      const effOn = L.EFFECT_KEYS.filter(k => !set.effects || set.effects[k] !== false).map(k => L.EFFECTS[k].name);

      const top = `<div class="t-top">
        <div><div class="t-code">방 코드 <b>${esc(code)}</b></div><div class="t-url">학생 주소: ${esc(studentUrl())}</div></div>
        <div class="t-stat"><span class="t-pill"><span class="live"></span>접속 ${online}명</span>
          <span class="t-pill big-timer" id="ttimer">${st.phase === "run" ? L.fmtTime(remain()) : st.phase === "end" ? "끝" : mins + ":00"}</span></div></div>`;

      const ranked = students.map(s => {
        const lg = Object.values((R.log || {})[s.id] || {});
        return { s, score: Math.max(0, sc[s.id] || 0), solved: lg.length, right: lg.filter(e => e.correct).length };
      }).sort((a, b) => b.score - a.score);
      let rank = 0, prev = null;
      const board = ranked.map((x, i) => {
        if (x.score !== prev) { rank = i + 1; prev = x.score; }
        return `<div class="row"><span class="rank">${rank}</span><span class="q" style="color:var(--ink)">${showNames ? esc(x.s.name) : "●●●"}</span><span>${x.right}/${x.solved} 정답</span><span class="p">${x.score}점</span></div>`;
      }).join("");
      const feed = Object.values(R.ledger || {}).filter(Boolean)
        .sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 8).map(x => `<li>${L.icon(L.EFFECT_ICON[x.kind])}<span>${L.ledgerText(R, x)}</span></li>`).join("");

      let left, ctrl;
      if (st.phase === "lobby") {
        left = `<div class="card wait"><h2>${esc(Q.title)}</h2>
          <div class="qrbox">${L.qrHTML(studentUrl() + "?room=" + code)}</div>
          <p>이 QR을 찍으면 방 코드 <b>${esc(code)}</b>가 채워진 화면이 열려요. 이름을 확인하고 들어오면 오른쪽에 나타나요.</p>
          <p class="small">${esc(Q.subtitle || "")}</p>
          <div class="meta"><span class="chip">학생 스스로 진행</span><span class="chip">제한 시간 ${mins}분</span><span class="chip">문제 ${Q.questions.length}개를 섞어서</span></div>
          <div class="meta">${effOn.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div></div>`;
        ctrl = `<button class="go" id="go" ${students.length ? "" : "disabled"}>시작하기 (${mins}분)</button>`;
      } else {
        const perQ = st.phase === "end" ? perQuestion() : "";
        left = `<div class="card"><div class="roster-head"><h2>${st.phase === "end" ? "최종 순위" : "실시간 순위"}</h2>
            <label class="toggle"><input type="checkbox" id="names" ${showNames ? "checked" : ""}>이름 보기</label></div>
          <div class="lead">${board || `<p class="small">아직 기록이 없어요.</p>`}</div>${perQ}</div>
          ${feed ? `<div class="card"><h2 class="ttitle" style="text-align:left;font-size:1.3rem">카드 소식</h2><ul class="feed">${feed}</ul></div>` : ""}`;
        if (st.phase === "run") ctrl = `<button class="go ghost" id="plus">+1분</button>${confirmEnd ? `<button class="go danger" id="stopyes">지금 끝내기</button><button class="go ghost" id="stopno">취소</button>` : `<button class="go ghost" id="stop">지금 끝내기</button>`}`;
        else ctrl = confirmReset
          ? `<span>기록을 지우고 같은 문제로 다시 시작할까요?</span><button class="go" id="resetyes">다시 하기</button><button class="go ghost" id="resetno">취소</button>`
          : confirmEnd
            ? `<span>기록이 모두 지워지고 학생 화면도 처음으로 돌아가요.</span><button class="go danger" id="endyes">수업 끝내기</button><button class="go ghost" id="endno">취소</button>`
            : `<button class="go ghost" id="reset">같은 문제로 다시 하기</button><button class="go ghost" id="end">수업 끝내기 (기록 지우기)</button>`;
      }

      const roster = ranked.map(x => `<div class="stu ${x.s.online ? "" : "off"}"><div class="nm"><i class="on"></i><span>${esc(x.s.name)}</span></div>
        <div class="st"><span>${x.solved}문제 · ${x.solved ? Math.round(100 * x.right / x.solved) : 0}%</span><b>${x.score}점</b></div></div>`).join("");

      app.innerHTML = `<div class="t-wrap">${banner()}${top}
        <div class="t-main"><div style="display:grid;gap:16px;min-width:0">${left}<div class="t-ctrl">${ctrl}</div></div>
          <div class="card" style="align-content:start"><div class="roster-head"><h2>학생 ${students.length}명</h2></div>
            <p class="small" style="text-align:left">초록 점: 접속 중 · 푼 문제 수 · 정답률 · 점수</p>
            <div class="roster">${roster || `<p class="small">아직 들어온 학생이 없어요.</p>`}</div></div></div></div>`;
      bind();
    }

    function perQuestion() {
      const stat = Q.questions.map(() => ({ n: 0, ok: 0 }));
      Object.values(R.log || {}).forEach(ents => Object.values(ents || {}).forEach(e => { if (e && stat[e.qi]) { stat[e.qi].n++; if (e.correct) stat[e.qi].ok++; } }));
      const chips = stat.map((s, i) => s.n ? `<span class="chip" title="${esc(L.plain(Q.questions[i].text))}">${i + 1}번 ${Math.round(100 * s.ok / s.n)}% (${s.n})</span>` : "").join("");
      return chips ? `<div><p class="small" style="margin:8px 0 6px">문항별 정답률 (푼 횟수)</p><div class="meta">${chips}</div></div>` : "";
    }

    function bind() {
      const on = (id, f) => { const el = document.getElementById(id); if (el) el.addEventListener("click", f); };
      on("go", () => B.set(base + "/state", { phase: "run", startedAt: B.now(), endsAt: B.serverNow() + ((R.settings && R.settings.timeLimit) || 300) * 1000 }));
      on("plus", () => B.update(base + "/state", { endsAt: (R.state.endsAt || B.serverNow()) + 60000 }));
      on("stop", () => { confirmEnd = true; render(); });
      on("stopno", () => { confirmEnd = false; render(); });
      on("stopyes", () => { confirmEnd = false; B.update(base + "/state", { phase: "end", endsAt: B.serverNow() }); });
      on("reset", () => { confirmReset = true; render(); });
      on("resetno", () => { confirmReset = false; render(); });
      on("resetyes", async () => { confirmReset = false; await B.update(base, { log: null, ledger: null, shields: null, state: { phase: "lobby" } }); });
      on("end", () => { confirmEnd = true; render(); });
      on("endno", () => { confirmEnd = false; render(); });
      on("endyes", async () => { stop(); await B.remove(base); onClose(); });
      const nm = document.getElementById("names"); if (nm) nm.addEventListener("change", () => { showNames = nm.checked; render(); });
    }

    const unsub = B.on(base, v => { if (!v) { stop(); onClose(); return; } R = v; render(); });
    const tick = setInterval(() => {
      if (!R || !R.state || R.state.phase !== "run") return;
      const t = document.getElementById("ttimer"); if (t) t.textContent = L.fmtTime(remain());
      if (remain() <= 0) B.update(base + "/state", { phase: "end" });   // 시간이 다 되면 끝
    }, 500);
    function stop() { unsub(); clearInterval(tick); }
    return stop;
  };
})();
