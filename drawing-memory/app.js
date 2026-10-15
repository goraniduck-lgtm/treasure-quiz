/* =========================================================
   그림 기억 레이스 — 교사·학생 공용 코드
   rooms/{4자리}/
     meta      : {game, state(lobby|draw|self|race|end), words[], per, raceSec, theme, drawStart, raceStart, raceEnd}
     players/p07 : {num, name, on, joined}
     pics/w03/p07 : 그림(JPEG dataURL)   ← 제시어별 저장
     ink/p07/w03  : 1                     ← 그린 그림 목록(가벼운 색인)
     self/p07  : {order[], pos, score, n, res{w03:1|0}, done}
     race/p07  : {s, t}
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Q = new URLSearchParams(location.search);
const pad2 = n => String(n).padStart(2, '0');
const wk = i => 'w' + pad2(i);
const wi = k => parseInt(k.slice(1), 10);
const pidOf = n => 'p' + pad2(n);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
const fmtT = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + pad2(s % 60); };
const koSort = a => a.slice().sort((x, y) => x.localeCompare(y, 'ko'));
function toast(msg, ms = 2400) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._h); toast._h = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------------- 저장소: Firebase 또는 연습 모드 ---------------- */
function makeFirebaseDB(cfg) {
  firebase.initializeApp(cfg);
  const db = firebase.database();
  let off = 0;
  db.ref('.info/serverTimeOffset').on('value', s => { off = s.val() || 0; });
  return {
    now: () => Date.now() + off,
    get: async p => (await db.ref(p).get()).val(),
    set: (p, v) => db.ref(p).set(v),
    update: (p, o) => db.ref(p).update(o),
    remove: p => db.ref(p).remove(),
    on(p, cb) { const r = db.ref(p); const h = s => cb(s.val()); r.on('value', h); return () => r.off('value', h); },
    onDisconnect(p, v) { db.ref(p).onDisconnect().set(v); },
    connected(cb) { db.ref('.info/connected').on('value', s => cb(!!s.val())); },
  };
}
function makeLocalDB() {
  /* 같은 브라우저의 여러 탭끼리만 연결되는 연습 모드.
     탭끼리 덮어쓰지 않도록 경로 4단계(rooms/코드/종류/학생)마다 따로 저장 */
  const PFX = 'dmdb:', D = 4;
  const parts = p => p.split('/').filter(Boolean);
  const clone = v => (v == null ? null : JSON.parse(JSON.stringify(v)));
  const subs = new Set();
  function setIn(o, ks, v) {
    for (let i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== 'object' || o[ks[i]] === null) o[ks[i]] = {}; o = o[ks[i]]; }
    if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = clone(v);
  }
  function tree() {
    const t = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || !k.startsWith(PFX)) continue;
      try { setIn(t, parts(k.slice(PFX.length)), JSON.parse(localStorage.getItem(k))); } catch (e) {}
    }
    return t;
  }
  const getAt = p => parts(p).reduce((o, k) => (o == null ? null : (o[k] ?? null)), tree());
  function writeFlat(ks, v) {
    if (ks.length >= D) {
      const key = PFX + ks.slice(0, D).join('/'), rest = ks.slice(D);
      if (!rest.length) { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(v)); return; }
      let cur = null; try { cur = JSON.parse(localStorage.getItem(key)); } catch (e) {}
      if (typeof cur !== 'object' || cur === null) cur = {};
      setIn(cur, rest, v);
      localStorage.setItem(key, JSON.stringify(cur)); return;
    }
    const pre = PFX + ks.join('/');
    const del = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k === pre || (k && k.startsWith(pre + '/'))) del.push(k); }
    del.forEach(k => localStorage.removeItem(k));
    if (v == null) return;
    if (typeof v === 'object' && !Array.isArray(v)) { for (const c in v) writeFlat(ks.concat(c), v[c]); }
    else localStorage.setItem(pre, JSON.stringify(v));
  }
  const notify = () => subs.forEach(f => f());
  const write = (p, v) => { try { writeFlat(parts(p), v); } catch (e) { toast('연습 모드 저장 공간이 가득 찼어요'); } notify(); };
  let t0 = null;
  window.addEventListener('storage', e => { if (e.key && !e.key.startsWith(PFX)) return; clearTimeout(t0); t0 = setTimeout(notify, 30); });
  return {
    now: () => Date.now(),
    get: async p => clone(getAt(p)),
    set: async (p, v) => write(p, v),
    update: async (p, o) => { for (const k in o) write(p + '/' + k, o[k]); },
    remove: async p => write(p, null),
    on(p, cb) {
      let last;
      const f = () => { const v = getAt(p); const s = JSON.stringify(v); if (s !== last) { last = s; cb(clone(v)); } };
      subs.add(f); setTimeout(f, 0); return () => subs.delete(f);
    },
    onDisconnect() {},
    connected(cb) { cb(true); },
  };
}
const LOCAL = Q.has('local') || typeof firebase === 'undefined' || !(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.databaseURL);
const DB = LOCAL ? makeLocalDB() : makeFirebaseDB(window.FIREBASE_CONFIG);

/* ---------------- 화면 · 타이머 공통 ---------------- */
let screenTick = null, globalTick = null;
function show(html, tick) { app.innerHTML = html; screenTick = tick || null; window.scrollTo(0, 0); }
setInterval(() => { try { globalTick && globalTick(); screenTick && screenTick(); } catch (e) { console.error(e); } }, 100);

