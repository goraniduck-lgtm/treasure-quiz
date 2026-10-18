/* 활동지 앱 공용 코드: 저장소(Firebase 또는 시연 모드), 채점, 통계 계산 */
(function () {
  "use strict";
  const WS = (window.WS = {});
  const TEACHER_EMAIL = "goraniduck@gmail.com";
  WS.TEACHER_EMAIL = TEACHER_EMAIL;
  WS.N_STUDENTS = 25;
  WS.SHEETS = window.WS_SHEETS;
  WS.demo = /[?&]demo(=1)?(&|$)/.test(location.search) || !window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.databaseURL;

  /* ---------- 도우미 ---------- */
  WS.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  WS.nl = (s) => WS.esc(s).replace(/\n/g, "<br>");
  WS.norm = (s) => String(s == null ? "" : s).normalize("NFC").replace(/[\s.,!?~·'"()（）‘’“”]/g, "").toLowerCase();
  WS.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  WS.fmtTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  WS.CAT_COLOR = { 생물: "#3C9D5D", 스포츠: "#2F7FD1", 환경: "#139C9C", 도덕: "#E08A1E", "재미있는 이야기": "#D6558C", "무서운 이야기": "#7A55C2" };
  WS.AREAS = ["맞춤법", "어휘", "사실", "추론", "의견"];
  WS.AREA_LABEL = { 맞춤법: "맞춤법", 어휘: "어휘", 사실: "사실 독해", 추론: "추론 독해", 의견: "의견 쓰기" };
  WS.LEVEL = { a: { t: "잘했어요", pt: 1, icon: "★★★" }, b: { t: "보통이에요", pt: 0.5, icon: "★★☆" }, c: { t: "더 노력해요", pt: 0, icon: "★☆☆" } };
  WS.CIRC = ["①", "②", "③", "④"];

  /* ---------- 채점 ---------- */
  // 문항 하나의 상태: o 맞음 / x 틀림 / r 오답 처리(교사 확인 가능) / m 교사 채점 필요 / g 서술 채점됨 / n 안 풀었음
  WS.alts = (ans) => [ans, ...String(ans).split(/[()\/]/)].map(WS.norm).filter(Boolean);
  function judge(item, a) {
    const blank = a == null || a === "" || (item.kind === "pick" && String(a).split("|").every((p) => !p));
    if (blank) return "n";
    switch (item.kind) {
      case "pick": {
        const parts = String(a).split("|");
        return item.ans.every((v, k) => parts[k] === v) ? "o" : "x";
      }
      case "fix": return WS.norm(a) === WS.norm(item.ans) ? "o" : "x";
      case "voc":
      case "choice": return Number(a) === item.ans ? "o" : "x";
      case "short":
        if (!item.auto) return "m";
        return WS.alts(item.ans).includes(WS.norm(a)) ? "o" : "r";
      case "write": return "m";
    }
    return "n";
  }
  WS.judge = judge;
  WS.itemResult = (item, a, fb) => {
    const ov = fb && fb.ov && fb.ov[item.id];
    if (item.kind === "write") {
      const lv = fb && fb.lv && fb.lv[item.id];
      if (lv && WS.LEVEL[lv]) return { st: "g", pt: WS.LEVEL[lv].pt, lv };
      return { st: judge(item, a) === "n" ? "n" : "m", pt: 0 };
    }
    if (ov === "o" || ov === "x") return { st: ov, pt: ov === "o" ? 1 : 0, teacher: true };
    const st = judge(item, a);
    return { st, pt: st === "o" ? 1 : 0 };
  };
  /** 한 활동지 결과. sub 없으면 null */
  WS.scoreSheet = (sheet, sub, fb) => {
    if (!sub) return null;
    const ans = sub.a || {};
    const items = [...sheet.A, ...sheet.B].map((it) => {
      const r = WS.itemResult(it, ans[it.id], fb);
      return { item: it, a: ans[it.id], ...r };
    });
    const byArea = {};
    WS.AREAS.forEach((ar) => (byArea[ar] = { pt: 0, max: 0 }));
    let total = 0;
    items.forEach((x) => { byArea[x.item.area].max += 1; byArea[x.item.area].pt += x.pt; total += x.pt; });
    const max = items.length;
    const pending = items.filter((x) => x.st === "m" || x.st === "r").length;
    return { items, total, max, pct: Math.round((total / max) * 100), byArea, pending, done: !!(fb && fb.done) };
  };
  WS.pctText = (r) => (r ? `${Math.round(r.total * 10) / 10}/${r.max}` : "-");

  /* ---------- 저장소 ---------- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = () => rej(new Error("스크립트를 불러오지 못했어요: " + src));
      document.head.appendChild(s);
    });
  }
  const FB_BASE = "https://www.gstatic.com/firebasejs/10.12.2/";

  function firebaseBackend() {
    let app, auth, db;
    return {
      kind: "firebase",
      async init() {
        await loadScript(FB_BASE + "firebase-app-compat.js");
        await Promise.all([loadScript(FB_BASE + "firebase-auth-compat.js"), loadScript(FB_BASE + "firebase-database-compat.js")]);
        app = firebase.initializeApp(window.FIREBASE_CONFIG, "worksheet");
        auth = firebase.auth(app); db = firebase.database(app);
      },
      user() { return auth.currentUser; },
      isTeacher() { const u = auth.currentUser; return !!(u && u.email && u.email.toLowerCase() === TEACHER_EMAIL); },
      onAuth(cb) { return auth.onAuthStateChanged(cb); },
      async signInAnon() { if (!auth.currentUser) await auth.signInAnonymously(); return auth.currentUser; },
      async signInTeacher(email, pw) { return auth.signInWithEmailAndPassword(email, pw); },
      async signOut() { return auth.signOut(); },
      get: (p) => db.ref(p).once("value").then((s) => s.val()),
      set: (p, v) => db.ref(p).set(v),
      update: (p, v) => db.ref(p).update(v),
      remove: (p) => db.ref(p).remove(),
      key: (p) => db.ref(p).push().key,
      on(p, cb, errCb) { const r = db.ref(p); const h = r.on("value", (s) => cb(s.val()), errCb); return () => r.off("value", h); },
      onConnection(cb) { const r = db.ref(".info/connected"); const h = r.on("value", (s) => cb(!!s.val())); return () => r.off("value", h); },
      now: () => firebase.database.ServerValue.TIMESTAMP,
    };
  }

  function demoBackend() {
    const KEY = "ws-demo-db";
    const ch = "BroadcastChannel" in window ? new BroadcastChannel("ws-demo") : null;
    const listeners = new Set();
    const read = () => WS.store.get(KEY) || {};
    const write = (t) => { WS.store.set(KEY, t); fire(); if (ch) ch.postMessage(1); };
    const parts = (p) => p.split("/").filter(Boolean);
    const getAt = (t, p) => parts(p).reduce((o, k) => (o == null ? o : o[k]), t);
    const clean = (v) => {
      if (v && typeof v === "object") {
        const o = Array.isArray(v) ? v.slice() : { ...v };
        Object.keys(o).forEach((k) => { const c = clean(o[k]); if (c === undefined || c === null) delete o[k]; else o[k] = c; });
        return Object.keys(o).length ? o : undefined;
      }
      return v;
    };
    const setAt = (t, p, v) => {
      const ks = parts(p);
      if (!ks.length) return v;
      let o = t;
      ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
      if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
      return t;
    };
    const fire = () => listeners.forEach((l) => l());
    if (ch) ch.onmessage = fire;
    window.addEventListener("storage", (e) => { if (e.key === KEY) fire(); });
    let me = WS.store.get("ws-demo-user");
    const authCbs = new Set();
    const setUser = (u) => { me = u; WS.store.set("ws-demo-user", u); authCbs.forEach((c) => c(u)); };
    return {
      kind: "demo",
      async init() {},
      user: () => me,
      isTeacher: () => !!(me && me.email),
      onAuth(cb) { authCbs.add(cb); setTimeout(() => cb(me), 0); return () => authCbs.delete(cb); },
      async signInAnon() { if (!me) setUser({ uid: "demo-" + Math.random().toString(36).slice(2, 8) }); return me; },
      async signInTeacher(email) { setUser({ uid: "demo-teacher", email }); return me; },
      async signOut() { setUser(null); },
      get: async (p) => clean(getAt(read(), p)) ?? null,
      set: async (p, v) => write(setAt(read(), p, clean(v) ?? null)),
      update: async (p, v) => { const t = read(); Object.keys(v).forEach((k) => setAt(t, p + "/" + k, clean(v[k]) ?? null)); write(t); },
      remove: async (p) => write(setAt(read(), p, null)),
      key: () => Math.random().toString(36).slice(2, 10),
      on(p, cb) { let last; const l = () => { const v = clean(getAt(read(), p)) ?? null; const s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } }; listeners.add(l); setTimeout(l, 0); return () => listeners.delete(l); },
      onConnection(cb) { setTimeout(() => cb(true), 0); return () => {}; },
      now: () => Date.now(),
    };
  }

  WS.backend = WS.demo ? demoBackend() : firebaseBackend();
  WS.ready = WS.backend.init();

  /* ---------- 통계 도우미 ---------- */
  /** subs: {학생: {시트: sub}}, fbs: {학생: {시트: fb}} */
  WS.collect = (subs, fbs) => {
    const rows = [];
    for (let st = 1; st <= WS.N_STUDENTS; st++) {
      for (const sh of WS.SHEETS) {
        const sub = subs && subs[st] && subs[st][sh.n];
        if (!sub) continue;
        const fb = fbs && fbs[st] && fbs[st][sh.n];
        rows.push({ st, sh, sub, fb, res: WS.scoreSheet(sh, sub, fb) });
      }
    }
    return rows;
  };
  WS.avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
})();
