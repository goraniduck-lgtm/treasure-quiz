/* 교사·학생 화면이 함께 쓰는 코드: 저장소(Firebase 또는 데모), 퀴즈 불러오기, 문항 그리기, 채점 */
(function () {
  "use strict";
  const L = (window.LQ = {});
  L.APP_VERSION = "20261028085812";

  /** 사이트가 새 버전이면 한 번 새로고침 (오래 열어 둔 태블릿이 예전 프로그램으로 남지 않게) */
  L.checkUpdate = async (canReload) => {
    try {
      const res = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return false;
      const v = String((await res.json()).v || "");
      if (!v || v <= L.APP_VERSION) return false;
      let tried = null; try { tried = sessionStorage.getItem("lq-reload"); } catch (e) {}
      if (tried === v) return false;                   // 같은 버전으로 이미 한 번 시도했으면 반복하지 않음
      if (canReload && !canReload()) return true;      // 지금은 새로고침하기 곤란한 순간
      try { sessionStorage.setItem("lq-reload", v); } catch (e) {}
      const qs = new URLSearchParams(location.search); qs.set("r", v);
      location.replace(location.pathname + "?" + qs.toString() + location.hash);
      return true;
    } catch (e) { return false; }
  };
  /** 새 화면이 뜬 직후 잠깐 탭을 막음: '정답 확인'을 누른 손가락(두 번 탭)이 다음 화면의 카드를 누르지 않게 */
  L.arm = (el, ms = 600) => {
    if (!el) return;
    el.classList.add("arming");
    clearTimeout(el._armT);
    el._armT = setTimeout(() => el.classList.remove("arming"), ms);
  };
  /** 방 코드가 담긴 학생용 QR (vendor/qrcode.js가 없으면 고정 QR 그림) */
  L.qrHTML = (url, cell = 5) => {
    try {
      const qr = window.qrcode(0, "M"); qr.addData(url); qr.make();
      return qr.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
    } catch (e) { return `<img src="qr-student.svg" alt="학생 주소 QR 코드">`; }
  };
  /** 문제 틀 생성기가 아직 없으면 불러오기 */
  L.ensureGenerators = () => (L.instantiate ? Promise.resolve() : new Promise(res => {
    const s = document.createElement("script"); s.src = "generators.js?t=" + Date.now(); s.onload = s.onerror = () => res(); document.head.appendChild(s);
  }));

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
  const DEFAULTS = { points: 10, cards: 4, treasures: 2, showAnswer: true };
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
  /** 방에 저장된 퀴즈(여러 차시 묶음 가능)와 문항 순서대로 불러오기 */
  L.loadRoomQuiz = async room => {
    const files = Array.isArray(room.quiz) ? room.quiz : [room.quiz];
    const parts = await Promise.all(files.map(L.loadQuiz));
    if (parts.some(p => p.questions.some(q => q.gen || q.shuffle))) await L.ensureGenerators();
    const Q = parts[0];
    const all = [].concat(...parts.map(p => p.questions.map(q => Object.assign({ _src: p.title }, q))));
    Q.allQuestions = all;
    Q.templates = Array.isArray(room.order) ? room.order.map(i => all[i]).filter(Boolean) : all;
    Q.seed = room.seed || String(room.createdAt || "") + (room.title || "");
    // 문제 틀(gen)은 방마다 새 숫자로: ① 모드는 이 문제를 반 전체가 같이 봄
    Q.questions = Q.templates.map((t, i) => (L.instantiate ? L.instantiate(t, Q.seed + ":" + i) : t));
    if (room.title) Q.title = room.title;
    if (parts.length > 1) Q.subtitle = parts.map(p => p.title).join(" · ");
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
  L.answersOf = q => (Array.isArray(q.answer) ? q.answer : [q.answer]);
  L.maxBase = Q => Q.questions.reduce((a, q) => a + L.ptsOf(Q, q), 0);

  L.isCorrect = (q, given) => {
    if (given === "" || given == null) return false;
    if (q.type === "ox") return String(given).toUpperCase() === String(q.answer).toUpperCase();
    if (q.type === "choice" && q.multi) {
      const a = L.answersOf(q).map(Number).sort((x, y) => x - y).join(","), g = String(given).split(",").filter(Boolean).map(Number).sort((x, y) => x - y).join(",");
      return a === g;
    }
    if (q.type === "choice" || q.type === "number") return L.answersOf(q).map(Number).includes(Number(given));
    return L.answersOf(q).map(L.norm).includes(L.norm(given));
  };
  L.optLabel = (q, i) => { const o = q.options[i - 1]; return (o && typeof o === "object" && o.label) || L.CIRCLED[i - 1] || String(i); };
  L.showAns = (q, v) => {
    if (q.type === "choice" && q.multi && v == null) return L.answersOf(q).map(i => L.optLabel(q, i)).join(", ");
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
    `<div class="qhead"><span class="qnum">문제 ${n}</span><span class="tag t-${q.type}">${q.multi ? "모두 고르기" : L.TYPE_NAME[q.type] || ""}</span><span class="pts">${L.ptsOf(Q, q)}점</span></div>
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
        const on = q.multi ? d.split(",").includes(String(i + 1)) : d === String(i + 1);
        return `<button class="opt ${on ? "sel" : ""}" data-v="${i + 1}"><span class="olabel">${L.esc(L.optLabel(q, i + 1))}</span>${optFig(obj)}${obj.text ? `<span class="otext">${L.fmt(obj.text)}</span>` : ""}</button>`;
      }).join("")}</div>`;
    }
    if (q.type === "number") {
      if (opts.preview) return `<div class="typed"><div class="numdisp empty">?</div>${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>`;
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
      return `<div class="typed"><div class="numdisp ${d === "" ? "empty" : ""}" id="nd">${d === "" ? "?" : L.esc(d)}</div>${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>
        <div class="pad">${keys.map(k => `<button data-k="${k}">${k}</button>`).join("")}<button class="dotk" data-k="." aria-label="소수점">.</button><button class="del" data-k="del" style="grid-column: span 4">지우기</button></div>`;
    }
    if (opts.preview) return `<div class="typed"><input disabled placeholder="답을 적어요">${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>`;
    return `<div class="typed"><input id="sa" autocomplete="off" autocapitalize="off" spellcheck="false" value="${L.esc(d)}" placeholder="답을 적어요">${q.unit ? `<span class="unit">${L.esc(q.unit)}</span>` : ""}</div>${q.hint ? `<p class="hint">${L.esc(q.hint)}</p>` : ""}`;
  };

  /** 답 고르기·입력 연결. get()/set(v)로 임시 답을 읽고 쓰고, submit()은 엔터·확인 */
  L.bindAnswer = (area, q, get, set, submit) => {
    if (q.type === "ox" || (q.type === "choice" && !q.multi)) {
      area.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => {
        area.querySelectorAll("[data-v]").forEach(x => x.classList.toggle("sel", x === b)); set(b.dataset.v);
      }));
    } else if (q.type === "choice") {
      area.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => {
        b.classList.toggle("sel");
        set(Array.from(area.querySelectorAll("[data-v].sel")).map(x => x.dataset.v).sort((a, c) => a - c).join(","));
      }));
    } else if (q.type === "number") {
      const nd = area.querySelector("#nd");
      area.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => {
        let v = get() || "";
        const k = b.dataset.k;
        if (k === "del") v = v.slice(0, -1);
        else if (k === ".") { if (!v.includes(".") && v.length < 7) v = (v || "0") + "."; }
        else if (v.length < 7) v = (v === "0" ? "" : v) + k;
        nd.textContent = v === "" ? "?" : v; nd.classList.toggle("empty", v === ""); set(v);
      }));
    } else {
      const sa = area.querySelector("#sa");
      sa.addEventListener("input", () => set(sa.value.trim() === "" ? "" : sa.value));
      sa.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing && get()) { e.preventDefault(); submit(); } });
    }
  };

  // ---------- icons ----------
  L.GEM = `<svg viewBox="0 0 64 56" aria-hidden="true"><polygon points="14,2 50,2 62,18 32,54 2,18" fill="#46C3E8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><polygon points="14,2 22,18 32,2" fill="#9BE3F6"/><polygon points="32,2 42,18 50,2" fill="#9BE3F6"/><polygon points="2,18 62,18 32,54" fill="#2AA7D0"/><polygon points="22,18 42,18 32,54" fill="#5FD0F0"/><polyline points="2,18 62,18" fill="none" stroke="#1D2A44" stroke-width="2.5"/><polyline points="14,2 22,18 32,54 42,18 50,2" fill="none" stroke="#1D2A44" stroke-width="2"/></svg>`;
  L.COIN = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#F4B400" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="20" r="11" fill="none" stroke="#B57F00" stroke-width="2.5"/><text x="20" y="25.5" text-anchor="middle" font-size="14" font-family="Jua, sans-serif" fill="#7A5500">P</text></svg>`;
  L.ROCK = `<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M8 46 Q4 30 16 22 Q22 8 38 12 Q56 14 58 32 Q62 46 48 50 Q28 54 8 46 Z" fill="#C9CED8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M20 26 Q26 22 30 26 M40 34 Q44 30 48 34" fill="none" stroke="#8E96A6" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  L.CHEST = `<svg class="chest" viewBox="0 0 120 96" aria-hidden="true"><rect x="10" y="40" width="100" height="50" rx="6" fill="#C8873A" stroke="#1D2A44" stroke-width="4"/><path d="M10 44 Q10 10 60 10 Q110 10 110 44 Z" fill="#E09A45" stroke="#1D2A44" stroke-width="4" stroke-linejoin="round"/><rect x="10" y="40" width="100" height="10" fill="#F4B400" stroke="#1D2A44" stroke-width="4"/><rect x="50" y="42" width="20" height="24" rx="4" fill="#F4B400" stroke="#1D2A44" stroke-width="4"/><circle cx="60" cy="54" r="3.5" fill="#1D2A44"/></svg>`;
  L.OICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36" fill="none" stroke="#2C7BE0" stroke-width="14"/></svg>`;
  L.XICON = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M20 20 L80 80 M80 20 L20 80" stroke="#E0453B" stroke-width="14" stroke-linecap="round"/></svg>`;

  // ---------- treasures ----------
  const SV = b => `<svg viewBox="0 0 64 56" aria-hidden="true">${b}</svg>`;
  L.ICONS = {
    coin: SV(`<ellipse cx="32" cy="30" rx="22" ry="22" fill="#F4B400" stroke="#1D2A44" stroke-width="3"/><ellipse cx="32" cy="30" rx="14" ry="14" fill="none" stroke="#B57F00" stroke-width="3"/><path d="M27 22 L32 38 L37 22" fill="none" stroke="#B57F00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),
    ruby: SV(`<polygon points="32,3 56,18 50,44 32,53 14,44 8,18" fill="#E2405A" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><polygon points="32,12 46,21 42,38 32,44 22,38 18,21" fill="#F37A8C"/><path d="M32 3 L32 12 M56 18 L46 21 M50 44 L42 38 M14 44 L22 38 M8 18 L18 21" fill="none" stroke="#1D2A44" stroke-width="2"/>`),
    gem: SV(`<polygon points="14,2 50,2 62,18 32,54 2,18" fill="#46C3E8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><polygon points="14,2 22,18 32,2" fill="#9BE3F6"/><polygon points="32,2 42,18 50,2" fill="#9BE3F6"/><polygon points="2,18 62,18 32,54" fill="#2AA7D0"/><polygon points="22,18 42,18 32,54" fill="#5FD0F0"/><polyline points="2,18 62,18" fill="none" stroke="#1D2A44" stroke-width="2.5"/><polyline points="14,2 22,18 32,54 42,18 50,2" fill="none" stroke="#1D2A44" stroke-width="2"/>`),
    crown: SV(`<polygon points="6,44 4,14 20,28 32,6 44,28 60,14 58,44" fill="#F4B400" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="44" width="52" height="8" rx="2" fill="#E09A00" stroke="#1D2A44" stroke-width="3"/><circle cx="32" cy="34" r="5" fill="#E2405A" stroke="#1D2A44" stroke-width="2"/><circle cx="17" cy="38" r="3.5" fill="#46C3E8" stroke="#1D2A44" stroke-width="2"/><circle cx="47" cy="38" r="3.5" fill="#46C3E8" stroke="#1D2A44" stroke-width="2"/>`),
    rock: SV(`<path d="M8 46 Q4 30 16 22 Q22 8 38 12 Q56 14 58 32 Q62 46 48 50 Q28 54 8 46 Z" fill="#C9CED8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M20 26 Q26 22 30 26 M40 34 Q44 30 48 34" fill="none" stroke="#8E96A6" stroke-width="2.5" stroke-linecap="round"/>`),
    boot: SV(`<path d="M18 4 H38 V34 L54 38 Q60 40 60 46 V52 H10 V40 Q14 36 16 30 Z" fill="#9B6B43" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M18 14 H38 M10 46 H60" stroke="#6E4A2C" stroke-width="3"/><circle cx="46" cy="44" r="2" fill="#1D2A44"/>`),
    shell: SV(`<path d="M32 50 L8 26 Q8 8 32 6 Q56 8 56 26 Z" fill="#F6E3C8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M32 50 L20 12 M32 50 L32 6 M32 50 L44 12" fill="none" stroke="#C9A77A" stroke-width="2.5"/>`)
  };
  // 보물 종류 (점수가 높을수록 드물게 나옴). 퀴즈 settings.treasureTypes 로 바꿀 수 있음
  L.DEFAULT_TREASURES = [
    { icon: "coin", name: "금화", points: 3, weight: 4 },
    { icon: "ruby", name: "루비", points: 5, weight: 3 },
    { icon: "gem", name: "다이아몬드", points: 7, weight: 2 },
    { icon: "crown", name: "왕관", points: 10, weight: 1 }
  ];
  L.BLANKS = [
    { icon: "rock", name: "돌멩이" }, { icon: "boot", name: "낡은 장화" }, { icon: "shell", name: "빈 조개껍데기" }
  ];
  L.treasureTypes = (Q, q) => (q && q.treasureTypes) || Q.set.treasureTypes || L.DEFAULT_TREASURES;
  L.treasureRange = Q => { const t = L.treasureTypes(Q).map(x => x.points); return Math.min(...t) === Math.max(...t) ? `${t[0]}점` : `${Math.min(...t)}~${Math.max(...t)}점`; };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pickWeighted = arr => { const tot = arr.reduce((a, x) => a + (x.weight || 1), 0); let r = Math.random() * tot; for (const x of arr) { r -= x.weight || 1; if (r < 0) return x; } return arr[arr.length - 1]; };
  /** 한 문제의 보물판: [{icon,name,points}] — points 0 이면 꽝 */
  L.makeBoard = (Q, q) => {
    const n = L.cardsOf(Q, q), t = L.treOf(Q, q), types = L.treasureTypes(Q, q);
    const pos = L.shuffleBoard(n, t);
    return pos.map(has => {
      const x = has ? pickWeighted(types) : pick(L.BLANKS);
      return { icon: x.icon, name: x.name, points: has ? x.points : 0 };
    });
  };
  L.icon = k => L.ICONS[k] || L.ICONS.gem;

  // ---------- 2번(자율 진행) 효과 카드 ----------
  Object.assign(L.ICONS, {
    bomb: SV(`<circle cx="28" cy="34" r="18" fill="#3A4560" stroke="#1D2A44" stroke-width="3"/><path d="M40 20 L46 12" stroke="#1D2A44" stroke-width="4" stroke-linecap="round"/><path d="M46 12 Q52 6 56 10" fill="none" stroke="#E0453B" stroke-width="3" stroke-linecap="round"/><circle cx="57" cy="8" r="4" fill="#F4B400"/><circle cx="21" cy="28" r="4" fill="#8A97B5"/>`),
    magnet: SV(`<path d="M10 6 H24 V32 Q24 40 32 40 Q40 40 40 32 V6 H54 V32 Q54 54 32 54 Q10 54 10 32 Z" fill="#E0453B" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="6" width="14" height="10" fill="#C9CED8" stroke="#1D2A44" stroke-width="3"/><rect x="40" y="6" width="14" height="10" fill="#C9CED8" stroke="#1D2A44" stroke-width="3"/>`),
    bag: SV(`<path d="M22 14 L18 4 H46 L42 14 Q60 26 58 42 Q56 54 32 54 Q8 54 6 42 Q4 26 22 14 Z" fill="#C8873A" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M22 14 H42" stroke="#1D2A44" stroke-width="3"/><text x="32" y="44" text-anchor="middle" font-size="20" font-family="Jua, sans-serif" fill="#FFE29A">ALL</text>`),
    shield: SV(`<path d="M32 3 L56 12 V30 Q56 46 32 54 Q8 46 8 30 V12 Z" fill="#46C3E8" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><path d="M32 10 L49 16 V30 Q49 41 32 47 Z" fill="#9BE3F6"/><path d="M22 29 L29 36 L43 21" fill="none" stroke="#1D2A44" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
    tax: SV(`<ellipse cx="20" cy="40" rx="13" ry="13" fill="#F4B400" stroke="#1D2A44" stroke-width="3"/><ellipse cx="44" cy="40" rx="13" ry="13" fill="#F4B400" stroke="#1D2A44" stroke-width="3"/><ellipse cx="32" cy="20" rx="13" ry="13" fill="#F4B400" stroke="#1D2A44" stroke-width="3"/><path d="M32 2 V8 M8 22 L3 18 M56 22 L61 18" stroke="#E0453B" stroke-width="3" stroke-linecap="round"/>`),
    crownx: SV(`<polygon points="6,44 4,14 20,28 32,6 44,28 60,14 58,44" fill="#F4B400" stroke="#1D2A44" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="44" width="52" height="8" rx="2" fill="#E09A00" stroke="#1D2A44" stroke-width="3"/><path d="M10 10 L54 52" stroke="#E0453B" stroke-width="7" stroke-linecap="round"/>`),
    swap: SV(`<circle cx="32" cy="29" r="25" fill="#BBD6F2" stroke="#1D2A44" stroke-width="3"/><path d="M16 22 H44 L38 15 M48 36 H20 L26 43" fill="none" stroke="#1D2A44" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`)
  });
  L.EFFECTS = {
    add:      { name: "점수 추가", weight: 45, desc: a => `+${a}점` },
    minus:    { name: "감점", weight: 15, desc: a => `-${a}점` },
    stealSome:{ name: "일부 가져오기", weight: 8, desc: () => "친구 점수 30% 가져오기", target: true },
    stealAll: { name: "전부 가져오기", weight: 3, desc: () => "친구 점수 전부 가져오기", target: true },
    swap:     { name: "점수 바꾸기", weight: 6, desc: () => "친구와 점수 바꾸기", target: true },
    topMinus: { name: "1등 감점", weight: 10, desc: () => "1등 점수 -30점 (내가 1등이면 2등)" },
    // 아래 두 장은 내가 지금 1등일 때만 나옴
    shield:   { name: "방어막", weight: 15, desc: () => "방어막 3개: 공격 3번 막기", leaderOnly: true },
    taxAll:   { name: "조금씩 가져오기", weight: 12, desc: () => "모든 친구에게서 3점씩", leaderOnly: true }
  };
  L.TAX = 3;
  // 점수 바꾸기·전부 가져오기: 문제를 5개 이상 풀고 3개 이상 맞힌 학생에게만, 마지막 1분에는 안 나옴
  L.BIG_EFFECTS = ["swap", "stealAll"];
  L.BIG_RULE = { minSolved: 5, minCorrect: 3, lastMs: 60000 };
  L.ATTACKS = ["stealSome", "stealAll", "swap", "topMinus"];
  L.TOP_MINUS = 30;
  /** 연속 정답 콤보 보너스 (맞힐 때마다): 1~5연속 2연속부터 +20·+30·+40·+50, 6~10연속 +80, 11~15연속 +150, 16연속 이상 +300 */
  L.comboBonus = n => (n >= 16 ? 300 : n >= 11 ? 150 : n >= 6 ? 80 : n >= 2 ? n * 10 : 0);
  L.COMBO_TEXT = "2~5연속 +20~50 · 6~10연속 +80 · 11~15연속 +150 · 16연속 이상 +300";
  L.EFFECT_KEYS = Object.keys(L.EFFECTS);
  L.EFFECT_ICON = { add: "coin", minus: "bomb", stealSome: "magnet", stealAll: "bag", swap: "swap", topMinus: "crownx", shield: "shield", taxAll: "tax", blocked: "shield" };
  /** 효과 카드 한 장 뽑기. enabled = {add:true, ...} */
  L.drawEffect = (enabled, ctx) => {
    let keys = L.EFFECT_KEYS.filter(k => (!enabled || enabled[k] !== false) && (!L.EFFECTS[k].leaderOnly || (ctx && ctx.leader)));
    if (ctx && ctx.allowBig === false) keys = keys.filter(k => !L.BIG_EFFECTS.includes(k));   // 큰 카드는 조건이 될 때만
    if (ctx && ctx.allowSwap === false) keys = keys.filter(k => k !== "swap");                // 등수가 절반 아래면 점수 바꾸기 없음
    if (!keys.length) keys = ["add"];
    const pickK = pickWeighted(keys.map(k => ({ k, weight: L.EFFECTS[k].weight }))).k;
    if (pickK === "add") { const a = pick([10, 10, 15, 15, 20, 30]); return { k: "add", amount: a, icon: a >= 30 ? "crown" : a >= 20 ? "gem" : a >= 15 ? "ruby" : "coin" }; }
    if (pickK === "minus") return { k: "minus", amount: pick([10, 10, 20]), icon: "bomb" };
    if (pickK === "topMinus") return { k: "topMinus", amount: L.TOP_MINUS, icon: "crownx" };
    return { k: pickK, icon: L.EFFECT_ICON[pickK] };
  };
  L.effectLabel = e => `${L.EFFECTS[e.k].name} · ${L.EFFECTS[e.k].desc(e.amount)}`;

  /** 2번 모드 점수표 {학생id: 점수} = 정답 점수 합 + 효과(ledger) 합 */
  L.selfScores = R => {
    const sc = {};
    Object.keys(R.students || {}).forEach(id => (sc[id] = 0));
    Object.entries(R.log || {}).forEach(([sid, ents]) => Object.values(ents || {}).forEach(e => { if (e) sc[sid] = (sc[sid] || 0) + (e.pts || 0) + (e.combo || 0); }));
    Object.values(R.ledger || {}).forEach(x => Object.entries((x && x.d) || {}).forEach(([sid, v]) => { sc[sid] = (sc[sid] || 0) + (v || 0); }));
    return sc;
  };
  L.fmtTime = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  L.seqId = () => Date.now().toString(36).padStart(9, "0") + L.rid(4);

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
    let offset = 0;
    db.ref(".info/serverTimeOffset").on("value", s => { offset = s.val() || 0; });
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
        // quiet=true: 방이 이미 지워졌을 때는 아무것도 쓰지 않음 (지운 방이 다시 생기지 않게)
        return quiet => { conn.off("value", h); r.onDisconnect().cancel(); if (!quiet) r.set(false); };
      },
      onConnected(cb) { const h = s => cb(!!s.val()); conn.on("value", h); return () => conn.off("value", h); },
      now: () => firebase.database.ServerValue.TIMESTAMP,
      serverNow: () => Date.now() + offset
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
        return quiet => { window.removeEventListener("pagehide", off); if (!quiet) off(); };
      },
      onConnected(cb) { setTimeout(() => cb(true), 0); return () => {}; },
      now: () => Date.now(),
      serverNow: () => Date.now()
    };
    return api;
  }

  /** 연결 상태 띠: 연결이 3초 넘게 끊겨 있을 때만 화면 맨 위에 표시 (데모 모드는 표시 안 함) */
  L.netBanner = B => {
    if (B.kind !== "firebase") return;
    const bar = document.createElement("div");
    bar.className = "banner err netbar"; bar.hidden = true;
    bar.textContent = "인터넷 연결이 끊겼어요. 다시 연결되면 자동으로 이어져요.";
    document.body.prepend(bar);
    let timer = null;
    B.onConnected(c => {
      clearTimeout(timer);
      if (c) bar.hidden = true;
      else timer = setTimeout(() => { bar.hidden = false; }, 3000);
    });
  };

  /** 학생 한 명의 점수 합계 (answers 전체 + 학생 id) */
  L.scoreOf = (answers, sid) => Object.values(answers || {}).reduce((a, qa) => {
    const r = qa && qa[sid]; return a + (r ? (r.pts || 0) + (r.bonus || 0) : 0);
  }, 0);
})();