function timerHTML(id, big) {
  return `<div class="timer ${big ? 'big' : ''}" id="${id}">
    <svg class="clock" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" class="rim"/><circle cx="50" cy="50" r="41" class="face"/>
      <path class="pie" d=""/>
      ${Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="11" x2="50" y2="${i % 3 ? 15 : 18}" class="tick" transform="rotate(${i * 30} 50 50)"/>`).join('')}
      <line class="hand" x1="50" y1="52" x2="50" y2="16"/><circle cx="50" cy="50" r="4.5" class="pin"/>
      <g class="bell"><circle cx="24" cy="10" r="7"/><circle cx="76" cy="10" r="7"/></g>
    </svg>
    <div class="tinfo"><div class="digits">0:00</div><div class="bar"><i></i></div></div>
  </div>`;
}
function updateTimer(el, remain, total) {
  if (!el) return;
  const frac = Math.max(0, Math.min(1, remain / total));
  const e = (1 - frac) * Math.PI * 2;
  const x = 50 + 41 * Math.sin(e), y = 50 - 41 * Math.cos(e);
  const pie = el.querySelector('.pie');
  if (frac >= 0.999) pie.setAttribute('d', 'M50 9 A41 41 0 1 1 49.99 9 Z');
  else if (frac <= 0) pie.setAttribute('d', '');
  else pie.setAttribute('d', `M50 50 L${x.toFixed(2)} ${y.toFixed(2)} A41 41 0 ${frac > 0.5 ? 1 : 0} 1 50 9 Z`);
  el.querySelector('.hand').setAttribute('transform', `rotate(${(e * 180 / Math.PI).toFixed(1)} 50 50)`);
  el.querySelector('.digits').textContent = fmtT(remain);
  el.querySelector('.bar i').style.width = (frac * 100).toFixed(1) + '%';
  const urgentAt = total >= 60000 ? 10000 : Math.min(3000, total * 0.35);
  const warnAt = total >= 60000 ? 30000 : total * 0.6;
  el.classList.toggle('warn', remain <= warnAt && remain > urgentAt);
  el.classList.toggle('urgent', remain <= urgentAt && remain > 0);
  el.classList.toggle('over', remain <= 0);
}
function countdown(startT) {
  const ov = $('#overlay'); const left = startT - DB.now();
  if (left > 0 && left < 6000) {
    const n = Math.ceil(left / 1000);
    if (ov.dataset.n !== String(n)) { ov.dataset.n = n; ov.innerHTML = `<div class="cd" key="${n}">${n}</div>`; ov.classList.add('on'); beep(n === 1 ? 660 : 520, 0.12); }
    return true;
  }
  if (ov.classList.contains('on')) { ov.classList.remove('on'); ov.innerHTML = ''; ov.dataset.n = ''; if (left > -800) beep(880, 0.25); }
  return false;
}
/* 소리 (교사 화면에서만) */
let actx = null, soundOn = true, isTeacher = false;
function initAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {} }
function beep(freq = 600, dur = 0.1, vol = 0.18) {
  if (!isTeacher || !soundOn || !actx) return;
  try {
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = freq; o.type = 'square'; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
}

const DEFAULT_WORDS = '사과 바나나 우산 자전거 고양이 강아지 물고기 나비 해바라기 눈사람 기린 코끼리 토끼 거북이 문어 비행기 기차 버스 배 로켓 집 나무 산 무지개 구름 번개 별 달 안경 모자 신발 시계 가위 연필 책 컵 의자 텔레비전 피자 아이스크림 케이크 햄버거 수박 당근 포도 딸기 왕관 열쇠 풍선 선물 축구공 기타 공룡 거미 달팽이 펭귄 상어 화산 등대 텐트 사다리 낙하산';
const THEMES = {
  run: { name: '달리기 경주', icon: '🏃' },
  plane: { name: '비행기 경주', icon: '✈️' },
  animal: { name: '동물 경주', icon: '🐎' },
};
const ANIMALS = ['🐎', '🐇', '🐢', '🐕', '🐈', '🦊', '🐖', '🐄', '🐓', '🦆', '🐿️', '🦔', '🐘', '🦒', '🐅', '🐊', '🦘', '🐁', '🐑', '🦌'];
function sprite(theme, num) {
  if (theme === 'plane') return num % 3 ? '✈️' : '🚀';
  if (theme === 'animal') return ANIMALS[(num - 1) % ANIMALS.length];
  return num % 2 ? '🏃' : '🏃‍♀️';
}

/* =========================================================
   첫 화면
   ========================================================= */
function home() {
  globalTick = null;
  if (location.hash === '#teacher') return teacherHome();
  studentJoin();
}
window.addEventListener('hashchange', () => { if (!T.code && !P.joined) home(); });

/* =========================================================
   교사
   ========================================================= */
const T = { code: null, meta: null, players: {}, ink: {}, self: {}, race: {}, unsubs: [], view: null, hideWord: false, lastBeep: 0 };
const R = () => 'rooms/' + T.code;

function teacherHome() {
  isTeacher = true;
  const st = Object.assign({ count: 20, per: 10, raceMin: 3, theme: 'animal', words: DEFAULT_WORDS }, lsGet('dm_settings') || {});
  const saved = lsGet('dm_teacher_code');
  show(`
  <div class="t-setup">
    <header class="brand"><div class="logo">🖍️</div><div><h1>그림 기억 레이스</h1><p>그리고 · 기억하고 · 맞히기</p></div></header>
    ${saved ? `<div class="card resume"><div>진행하던 방 <b>${esc(saved)}</b>이 있어요.</div><button class="btn" id="resume">이어서 진행</button></div>` : ''}
    <div class="card">
      <h2>게임 설정</h2>
      <div class="grid2">
        <label>제시어 개수 <b id="countV">${st.count}개</b><input type="range" id="count" min="5" max="30" value="${st.count}"></label>
        <label>제시어 하나당 그리는 시간 <b id="perV">${st.per}초</b><input type="range" id="per" min="5" max="30" value="${st.per}"></label>
        <label>친구 그림 맞히기 경주 시간 <b id="raceV">${st.raceMin}분</b><input type="range" id="raceMin" min="1" max="6" value="${st.raceMin}"></label>
        <div class="lbl">경주 모양
          <div class="seg" id="theme">${Object.entries(THEMES).map(([k, v]) => `<button data-v="${k}" class="${st.theme === k ? 'on' : ''}">${v.icon} ${v.name}</button>`).join('')}</div>
        </div>
      </div>
      <label class="wl">제시어 목록 <small>(띄어쓰기·줄바꿈으로 구분 · 이 중에서 무작위로 뽑아요)</small>
        <textarea id="words" rows="5">${esc(st.words)}</textarea></label>
      <div class="row"><span id="wcount" class="muted"></span><button class="link" id="resetWords">기본 목록으로</button></div>
      <div class="total" id="total"></div>
    </div>
    <button class="btn big primary" id="create">방 만들기 →</button>
    ${LOCAL ? '<p class="muted center">연습 모드: 이 브라우저의 다른 탭에서만 학생으로 들어올 수 있어요.</p>' : ''}
  </div>`);
  const upd = () => {
    const words = parseWords($('#words').value);
    $('#countV').textContent = $('#count').value + '개';
    $('#perV').textContent = $('#per').value + '초';
    $('#raceV').textContent = $('#raceMin').value + '분';
    $('#wcount').textContent = `목록에 ${words.length}개`;
    const c = +$('#count').value;
    $('#total').innerHTML = words.length < c ? `<span class="bad">제시어가 ${c - words.length}개 더 필요해요</span>` : `그리기 시간 약 <b>${fmtT(c * $('#per').value * 1000)}</b>`;
    $('#create').disabled = words.length < c;
  };
  ['count', 'per', 'raceMin', 'words'].forEach(id => $('#' + id).addEventListener('input', upd));
  $('#theme').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#theme button').forEach(x => x.classList.toggle('on', x === b)); };
  $('#resetWords').onclick = () => { $('#words').value = DEFAULT_WORDS; upd(); };
  upd();
  if ($('#resume')) $('#resume').onclick = () => { initAudio(); openTeacherRoom(saved); };
  $('#create').onclick = async () => {
    initAudio();
    const s = { count: +$('#count').value, per: +$('#per').value, raceMin: +$('#raceMin').value, theme: $('#theme .on').dataset.v, words: $('#words').value };
    lsSet('dm_settings', s);
    $('#create').disabled = true;
    try {
      let code;
      for (let i = 0; i < 30; i++) { code = String(1000 + Math.floor(Math.random() * 9000)); if (!(await DB.get('rooms/' + code + '/meta'))) break; }
      await DB.set('rooms/' + code, { meta: { game: 'drawmem', state: 'lobby', created: DB.now(), count: s.count, per: s.per, raceSec: s.raceMin * 60, theme: s.theme, pool: parseWords(s.words) } });
      lsSet('dm_teacher_code', code);
      openTeacherRoom(code);
    } catch (e) { console.error(e); toast('방을 만들지 못했어요. 인터넷 연결을 확인해 주세요.'); $('#create').disabled = false; }
  };
}
function parseWords(t) { return [...new Set(String(t).split(/[\s,]+/).map(w => w.trim()).filter(Boolean))]; }

function openTeacherRoom(code) {
  T.unsubs.forEach(f => f()); T.unsubs = [];
  T.code = code; T.view = null;
  const sub = (k, cb) => T.unsubs.push(DB.on(R() + '/' + k, cb));
  sub('meta', v => {
    if (!v) { toast('방이 없어요'); lsDel('dm_teacher_code'); T.code = null; T.unsubs.forEach(f => f()); return teacherHome(); }
    T.meta = v; teacherRender();
  });
  sub('players', v => { T.players = v || {}; teacherUpdate(); });
  sub('ink', v => { T.ink = v || {}; teacherUpdate(); });
  sub('self', v => { T.self = v || {}; teacherUpdate(); });
  sub('race', v => { T.race = v || {}; teacherUpdate(); });
  globalTick = teacherAuto;
}
const roster = () => Object.entries(T.players).filter(([, p]) => p && p.num).map(([id, p]) => ({ id, ...p })).sort((a, b) => a.num - b.num);
const pname = p => `${p.num}번${p.name ? ' ' + esc(p.name) : ''}`;

/* 시간이 다 되면 다음 단계로 자동 진행 */
let advancing = false;
function teacherAuto() {
  const m = T.meta; if (!m || advancing) return;
  const now = DB.now();
  if (m.state === 'draw' && now > m.drawStart + m.words.length * m.per * 1000 + 2500) {
    advancing = true; DB.update(R() + '/meta', { state: 'self' }).finally(() => (advancing = false));
  }
  if (m.state === 'race' && now > m.raceEnd + 1500) {
    advancing = true; DB.update(R() + '/meta', { state: 'end' }).finally(() => (advancing = false));
  }
}

function tTop() {
  return `<header class="t-top">
    <div class="brand sm"><span class="logo">🖍️</span><b>그림 기억 레이스</b></div>
    <div class="code">방 코드 <b>${esc(T.code)}</b></div>
    <div class="t-tools">
      <button class="icon" id="snd" title="소리">${soundOn ? '🔊' : '🔇'}</button>
      <button class="icon" id="gal" title="그림 모아 보기">🖼️</button>
      <button class="icon" id="menu" title="메뉴">⋯</button>
    </div>
  </header>`;
}
function bindTop() {
  $('#snd').onclick = () => { soundOn = !soundOn; initAudio(); $('#snd').textContent = soundOn ? '🔊' : '🔇'; };
  $('#gal').onclick = () => gallery();
  $('#menu').onclick = () => teacherMenu();
}
function teacherMenu() {
  modal(`<h2>메뉴</h2>
    <button class="btn wide" id="mReplay">🔁 같은 학생들과 새 판</button>
    <button class="btn wide" id="mLobby">⏮ 대기실로 돌아가기</button>
    <button class="btn wide danger" id="mClose">🗑 방 닫기 (기록 모두 지우기)</button>
    <button class="btn wide ghost" id="mX">닫기</button>`);
  $('#mX').onclick = closeModal;
  $('#mReplay').onclick = async () => { closeModal(); await resetRound(); };
  $('#mLobby').onclick = async () => { closeModal(); await resetRound(); };
  $('#mClose').onclick = async () => {
    if (!confirm('방을 닫으면 학생들의 그림과 점수가 모두 지워져요. 닫을까요?')) return;
    closeModal(); lsDel('dm_teacher_code');
    const c = T.code; T.unsubs.forEach(f => f()); T.unsubs = []; T.code = null; globalTick = null;
    await DB.remove('rooms/' + c); teacherHome();
  };
}
async function resetRound() {
  await DB.update(R(), { pics: null, ink: null, self: null, race: null });
  await DB.update(R() + '/meta', { state: 'lobby', words: null, drawStart: null, raceStart: null, raceEnd: null });
}

function teacherRender() {
  const st = T.meta.state;
  if (st !== T.view) {
    T.view = st;
    document.body.className = 'teacher st-' + st;
    if (st === 'lobby') tLobby();
    else if (st === 'draw') tDraw();
    else if (st === 'self') tSelf();
    else if (st === 'race') tRace();
    else if (st === 'end') tEnd();
  }
  teacherUpdate();
}
function teacherUpdate() { if (T.update) T.update(); }

/* ---------- 대기실 ---------- */
function tLobby() {
  const url = location.origin + location.pathname + '?code=' + T.code + (LOCAL ? '&local' : '');
  show(`${tTop()}
  <main class="t-lobby">
    <section class="card joinbox">
      <div class="qr" id="qr"></div>
      <div class="howto">
        <div class="step">① 태블릿으로 QR을 찍거나 주소로 들어가요</div>
        <div class="url">${esc(url.replace(/^https?:\/\//, ''))}</div>
        <div class="step">② 방 코드 <b class="bigcode">${esc(T.code)}</b>와 내 번호를 골라요</div>
      </div>
      <div class="rules">
        <div><b>1</b> ${T.meta.count}개 제시어를 ${T.meta.per}초씩 그려요</div>
        <div><b>2</b> 내 그림을 보고 제시어 기억해서 맞히기</div>
        <div><b>3</b> ${THEMES[T.meta.theme].icon} 친구 그림 맞히기 경주 ${Math.round(T.meta.raceSec / 60)}분</div>
      </div>
    </section>
    <section class="card">
      <h2>들어온 학생 <span class="pill" id="cnt">0</span></h2>
      <div class="tiles" id="roster"></div>
    </section>
  </main>
  <footer class="t-act"><button class="btn big primary" id="start">확인했어요 · 그리기 시작 ▶</button></footer>`);
  bindTop();
  try { new QRCode($('#qr'), { text: url, width: 168, height: 168, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { $('#qr').innerHTML = '<div class="noqr">QR</div>'; }
  $('#start').onclick = async () => {
    initAudio();
    const n = roster().length;
    if (!n) return toast('아직 들어온 학생이 없어요');
    $('#start').disabled = true;
    const words = shuffle(T.meta.pool || parseWords(DEFAULT_WORDS)).slice(0, T.meta.count);
    await DB.update(R(), { pics: null, ink: null, self: null, race: null });
    await DB.update(R() + '/meta', { state: 'draw', words, drawStart: DB.now() + 4500 });
  };
  T.update = () => {
    const rs = roster();
    $('#cnt').textContent = rs.length + '명';
    $('#roster').innerHTML = rs.length ? rs.map(p => `<div class="tile ${p.on === false ? 'off' : ''}">
        <span class="num">${p.num}</span><span class="nm">${esc(p.name || '')}</span>
        <button class="kick" data-kick="${p.id}" title="내보내기">×</button></div>`).join('')
      : '<p class="muted">학생이 들어오면 여기에 번호가 나타나요.</p>';
    $$('[data-kick]').forEach(b => b.onclick = () => kick(b.dataset.kick));
  };
}
async function kick(id) {
  const p = T.players[id]; if (!p) return;
  if (!confirm(`${p.num}번을 내보낼까요?`)) return;
  await DB.update(R(), { ['players/' + id]: null, ['ink/' + id]: null, ['self/' + id]: null, ['race/' + id]: null });
}

/* ---------- 그리기 (교사 화면) ---------- */
function tDraw() {
  show(`${tTop()}
  <main class="t-draw">
    <section class="wordpanel">
      <div class="lbl">지금 그릴 제시어 <span id="tprog"></span></div>
      <div class="tword" id="tword">준비!</div>
      <button class="link" id="hide">${T.hideWord ? '제시어 보이기' : '제시어 가리기'}</button>
      ${timerHTML('tt', true)}
      <div class="dots" id="dots"></div>
    </section>
    <section class="card">
      <h2>그린 그림 수</h2>
      <div class="tiles" id="roster"></div>
    </section>
  </main>`);
  bindTop();
  $('#hide').onclick = () => { T.hideWord = !T.hideWord; $('#hide').textContent = T.hideWord ? '제시어 보이기' : '제시어 가리기'; lastI = -2; };
  let lastI = -2;
  screenTick = () => {
    const m = T.meta; if (m.state !== 'draw') return;
    const now = DB.now(), per = m.per * 1000, n = m.words.length;
    countdown(m.drawStart);
    const i = Math.floor((now - m.drawStart) / per);
    if (i !== lastI) {
      lastI = i;
      const w = $('#tword');
      if (i < 0) { w.textContent = '준비!'; $('#tprog').textContent = ''; }
      else if (i >= n) { w.textContent = '그리기 끝! 🎉'; $('#tprog').textContent = ''; }
      else { w.textContent = T.hideWord ? '❓❓❓' : m.words[i]; $('#tprog').textContent = `${i + 1} / ${n}`; w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); }
      $('#dots').innerHTML = m.words.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('');
    }
    if (i >= 0 && i < n) {
      const remain = m.drawStart + (i + 1) * per - now;
      updateTimer($('#tt'), remain, per);
      const sec = Math.ceil(remain / 1000);
      if (remain < 3000 && sec !== T.lastBeep) { T.lastBeep = sec; beep(700, 0.06, 0.1); }
    } else updateTimer($('#tt'), i < 0 ? per : 0, per);
  };
  T.update = () => {
    const rs = roster();
    $('#roster').innerHTML = rs.map(p => { const c = Object.keys(T.ink[p.id] || {}).length; return `<div class="tile ${p.on === false ? 'off' : ''}"><span class="num">${p.num}</span><span class="nm">${esc(p.name || '')}</span><span class="cnt">${c}</span></div>`; }).join('');
  };
}

/* ---------- 내 그림 기억 퀴즈 (교사 화면) ---------- */
function tSelf() {
  show(`${tTop()}
  <main class="t-self">
    <section class="card hero">
      <div class="big-emoji">🧠</div>
      <div><h2>내 그림 기억 퀴즈 중</h2><p>학생들이 순서가 바뀐 자기 그림을 보고 제시어를 맞히고 있어요.</p>
      <div class="progress"><i id="selfBar"></i></div><div class="muted" id="selfTxt"></div></div>
    </section>
    <section class="card"><h2>학생별 진행</h2><div class="tiles wide" id="roster"></div></section>
  </main>
  <footer class="t-act"><button class="btn big primary" id="go">${THEMES[T.meta.theme].icon} 친구 그림 맞히기 경주 시작!</button></footer>`);
  bindTop();
  $('#go').onclick = async () => {
    initAudio();
    const rs = roster(), done = rs.filter(p => T.self[p.id] && T.self[p.id].done).length;
    if (done < rs.length && !confirm(`아직 ${rs.length - done}명이 퀴즈를 푸는 중이에요. 그래도 시작할까요?`)) return;
    $('#go').disabled = true;
    const start = DB.now() + 4500;
    await DB.update(R(), { race: null });
    await DB.update(R() + '/meta', { state: 'race', raceStart: start, raceEnd: start + T.meta.raceSec * 1000 });
  };
  T.update = () => {
    const rs = roster();
    let done = 0;
    $('#roster').innerHTML = rs.map(p => {
      const s = T.self[p.id] || {};
      if (s.done) done++;
      const st = s.done ? `<span class="ok">✔ ${s.score || 0}/${s.n || 0}</span>` : s.n ? `<span class="ing">${s.pos || 0}/${s.n}</span>` : '<span class="ing">…</span>';
      return `<div class="tile ${s.done ? 'fin' : ''} ${p.on === false ? 'off' : ''}"><span class="num">${p.num}</span><span class="nm">${esc(p.name || '')}</span>${st}</div>`;
    }).join('');
    $('#selfBar').style.width = (rs.length ? done / rs.length * 100 : 0) + '%';
    $('#selfTxt').textContent = `${done} / ${rs.length}명 끝냄`;
  };
}

/* ---------- 경주 (교사 화면) ---------- */
function raceRanking() {
  return roster().map(p => ({ ...p, s: (T.race[p.id] && T.race[p.id].s) || 0, t: (T.race[p.id] && T.race[p.id].t) || Infinity }))
    .sort((a, b) => b.s - a.s || a.t - b.t || a.num - b.num);
}
function tRace() {
  const theme = T.meta.theme;
  const rs = roster();
  show(`
  <main class="race theme-${theme}">
    <header class="race-head">
      <div class="rtitle"><span>${THEMES[theme].icon}</span> 친구 그림 맞히기 ${THEMES[theme].name}<small>방 ${esc(T.code)}</small></div>
      ${timerHTML('rt', true)}
      <button class="icon" id="snd">${soundOn ? '🔊' : '🔇'}</button>
    </header>
    <div class="race-body">
      <div class="track" id="track" style="--n:${Math.max(rs.length, 1)}">
        ${theme === 'plane' ? '<div class="clouds"><span>☁️</span><span>☁️</span><span>☁️</span><span>☁️</span><span>☁️</span></div>' : ''}
        <div class="finish">🏁</div>
        <div class="lanes" id="lanes"></div>
      </div>
      <aside class="board"><h3>실시간 순위</h3><ol id="board"></ol></aside>
    </div>
  </main>`);
  $('#snd').onclick = () => { soundOn = !soundOn; initAudio(); $('#snd').textContent = soundOn ? '🔊' : '🔇'; };
  const total = T.meta.raceSec * 1000;
  screenTick = () => {
    const m = T.meta; if (m.state !== 'race') return;
    const now = DB.now();
    countdown(m.raceStart);
    const remain = Math.min(total, m.raceEnd - now);
    updateTimer($('#rt'), remain, total);
    document.body.classList.toggle('panic', remain <= 10000 && remain > 0);
    const sec = Math.ceil(remain / 1000);
    if (remain > 0 && remain <= 10000 && sec !== T.lastBeep) { T.lastBeep = sec; beep(remain <= 5000 ? 980 : 760, 0.08, 0.15); }
  };
  let prevTop = null, built = '';
  const buildLanes = () => {
    const rs = roster(), sig = rs.map(p => p.id + (p.name || '')).join(',');
    if (sig === built) return;
    built = sig;
    $('#track').style.setProperty('--n', Math.max(rs.length, 1));
    $('#lanes').innerHTML = rs.map(p => `<div class="lane" data-id="${p.id}">
          <div class="lname">${pname(p)}</div>
          <div class="runway"><div class="runner" style="left:0%"><span class="crown">👑</span><span class="bob"><span class="em">${sprite(theme, p.num)}</span></span><span class="sc"></span></div></div>
        </div>`).join('');
  };
  T.update = () => {
    buildLanes();
    const rank = raceRanking();
    const top = rank.length ? rank[0].s : 0;
    const scale = Math.max(8, top + 3);
    rank.forEach((p, i) => {
      const lane = document.querySelector(`.lane[data-id="${p.id}"]`); if (!lane) return;
      const r = lane.querySelector('.runner');
      const pct = Math.min(1, p.s / scale) * 100;
      r.style.left = pct.toFixed(1) + '%';
      const sc = r.querySelector('.sc');
      if (sc.textContent !== String(p.s)) { sc.textContent = p.s; r.classList.remove('boost'); void r.offsetWidth; r.classList.add('boost'); }
      r.classList.toggle('lead', i === 0 && p.s > 0);
    });
    const ol = $('#board');
    ol.innerHTML = rank.slice(0, 8).map((p, i) => `<li class="r${i + 1}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who">${sprite(T.meta.theme, p.num)} ${pname(p)}</span><b>${p.s}</b></li>`).join('');
    if (rank[0] && rank[0].s > 0 && prevTop !== rank[0].id) { if (prevTop) beep(1200, 0.08, 0.1); prevTop = rank[0].id; }
  };
}

/* ---------- 결과 (교사 화면) ---------- */
function tEnd() {
  document.body.classList.remove('panic');
  const rank = raceRanking();
  const pod = [rank[1], rank[0], rank[2]];
  show(`${tTop()}
  <main class="t-end">
    <h1 class="end-title">🏆 최종 순위</h1>
    <div class="podium">${pod.map((p, k) => p ? `<div class="pod p${[2, 1, 3][k]}">
      <div class="pem">${sprite(T.meta.theme, p.num)}</div><div class="pn">${pname(p)}</div><div class="ps">${p.s}개</div>
      <div class="block">${[2, 1, 3][k]}</div></div>` : '<div class="pod empty"></div>').join('')}</div>
    <section class="card">
      <table class="rank"><thead><tr><th>순위</th><th>학생</th><th>친구 그림 맞히기</th><th>내 그림 기억 퀴즈</th></tr></thead>
      <tbody>${rank.map((p, i) => { const s = T.self[p.id] || {}; return `<tr><td>${i + 1}</td><td>${pname(p)}</td><td><b>${p.s}</b>개</td><td>${s.n ? `${s.score || 0} / ${s.n}` : '-'}</td></tr>`; }).join('')}</tbody></table>
    </section>
  </main>
  <footer class="t-act"><button class="btn" id="g2">🖼️ 제시어별 그림 보기</button><button class="btn primary" id="again">🔁 같은 학생들과 새 판</button></footer>`);
  bindTop();
  $('#g2').onclick = () => gallery();
  $('#again').onclick = () => resetRound();
  T.update = null;
  setTimeout(() => confetti(), 200);
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cs = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f783ac', '#ffa94d'];
  box.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${cs[Math.floor(Math.random() * cs.length)]};animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.8).toFixed(2)}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 5000);
}

/* ---------- 제시어별 그림 모아 보기 ---------- */
async function gallery(sel = 0) {
  const words = T.meta.words || [];
  if (!words.length) return toast('아직 그린 그림이 없어요');
  modal(`<div class="gal">
    <div class="gal-head"><h2>제시어별 그림</h2><button class="icon" id="gx">✕</button></div>
    <div class="chips" id="chips">${words.map((w, i) => `<button data-i="${i}" class="${i === sel ? 'on' : ''}">${i + 1}. ${esc(w)}</button>`).join('')}</div>
    <div class="gal-grid" id="gg"><p class="muted">불러오는 중…</p></div></div>`, true);
  $('#gx').onclick = closeModal;
  $('#chips').onclick = e => { const b = e.target.closest('button'); if (b) gallery(+b.dataset.i); };
  $('#chips .on').scrollIntoView({ inline: 'center', block: 'nearest' });
  const pics = (await DB.get(R() + '/pics/' + wk(sel))) || {};
  const ids = Object.keys(pics).sort();
  $('#gg').innerHTML = ids.length ? ids.map(id => { const p = T.players[id]; return `<figure><img src="${pics[id]}" alt=""><figcaption>${p ? pname(p) : id.slice(1) + '번'}</figcaption></figure>`; }).join('') : '<p class="muted">이 제시어 그림이 없어요.</p>';
}
function modal(html, wide) {
  closeModal();
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
  m.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}">${html}</div>`;
  m.onclick = e => { if (e.target === m) closeModal(); };
  document.body.appendChild(m);
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }

/* =========================================================
   학생
   ========================================================= */
const P = { joined: false, code: null, pid: null, num: null, name: '', meta: null, unsubs: [], view: null, myPics: {} };
const PR = () => 'rooms/' + P.code;

function studentJoin(msg) {
  isTeacher = false;
  document.body.className = 'student st-join';
  const last = lsGet('dm_student') || {};
  const code = Q.get('code') || last.code || '';
  let num = last.num || null;
  show(`
  <main class="s-join">
    <header class="brand"><div class="logo">🖍️</div><div><h1>그림 기억 레이스</h1><p>그리고 · 기억하고 · 맞히기</p></div></header>
    ${msg ? `<div class="notice">${esc(msg)}</div>` : ''}
    <div class="card">
      <label class="lbl">방 코드<input id="code" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000" value="${esc(code)}"></label>
      <div class="lbl">내 번호</div>
      <div class="numgrid" id="nums">${Array.from({ length: 30 }, (_, i) => `<button data-n="${i + 1}" class="${num === i + 1 ? 'on' : ''}">${i + 1}</button>`).join('')}</div>
      <label class="lbl">이름 <small>(안 써도 돼요)</small><input id="name" maxlength="6" autocomplete="off" value="${esc(last.name || '')}"></label>
      <button class="btn big primary wide" id="go">들어가기</button>
    </div>
    <a class="tlink" href="#teacher">선생님 화면</a>
  </main>`);
  $('#nums').onclick = e => { const b = e.target.closest('button'); if (!b) return; num = +b.dataset.n; $$('#nums button').forEach(x => x.classList.toggle('on', x === b)); };
  $('#code').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); };
  $('#go').onclick = async () => {
    const c = $('#code').value.trim();
    if (!/^\d{4}$/.test(c)) return toast('방 코드 4자리를 써 주세요');
    if (!num) return toast('내 번호를 골라 주세요');
    $('#go').disabled = true;
    try {
      const meta = await DB.get('rooms/' + c + '/meta');
      if (!meta || meta.game !== 'drawmem') { $('#go').disabled = false; return toast('그런 방이 없어요. 코드를 다시 확인해요'); }
      const pid = pidOf(num);
      const ex = await DB.get('rooms/' + c + '/players/' + pid);
      if (ex && ex.num && ex.on && last.code !== c && !confirm(`${num}번은 이미 들어와 있어요. 내가 ${num}번이 맞나요?`)) { $('#go').disabled = false; return; }
      const name = $('#name').value.trim().slice(0, 6);
      lsSet('dm_student', { code: c, num, name });
      enterRoom(c, num, name);
    } catch (e) { console.error(e); $('#go').disabled = false; toast('연결이 안 돼요. 와이파이를 확인해 주세요'); }
  };
}

