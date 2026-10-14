/* 교사·학생 화면이 함께 쓰는 코드: 저장소(Firebase 또는 데모), 퀴즈 불러오기, 문항 그리기, 채점 */
(function () {
  "use strict";
  const L = (window.LQ = {});

  // ---------- helpers ----------
  L.esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  L.fmt = t => String(t || "").replace(/\[\s*\]|\[ ?\? ?\]/g, '<span class="blank">?</span>').replace(/\n/g, "<br>");
  L.plain = t => String(t || "").replace(/\[\s*\]/g, "□").replace(/\n/g, " ").replace(/<[^>]+>/g, "");
  L.norm = s => String(s).normalize("NFC").replace(/[\s.,!?~·'"()（）]/g, "").toLowerCase();
  L.rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  L.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  L.shuffleBoard = (n, t) => {
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const b = Array(n).fill(false); idx.slice(0, t).forEach(i => (b[i] = true)); return b;
  };

  // ---------- quiz ----------
  const DEFAULTS = { points: 10, cards: 4, treasures: 2, treasureBonus: 5, showAnswer: true };
  L.CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧"];
  L.TYPE_NAME = { ox: "OX 퀴즈", choice: "객관식", short: "단답형", number: "단답형" };
  L.CARD_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];

  L.loadQuiz = async file => {
    const res = await fetch("quizzes/" + encodeURIComponent(file) + "?v=" + Date.now());
    if (!res.ok) throw new Error("퀴즈 파일을 찾을 수 없어요: " + file);
    const Q = new Function(await res.text() + "\n;return QUIZ;")();
    Q.file = file;
    Q.set = Object.assign({}, DEFAULTS, Q.settings || {});
    return Q;
  };
  L.loadQuizList = async () => {
    const res = await fetch("quizzes/index.json?v=" + Date.now());
    if (!res.ok) return [];
    return res.json();
  };
  L.ptsOf = (Q, q) => (q.points != null ? q.points : Q.set.points);
  L.cardsOf = (Q, q) => (q.cards != null ? q.cards : Q.set.cards);
  L.treOf = (Q, q) => Math.min(q.treasures != null ? q.treasures : Q.set.treasures, L.cardsOf(Q, q));
  L.bonusOf = (Q, q) => (q.treasureBonus != null ? q.treasureBonus : Q.set.treasureBonus);
  L.answersOf = q => (Array.isArray(q.answer) ? q.answer : [q.answer]);
  L.maxBase = Q => Q.questions.reduce((a, q) => a + L.ptsOf(Q, q), 0);

  L.isCorrect = (q, given) => {
    if (given === "" || given == null) return false;
    if (q.type === "ox") return String(given).toUpperCase() === String(q.answer).toUpperCase();
    if (q.type === "choice" || q.type === "number") return L.answersOf(q).map(Number).includes(Number(given));
    return L.answersOf(q).map(L.norm).includes(L.norm(given));
  };
  L.optLabel = (q, i) => { const o = q.options[i - 1]; return (o && typeof o === "object" && o.label) || L.CIRCLED[i - 1] || String(i); };
  L.showAns = (q, v) => {
    if (v == null) v = L.answersOf(q)[0];
    if (q.type === "ox") return v;
    if (q.type === "choice") { const o = q.options[v - 1]; const t = typeof o === "string" ? o : (o && o.text) || ""; return L.optLabel(q, v) + (t ? " " + t : ""); }
    if (q.type === "number") return v + (q.unit || "");
    return v;
  };

  // ---------- figures ----------
  let figSeq = 0;
  L.figure = f => {
    if (!f) return "";
    if (typeof f === "string") {
      if (f.trim().startsWith("<svg")) return `<div class="fig">${f}</div>`;
      const src = /^(data:|https?:|\/)/.test(f) ? f : "quizzes/" + f.replace(/^\.\//, "");
      return `<div class="fig"><img src="${L.esc(src)}" alt=""></div>`;
    }
    const w = f.w || 300, h = f.h || 160, g = f.grid;
    let grid = "";
    if (g) {
      const id = "gp" + ++figSeq;
      grid = `<defs><pattern id="${id}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><path class="gr" d="M ${g} 0 L 0 0 0 ${g}"/></pattern></defs><rect class="bgr" width="${w}" height="${h}" fill="url(#${id})" stroke="none"/>`;
    }
    return `<div class="fig"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="그림">${grid}${f.draw || ""}</svg></div>`;
  };
  const optFig = o => (o.image ? L.figure(o.image) : L.figure(o.figure || o.svg));

  L.questionHead = (Q, q, n) =>
    `<div class="qhead"><span class="qnum">문제 ${n}</span><span class="tag t-${q.type}">${L.TYPE_NAME[q.type] || ""}</span><span class="pts">${L.ptsOf(Q, q)}점</span></div>
     <p class="qtext">${L.fmt(q.text)}</p>${q.image ? L.figure(q.image) : L.figure(q.figure)}`;

  /** 답하는 칸. draft = 지금 고른 값, locked = 누를 수 없게 */
  L.answerArea = (q, draft, opts = {}) => {
    const d = draft == null ? "" : String(draft);
    if (q.type === "ox") {
      return `<div class="ox">${["O", "X"].map(v => `<button class="oxbtn ${d === v ? "sel" : ""}" data-v="${v}" aria-label="${v}">${v === "O" ? L.OICON : L.XICON}</button>`).join("")}</div>`;
    }
    if (q.type === "choice") {
      const textual = q.options.every(o => typeof o === "string" || (!o.figure && !o.image && !o.svg));
      return `<div class="choices ${textual ? "textual" : ""}">${q.options.map((o, i) => {
        const obj = typeof o === "string" ? { text: o } : o;
        return `<button class="opt ${d === String(i + 1) ? "sel" : ""}" data-v="${i + 1}"><span class="olabel">${L.esc(L.optLabel(q, i + 1))}</span>${optFig(obj)}${obj.text ? `<span class="otext">${L.fmt(obj.text)}</span>` : ""}</button>`;
      }).join("")}</div>`;
    }
    if (q.type === "number") {
      if (opts.preview) return `<div class="typed"><div class="numdisp empty">?</div>${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>`;
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
      return `<div class="typed"><div class="numdisp ${d === "" ? "empty" : ""}" id="nd">${d === "" ? "?" : L.esc(d)}</div>${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>
        <div class="pad">${keys.map(k => `<button data-k="${k}">${k}</button>`).join("")}<button class="del" data-k="del" style="grid-column: span 5">지우기</button></div>`;
    }
    if (opts.preview) return `<div class="typed"><input disabled placeholder="답을 적어요">${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>`;
    return `<div class="typed"><input id="sa" autocomplete="off" autocapitalize="off" spellcheck="false" value="${L.esc(d)}" placeholder="답을 적어요">${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>${q.hint ? `<p class="hint">${L.esc(q.hint)}</p>` : ""}`;
  };

  // ---------- icons ----------
  L.GEM = `<svg viewBox="0 0 64 56" aria-hidden="true"><polygon points="14,2 50,2 62,18 32,54 2,18" fill="#46C3E8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><polygon points="14,2 22,18 32,2" fill="#9BE3F6"/><polygon points="32,2 42,18 50,2" fill="#9BE3F6"/><polygon points="2,18 62,18 32,54" fill="#2AA7D0"/><polygon points="22,18 42,18 32,54" fill="#5FD0F0"/><polyline points="2,18 62,18" fill="none" stroke="#1D2A44" stroke-width="2.5"/><polyline points="14,2 22,18 32,54 42,18 50,2" fill="none" stroke="#1D2A44" stroke-width="2"/></svg>`;
  L.COIN = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#F4B400" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="20" r="11" fill="none" stroke="#B57F00" stroke-width="2.5"/><text x="20" y="25.5" text-anchor="middle" font-size="14" font-family="Jua, sans-serif" fill="#7A5500">P</text></svg>`;
  L.ROCK = `<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M8 46 Q4 30 16 22 Q22 8 38 12 Q56 14 58 32 Q62 46 48 50 Q28 54 8 46 Z" fill="#C9CED8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M20 26 Q26 22 30 26 M40 34 Q44 30 48 34" fill="none" stroke="#8E96A6" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  L.CHEST = `<svg class="chest" viewBox="0 0 120 96" aria-hidden="true"><rect x="10" y="40" width="100" height="50" rx="6" fill="#C8873A" stroke="#1D2A44" stroke-width="4"/><path d="M10 44 Q10 10 60 10 Q110 10 110 44 Z" fill="#E09A45" stroke="#1D2A44" stroke-width="4" stroke-linejoin="round"/><rect x="10" y="40" width="100" height="10" fill="#F4B400" stroke="#1D2A44" stroke-width="4"/><rect x="50" y="42" width="20" height="24" rx="4" fill="#F4B400" stroke="#1D2A44" stroke-width="4"/><circle cx="60" cy="54" r="3.5" fill="#1D2A44"/></svg>`;
  L.OICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36" fill="none" stroke="#2C7BE0" stroke-width="14"/></svg>`;
  L.XICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M20 20 L80 80 M80 20 L20 80" stroke="#E0453B" stroke-width="14" stroke-linecap="round"/></svg>`;

  // ---------- backend ----------
  L.makeBackend = () => {
    const cfg = window.FIREBASE_CONFIG;
    const ready = cfg && cfg.databaseURL && !/YOUR|여기에/.test(cfg.databaseURL) && window.firebase;
    return ready ? firebaseBackend(cfg) : demoBackend();
  };

  function firebaseBackend(cfg) {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    const db = app.database();
    const conn = db.ref(".info/connected");
    return {
      kind: "firebase",
      set: (p, v) => db.ref(p).set(v),
      update: (p, v) => db.ref(p).update(v),
      remove: p => db.ref(p).remove(),
      get: p => db.ref(p).get().then(s => s.val()),
      on(p, cb) { const r = db.ref(p); const h = s => cb(s.val()); r.on("value", h); return () => r.off("value", h); },
      presence(p) {
        const r = db.ref(p);
        const h = s => { if (s.val()) { r.onDisconnect().set(false); r.set(true); } };
        conn.on("value", h);
        return () => { conn.off("value", h); r.onDisconnect().cancel(); r.set(false); };
      },
      onConnected(cb) { const h = s => cb(!!s.val()); conn.on("value", h); return () => conn.off("value", h); },
      now: () => firebase.database.ServerValue.TIMESTAMP
    };
  }

  // 데모: 같은 컴퓨터·같은 브라우저의 탭끼리만 연결 (설정 전 연습용)
  function demoBackend() {
    const KEY = "live-quiz-demo-db";
    const ch = "BroadcastChannel" in window ? new BroadcastChannel("live-quiz-demo") : null;
    const read = () => L.store.get(KEY) || {};
    const seg = p => p.split("/").filter(Boolean);
    const getAt = (d, p) => seg(p).reduce((o, k) => (o == null ? undefined : o[k]), d);
    const setAt = (d, p, v) => {
      const s = seg(p); let o = d;
      for (let i = 0; i < s.length - 1; i++) { if (typeof o[s[i]] !== "object" || o[s[i]] === null) o[s[i]] = {}; o = o[s[i]]; }
      if (v === null || v === undefined) delete o[s[s.length - 1]]; else o[s[s.length - 1]] = JSON.parse(JSON.stringify(v));
    };
    const listeners = new Set();
    const fire = () => {
      const d = read();
      listeners.forEach(l => {
        const v = getAt(d, l.p), j = v === undefined ? "null" : JSON.stringify(v);
        if (j !== l.last) { l.last = j; l.cb(JSON.parse(j)); }
      });
    };
    const commit = d => { L.store.set(KEY, d); if (ch) ch.postMessage(1); fire(); };
    if (ch) ch.onmessage = fire;
    window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
    const api = {
      kind: "demo",
      async set(p, v) { const d = read(); setAt(d, p, v); commit(d); },
      async update(p, obj) { const d = read(); Object.keys(obj).forEach(k => setAt(d, p + "/" + k, obj[k])); commit(d); },
      async remove(p) { const d = read(); setAt(d, p, null); commit(d); },
      async get(p) { const v = getAt(read(), p); return v === undefined ? null : JSON.parse(JSON.stringify(v)); },
      on(p, cb) { const l = { p, cb, last: undefined }; listeners.add(l); setTimeout(fire, 0); return () => listeners.delete(l); },
      presence(p) {
        api.set(p, true);
        const off = () => api.set(p, false);
        window.addEventListener("pagehide", off);
        return () => { window.removeEventListener("pagehide", off); off(); };
      },
      onConnected(cb) { setTimeout(() => cb(true), 0); return () => {}; },
      now: () => Date.now()
    };
    return api;
  }

  /** 학생 한 명의 점수 합계 (answers 전체 + 학생 id) */
  L.scoreOf = (answers, sid) => Object.values(answers || {}).reduce((a, qa) => {
    const r = qa && qa[sid]; return a + (r ? (r.pts || 0) + (r.bonus || 0) : 0);
  }, 0);
})();
