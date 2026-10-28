/* 2번 방식 순위 애니메이션: 레이싱 / 높이 오르기
   L.rankView({ compact, me }) → { el, setMode(m), setNames(b), update(R) }
   - 교사 TV(compact=false): 1~5등은 자기 레인, 6등부터는 함께 쓰는 레인에 모두
   - 학생 태블릿(compact=true): 1~5등 레인만 작게
   등수는 결승선(정상)에 가까운 순서. 레인은 들어온 순서대로 빈 레인을 차지하고 등수가 바뀌어도 그대로 둔다. */
(function () {
  "use strict";
  const L = window.LQ;
  const COLORS = ["--rc1", "--rc2", "--rc3", "--rc4", "--rc5", "--rc6", "--rc7", "--rc8"];
  const tier = n => (n >= 11 ? 4 : n >= 6 ? 3 : n >= 2 ? 2 : 0);
  const hashC = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0; return COLORS[Math.abs(h) % COLORS.length]; };
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  const car = c => `<svg class="car" viewBox="0 0 120 56" aria-hidden="true">
    <path d="M10 38 L14 24 Q18 18 30 17 L52 16 Q60 4 78 6 L92 8 Q104 12 108 24 L112 38 Q112 44 106 44 L14 44 Q8 44 10 38 Z" fill="var(${c})" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/>
    <path d="M58 16 Q64 9 76 10 L88 11 Q96 13 99 20 L58 20 Z" fill="#DDF1FF" stroke="#1D2A44" stroke-width="2.5"/>
    <rect x="18" y="26" width="16" height="6" rx="3" fill="#fff" opacity=".7"/>
    <circle cx="32" cy="45" r="9" fill="#1D2A44"/><circle cx="32" cy="45" r="3.5" fill="#C9D6E6"/>
    <circle cx="90" cy="45" r="9" fill="#1D2A44"/><circle cx="90" cy="45" r="3.5" fill="#C9D6E6"/></svg>`;
  const man = c => `<svg class="man" viewBox="0 0 60 80" aria-hidden="true">
    <path d="M30 34 L14 22 M30 34 L46 18 M30 50 L18 70 M30 50 L44 66" stroke="#1D2A44" stroke-width="6" stroke-linecap="round" fill="none"/>
    <rect x="21" y="28" width="18" height="26" rx="8" fill="var(${c})" stroke="#1D2A44" stroke-width="3"/>
    <circle cx="30" cy="18" r="10" fill="#FFE2C6" stroke="#1D2A44" stroke-width="3"/>
    <path d="M19 16 Q30 2 41 16 Z" fill="var(${c})" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const crown = `<svg class="crown" viewBox="0 0 40 26" aria-hidden="true"><path d="M3 23 L6 6 L14 15 L20 3 L26 15 L34 6 L37 23 Z" fill="#F4B400" stroke="#1D2A44" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  const shieldIc = `<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1 L19 4 L18 12 Q16 18 10 21 Q4 18 2 12 L1 4 Z" fill="#fff"/></svg>`;
  const flag = `<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M6 28 L6 3 L25 9 L6 15" fill="#F4B400" stroke="#1D2A44" stroke-width="2.5" stroke-linejoin="round"/></svg>`;

  L.rankView = ({ compact = false, me = null } = {}) => {
    const el = document.createElement("div");
    el.className = "rv" + (compact ? " rv-mini" : "");
    el.innerHTML = `<div class="rv-field"></div><div class="rv-fx"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none"></svg></div>${compact ? "" : `<div class="rv-tick"><span class="ic">●</span><span class="msg">문제를 맞힐수록 앞으로 나가요!</span></div>`}`;
    const field = el.querySelector(".rv-field"), fx = el.querySelector(".rv-fx"), fxsvg = fx.querySelector("svg"), ticker = el.querySelector(".rv-tick");
    let mode = "race", showNames = true, scaleMax = 100, R0 = null, seenLedger = null, seenLog = null;
    let S = [];                         // [{id,name,score,combo,shield}]
    const runners = new Map(), lanes = [null, null, null, null, null];
    const COLS = compact ? [10, 30, 50, 70, 90] : [9.5, 21, 32.5, 44, 55.5];
    const nm = s => (showNames || (me && s.id === me) ? s.name : "●●●");
    const byId = id => S.find(s => s.id === id);
    const ranked = () => S.slice().sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));

    function posOf(s, rank, lane) {
      const p = Math.max(0, s.score) / scaleMax;
      if (mode === "race") {
        const x = compact ? 9 + p * 80 : 10 + p * 81;
        if (compact) return { x, y: 10 + lane * 20 };
        return lane >= 0 ? { x, y: 8 + lane * 15 } : { x, y: 79.5 + (rank % 3) * 7.6 };
      }
      const y = compact ? 84 - p * 64 : 86 - p * 68;
      return lane >= 0 ? { x: COLS[lane], y } : { x: 69 + (rank % 4) * 8.6, y };
    }

    function drawField() {
      field.className = "rv-field " + mode;
      let h = "";
      if (mode === "race") {
        if (compact) for (let i = 0; i < 5; i++) h += `<div class="lane" style="top:${i * 20}%;height:20%"></div>`;
        else { for (let i = 0; i < 5; i++) h += `<div class="lane" style="top:${i * 15}%;height:15%"></div>`; h += `<div class="lane pack" style="top:75%;height:25%"><div class="pk">6등부터<br>함께 달려요</div></div>`; }
        h += `<div class="start"></div><div class="finish"></div>`;
      } else {
        h += `<div class="summit">${flag}<span>정상</span></div>`;
        COLS.forEach(x => (h += `<div class="col" style="left:${x - (compact ? 7 : 5)}%;width:${compact ? 14 : 10}%"></div>`));
        if (!compact) h += `<div class="col pack" style="left:64.5%;width:34%"><div class="pk">6등부터 함께 오르는 벽</div></div>`;
        h += `<div class="ticks"></div>`;
      }
      field.innerHTML = h;
      runners.clear(); lanes.fill(null);
      drawTicks();
    }
    function drawTicks() {
      const t = field.querySelector(".ticks"); if (!t) return;
      const step = scaleMax <= 250 ? 50 : scaleMax <= 600 ? 100 : scaleMax <= 1500 ? 250 : 500;
      let h = "";
      for (let v = step; v <= scaleMax; v += step) h += `<span class="tick" style="top:${(compact ? 84 - (v / scaleMax) * 64 : 86 - (v / scaleMax) * 68)}%">${v}</span>`;
      t.innerHTML = h;
    }
    function makeRunner(s) {
      const r = document.createElement("div");
      r.className = "runner" + (me && s.id === me ? " me" : "");
      r.innerHTML = `<div class="body"><span class="flame"><i></i></span>${mode === "race" ? car(hashC(s.id)) : man(hashC(s.id))}${crown}<span class="bubble"></span><span class="sc">${shieldIc}<span class="n"></span></span></div>
        <div class="rvtag"><span class="rb"></span><span class="nm"></span><b class="pt"></b><span class="cb"></span></div>`;
      field.appendChild(r);
      return r;
    }
    const place = (r, p) => { r.style.left = p.x + "%"; r.style.top = p.y + "%"; };
    function pop(r, text, cls) {
      if (!r) return;
      const p = document.createElement("span"); p.className = "pop " + (cls || ""); p.textContent = text;
      r.querySelector(".body").appendChild(p); setTimeout(() => p.remove(), 1700);
    }

    function render(opts = {}) {
      if (!S.length) { runners.forEach(r => r.remove()); runners.clear(); lanes.fill(null); return; }
      const r = ranked(), top = r.slice(0, 5), topIds = new Set(top.map(x => x.id));
      const ns = Math.max(100, Math.ceil((Math.max(0, r[0].score) * 1.15) / 50) * 50);
      if (ns !== scaleMax) { scaleMax = ns; drawTicks(); }
      for (let i = 0; i < 5; i++) if (lanes[i] != null && !topIds.has(lanes[i])) lanes[i] = null;
      const entered = new Set();
      top.forEach(x => { if (!lanes.includes(x.id)) { lanes[lanes.indexOf(null)] = x.id; entered.add(x.id); } });
      const shown = compact ? top : r;
      for (const [id, node] of runners) if (!shown.some(x => x.id === id)) {
        node.classList.add("leaving"); setTimeout(() => node.remove(), 700); runners.delete(id);
      }
      // 함께 쓰는 레인: 같은 줄에서 겹치지 않도록 조금씩 밀어 놓음 (순서는 그대로)
      const P = new Map(), last = {};
      shown.forEach(s => {
        const rank = r.indexOf(s), lane = lanes.indexOf(s.id), p = posOf(s, rank, lane);
        if (lane < 0) {
          const row = mode === "race" ? rank % 3 : rank % 4, prev = last[row];
          if (prev) { if (mode === "race") p.x = Math.min(p.x, prev.x - 4.6); else p.y = Math.max(p.y, prev.y + 5.5); }
          if (mode === "race") p.x = Math.max(p.x, 4); else p.y = Math.min(p.y, 96);
          last[row] = p;
        }
        P.set(s.id, p);
      });
      shown.forEach(s => {
        const rank = r.indexOf(s), lane = lanes.indexOf(s.id);
        let node = runners.get(s.id), fresh = false;
        if (!node) { node = makeRunner(s); runners.set(s.id, node); fresh = true; }
        const prev = node._rank; node._rank = rank;
        node.classList.toggle("mini", lane < 0);
        node.querySelector(".rb").textContent = lane < 0 ? rank + 1 : rank + 1 + "등";
        node.querySelector(".nm").textContent = nm(s);
        node.querySelector(".pt").textContent = Math.max(0, s.score) + "점";
        node.querySelector(".cb").textContent = s.combo + "연속";
        node.querySelector(".sc .n").textContent = s.shield;
        node.classList.toggle("shielded", s.shield > 0);
        node.classList.toggle("rlead", rank === 0 && s.score > 0);
        node.classList.remove("c2", "c3", "c4"); const t = tier(s.combo); if (t) node.classList.add("c" + t);
        if (fresh) { node.style.transition = "none"; place(node, compact ? { x: P.get(s.id).x, y: 115 } : P.get(s.id)); node.offsetWidth; node.style.transition = ""; if (compact) place(node, P.get(s.id)); }
        else place(node, P.get(s.id));
        if (!opts.silent && !fresh) {
          if (entered.has(s.id)) pop(node, "TOP 5!", "rin");
          else if (lane >= 0 && prev != null && rank < prev) pop(node, rank === 0 ? "1등!" : "추월!", "rgo");
        }
      });
    }

    // ---------- 효과 ----------
    function ptOf(id) {
      const node = runners.get(id), sr = el.getBoundingClientRect();
      if (!node || !sr.width) return null;
      const b = node.querySelector(".body").getBoundingClientRect();
      return { x: ((b.left + b.width / 2 - sr.left) / sr.width) * 100, y: ((b.top + b.height / 2 - sr.top) / sr.height) * 100 };
    }
    function floatAt(p, text, cls) {
      if (!p) return;
      const d = document.createElement("div"); d.className = "float " + cls; d.textContent = text;
      d.style.left = p.x + "%"; d.style.top = p.y + "%"; fx.appendChild(d); setTimeout(() => d.remove(), 1400);
    }
    function banner(text) { const d = document.createElement("div"); d.className = "rvban"; d.textContent = text; fx.appendChild(d); setTimeout(() => d.remove(), 1500); }
    function bolt(a, b, color = "#FFE14D", w = 7) {
      if (!a || !b) return;
      const A = { x: a.x * 10, y: a.y * 10 }, B = { x: b.x * 10, y: b.y * 10 }, n = 7, pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t;
        const dx = -(B.y - A.y), dy = B.x - A.x, Lh = Math.hypot(dx, dy) || 1, j = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * R(10, 24);
        pts.push(`${(x + (dx / Lh) * j).toFixed(1)},${(y + (dy / Lh) * j).toFixed(1)}`);
      }
      [[color, w], ["#fff", w * 0.35]].forEach(([c, sw]) => {
        const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        pl.setAttribute("points", pts.join(" ")); pl.setAttribute("fill", "none"); pl.setAttribute("stroke", c);
        pl.setAttribute("stroke-width", sw); pl.setAttribute("stroke-linejoin", "round"); pl.setAttribute("stroke-linecap", "round");
        pl.setAttribute("vector-effect", "non-scaling-stroke");
        fxsvg.appendChild(pl);
        pl.style.strokeDasharray = 3000; pl.style.strokeDashoffset = 3000;
        if (pl.animate) pl.animate([{ strokeDashoffset: 3000, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .45 }, { strokeDashoffset: 0, opacity: 0 }], { duration: 750, easing: "ease-out", fill: "forwards" });
        setTimeout(() => pl.remove(), 800);
      });
    }
    function coin(a, b, delay) {
      if (!a || !b || !Element.prototype.animate) return;
      const d = document.createElement("div"); d.className = "coin"; fx.appendChild(d);
      const sr = el.getBoundingClientRect(), X = p => (p.x / 100) * sr.width, Y = p => (p.y / 100) * sr.height;
      const mx = (X(a) + X(b)) / 2, my = Math.min(Y(a), Y(b)) - sr.height * 0.18;
      d.animate([{ transform: `translate(${X(a)}px,${Y(a)}px) scale(.6)`, opacity: 0 }, { transform: `translate(${X(a)}px,${Y(a)}px) scale(1)`, opacity: 1, offset: .1 },
        { transform: `translate(${mx}px,${my}px) scale(1.2)`, offset: .55 }, { transform: `translate(${X(b)}px,${Y(b)}px) scale(.7)`, opacity: 1 }],
        { duration: 900, delay, easing: "ease-in-out", fill: "both" });
      setTimeout(() => d.remove(), 950 + delay);
    }
    function anim(id, cls) {
      const node = runners.get(id); if (!node) return;
      const b = node.querySelector(".body"); b.classList.remove(cls); b.offsetWidth; b.classList.add(cls); setTimeout(() => b.classList.remove(cls), 900);
    }
    function flashShield(id) { const node = runners.get(id); if (!node) return; const bb = node.querySelector(".bubble"); bb.classList.remove("flash"); bb.offsetWidth; bb.classList.add("flash"); }
    function say(icon, html) { if (ticker && showNames) ticker.innerHTML = `<span class="ic">${icon}</span><span class="msg">${html}</span>`; }

    /** 새 기록 하나 → 효과 (점수 위치 이동은 render 가 맡음) */
    function playLedger(x, Rv, pre) {
      const a = x.by, t = x.target, d = x.d || {}, va = d[a] || 0, vt = t ? d[t] || 0 : 0;
      const pa = pre[a] || ptOf(a), pt = t ? pre[t] || ptOf(t) : null;
      const sky = pt ? { x: pt.x + 6, y: -4 } : null;
      switch (x.kind) {
        case "add": floatAt(pa, `+${va}`, "plus"); anim(a, "hop"); break;
        case "minus": floatAt(pa, `${va}`, "minus"); anim(a, "shake"); break;
        case "stealSome": case "stealAll":
          bolt(pa || { x: 50, y: 95 }, pt, "#FFE14D", x.kind === "stealAll" ? 10 : 7);
          setTimeout(() => { floatAt(pt, `${vt}`, "minus" + (x.kind === "stealAll" ? " big" : "")); floatAt(pa, `+${va}`, "plus"); anim(t, "shake"); }, 300);
          if (x.kind === "stealAll" && !compact) banner("전부 가져오기!");
          break;
        case "swap":
          bolt(pa || { x: 50, y: 95 }, pt, "#9FDBFF", 10); anim(a, "spin"); anim(t, "spin");
          if (!compact) banner("점수 바꾸기!");
          break;
        case "topMinus": bolt(sky, pt, "#FF8A5B", 9); setTimeout(() => { floatAt(pt, `${vt}`, "minus big"); anim(t, "shake"); }, 300); break;
        case "shield": floatAt(pa, "방어막 +3", "info"); break;
        case "blocked": bolt(pa || { x: 50, y: 95 }, pt, "#FFE14D", 7); setTimeout(() => { flashShield(t); floatAt(pt, "막았다!", "info"); }, 300); break;
        case "taxAll": {
          let i = 0;
          Object.keys(d).forEach(id => { if (id !== a && d[id] < 0) coin(pre[id] || ptOf(id) || { x: 50, y: 95 }, pa, (i++ % 8) * 60); });
          setTimeout(() => { floatAt(pa, `+${va}`, "plus big"); anim(a, "hop"); }, 650);
          break;
        }
      }
      say(x.kind === "blocked" || x.kind === "shield" ? "◆" : x.kind === "swap" ? "⇄" : x.kind === "taxAll" || x.kind === "add" ? "●" : "⚡", L.ledgerText(Rv, x));
    }

    /** 데이터가 바뀔 때마다 부름 */
    function update(Rv) {
      R0 = Rv;
      const sc = L.selfScores(Rv), log = Rv.log || {}, shields = Rv.shields || {};
      const studs = Object.entries(Rv.students || {}).filter(([, s]) => s && s.name);
      const pre = {}; runners.forEach((_, id) => { const p = ptOf(id); if (p) pre[id] = p; });
      const newLog = [], newLedger = [];
      const firstTime = !seenLedger;
      if (firstTime) { seenLedger = new Set(); seenLog = new Set(); }
      else {                                // '다시 하기'로 기록이 지워졌으면 본 기록도 비움
        const curLog = new Set(); Object.entries(log).forEach(([id, ents]) => Object.keys(ents || {}).forEach(k => curLog.add(id + "/" + k)));
        seenLog.forEach(k => { if (!curLog.has(k)) seenLog.delete(k); });
        const curL = Rv.ledger || {}; seenLedger.forEach(k => { if (!curL[k]) seenLedger.delete(k); });
      }
      S = studs.map(([id, s]) => {
        const ents = log[id] || {}, keys = Object.keys(ents).sort();
        let combo = 0; for (let i = keys.length - 1; i >= 0 && ents[keys[i]] && ents[keys[i]].correct; i--) combo++;
        keys.forEach(k => { const key = id + "/" + k; if (!seenLog.has(key)) { seenLog.add(key); if (!firstTime) newLog.push([id, ents[k]]); } });
        return { id, name: s.name, score: sc[id] || 0, combo, shield: shields[id] || 0 };
      });
      Object.entries(Rv.ledger || {}).forEach(([k, x]) => { if (!x || seenLedger.has(k)) return; seenLedger.add(k); if (!firstTime) newLedger.push(x); });
      newLog.forEach(([id, e]) => {
        if (!e) return;
        const p = pre[id] || ptOf(id);
        if (e.correct) {
          anim(id, "hop");
          floatAt(p, e.combo ? `+${(e.pts || 0) + e.combo} (${e.streak}연속)` : `+${e.pts || 0}`, "plus" + (e.combo >= 80 ? " big" : ""));
          if (!compact && (e.streak === 6 || e.streak === 11 || e.streak === 16)) banner(`${showNames ? byId(id).name + " " : ""}${e.streak}연속 정답!`);
          if (e.combo) say("★", `${L.esc(byId(id).name)} ${e.streak}연속 정답! 콤보 보너스 +${e.combo}점`);
        } else { const node = runners.get(id); if (node) { const b = node.querySelector(".body"); b.classList.add("dim"); setTimeout(() => b.classList.remove("dim"), 900); } }
      });
      newLedger.sort((a, b) => (a.at || 0) - (b.at || 0)).forEach((x, i) => setTimeout(() => playLedger(x, Rv, pre), i * 280));
      render({ silent: firstTime });
    }

    drawField();
    return {
      el,
      setMode(m) { if (m !== "race" && m !== "climb") m = "race"; if (m === mode) return; mode = m; drawField(); render({ silent: true }); },
      setNames(b) { if (showNames === b) return; showNames = b; if (ticker && !b) ticker.innerHTML = ""; render({ silent: true }); },
      update,
      get mode() { return mode; },
    };
  };
})();