async function enterRoom(code, num, name) {
  P.unsubs.forEach(f => f()); P.unsubs = [];
  Object.assign(P, { code, num, name, pid: pidOf(num), joined: true, view: null, myPics: {} });
  const me = PR() + '/players/' + P.pid;
  await DB.update(me, { num, name, on: true, joined: DB.now() });
  DB.onDisconnect(me + '/on', false);
  let seen = false;
  P.unsubs.push(DB.on(me, v => {
    if (v && v.num) { seen = true; return; }
    if (seen) leaveRoom('선생님이 방에서 내보냈어요');
  }));
  P.unsubs.push(DB.on(PR() + '/meta', v => {
    if (!v) return leaveRoom('방이 닫혔어요');
    P.meta = v; studentRender();
  }));
}
DB.connected(c => {
  document.body.classList.toggle('offline', !c);
  if (c && P.joined) { const me = PR() + '/players/' + P.pid; DB.update(me, { on: true }); DB.onDisconnect(me + '/on', false); }
});
function leaveRoom(msg) {
  P.unsubs.forEach(f => f()); P.unsubs = []; P.joined = false; P.code = null;
  $('#overlay').classList.remove('on'); $('#overlay').innerHTML = '';
  studentJoin(msg);
}
function sHead(extra = '') {
  return `<header class="s-top"><span class="me">${P.num}번${P.name ? ' ' + esc(P.name) : ''}</span>${extra}</header>`;
}
function studentRender() {
  const st = P.meta.state;
  const key = st + (st === 'draw' ? P.meta.drawStart : st === 'race' ? P.meta.raceStart : '');
  if (key === P.view) return;
  P.view = key;
  document.body.className = 'student st-' + st;
  $('#overlay').classList.remove('on'); $('#overlay').innerHTML = '';
  if (st === 'lobby') sLobby();
  else if (st === 'draw') sDraw();
  else if (st === 'self') sSelf();
  else if (st === 'race') sRace();
  else if (st === 'end') sEnd();
}

