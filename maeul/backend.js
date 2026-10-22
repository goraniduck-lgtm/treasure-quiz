/* 우리 마을 문제 해결단 — 저장소 (보물 찾기 퀴즈와 같은 Firebase quiz-bomool, maeul/ 아래)
   ?demo=1 을 주소 뒤에 붙이면 Firebase 없이 이 브라우저 안에서만 연습 모드로 동작 */
window.MB = (function () {
  const TEACHER_EMAIL = "goraniduck@gmail.com";
  const DEMO = /[?&]demo=1\b/.test(location.search);
  const FB_BASE = "https://www.gstatic.com/firebasejs/10.12.2/";

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("load " + src));
    document.head.appendChild(s);
  });

  function firebaseBackend() {
    let auth, db;
    return {
      kind: "firebase",
      async init() {
        await loadScript(FB_BASE + "firebase-app-compat.js");
        await Promise.all([loadScript(FB_BASE + "firebase-auth-compat.js"), loadScript(FB_BASE + "firebase-database-compat.js")]);
        const app = firebase.initializeApp(window.FIREBASE_CONFIG, "maeul");
        auth = firebase.auth(app); db = firebase.database(app);
      },
      uid: () => auth.currentUser && auth.currentUser.uid,
      isTeacher() { const u = auth.currentUser; return !!(u && u.email && u.email.toLowerCase() === TEACHER_EMAIL); },
      onAuth: (cb) => auth.onAuthStateChanged(cb),
      async signInAnon() { if (!auth.currentUser) await auth.signInAnonymously(); return auth.currentUser; },
      signInTeacher: (email, pw) => auth.signInWithEmailAndPassword(email, pw),
      signOut: () => auth.signOut(),
      get: (p) => db.ref(p).once("value").then((s) => s.val()),
      set: (p, v) => db.ref(p).set(v),
      remove: (p) => db.ref(p).remove(),
      push: (p, v) => { const r = db.ref(p).push(); return r.set(v).then(() => r.key); },
      on(p, cb, err) { const r = db.ref(p); const h = r.on("value", (s) => cb(s.val()), err); return () => r.off("value", h); },
      onConnection(cb) { const r = db.ref(".info/connected"); const h = r.on("value", (s) => cb(!!s.val())); return () => r.off("value", h); },
      now: () => firebase.database.ServerValue.TIMESTAMP,
    };
  }

  function demoBackend() {
    const KEY = "maeul-demo-db";
    const ch = "BroadcastChannel" in window ? new BroadcastChannel("maeul-demo") : null;
    const subs = new Set();
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
    const parts = (p) => p.split("/").filter(Boolean);
    const getAt = (t, p) => parts(p).reduce((o, k) => (o == null ? o : o[k]), t);
    const fire = () => subs.forEach((f) => f());
    const write = (t) => { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {} fire(); if (ch) ch.postMessage(1); };
    if (ch) ch.onmessage = fire;
    const setAt = (p, v) => {
      const t = read(); const ks = parts(p); let o = t;
      ks.slice(0, -1).forEach((k) => { if (!o[k] || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
      if (v == null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
      write(t);
    };
    let me = null;
    try { me = localStorage.getItem("maeul-demo-uid"); } catch (e) {}
    if (!me) { me = "demo-" + Math.random().toString(36).slice(2, 9); try { localStorage.setItem("maeul-demo-uid", me); } catch (e) {} }
    let teacher = false; const authCbs = new Set();
    return {
      kind: "demo",
      async init() {},
      uid: () => me,
      isTeacher: () => teacher,
      onAuth(cb) { authCbs.add(cb); setTimeout(() => cb(teacher ? { email: TEACHER_EMAIL } : { uid: me }), 0); return () => authCbs.delete(cb); },
      async signInAnon() { return { uid: me }; },
      async signInTeacher() { teacher = true; authCbs.forEach((f) => f({ email: TEACHER_EMAIL })); },
      async signOut() { teacher = false; authCbs.forEach((f) => f(null)); },
      get: async (p) => getAt(read(), p) ?? null,
      set: async (p, v) => setAt(p, v),
      remove: async (p) => setAt(p, null),
      push: async (p, v) => { const k = "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); setAt(p + "/" + k, v); return k; },
      on(p, cb) { const f = () => cb(getAt(read(), p) ?? null); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
      onConnection(cb) { setTimeout(() => cb(true), 0); return () => {}; },
      now: () => Date.now(),
    };
  }

  const be = DEMO ? demoBackend() : firebaseBackend();
  /* 반 이름: 저장 키는 "4-2", 화면 이름은 "4학년 2반" */
  be.clsKey = (g, n) => `${g}-${n}`;
  be.clsLabel = (k) => { const m = /^(\d)-(\d+)$/.exec(k || ""); return m ? `${m[1]}학년 ${m[2]}반` : String(k || ""); };
  be.validCls = (k) => /^[3-6]-([1-9]|1[0-9]|20)$/.test(k);
  be.sortCls = (a) => a.sort((x, y) => x.localeCompare(y, "ko", { numeric: true }));
  be.TEACHER_EMAIL = TEACHER_EMAIL;
  be.DEMO = DEMO;
  return be;
})();