function sLobby() {
  P.myPics = {};
  show(`${sHead()}
  <main class="s-wait">
    <div class="wait-emoji">🖍️</div>
    <h2>들어왔어요!</h2>
    <p>선생님이 시작할 때까지 기다려요.</p>
    <ol class="flow">
      <li><b>그리기</b> 제시어가 ${P.meta.per}초마다 바뀌어요. 빨리 그려요!</li>
      <li><b>기억하기</b> 순서가 섞인 내 그림을 보고 제시어를 맞혀요.</li>
      <li><b>경주</b> 친구 그림을 보고 제시어를 최대한 많이 맞혀요.</li>
    </ol>
  </main>`);
}

/* ---------- 그리기 ---------- */
const COLORS = ['#222222', '#e03131', '#1971c2', '#2f9e44', '#f08c00', '#7f4f24', '#ae3ec9'];
function sDraw() {
  const m = P.meta, n = m.words.length, per = m.per * 1000;
  show(`${sHead('<span class="prog" id="prog"></span>')}
  <main class="s-draw">
    <div class="wordline"><span class="wl">그려요!</span><span class="sword" id="sword">준비</span>${timerHTML('st')}</div>
    <div class="canvas-wrap"><canvas id="cv"></canvas><div class="done-cover" id="cover" hidden></div></div>
    <div class="tools">
      <div class="colors">${COLORS.map((c, i) => `<button class="sw ${i ? '' : 'on'}" data-c="${c}" style="--c:${c}"></button>`).join('')}</div>
      <div class="tbtns">
        <button class="tb on" data-w="0.012" title="가는 펜"><i style="--d:6px"></i></button>
        <button class="tb" data-w="0.028" title="굵은 펜"><i style="--d:14px"></i></button>
        <button class="tb" id="eraser" title="지우개">🧽</button>
        <button class="tb" id="undo" title="되돌리기">↩️</button>
        <button class="tb" id="clr" title="다 지우기">🗑️</button>
      </div>
    </div>
  </main>`);
  const pad = makePad($('#cv'));
  $$('.sw').forEach(b => b.onclick = () => { $$('.sw').forEach(x => x.classList.toggle('on', x === b)); $('#eraser').classList.remove('on'); pad.color = b.dataset.c; pad.erase = false; });
  $$('[data-w]').forEach(b => b.onclick = () => { $$('[data-w]').forEach(x => x.classList.toggle('on', x === b)); pad.width = +b.dataset.w; });
  $('#eraser').onclick = () => { pad.erase = !pad.erase; $('#eraser').classList.toggle('on', pad.erase); };
  $('#undo').onclick = () => pad.undo();
  $('#clr').onclick = () => pad.clear();
  let cur = -2;
  screenTick = () => {
    const now = DB.now();
    countdown(m.drawStart);
    const i = Math.floor((now - m.drawStart) / per);
    if (i !== cur) {
      if (cur >= 0 && cur < n) saveDrawing(cur, pad);
      cur = i;
      pad.clear(); pad.enabled = i >= 0 && i < n;
      const w = $('#sword');
      if (i < 0) { w.textContent = '준비'; }
      else if (i >= n) {
        w.textContent = '끝!';
        $('#cover').hidden = false;
        $('#cover').innerHTML = `<div><div class="big-emoji">🎉</div><b>다 그렸어요!</b><p>곧 기억 퀴즈가 시작돼요.<br>무슨 그림을 그렸는지 떠올려 봐요.</p></div>`;
      } else {
        w.textContent = m.words[i]; w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop');
        $('#prog').textContent = `${i + 1} / ${n}`;
        if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
      }
    }
    if (i >= 0 && i < n) updateTimer($('#st'), m.drawStart + (i + 1) * per - now, per);
    else updateTimer($('#st'), i < 0 ? per : 0, per);
  };
}
function saveDrawing(i, pad) {
  if (!pad.hasInk()) return;
  const url = pad.export();
  P.myPics[i] = url;
  DB.update(PR(), { [`pics/${wk(i)}/${P.pid}`]: url, [`ink/${P.pid}/${wk(i)}`]: 1 }).catch(e => console.error(e));
}
function makePad(cv) {
  const ctx = cv.getContext('2d');
  const pad = { color: COLORS[0], width: 0.012, erase: false, enabled: false, strokes: [] };
  let size = 0, curS = null;
  function fit() {
    const r = cv.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    size = r.width; cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.width * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  }
  function drawStroke(c, s, S) {
    c.strokeStyle = s.e ? '#ffffff' : s.c; c.lineWidth = s.w * S; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); const p = s.p;
    c.moveTo(p[0][0] * S, p[0][1] * S);
    if (p.length === 1) c.lineTo(p[0][0] * S + 0.01, p[0][1] * S);
    for (let k = 1; k < p.length; k++) c.lineTo(p[k][0] * S, p[k][1] * S);
    c.stroke();
  }
  function redraw() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size); pad.strokes.forEach(s => drawStroke(ctx, s, size)); }
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
  cv.addEventListener('pointerdown', e => {
    if (!pad.enabled) return; e.preventDefault(); cv.setPointerCapture(e.pointerId);
    curS = { c: pad.color, w: pad.erase ? 0.07 : pad.width, e: pad.erase, p: [pt(e)] }; pad.strokes.push(curS); drawStroke(ctx, curS, size);
  });
  cv.addEventListener('pointermove', e => {
    if (!curS) return; e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => curS.p.push(pt(ev)));
    const p = curS.p, a = p[Math.max(0, p.length - evs.length - 1)];
    ctx.strokeStyle = curS.e ? '#fff' : curS.c; ctx.lineWidth = curS.w * size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a[0] * size, a[1] * size); for (let k = p.length - evs.length; k < p.length; k++) ctx.lineTo(p[k][0] * size, p[k][1] * size); ctx.stroke();
  });
  const end = () => { curS = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('pointerleave', end);
  window.addEventListener('resize', fit);
  pad.clear = () => { pad.strokes = []; curS = null; redraw(); };
  pad.undo = () => { pad.strokes.pop(); redraw(); };
  pad.hasInk = () => pad.strokes.some(s => !s.e);
  pad.export = () => {
    const S = 320, o = document.createElement('canvas'); o.width = o.height = S;
    const c = o.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, S, S);
    pad.strokes.forEach(s => drawStroke(c, s, S));
    return o.toDataURL('image/jpeg', 0.72);
  };
  requestAnimationFrame(fit);
  return pad;
}

/* ---------- 단어 고르기 판 ---------- */
function bankHTML(words) {
  return `<div class="bank" id="bank">${koSort(words).map(w => `<button data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
}
function flash(ok, answer) {
  const f = $('#fb'); if (!f) return;
  f.className = 'fb ' + (ok ? 'ok' : 'no');
  f.innerHTML = ok ? '<b>⭕ 정답!</b>' : `<b>❌ 땡!</b><span>정답은 <em>${esc(answer)}</em></span>`;
}

/* ---------- 내 그림 기억 퀴즈 ---------- */
async function sSelf() {
  const m = P.meta, words = m.words;
  show(`${sHead('<span class="prog" id="prog"></span><span class="score" id="score"></span>')}<main class="s-quiz"><p class="muted center">내 그림을 불러오는 중…</p></main>`);
  const base = PR() + '/self/' + P.pid;
  let S = await DB.get(base);
  if (!S || !S.order) {
    const ink = (await DB.get(PR() + '/ink/' + P.pid)) || {};
    const keys = [...new Set([...Object.keys(ink), ...Object.keys(P.myPics).map(i => wk(+i))])];
    S = { order: shuffle(keys), pos: 0, score: 0, n: keys.length, res: {}, done: keys.length === 0 };
    await DB.set(base, S);
  }
  S.res = S.res || {};
  const pics = {};
  await Promise.all(S.order.map(async k => { pics[k] = P.myPics[wi(k)] || (await DB.get(`${PR()}/pics/${k}/${P.pid}`)); }));
  if (P.meta.state !== 'self') return;
  if (S.done || S.pos >= S.n) return selfReview(S, pics);
  show(`${sHead('<span class="prog" id="prog"></span><span class="score" id="score"></span>')}
  <main class="s-quiz">
    <h2 class="qtitle">🧠 내가 그린 그림이에요. 제시어는 뭐였을까?</h2>
    <div class="qbody">
      <div class="pic"><img id="pic" alt=""><div class="fb" id="fb"></div></div>
      ${bankHTML(words)}
    </div>
  </main>`);
  let lock = false;
  const showQ = () => {
    $('#prog').textContent = `${S.pos + 1} / ${S.n}`;
    $('#score').textContent = `⭕ ${S.score}`;
    $('#pic').src = pics[S.order[S.pos]] || '';
    $('#fb').className = 'fb';
    $$('#bank button').forEach(b => b.className = '');
  };
  showQ();
  $('#bank').onclick = async e => {
    const b = e.target.closest('button'); if (!b || lock) return;
    lock = true;
    const k = S.order[S.pos], ans = words[wi(k)], ok = b.dataset.w === ans;
    b.className = ok ? 'right' : 'wrong';
    if (!ok) $$('#bank button').forEach(x => { if (x.dataset.w === ans) x.className = 'right'; });
    flash(ok, ans);
    S.res[k] = ok ? 1 : 0; if (ok) S.score++; S.pos++;
    if (S.pos >= S.n) S.done = true;
    DB.update(base, { pos: S.pos, score: S.score, ['res/' + k]: S.res[k], done: !!S.done });
    setTimeout(() => { lock = false; if (P.meta.state !== 'self') return; if (S.done) selfReview(S, pics); else showQ(); }, ok ? 900 : 1600);
  };
}
function selfReview(S, pics) {
  const words = P.meta.words;
  show(`${sHead()}
  <main class="s-review">
    <div class="result-card"><div class="big-emoji">${S.n && S.score / S.n >= 0.8 ? '🌟' : '🧠'}</div>
      <h2>기억 퀴즈 끝!</h2>
      <div class="bigscore">${S.score} <small>/ ${S.n}</small></div>
      <p>선생님이 <b>친구 그림 맞히기 경주</b>를 시작할 때까지 기다려요.</p></div>
    <div class="mini-grid">${S.order.slice().sort().map(k => `<figure class="${S.res[k] ? 'o' : 'x'}"><img src="${pics[k] || ''}" alt=""><figcaption>${S.res[k] ? '⭕' : '❌'} ${esc(words[wi(k)])}</figcaption></figure>`).join('') || '<p class="muted">그린 그림이 없어요.</p>'}</div>
  </main>`);
}

/* ---------- 친구 그림 맞히기 경주 ---------- */
async function sRace() {
  const m = P.meta, words = m.words, total = m.raceSec * 1000;
  show(`${sHead('<span class="score" id="score"></span>')}<main class="s-quiz"><p class="muted center">친구 그림을 불러오는 중…</p></main>`);
  const ink = (await DB.get(PR() + '/ink')) || {};
  let pool = [];
  for (const pid in ink) if (pid !== P.pid) for (const k in ink[pid]) pool.push({ pid, k });
  pool = shuffle(pool);
  const mine = (await DB.get(PR() + '/race/' + P.pid)) || {};
  let score = mine.s || 0, ptr = 0, lock = false, over = false;
  const cache = new Map();
  const load = it => { const key = it.k + '/' + it.pid; if (!cache.has(key)) cache.set(key, DB.get(`${PR()}/pics/${key}`)); return cache.get(key); };
  if (P.meta.state !== 'race') return;
  show(`${sHead('<span class="score" id="score"></span>')}
  <main class="s-quiz race-q">
    <div class="rq-top"><h2 class="qtitle">🏁 친구 그림! 제시어는?</h2>${timerHTML('srt')}</div>
    <div class="qbody">
      <div class="pic"><img id="pic" alt=""><div class="fb" id="fb"></div><div class="endcover" id="endc" hidden><div><div class="big-emoji">⏰</div><b>시간 끝!</b><p>선생님 화면에서 순위를 확인해요.</p></div></div></div>
      ${bankHTML(words)}
    </div>
  </main>`);
  const setScore = () => { $('#score').textContent = `⭕ ${score}개`; };
  setScore();
  if (!pool.length) { $('#pic').removeAttribute('src'); $('#fb').className = 'fb no'; $('#fb').innerHTML = '<span>맞힐 친구 그림이 없어요</span>'; }
  const showQ = async () => {
    if (!pool.length) return;
    if (ptr >= pool.length) { pool = shuffle(pool); ptr = 0; }
    const it = pool[ptr];
    for (let k = 1; k <= 3; k++) load(pool[(ptr + k) % pool.length]);
    $('#fb').className = 'fb';
    $$('#bank button').forEach(b => b.className = '');
    $('#pic').style.opacity = 0.3;
    const url = await load(it);
    if (pool[ptr] !== it) return;
    if (!url) { ptr++; return showQ(); }
    $('#pic').src = url; $('#pic').style.opacity = 1;
    lock = false;
  };
  lock = true;
  const started = () => DB.now() >= m.raceStart;
  const kick0 = setInterval(() => { if (started()) { clearInterval(kick0); showQ(); } }, 100);
  $('#bank').onclick = e => {
    const b = e.target.closest('button'); if (!b || lock || over || !started() || !pool.length) return;
    lock = true;
    const it = pool[ptr], ans = words[wi(it.k)], ok = b.dataset.w === ans;
    b.className = ok ? 'right' : 'wrong';
    flash(ok, ans);
    if (ok) { score++; setScore(); DB.update(PR() + '/race/' + P.pid, { s: score, t: DB.now() }); }
    ptr++;
    setTimeout(() => { if (!over) showQ(); }, ok ? 450 : 1500);
  };
  screenTick = () => {
    const now = DB.now();
    countdown(m.raceStart);
    const remain = Math.min(total, m.raceEnd - now);
    updateTimer($('#srt'), remain, total);
    if (remain <= 0 && !over) { over = true; lock = true; $('#endc').hidden = false; }
  };
}

async function sEnd() {
  show(`${sHead()}<main class="s-wait"><p class="muted">결과를 불러오는 중…</p></main>`);
  const [race, self, players] = await Promise.all([DB.get(PR() + '/race'), DB.get(PR() + '/self/' + P.pid), DB.get(PR() + '/players')]);
  const list = Object.keys(players || {}).filter(id => players[id] && players[id].num).map(id => ({ id, s: (race && race[id] && race[id].s) || 0, t: (race && race[id] && race[id].t) || Infinity }))
    .sort((a, b) => b.s - a.s || a.t - b.t);
  const my = list.findIndex(x => x.id === P.pid);
  const s = (race && race[P.pid] && race[P.pid].s) || 0;
  show(`${sHead()}
  <main class="s-wait">
    <div class="wait-emoji">${my === 0 ? '🥇' : my === 1 ? '🥈' : my === 2 ? '🥉' : '🏅'}</div>
    <h2>${my >= 0 ? `${my + 1}등` : '경주 끝!'}</h2>
    <div class="endstats">
      <div><span>친구 그림 맞히기</span><b>${s}개</b></div>
      <div><span>내 그림 기억 퀴즈</span><b>${self && self.n ? `${self.score || 0} / ${self.n}` : '-'}</b></div>
    </div>
    <p>수고했어요! 선생님 화면을 함께 봐요.</p>
  </main>`);
}

/* ---------------- 시작 ---------------- */
(function boot() {
  if (LOCAL) document.body.classList.add('local');
  const last = lsGet('dm_student');
  if (location.hash !== '#teacher' && last && last.code && (!Q.get('code') || Q.get('code') === last.code)) {
    DB.get('rooms/' + last.code + '/players/' + pidOf(last.num)).then(p => {
      if (p && p.num) enterRoom(last.code, last.num, last.name || ''); else home();
    }).catch(() => home());
    show('<main class="s-wait"><p class="muted">다시 연결하는 중…</p></main>');
    return;
  }
  home();
})();
