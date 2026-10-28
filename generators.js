/* 문제 틀(생성기): 문항 파일에 { gen: "dec.op", opts: {...} } 처럼 적으면
   방·학생·시도마다 다른 숫자로 문제를 만들고 정답도 계산한다.
   소수는 모두 '1000배 한 정수(밀리)'로 계산해서 소수 오차가 없다. */
(function () {
  "use strict";
  const L = window.LQ;

  // ---------- 씨앗이 있는 난수 ----------
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    return h1 >>> 0;
  }
  function makeRng(seed) {
    let a = hash(String(seed));
    const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const R = { next };
    R.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    R.pick = arr => arr[Math.floor(next() * arr.length)];
    R.shuffle = arr => { const a2 = arr.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
    R.chance = p => next() < p;
    R.distinct = (n, lo, hi) => R.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
    return R;
  }
  L.rng = makeRng;

  // ---------- 소수(밀리 정수) ----------
  const fmt = m => {                       // 1250 → "1.25"
    const neg = m < 0; m = Math.abs(m);
    const ip = Math.floor(m / 1000), fp = String(m % 1000).padStart(3, "0").replace(/0+$/, "");
    return (neg ? "-" : "") + ip + (fp ? "." + fp : "");
  };
  const fmtN = (m, places) => {            // 자릿수 고정 (끝자리 0 살림): fmtN(700, 2) → "0.70"
    const ip = Math.floor(m / 1000), fp = String(m % 1000).padStart(3, "0").slice(0, places);
    return ip + (places ? "." + fp : "");
  };
  const val = m => Number(fmt(m));
  const places = m => { const s = fmt(m); return s.includes(".") ? s.split(".")[1].length : 0; };
  /** 정수부 lo~hi, 소수 d자리, 끝자리 0 아님 */
  const rdec = (R, lo, hi, d) => {
    const ip = R.int(lo, hi), unit = 10 ** (3 - d);
    let fp; do { fp = R.int(0, 10 ** d - 1); } while (d > 0 && fp % 10 === 0);
    return ip * 1000 + fp * unit;
  };
  const NUMK = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const readInt = n => {
    if (n < 10) return NUMK[n];
    const t = Math.floor(n / 10), o = n % 10;
    return (t > 1 ? NUMK[t] : "") + "십" + (o ? NUMK[o] : "");
  };
  const readDec = m => { const [ip, fp] = fmt(m).split("."); return readInt(Number(ip)) + " 점 " + (fp || "").split("").map(c => NUMK[c]).join(""); };
  L.dec = { fmt, val, readDec };

  // ---------- 그림 ----------
  const FILL = "#FFD36B", GRIDC = "#9DB4CF";
  const tx = (x, y, t, size, color) => `<text x="${x}" y="${y}" style="${size ? `font-size:${size}px;` : ""}${color ? `fill:${color};` : ""}">${t}</text>`;
  function grid100(n, x0 = 10, y0 = 10, c = 15) {
    let s = "";
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), k = i % 10;
      s += `<rect x="${x0 + k * c}" y="${y0 + r * c}" width="${c}" height="${c}" style="fill:${i < n ? FILL : "#FFFFFF"};stroke:${GRIDC};stroke-width:1"/>`;
    }
    return s + `<rect x="${x0}" y="${y0}" width="${10 * c}" height="${10 * c}" style="fill:none;stroke:#1D2A44;stroke-width:2"/>`;
  }
  const grids = (...ns) => ({ w: 10 + 190 * ns.length, h: 170, draw: ns.map((n, i) => grid100(n, 10 + i * 190)).join("") });
  function numline(a, b, arrow) {          // 밀리 단위
    const x0 = 30, x1 = 390, y = 70, X = v => x0 + ((v - a) / (b - a)) * (x1 - x0);
    let s = `<line x1="${x0 - 10}" y1="${y}" x2="${x1 + 10}" y2="${y}"/>`;
    for (let i = 0; i <= 10; i++) {
      const xx = x0 + (i * (x1 - x0)) / 10, big = i === 0 || i === 10;
      s += `<line x1="${xx}" y1="${y - (big ? 12 : 7)}" x2="${xx}" y2="${y + (big ? 12 : 7)}" style="stroke-width:${big ? 3 : 2}"/>`;
    }
    s += tx(x0, y + 36, fmt(a), 18) + tx(x1, y + 36, fmt(b), 18);
    const ax = X(arrow);
    s += `<path d="M ${ax - 9} ${y - 34} L ${ax + 9} ${y - 34} L ${ax} ${y - 16} Z" style="fill:#E0453B;stroke:none"/>` + tx(ax, y - 42, "?", 20, "#E0453B");
    return { w: 420, h: 120, draw: s };
  }
  /** 세로셈. a, b, res: 문자열('□'는 빈 상자), res 없으면 물음표 칸 */
  function vfig(a, b, op, res) {
    const sp = t => (t.split(".").concat([""])).slice(0, 2);
    const rows = [a, b].concat(res ? [res] : []);
    const I = Math.max(...rows.map(r => sp(r)[0].length)), F = Math.max(...rows.map(r => sp(r)[1].length));
    const cw = 34, x0 = 70, y0 = 44, rh = 50, labels = ["㉠", "㉡", "㉢", "㉣"]; let li = 0, s = "";
    const row = (t, y) => {
      const [ip, fp] = sp(t), cells = (" ".repeat(I - ip.length) + ip).split("").concat(["."], (fp + " ".repeat(F - fp.length)).split(""));
      let x = x0;
      for (const ch of cells) {
        if (ch === ".") { if (F) s += tx(x - 17, y, ".", 30); continue; }
        if (ch === "□") s += `<rect x="${x - 14}" y="${y - 30}" width="28" height="36" rx="5" style="fill:#EAF3FD;stroke:#2C7BE0;stroke-width:2.5"/>` + tx(x, y - 3, labels[li++], 18, "#2C7BE0");
        else if (ch !== " ") s += tx(x, y, ch, 30);
        x += cw;
      }
    };
    row(a, y0); row(b, y0 + rh);
    s += tx(x0 - 40, y0 + rh, op, 30);
    const wtot = cw * (I + F);
    s += `<line x1="${x0 - 50}" y1="${y0 + rh + 16}" x2="${x0 + wtot - 4}" y2="${y0 + rh + 16}"/>`;
    const y = y0 + rh * 2 + 4;
    if (res) row(res, y);
    else s += `<rect x="${x0 - 16}" y="${y - 32}" width="${wtot}" height="40" rx="6" style="fill:#EAF3FD;stroke:#2C7BE0;stroke-width:2;stroke-dasharray:6 4"/>` + tx(x0 - 16 + wtot / 2, y - 4, "?", 24, "#2C7BE0");
    return { w: Math.max(260, x0 + wtot + 40), h: 190, draw: s };
  }

  // ---------- 문항 모양 ----------
  const num = (text, m, unit, extra) => Object.assign({ type: "number", text, answer: val(m) }, unit ? { unit } : {}, extra || {});
  const cnt = (text, n, unit, extra) => Object.assign({ type: "number", text, answer: n }, unit ? { unit } : {}, extra || {});
  const choice = (text, options, answer, extra) => Object.assign({ type: "choice", text, options, answer }, extra || {});
  const CMP = ["＞ (왼쪽이 더 커요)", "＜ (오른쪽이 더 커요)", "＝ (같아요)"];
  const PLACE = ["일의 자리", "소수 첫째 자리", "소수 둘째 자리", "소수 셋째 자리"];
  const digitsOf = (m, d) => { const s = fmtN(m, d); return s; };

  // 받침에 맞는 조사: 숫자는 읽는 소리(영·일·삼·육·칠·팔은 받침 있음), 한글은 마지막 글자
  const hasB = ch => /[0-9]/.test(ch) ? "013678".includes(ch) : (/[가-힣]/.test(ch) ? (ch.charCodeAt(0) - 0xac00) % 28 !== 0 : false);
  const PAIRS = { "을(를)": ["을", "를"], "은(는)": ["은", "는"], "이(가)": ["이", "가"], "이에요": ["이에요", "예요"], "와(과)": ["과", "와"] };
  // {2 3/5} 같은 분수 표기 뒤에서는 분자(마지막 숫자)의 소리로 고름: '5분의 3은'
  const fixJosa = t => t.replace(/(\{[^{}]*\}|[0-9가-힣])('?)(을\(를\)|은\(는\)|이\(가\)|와\(과\)|이에요)/g, (m, ch, q, p) => {
    const last = ch.length > 1 ? (ch.match(/(\d)\/[^/]*\}$/) || ch.match(/(\d)\}$/) || [, "0"])[1] : ch;
    return ch + q + PAIRS[p][hasB(last) ? 0 : 1];
  });
  L.fixJosa = fixJosa;

  const G = (L.GENS = {});

  // ===== 소수 두 자리 수 · 세 자리 수 =====
  G["dec.grid"] = R => { let n = R.int(11, 99); if (n % 10 === 0) n += 3; return num("전체 크기가 1인 모눈종이입니다.\n색칠된 부분의 크기를 소수로 나타내어 보세요.", n * 10, null, { figure: grids(n) }); };
  G["dec.frac"] = (R, o) => {
    const d = o.d || 2, den = 10 ** d; let n; do { n = R.int(1, den - 1); } while (n % 10 === 0);
    return num(`${den}분의 ${n}을(를) 소수로 나타내어 보세요.`, (n * 1000) / den);
  };
  G["dec.read"] = (R, o) => { const m = rdec(R, 0, 9, o.d || 2); return { type: "short", text: `${fmt(m)}을(를) 읽어 보세요.`, answer: [readDec(m).replace(/\s/g, "")], hint: "예) 영 점 일이" }; };
  G["dec.write"] = (R, o) => { const m = rdec(R, 0, 9, o.d || 2); return num(`'${readDec(m)}'을(를) 소수로 써 보세요.`, m); };
  G["dec.place"] = (R, o) => {
    const d = o.d || 2, ds = R.distinct(d + 1, 1, 9), m = ds[0] * 1000 + ds.slice(1).reduce((a, x, i) => a + x * 10 ** (2 - i), 0);
    const p = R.int(0, d), s = fmtN(m, d), digit = ds[p];
    return choice(`${s}에서 숫자 ${digit}은(는) 어느 자리 숫자인가요?`, PLACE.slice(0, d + 1), p + 1);
  };
  G["dec.value"] = (R, o) => {
    const d = o.d || 2, ds = R.distinct(d + 1, 1, 9), m = ds[0] * 1000 + ds.slice(1).reduce((a, x, i) => a + x * 10 ** (2 - i), 0);
    const p = R.int(1, d);
    return num(`${fmtN(m, d)}에서 숫자 ${ds[p]}이(가) 나타내는 수는 얼마인가요?`, ds[p] * 10 ** (3 - p));
  };
  G["dec.compose"] = (R, o) => {
    const d = o.d || 2, parts = [R.int(1, 9)].concat(Array.from({ length: d }, (_, i) => R.int(i === d - 1 ? 1 : 0, 9)));
    const names = ["1", "0.1", "0.01", "0.001"], m = parts.reduce((a, x, i) => a + x * 10 ** (3 - i), 0);
    const txt = parts.map((x, i) => (x ? `${names[i]}이 ${x}개` : "")).filter(Boolean).join(", ");
    return num(`${txt}인 수는 얼마인가요?`, m);
  };
  G["dec.count"] = (R, o) => {
    const d = o.d || 2; let n; do { n = R.int(12, d === 2 ? 399 : 999); } while (n % 10 === 0);
    return num(`${d === 2 ? "0.01" : "0.001"}이 ${n}개인 수는 얼마인가요?`, n * 10 ** (3 - d));
  };
  G["dec.numline"] = (R, o) => {
    const d = o.d || 2, step = 10 ** (3 - d);           // 작은 눈금 한 칸
    const a = (d === 2 ? R.int(0, 39) * 100 : R.int(0, 299) * 10), j = R.int(1, 9);
    return num("수직선에서 화살표가 가리키는 수는 얼마인가요?", a + j * step, null, { figure: numline(a, a + 10 * step, a + j * step) });
  };
  G["dec.unit"] = (R, o) => {
    if ((o.d || 2) === 2) { const a = R.int(1, 3), b = R.int(1, 99); return num(`${a} m ${b} cm는 몇 m인지 소수로 나타내어 보세요.`, a * 1000 + b * 10, "m"); }
    const a = R.int(1, 5), b = R.pick([R.int(1, 9), R.int(10, 99), R.int(100, 999)]);
    return num(`${a} km ${b} m는 몇 km인지 소수로 나타내어 보세요.`, a * 1000 + b, "km");
  };
  G["dec.step"] = R => {
    const m = rdec(R, 0, 9, 2), st = R.pick([[10, "0.01 큰"], [100, "0.1 큰"], [-10, "0.01 작은"], [-100, "0.1 작은"]]);
    if (m + st[0] < 0) return G["dec.step"](R);
    return num(`${fmt(m)}보다 ${st[1]} 수는 얼마인가요?`, m + st[0]);
  };
  G["dec.find"] = (R, o) => {
    const d = o.d || 2, ip = R.int(1, 8), ds = Array.from({ length: d }, () => R.int(1, 9));
    const m = ip * 1000 + ds.reduce((a, x, i) => a + x * 10 ** (2 - i), 0);
    const lines = [`• ${ip}보다 크고 ${ip + 1}보다 작아요.`, `• 소수 첫째 자리 숫자는 ${ds[0]}이에요.`, `• 소수 둘째 자리 숫자는 ${ds[1]}이에요.`];
    if (d === 3) lines.push(ds[2] === ds[0] ? "• 소수 셋째 자리 숫자는 소수 첫째 자리 숫자와 같아요." : `• 소수 셋째 자리 숫자는 ${ds[2]}이에요.`);
    return num(`다음에서 설명하는 소수 ${d === 2 ? "두" : "세"} 자리 수는 얼마인가요?\n` + lines.join("\n"), m);
  };
  G["dec.least"] = R => {     // 숫자 d가 나타내는 수가 가장 작은 것
    const dg = R.int(2, 9), others = () => R.distinct(3, 1, 9).filter(x => x !== dg).slice(0, 3);
    const opts = [0, 1, 2, 3].map(p => { const o2 = others(), cells = []; let k = 0; for (let i = 0; i < 4; i++) cells.push(i === p ? dg : o2[k++] || 1); return cells[0] * 1000 + cells[1] * 100 + cells[2] * 10 + cells[3]; });
    const order = R.shuffle([0, 1, 2, 3]);
    return choice(`숫자 ${dg}이(가) 나타내는 수가 가장 작은 것을 고르세요.`, order.map(i => fmtN(opts[i], 3)), order.indexOf(3) + 1);
  };

  // ===== 소수 사이의 관계 =====
  G["dec.times"] = (R, o) => {
    const ops = o.ops || ["x10", "x100", "/10", "/100"], op = R.pick(ops);
    let m;
    if (op[0] === "x") { const f = Number(op.slice(1)); m = rdec(R, 0, 9, R.pick([1, 2, 3])); return num(`${fmt(m)}의 ${f}배는 얼마인가요?`, m * f); }
    const f = Number(op.slice(1)), d = f === 10 ? 2 : 1;
    do { m = R.chance(0.4) ? R.int(1, 99) * 1000 : rdec(R, 0, 99, R.int(0, d)); } while ((m / f) % 1 !== 0 || m === 0);
    return num(`${fmt(m)}의 ${f}분의 1은 얼마인가요?`, m / f);
  };
  G["dec.shift"] = R => {
    const c = R.pick([["10배", 1], ["100배", 2], ["10분의 1을", 3], ["100분의 1을", 4]]);
    return choice(`어떤 수를 ${c[0]} 하면 소수점을 기준으로 수가 어떻게 움직이나요?`, ["왼쪽으로 한 자리", "왼쪽으로 두 자리", "오른쪽으로 한 자리", "오른쪽으로 두 자리"], c[1]);
  };
  G["dec.ratio"] = R => {
    const dg = R.int(1, 9), p1 = R.int(0, 1), p2 = R.int(p1 + 1, 3), m = dg * 1111;
    return cnt(`${fmtN(m, 3)}에서 ${PLACE[p1]} 숫자 ${dg}이(가) 나타내는 수는\n${PLACE[p2]} 숫자 ${dg}이(가) 나타내는 수의 몇 배인가요?`, 10 ** (p2 - p1), "배");
  };
  G["dec.oddone"] = R => {
    const v = R.int(1, 9) * 1000;           // 같은 값 v (1~9)
    const exprs = [`${fmt(v / 10)}의 10배`, `${fmt(v * 10)}의 10분의 1`, `${fmt(v / 100)}의 100배`, `${fmt(v * 100)}의 100분의 1`];
    const wrong = R.pick([`${fmt(v / 100)}의 10배`, `${fmt(v * 10)}의 100분의 1`, `${fmt(v / 10)}의 100배`]);
    const pickd = R.shuffle(exprs).slice(0, 3).concat([wrong]), order = R.shuffle([0, 1, 2, 3]);
    return choice("나타내는 수가 다른 하나를 고르세요.", order.map(i => pickd[i]), order.indexOf(3) + 1);
  };
  G["dec.timesword"] = R => {
    const it = R.pick([["지우개 1개의 무게", "지우개", "개", "kg", 10, 90], ["클립 1개의 무게", "클립", "개", "kg", 1, 9], ["색종이 한 묶음의 무게", "색종이", "묶음", "kg", 20, 90], ["물약 한 병의 양", "물약", "병", "L", 10, 50]]);
    const w = R.int(it[4], it[5]), f = R.pick([10, 100]);
    return num(`${it[0]}는 ${fmt(w)} ${it[3]}입니다.\n${it[1]} ${f}${it[2]}은(는) 모두 몇 ${it[3]}인가요?`, w * f, it[3]);
  };
  G["dec.mistake10"] = R => {
    const right = rdec(R, 0, 9, R.pick([2, 3])), x = right * 10, wrongR = x * 10;
    if (right % 1 || x > 99999) return G["dec.mistake10"](R);
    return num(`어떤 수의 10분의 1을 해야 할 것을 잘못하여 10배 했더니 ${fmt(wrongR)}이(가) 되었습니다.\n바르게 계산한 값은 얼마인가요?`, right);
  };

  // ===== 크기 비교 =====
  G["dec.cmp"] = R => {
    const t = R.int(0, 3);
    let a, b, sa, sb;
    if (t === 0) { a = rdec(R, 0, 9, 2); b = Math.floor(a / 100) * 100 + R.pick([0, 100]); if (b === a) b += 100; }   // 0.45 vs 0.5
    else if (t === 1) { a = rdec(R, 0, 9, 3); b = Math.round(a / 10) * 10 + R.pick([-10, 10, 0]); if (b === a) b += 10; }
    else if (t === 2) { a = rdec(R, 0, 9, 1); b = a; }                                                                      // 0.7 vs 0.70
    else { a = rdec(R, 0, 9, 2); b = a + R.pick([-1, 1]) * R.pick([1, 9, 10, 90]) * 10 / 10; if (b < 0 || places(b) > 3) b = a + 100; }
    sa = fmt(a); sb = t === 2 ? fmtN(b, 2) : fmt(b);
    if (R.chance(0.5)) [sa, sb, a, b] = [sb, sa, b, a];
    return choice(`두 수의 크기를 비교하여 알맞은 것을 고르세요.\n${sa} [ ] ${sb}`, CMP, a > b ? 1 : a < b ? 2 : 3);
  };
  G["dec.extreme"] = (R, o) => {
    const big = o.which ? o.which === "max" : R.chance(0.5), ip = R.int(0, 5), ds = R.distinct(2, 1, 9);
    const cand = [ip * 1000 + ds[0] * 100 + ds[1] * 10, ip * 1000 + ds[0] * 100, ip * 1000 + ds[0] * 100 + ds[1], ip * 1000 + ds[1] * 100 + ds[0], ip * 1000 + ds[0] * 10 + ds[1], ip * 1000 + ds[1] * 100 + ds[0] * 10 + ds[1]];
    const vals = Array.from(new Set(R.shuffle(cand))).slice(0, 4);
    const target = big ? Math.max(...vals) : Math.min(...vals);
    return choice(`${big ? "가장 큰" : "가장 작은"} 수를 고르세요.`, vals.map(fmt), vals.indexOf(target) + 1);
  };
  G["dec.gridcmp"] = R => {
    const [a, b] = R.distinct(2, 21, 95);
    return choice("모눈종이 두 장에 색칠한 부분이 나타내는 수입니다.\n더 큰 수는 어느 쪽인가요?", ["왼쪽", "오른쪽"], a > b ? 1 : 2, { figure: grids(a, b), explain: `왼쪽은 ${fmt(a * 10)}, 오른쪽은 ${fmt(b * 10)}이에요.` });
  };
  G["dec.wordcmp"] = R => {
    const nm = R.shuffle(["주원", "설아", "민준", "하윤", "도윤", "서아"]).slice(0, 2), a = rdec(R, 1, 3, 2);
    let b = Math.floor(a / 100) * 100 + R.pick([100, 0]); if (b === a) b += 100;
    const far = R.chance(0.5);
    return choice(`학교에서 집까지의 거리가 ${nm[0]}는 ${fmt(a)} km, ${nm[1]}는 ${fmt(b)} km입니다.\n집이 학교에서 더 ${far ? "먼" : "가까운"} 사람은 누구인가요?`, nm, (far ? a > b : a < b) ? 1 : 2);
  };
  G["dec.blank"] = R => {   // a.b□c < a.bde 에서 □에 들어갈 수 있는 가장 큰 숫자
    const ip = R.int(1, 9), b = R.int(0, 9), d = R.int(1, 8), e = R.int(0, 9), c = R.int(0, 9);
    const target = ip * 1000 + b * 100 + d * 10 + e;
    let best = -1; for (let x = 0; x <= 9; x++) if (ip * 1000 + b * 100 + x * 10 + c < target) best = x;
    if (best < 0) return G["dec.blank"](R);
    return cnt(`${ip}.${b}□${c} < ${fmt(target).padEnd(5, "0")} 일 때, □ 안에 들어갈 수 있는\n숫자 중 가장 큰 숫자는 무엇인가요?`, best);
  };
  G["dec.cards"] = R => {
    const ds = R.distinct(3, 1, 9).sort((a, b) => a - b), big = R.chance(0.5), o2 = big ? ds.slice().reverse() : ds;
    return num(`숫자 카드 ${R.shuffle(ds).join(", ")}을(를) 한 번씩 모두 사용하여\n□.□□ 모양의 소수를 만들 때 가장 ${big ? "큰" : "작은"} 수는 얼마인가요?`, o2[0] * 1000 + o2[1] * 100 + o2[2] * 10);
  };

  // ===== 덧셈·뺄셈 =====
  /** opts: op "+"|"-", da/db 소수 자릿수, carry true(받아올림·받아내림 있게), vert 세로셈 그림, ipMax 정수부 최대 */
  function pair(R, o) {
    const da = o.da || 1, db = o.db || da, ipMax = o.ipMax == null ? 9 : o.ipMax;
    for (let t = 0; t < 200; t++) {
      let a = rdec(R, o.ipMin || 0, ipMax, da), b = rdec(R, o.ipMin || 0, ipMax, db);
      if (o.wholeA) a = R.int(2, 9) * 1000;
      if (o.op === "-" && a <= b) { if (da === db && !o.wholeA && a !== b) [a, b] = [b, a]; else continue; }
      const r = o.op === "+" ? a + b : a - b;
      const lowA = a % 100, lowB = b % 100;
      const carry = o.op === "+" ? (a % 1000) % 100 + (b % 1000) % 100 >= 100 || (a % 100) % 10 + (b % 100) % 10 >= 10 || (a % 1000) + (b % 1000) >= 1000
                                 : (a % 10 < b % 10) || (a % 100 < b % 100) || (a % 1000 < b % 1000);
      if (o.carry === true && !carry) continue;
      if (o.carry === false && carry) continue;
      if (o.maxR && r > o.maxR) continue;
      return [a, b, r, lowA, lowB];
    }
    return [1500, 700, o.op === "+" ? 2200 : 800];
  }
  const sym = op => (op === "+" ? "+" : "−");
  G["dec.op"] = (R, o) => {
    const [a, b, r] = pair(R, o);
    const da = Math.max(places(a), places(b), 1);
    if (o.vert) return num("세로셈을 계산해 보세요.", r, null, { figure: vfig(fmtN(a, places(a)), fmtN(b, places(b)), sym(o.op)) });
    return num(`${fmt(a)} ${o.op === "+" ? "+" : "-"} ${fmt(b)}을(를) 계산해 보세요.`, r);
  };
  G["dec.count01"] = (R, o) => {
    const [a, b, r] = pair(R, Object.assign({ da: 1, ipMax: 0 }, o));
    return cnt(`${fmt(a)} ${o.op === "+" ? "+" : "-"} ${fmt(b)}은(는) 0.1이 모두 몇 개인 수인가요?`, r / 100, "개");
  };
  const WORD_ADD = [
    (a, b, u) => [`어제는 비가 ${a} mm 내렸고, 오늘은 어제보다 ${b} mm 더 내렸습니다.\n오늘 내린 비는 몇 mm인가요?`, "mm"],
    (a, b) => [`하윤이는 ${a} L 물병을, 동생은 ${b} L 물병을 준비했습니다.\n두 물병에 가득 담은 물은 모두 몇 L인가요?`, "L"],
    (a, b) => [`길이가 ${a} m인 끈과 ${b} m인 끈을 겹치지 않게 이었습니다.\n이은 끈의 길이는 몇 m인가요?`, "m"],
    (a, b) => [`${a} kg인 가방에 ${b} kg인 책을 넣었습니다.\n가방의 무게는 몇 kg이 되나요?`, "kg"],
    (a, b) => [`민준이는 오전에 ${a} km, 오후에 ${b} km를 걸었습니다.\n민준이가 걸은 거리는 모두 몇 km인가요?`, "km"],
  ];
  const WORD_SUB = [
    (a, b) => [`주스 ${a} L 중에서 ${b} L를 마셨습니다.\n남은 주스는 몇 L인가요?`, "L"],
    (a, b) => [`철사 ${a} m 중에서 ${b} m를 사용했습니다.\n남은 철사는 몇 m인가요?`, "m"],
    (a, b) => [`밀가루 ${a} kg 중에서 빵을 만드는 데 ${b} kg을 썼습니다.\n남은 밀가루는 몇 kg인가요?`, "kg"],
    (a, b) => [`집에서 도서관까지는 ${a} km, 집에서 학교까지는 ${b} km입니다.\n도서관이 학교보다 몇 km 더 먼가요?`, "km"],
    (a, b) => [`책상의 가로는 ${a} m, 세로는 ${b} m입니다.\n가로는 세로보다 몇 m 더 긴가요?`, "m"],
  ];
  G["dec.word"] = (R, o) => {
    const [a, b, r] = pair(R, Object.assign({ ipMax: 5 }, o));
    const [t, u] = R.pick(o.op === "+" ? WORD_ADD : WORD_SUB)(fmt(a), fmt(b));
    return num(t, r, u);
  };
  G["dec.best"] = (R, o) => {
    for (let t = 0; t < 50; t++) {
      const ps = [0, 1, 2, 3].map(() => pair(R, o)), rs = ps.map(p => p[2]);
      const big = o.which ? o.which === "max" : R.chance(0.5), target = big ? Math.max(...rs) : Math.min(...rs);
      if (rs.filter(x => x === target).length !== 1 || new Set(rs).size < 3) continue;
      if (new Set(ps.map(p => p[0] + "|" + p[1])).size < 4) continue;
      return choice(`계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`, ps.map(p => `${fmt(p[0])} ${o.op === "+" ? "+" : "-"} ${fmt(p[1])}`), rs.indexOf(target) + 1);
    }
    return G["dec.op"](R, o);
  };
  G["dec.puzzle"] = (R, o) => {   // ㉠.x ± y.㉡ = 결과 (소수 한 자리, 받아올림·받아내림 있음)
    const [a, b, r] = pair(R, { op: o.op, da: 1, carry: true, ipMin: 1, ipMax: 8 });
    const A = fmtN(a, 1), Bs = fmtN(b, 1), ask = R.pick([0, 1]);
    const top = "□" + A.slice(A.indexOf(".")), bot = Bs.slice(0, Bs.indexOf(".") + 1) + "□";
    if (A.indexOf(".") !== 1) return G["dec.puzzle"](R, o);
    const ans = ask === 0 ? Number(A[0]) : Number(Bs[Bs.length - 1]);
    return cnt(`${o.op === "+" ? "덧셈식" : "뺄셈식"}에서 ${ask === 0 ? "㉠" : "㉡"}에 알맞은 숫자는 무엇인가요?`, ans, null,
      { figure: vfig(top, bot, sym(o.op), fmtN(r, 1)) });
  };
  G["dec.oxcalc"] = (R, o) => {
    const [a, b, r] = pair(R, Object.assign({ da: 1, ipMax: 0, carry: true }, o));
    const right = R.chance(0.5), shown = right ? fmt(r) : (o.op === "+" ? "0." + String(r / 100) : fmt(r + R.pick([100, -100])));
    if (!right && shown === fmt(r)) return G["dec.oxcalc"](R, o);
    return { type: "ox", text: `${fmt(a)} ${o.op === "+" ? "+" : "-"} ${fmt(b)} = ${shown} 입니다.`, answer: right ? "O" : "X", explain: `바른 답은 ${fmt(r)}이에요.` };
  };
  G["dec.inverse"] = (R, o) => {
    const k = R.pick(o.kinds || ["addTo", "minusBox", "plusBox"]);
    const [a, b] = pair(R, { op: "+", da: o.da || 2, db: o.db || o.da || 2, ipMax: 6 });
    if (k === "addTo") return num(`어떤 수에 ${fmt(b)}을(를) 더했더니 ${fmt(a + b)}이(가) 되었습니다.\n어떤 수는 얼마인가요?`, a);
    if (k === "minusBox") return num(`□ - ${fmt(b)} = ${fmt(a)} 일 때, □ 안에 알맞은 수는 얼마인가요?`, a + b);
    return num(`${fmt(b)} + □ = ${fmt(a + b)} 일 때, □ 안에 알맞은 수는 얼마인가요?`, a);
  };
  G["dec.wrongop"] = (R, o) => {
    const [x, b] = pair(R, { op: "+", da: 2, db: 2, ipMin: 2, ipMax: 6 });
    if (x <= b) return G["dec.wrongop"](R, o);
    return num(`어떤 수에서 ${fmt(b)}을(를) 빼야 할 것을 잘못하여 더했더니 ${fmt(x + b)}이(가) 되었습니다.\n바르게 계산한 값은 얼마인가요?`, x - b, null, { explain: `어떤 수는 ${fmt(x)}이고, ${fmt(x)} - ${fmt(b)} = ${fmt(x - b)}예요.` });
  };
  G["dec.diffext"] = R => {
    const vals = Array.from(new Set([0, 1, 2, 3].map(() => rdec(R, 1, 6, R.pick([1, 2]))))).slice(0, 4);
    if (vals.length < 4) return G["dec.diffext"](R);
    return num(`${vals.map(fmt).join(", ")} 중에서\n가장 큰 수와 가장 작은 수의 차는 얼마인가요?`, Math.max(...vals) - Math.min(...vals));
  };
  G["dec.sum3"] = (R, o) => {
    const d = o.d || 1, xs = [0, 1, 2].map(() => rdec(R, 0, 4, d)), same = R.chance(0.4);
    const ys = same ? [xs[0], xs[0], xs[0]] : xs;
    return num(`${ys.map(fmt).join(" + ")}을(를) 계산해 보세요.`, ys.reduce((a, x) => a + x, 0));
  };

  // =====================================================================
  // 4단원 사각형 (길이·각도가 바뀌는 문항)
  // =====================================================================
  const f1 = v => Math.round(v * 10) / 10;
  const ln = (x1, y1, x2, y2, st) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${st ? ` style="${st}"` : ""}/>`;
  const dash = (x1, y1, x2, y2) => ln(x1, y1, x2, y2, "stroke-dasharray:6 5;stroke-width:2");
  const poly = pts => `<polygon points="${pts.map(p => f1(p[0]) + "," + f1(p[1])).join(" ")}"/>`;
  const ra = (x, y, dx, dy, sz = 10) => `<path d="M ${x + dx * sz} ${y} L ${x + dx * sz} ${y + dy * sz} L ${x} ${y + dy * sz}" style="stroke-width:2"/>`;
  const vlab = (pts, names, off = 16) => {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return pts.map((p, i) => { const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; return tx(f1(p[0] + (dx / d) * off), f1(p[1] + (dy / d) * off + 6), names[i]); }).join("");
  };
  const gridBg = (w, h, g) => `<defs><pattern id="gg${w}${h}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><path class="gr" d="M ${g} 0 L 0 0 0 ${g}"/></pattern></defs><rect class="bgr" width="${w}" height="${h}" fill="url(#gg${w}${h})" stroke="none"/>`;
  const rad = d => (d * Math.PI) / 180;
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [4, 3, 5], [8, 6, 10], [9, 12, 15], [12, 5, 13]];   // [높이, 가로로 비낀 길이, 빗변]

  /** 평행사변형 그림: 밑변 B·옆변 S(px), ㄴ의 각 a도 */
  function pgram(a, B = 200, S = 110) {
    S = Math.min(S, 150);
    const x0 = 50, dx = S * Math.cos(rad(a)), dy = S * Math.sin(rad(a)), y0 = 44 + dy;
    const P = [[x0 + dx, y0 - dy], [x0, y0], [x0 + B, y0], [x0 + B + dx, y0 - dy]];   // ㄱ ㄴ ㄷ ㄹ
    const w = Math.max(...P.map(p => p[0])) + 50;
    return { P, w, h: y0 + 40, shape: poly(P) + vlab(P, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]) };
  }
  /** 마름모 그림: ㄴ(왼쪽 꼭짓점)의 각 a도, 한 변 s px */
  function rhomb(a, s = 120) {
    const p = s * Math.cos(rad(a / 2)), q = s * Math.sin(rad(a / 2)), cx = 40 + p, cy = 30 + q;
    const P = [[cx, cy - q], [cx - p, cy], [cx, cy + q], [cx + p, cy]];   // ㄱ(위) ㄴ(왼) ㄷ(아래) ㄹ(오른)
    return { P, cx, cy, w: cx + p + 40, h: cy + q + 34, shape: poly(P) + vlab(P, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]) };
  }
  const notRight = (R, lo, hi) => { let a; do { a = R.int(lo / 5, hi / 5) * 5; } while (a === 90); return a; };

  G["geo.perpAngle"] = R => {   // 수선 + 비스듬한 반직선, ㉠ = 90 - x
    const x = R.int(4, 14) * 5, ox = 140, oy = 150, L2 = 150;
    const ex = ox + L2 * Math.cos(rad(x)), ey = oy - L2 * Math.sin(rad(x)), mx = ox + 52 * Math.cos(rad((x + 90) / 2)), my = oy - 52 * Math.sin(rad((x + 90) / 2));
    const lx = ox + 72 * Math.cos(rad(x / 2)), ly = oy - 72 * Math.sin(rad(x / 2));
    const draw = ln(20, oy, 300, oy) + tx(292, oy - 10, "가") + ln(ox, 15, ox, 180) + tx(ox + 16, 26, "나") + ra(ox, oy, -1, -1) + ln(ox, oy, ex, ey) + tx(f1(lx), f1(ly + 6), `${x}°`, 16) + tx(f1(mx), f1(my + 6), "㉠", 18);
    return cnt("직선 나는 직선 가에 대한 수선입니다.\n㉠의 각도는 몇 도인가요?", 90 - x, "°", { figure: { w: 320, h: 190, draw } });
  };
  G["geo.gridDist"] = R => {   // 모눈 1칸 = 1 cm
    const n = R.int(2, 6), vertical = R.chance(0.35), g = 20;
    if (vertical) { const x = R.int(1, 15 - n) * g; return cnt("모눈 한 칸의 길이는 1 cm입니다.\n평행선 사이의 거리는 몇 cm인가요?", n, "cm", { figure: { w: 360, h: 160, draw: gridBg(360, 160, g) + ln(x, 0, x, 160) + ln(x + n * g, 0, x + n * g, 160) } }); }
    const y = R.int(1, 7 - n) * g;
    return cnt("모눈 한 칸의 길이는 1 cm입니다.\n평행선 사이의 거리는 몇 cm인가요?", n, "cm", { figure: { w: 360, h: 160, draw: gridBg(360, 160, g) + ln(0, y, 360, y) + ln(0, y + n * g, 360, y + n * g) } });
  };
  G["geo.rectDist"] = R => {
    const w = R.int(5, 9), h = R.int(2, Math.min(5, w - 2)), sc = 220 / w, H = h * sc, P = [[60, 40], [60, 40 + H], [280, 40 + H], [280, 40]];
    const askTB = R.chance(0.5);
    const draw = poly(P) + vlab(P, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]) + tx(170, 30, `${w} cm`, 17) + tx(30, f1(40 + H / 2 + 6), `${h} cm`, 17);
    return cnt(`직사각형에서 변 ${askTB ? "ㄱㄹ과 변 ㄴㄷ" : "ㄱㄴ과 변 ㄹㄷ"} 사이의 거리는 몇 cm인가요?`, askTB ? h : w, "cm", { figure: { w: 340, h: 40 + H + 50, draw } });
  };
  G["geo.parSum"] = (R, o) => {
    const k = o.lines || R.pick([3, 4]), names = ["가", "나", "다", "라"].slice(0, k), gaps = Array.from({ length: k - 1 }, () => R.int(2, 7));
    const tot = gaps.reduce((a, b) => a + b, 0), sc = 180 / tot; let y = 20, draw = "";
    const ys = [y]; gaps.forEach(gp => ys.push((y += gp * sc)));
    ys.forEach((yy, i) => (draw += ln(40, yy, 340, yy) + tx(24, f1(yy + 6), names[i])));
    gaps.forEach((gp, i) => (draw += dash(220, ys[i], 220, ys[i + 1]) + tx(258, f1((ys[i] + ys[i + 1]) / 2 + 6), `${gp} cm`, 16)));
    const a = 0, b = k - 1;
    return cnt(`직선 ${names.join(", ")}는 서로 평행합니다.\n직선 ${names[a]}와 직선 ${names[b]} 사이의 거리는 몇 cm인가요?`, tot, "cm", { figure: { w: 360, h: ys[k - 1] + 24, draw } });
  };
  G["geo.slantDist"] = R => {   // 비스듬한 선분 c cm, 수선 h cm → 거리 h
    const [h, d, c] = R.pick(TRIPLES), sc = 90 / h, y1 = 40, y2 = 40 + h * sc, x1 = R.int(50, 90), x2 = x1 + d * sc;
    if (x2 > 300) return G["geo.slantDist"](R);
    const px = Math.min(330, x2 + 70);
    const draw = ln(20, y1, 380, y1) + tx(16, y1 - 10, "가") + ln(20, y2, 380, y2) + tx(16, y2 + 20, "나") + ln(x1, y1, x2, y2) + tx(f1((x1 + x2) / 2 - 22), f1((y1 + y2) / 2 + 8), `${c} cm`, 16) + ln(px, y1, px, y2) + ra(px, y2, 1, -1) + tx(px + 30, f1((y1 + y2) / 2 + 6), `${h} cm`, 16);
    return cnt("직선 가와 직선 나는 서로 평행합니다.\n평행선 사이의 거리는 몇 cm인가요?", h, "cm", { figure: { w: 380, h: y2 + 34, draw } });
  };
  G["geo.pgramHeight"] = R => {
    const [h, d, c] = R.pick(TRIPLES), base = R.int(Math.max(c, 6), 12), sc = 100 / h;
    const x0 = 50, y0 = 140, P = [[x0, y0], [x0 + base * sc, y0], [x0 + base * sc + d * sc, y0 - h * sc], [x0 + d * sc, y0 - h * sc]];
    if (P[2][0] > 420) return G["geo.pgramHeight"](R);
    const hx = P[3][0];
    const draw = poly(P) + dash(hx, y0 - h * sc, hx, y0) + ra(hx, y0, 1, -1) + tx(f1((P[0][0] + P[3][0]) / 2 - 26), f1(y0 - (h * sc) / 2), `${c} cm`, 16) + tx(hx + 28, f1(y0 - (h * sc) / 2 + 10), `${h} cm`, 16) + tx(f1((P[0][0] + P[1][0]) / 2), y0 + 22, `${base} cm`, 16);
    return cnt("평행사변형에서 위아래 두 변 사이의 거리는 몇 cm인가요?", h, "cm", { figure: { w: P[2][0] + 30, h: 170, draw } });
  };
  G["geo.pgramSide"] = R => {
    const a = R.int(5, 12), b = R.int(3, a - 1), g = pgram(notRight(R, 50, 75), 200, 200 * b / a);
    const askTop = R.chance(0.5), P = g.P;
    const draw = g.shape + tx(f1((P[0][0] + P[3][0]) / 2), f1(P[0][1] - 12), `${a} cm`, 17) + tx(f1((P[0][0] + P[1][0]) / 2 - 28), f1((P[0][1] + P[1][1]) / 2 + 6), `${b} cm`, 17);
    return cnt(`평행사변형 ㄱㄴㄷㄹ에서 변 ${askTop ? "ㄴㄷ" : "ㄹㄷ"}의 길이는 몇 cm인가요?`, askTop ? a : b, "cm", { figure: { w: g.w, h: g.h, draw } });
  };
  G["geo.pgramAngle"] = (R, o) => {
    const a = notRight(R, 45, 80), g = pgram(a), P = g.P, kind = o.kind || R.pick(["adj", "opp"]);
    const draw = g.shape + tx(f1(P[1][0] + 40), f1(P[1][1] - 8), `${a}°`, 16);
    return kind === "adj"
      ? cnt(`평행사변형 ㄱㄴㄷㄹ에서 각 ㄱㄴㄷ이 ${a}°입니다.\n각 ㄴㄱㄹ은 몇 도인가요?`, 180 - a, "°", { figure: { w: g.w, h: g.h, draw } })
      : cnt(`평행사변형 ㄱㄴㄷㄹ에서 각 ㄱㄴㄷ이 ${a}°입니다.\n각 ㄱㄹㄷ은 몇 도인가요?`, a, "°", { figure: { w: g.w, h: g.h, draw } });
  };
  G["geo.adjAngle"] = R => { const a = notRight(R, 35, 145); return cnt(`평행사변형에서 한 각이 ${a}°입니다.\n이 각과 이웃한 각은 몇 도인가요?`, 180 - a, "°"); };
  G["geo.pgramPerim"] = (R, o) => {
    const a = R.int(5, 12), b = R.int(3, a - 1), g = pgram(notRight(R, 50, 75), 200, 200 * b / a), P = g.P;
    if (o.inverse) {
      const draw = g.shape + tx(f1((P[0][0] + P[1][0]) / 2 - 28), f1((P[0][1] + P[1][1]) / 2 + 6), `${b} cm`, 17);
      return cnt(`평행사변형 ㄱㄴㄷㄹ의 네 변의 길이의 합은 ${2 * (a + b)} cm입니다.\n변 ㄱㄴ이 ${b} cm일 때, 변 ㄴㄷ은 몇 cm인가요?`, a, "cm", { figure: { w: g.w, h: g.h, draw } });
    }
    const draw = g.shape + tx(f1((P[0][0] + P[3][0]) / 2), f1(P[0][1] - 12), `${a} cm`, 17) + tx(f1((P[0][0] + P[1][0]) / 2 - 28), f1((P[0][1] + P[1][1]) / 2 + 6), `${b} cm`, 17);
    return cnt("평행사변형의 네 변의 길이의 합은 몇 cm인가요?", 2 * (a + b), "cm", { figure: { w: g.w, h: g.h, draw } });
  };
  G["geo.rhombAngle"] = R => {
    const a = notRight(R, 55, 110), g = rhomb(a), P = g.P;
    const draw = g.shape + tx(f1(P[1][0] + 34), f1(P[1][1] + 6), `${a}°`, 16);
    return cnt(`마름모 ㄱㄴㄷㄹ에서 각 ㄱㄴㄷ이 ${a}°입니다.\n각 ㄴㄱㄹ은 몇 도인가요?`, 180 - a, "°", { figure: { w: g.w, h: g.h, draw } });
  };
  G["geo.rhombPerim"] = (R, o) => {
    const s = R.int(3, 15);
    if (o.inverse) return cnt(`마름모의 네 변의 길이의 합이 ${4 * s} cm입니다.\n한 변의 길이는 몇 cm인가요?`, s, "cm");
    const g = rhomb(notRight(R, 60, 110)), P = g.P;
    return cnt("마름모의 네 변의 길이의 합은 몇 cm인가요?", 4 * s, "cm", { figure: { w: g.w, h: g.h, draw: poly(P) + tx(f1((P[0][0] + P[1][0]) / 2 - 26), f1((P[0][1] + P[1][1]) / 2), `${s} cm`, 17) } });
  };
  G["geo.rhombHalf"] = R => {
    const d = R.int(3, 12) * 2, g = rhomb(notRight(R, 60, 110)), P = g.P, which = R.chance(0.5);
    const draw = g.shape + ln(P[0][0], P[0][1], P[2][0], P[2][1]) + ln(P[1][0], P[1][1], P[3][0], P[3][1]) + tx(f1(g.cx + 14), f1(g.cy + 22), "ㅇ", 17);
    return which
      ? cnt(`마름모에서 선분 ㄱㄷ의 길이는 ${d} cm입니다.\n선분 ㄱㅇ은 몇 cm인가요?`, d / 2, "cm", { figure: { w: g.w, h: g.h, draw }, explain: "마주 보는 꼭짓점끼리 이은 선분은 서로를 똑같이 둘로 나눠요." })
      : cnt(`마름모에서 선분 ㄴㅇ의 길이는 ${d / 2} cm입니다.\n선분 ㄴㄹ은 몇 cm인가요?`, d, "cm", { figure: { w: g.w, h: g.h, draw }, explain: "마주 보는 꼭짓점끼리 이은 선분은 서로를 똑같이 둘로 나눠요." });
  };
  G["geo.squarePerim"] = R => { const s = R.int(3, 15); return R.chance(0.5) ? cnt(`정사각형의 네 변의 길이의 합이 ${4 * s} cm입니다.\n한 변의 길이는 몇 cm인가요?`, s, "cm") : cnt(`정사각형의 한 변의 길이가 ${s} cm입니다.\n네 변의 길이의 합은 몇 cm인가요?`, 4 * s, "cm"); };

  /** 여러 사각형 분류: 가~마 도형을 무작위로 그리고 ask 종류를 모두 고르기 */
  const KINDS = {
    square: ["square", "rect", "rhomb", "para", "trap"], rect: ["rect", "para", "trap"], rhomb: ["rhomb", "para", "trap"],
    para: ["para", "trap"], trap: ["trap"], irr: [],
  };
  const KNAME = { square: "정사각형", rect: "직사각형", rhomb: "마름모", para: "평행사변형", trap: "사다리꼴" };
  function drawKind(R, k, cx) {      // 칸 가운데 cx, 칸 너비 120, 높이 0~150
    const w = R.int(3, 5) * 20, h = R.int(2, 4) * 20, top = 80 - h / 2;
    if (k === "square") { const s = R.int(3, 4) * 20; return [[cx - s / 2, 80 - s / 2], [cx + s / 2, 80 - s / 2], [cx + s / 2, 80 + s / 2], [cx - s / 2, 80 + s / 2]]; }
    if (k === "rect") { const W = h === w ? w + 20 : Math.max(w, h + 20); return [[cx - W / 2, top], [cx + W / 2, top], [cx + W / 2, top + h], [cx - W / 2, top + h]]; }
    if (k === "rhomb") { const p = R.int(2, 3) * 20, q = p === 40 ? 60 : 40; return [[cx, 80 - q], [cx + p, 80], [cx, 80 + q], [cx - p, 80]]; }
    if (k === "para") {
      const W = R.int(3, 4) * 20, sh = 20 * R.pick([1, -1]);
      if (Math.abs(Math.hypot(2 * sh, h) - W) < 1) return drawKind(R, k, cx);      // 마름모가 되지 않게
      return [[cx - W / 2 + sh, top], [cx + W / 2 + sh, top], [cx + W / 2 - sh, top + h], [cx - W / 2 - sh, top + h]];
    }
    if (k === "trap") { const tw = R.int(1, 2) * 20, off = R.int(-10, 10); return [[cx - tw / 2 + off, top], [cx + tw / 2 + off, top], [cx + w / 2 + 5, top + h], [cx - w / 2 - 5, top + h]]; }
    return [[cx - 45, top + h], [cx + 50, top + h - 10], [cx + 30, top], [cx - 20, top + 15]];
  }
  G["geo.classify"] = (R, o) => {
    const ask = o.ask || R.pick(["para", "rhomb", "rect", "trap", "square"]);
    for (let t = 0; t < 50; t++) {
      const kinds = R.shuffle(["square", "rect", "rhomb", "para", "trap", "irr"]).slice(0, 5);
      const ans = kinds.map((k, i) => (KINDS[k].includes(ask) ? i + 1 : 0)).filter(Boolean);
      if (!ans.length || ans.length === 5) continue;
      let draw = gridBg(640, 170, 20);
      kinds.forEach((k, i) => { const cx = 64 + i * 128; draw += poly(drawKind(R, k, cx)) + tx(cx, 162, "가나다라마"[i], 24); });
      return { type: "choice", multi: true, text: `${KNAME[ask]}을(를) 모두 고르세요.`, answer: ans, options: "가나다라마".split("").map(c => ({ label: c })), figure: { w: 640, h: 170, draw } };
    }
  };

  // =====================================================================
  // 4단원 사각형 ②: 도형·직선 그림과 개념 문장까지 바뀌는 문항
  // =====================================================================
  const dotc = (x, y) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="5" style="fill:#1D2A44;stroke:none"/>`;
  /** 기울어진 직각 표시: 꼭짓점 (cx,cy), 두 변 방향 단위벡터 u, v */
  const raR = (cx, cy, u, v, s = 11) => `<path d="M ${f1(cx + u[0] * s)} ${f1(cy + u[1] * s)} L ${f1(cx + u[0] * s + v[0] * s)} ${f1(cy + u[1] * s + v[1] * s)} L ${f1(cx + v[0] * s)} ${f1(cy + v[1] * s)}" style="stroke-width:2"/>`;
  const seg = (cx, cy, deg, len) => { const dx = (Math.cos(rad(deg)) * len) / 2, dy = (-Math.sin(rad(deg)) * len) / 2; return ln(cx - dx, cy - dy, cx + dx, cy + dy); };
  const sfig = draw => ({ w: 160, h: 110, grid: 10, draw });
  const bigfig = P => ({ w: 320, h: 220, grid: 20, draw: poly(P.map(p => [p[0] * 2, p[1] * 2])) });
  const ira = (R, a, b) => R.int(a, b);
  const rLa = w => (hasB(w[w.length - 1]) ? w + "이라고" : w + "라고");

  /** 변끼리 평행·수직인 쌍의 수와 사각형 이름을 좌표로 직접 계산 */
  function shapeInfo(P) {
    const n = P.length, V = P.map((p, i) => [P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1]]), len = V.map(v => Math.hypot(v[0], v[1]));
    let par = 0, perp = 0, minS = 1, minC = 1;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const s = Math.abs(V[i][0] * V[j][1] - V[i][1] * V[j][0]) / (len[i] * len[j]), c = Math.abs(V[i][0] * V[j][0] + V[i][1] * V[j][1]) / (len[i] * len[j]);
      if (s < 0.01) par++; else minS = Math.min(minS, s);
      if (c < 0.01) perp++; else minC = Math.min(minC, c);
    }
    const kinds = [];
    if (n === 4) {
      const cr = (a, b) => Math.abs(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(...a) * Math.hypot(...b)) < 0.01;
      const np = cr(V[0], V[2]) + cr(V[1], V[3]);
      if (np) kinds.push("trap");
      if (np === 2) {
        kinds.push("para");
        const eq = Math.max(...len) - Math.min(...len) < 0.5, right = Math.abs(V[0][0] * V[1][0] + V[0][1] * V[1][1]) < 0.5;
        if (eq) kinds.push("rhomb");
        if (right) kinds.push("rect");
        if (eq && right) kinds.push("square");
      }
    }
    return { par, perp, kinds, minS, minC };
  }
  const box = (cx, cy, w, h) => [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
  const mirror = (R, P) => (R.chance(0.5) ? P.map(p => [160 - p[0], p[1]]) : P);
  /** 160×110 칸 안의 도형 (모눈 10 단위) */
  function makeShape(R, k) {
    const cx = 80, cy = 55;
    for (let t = 0; t < 400; t++) {
      let P;
      if (k === "square") { const s = R.pick([60, 70, 80]); P = box(cx, cy, s, s); }
      else if (k === "rect") { const w = R.pick([100, 110, 120]), h = R.pick([50, 60]); P = box(cx, cy, w, h); }
      else if (k === "rhomb") { const p = R.pick([30, 40, 50, 60]), q = R.pick([30, 40, 45]); if (p === q) continue; P = [[cx, cy - q], [cx + p, cy], [cx, cy + q], [cx - p, cy]]; }
      else if (k === "para") { const W = R.pick([80, 90, 100]), h = R.pick([50, 60]), s = R.pick([-30, -20, 20, 30]), bx = cx - W / 2 - s / 2; P = [[bx, cy + h / 2], [bx + W, cy + h / 2], [bx + W + s, cy - h / 2], [bx + s, cy - h / 2]]; }
      else if (k === "trap") { const W = R.pick([110, 120, 130]), T = R.pick([40, 50, 60]), off = R.pick([-20, -10, 0, 10, 20]), h = R.pick([60, 70]); P = [[cx - W / 2, cy + h / 2], [cx + W / 2, cy + h / 2], [cx + off + T / 2, cy - h / 2], [cx + off - T / 2, cy - h / 2]]; }
      else if (k === "rtrap") { const W = R.pick([100, 110, 120]), T = R.pick([50, 60, 70]), h = R.pick([60, 70]), x0 = cx - W / 2; P = mirror(R, [[x0, cy + h / 2], [x0 + W, cy + h / 2], [x0 + T, cy - h / 2], [x0, cy - h / 2]]); }
      else if (k === "irr") { P = [[25, 85], [140, 95], [115, 20], [55, 40]].map(p => [p[0] + R.int(-1, 1) * 10, p[1] + R.int(-1, 1) * 10]); P = mirror(R, P); }
      else if (k === "tri") { P = [[R.pick([20, 30]), 90], [R.pick([130, 140]), 90], [R.int(5, 11) * 10, R.pick([15, 20, 30])]]; }
      else if (k === "rtri") { const w = R.pick([90, 100, 110]), h = R.pick([60, 70]); P = mirror(R, [[30, 90], [30 + w, 90], [30, 90 - h]]); }
      else if (k === "hex") { const r = 48, a0 = R.pick([0, 30]); P = [0, 1, 2, 3, 4, 5].map(i => [cx + r * Math.cos(rad(a0 + 60 * i)), cy + r * Math.sin(rad(a0 + 60 * i))]); }
      else if (k === "pent") { const r = 48; P = [0, 1, 2, 3, 4].map(i => [cx + r * Math.cos(rad(-90 + 72 * i)), cy + 4 + r * Math.sin(rad(-90 + 72 * i))]); }
      const inf = shapeInfo(P);
      if (inf.minS < 0.12 || inf.minC < 0.12) continue;     // 거의 평행·거의 수직처럼 헷갈리는 모양은 버림
      if ((k === "irr" || k === "tri") && (inf.par || inf.perp || inf.minS < 0.3 || inf.minC < 0.2)) continue;   // 평행·수직처럼 보이지도 않게
      return P;
    }
    if (k === "irr") return [[25, 85], [140, 95], [115, 20], [55, 40]];
    if (k === "tri") return [[20, 90], [140, 90], [90, 20]];
    return makeShape(R, "rect");
  }

  // ---------- 개념 문장 (문항 파일 opts 에 문장 목록을 적음) ----------
  const FRIENDS = ["가온", "나래", "다온", "라희", "마루", "보미", "서진", "아라", "하람", "예솔"];
  /** 하나 골라 내기: opts.items = [문항, …] (보기 섞기는 shuffle:true) */
  G["pick"] = (R, o) => {
    const q = JSON.parse(JSON.stringify(R.pick(o.items)));
    if (q.shuffle && Array.isArray(q.options)) {
      const order = R.shuffle(q.options.map((_, i) => i)), remap = x => order.indexOf(x - 1) + 1;
      q.answer = Array.isArray(q.answer) ? q.answer.map(remap).sort((a, b) => a - b) : remap(q.answer);
      q.options = order.map(i => q.options[i]);
    }
    delete q.shuffle;
    return q;
  };
  /** OX: opts.t = 옳은 문장들, opts.f = [[틀린 문장, 까닭], …] */
  G["facts.ox"] = (R, o) => {
    if (R.chance(0.5)) return { type: "ox", text: R.pick(o.t), answer: "O" };
    const f = R.pick(o.f);
    return { type: "ox", text: f[0], answer: "X", explain: f[1] };
  };
  /** 잘못(바르게) 말한 친구 찾기 */
  G["facts.friends"] = (R, o) => {
    const right = R.chance(0.25), nm = R.shuffle(FRIENDS).slice(0, 4).sort();
    const odd = right ? R.pick(o.t) : R.pick(o.f), rest = right ? R.shuffle(o.f).slice(0, 3).map(x => x[0]) : R.shuffle(o.t).slice(0, 3);
    const oddText = right ? odd : odd[0], list = R.shuffle([oddText, ...rest]);
    return choice(right ? "바르게 말한 친구는 누구인가요?" : "잘못 말한 친구는 누구인가요?", list.map((s, i) => `${nm[i]}: ${s}`), list.indexOf(oddText) + 1, right ? {} : { explain: odd[1] });
  };
  /** 옳은 것 모두 고르기 */
  G["facts.multi"] = (R, o) => {
    const k = R.int(1, 3), ts = R.shuffle(o.t).slice(0, k), fs = R.shuffle(o.f).slice(0, 4 - k).map(x => x[0]);
    const list = R.shuffle([...ts, ...fs]);
    return { type: "choice", multi: true, text: o.title || "옳은 것을 모두 고르세요.", options: list, answer: list.map((s, i) => (ts.includes(s) ? i + 1 : 0)).filter(Boolean) };
  };

  // ---------- 수직·평행 ----------
  /** 네 그림 중 수직(평행)인 두 직선 고르기 */
  G["geo.whichPair"] = (R, o) => {
    const rel = o.rel || "perp";
    const perpFig = () => {
      const v = R.int(0, 2);
      if (v === 0) { const x = R.int(6, 10) * 10, y = R.int(4, 7) * 10; return sfig(ln(15, y, 145, y) + ln(x, 8, x, 102) + ra(x, y, 1, -1)); }
      if (v === 1) { const a = R.pick([30, 45, 60, 120, 135, 150]), u = [Math.cos(rad(a)), -Math.sin(rad(a))], w = [Math.cos(rad(a + 90)), -Math.sin(rad(a + 90))]; return sfig(seg(80, 55, a, 100) + seg(80, 55, a + 90, 100) + raR(80, 55, u, w)); }
      const x = R.int(4, 12) * 10; return sfig(ln(15, 90, 145, 90) + ln(x, 12, x, 90) + ra(x, 90, x > 80 ? -1 : 1, -1));
    };
    const parFig = () => {
      const a = R.pick([0, 0, 20, 30, 150, 160, 90]), g = R.pick([30, 36, 40]), nx = Math.sin(rad(a)) * g / 2, ny = Math.cos(rad(a)) * g / 2, L2 = a === 90 ? 90 : a % 180 === 0 ? 130 : 110;
      return sfig(seg(80 - nx, 55 - ny, a, L2) + seg(80 + nx, 55 + ny, a, L2));
    };
    const crossFig = () => { const a = R.pick([20, 30, 150, 160]), d = R.pick([45, 55, 60]); return sfig(seg(80, 55, a, 120) + seg(80, 55, a + d, 100)); };
    const meetFig = () => { const e1 = R.int(1, 2) * 10, e2 = R.int(1, 2) * 10, P = R.chance(0.5); const y1 = 25, y2 = 85; return sfig(P ? ln(15, y1, 145, y1 + e1) + ln(15, y2, 145, y2 - e2) : ln(15, y1 + e1, 145, y1) + ln(15, y2 - e2, 145, y2)); };
    const leanFig = () => { const x = R.int(6, 10) * 10, y = R.int(5, 7) * 10, a = R.pick([65, 70, 110, 115]); return sfig(ln(15, y, 145, y) + ln(x, y, x + 60 * Math.cos(rad(a)), y - 60 * Math.sin(rad(a)))); };
    const good = rel === "perp" ? perpFig() : parFig();
    const bad = rel === "perp" ? [crossFig(), parFig(), R.chance(0.5) ? meetFig() : leanFig()] : [crossFig(), perpFig(), meetFig()];
    const list = R.shuffle([good, ...bad]);
    return choice(rel === "perp" ? "두 직선이 서로 수직인 것을 고르세요." : "두 직선이 서로 평행한 것을 고르세요.", list.map(f => ({ figure: f })), list.indexOf(good) + 1);
  };
  /** 직선 가에 수직(평행)인 직선 모두 고르기 */
  G["geo.relLines"] = (R, o) => {
    const rel = o.rel || "perp", nm = ["나", "다", "라"];
    let good; do { good = [R.chance(0.5), R.chance(0.5), R.chance(0.5)]; } while (!good.some(Boolean) || good.every(Boolean));
    let draw = "";
    if (rel === "perp") {
      draw += ln(20, 120, 390, 120) + tx(380, 110, "가");
      [100, 200, 320].forEach((x, i) => {
        if (good[i]) draw += ln(x, 20, x, 200) + tx(x + 16, 32, nm[i]);
        else { const a = R.pick([64, 68, 72, 108, 112, 116]), dx = 90 / Math.tan(rad(a)); draw += ln(x - dx, 210, x + dx, 30) + tx(f1(x + dx + 16), 42, nm[i]); }
      });
      return { type: "choice", multi: true, text: "직선 가에 수직인 직선을 모두 고르세요.", options: nm.map(n => "직선 " + n), answer: good.map((g, i) => (g ? i + 1 : 0)).filter(Boolean), figure: { w: 400, h: 220, grid: 20, draw } };
    }
    draw += ln(40, 40, 390, 40) + tx(24, 46, "가");
    [90, 140, 190].forEach((y, i) => {
      if (good[i]) draw += ln(40, y, 390, y);
      else { const d = R.pick([-1, 1]) * R.pick([30, 34, 38]); draw += ln(40, y - d / 2, 390, y + d / 2); }
      draw += tx(24, y + 6, nm[i]);
    });
    return { type: "choice", multi: true, text: "직선 가와 평행한 직선을 모두 고르세요.", options: nm.map(n => "직선 " + n), answer: good.map((g, i) => (g ? i + 1 : 0)).filter(Boolean), figure: { w: 400, h: 220, grid: 20, draw } };
  };
  /** 도형에서 평행(수직)인 변 몇 쌍 */
  G["geo.sidePairs"] = (R, o) => {
    const rel = o.rel || "par", kinds = o.kinds || (rel === "par" ? ["trap", "rtrap", "para", "rect", "hex", "tri", "pent", "irr"] : ["rect", "square", "rtrap", "rtri", "para", "rhomb", "trap"]);
    const P = makeShape(R, R.pick(kinds)), inf = shapeInfo(P);
    return cnt(`도형에서 서로 ${rel === "par" ? "평행" : "수직"}인 변은 모두 몇 쌍인가요?`, rel === "par" ? inf.par : inf.perp, "쌍", { figure: bigfig(P) });
  };
  const PROP_POOL = {
    perp: ["rect", "square", "rtrap", "rtri", "para", "rhomb", "trap", "tri", "irr"],
    par: ["trap", "rtrap", "para", "rect", "tri", "irr", "hex", "pent", "rtri"],
    trap: ["trap", "rtrap", "para", "rect", "rhomb", "irr", "tri", "irr"],
    para: ["para", "rect", "rhomb", "square", "trap", "rtrap", "irr"],
    rhomb: ["rhomb", "rhomb", "square", "para", "rect", "trap", "irr"],
    rect: ["rect", "square", "para", "rhomb", "trap", "rtrap"],
    square: ["square", "rect", "rhomb", "para", "trap"],
  };
  const KNAME2 = { trap: "사다리꼴", para: "평행사변형", rhomb: "마름모", rect: "직사각형", square: "정사각형" };
  /** 성질에 맞는 도형 모두 고르기 (보기가 그림) */
  G["geo.pickShapes"] = (R, o) => {
    const prop = o.prop || "trap", n = o.n || 4, has = P => { const f = shapeInfo(P); return prop === "perp" ? f.perp > 0 : prop === "par" ? f.par > 0 : f.kinds.includes(prop); };
    for (let t = 0; t < 100; t++) {
      const Ps = Array.from({ length: n }, () => makeShape(R, R.pick(PROP_POOL[prop])));
      const ans = Ps.map((P, i) => (has(P) ? i + 1 : 0)).filter(Boolean);
      if (!ans.length || ans.length === n) continue;
      const opts = Ps.map(P => ({ figure: sfig(poly(P)) }));
      if (new Set(opts.map(x => x.figure.draw)).size < n) continue;
      const text = prop === "perp" ? "서로 수직인 변이 있는 도형을 모두 고르세요." : prop === "par" ? "서로 평행한 변이 있는 도형을 모두 고르세요." : `${KNAME2[prop]}을(를) 모두 고르세요.`;
      return { type: "choice", multi: true, text, options: opts, answer: ans };
    }
  };
  /** 직사각형(평행사변형)에서 한 변과 수직(평행)인 변 고르기 */
  G["geo.rectSides"] = (R, o) => {
    const rel = o.rel || "perp", isPara = rel === "par" && R.chance(0.5);
    const w = R.int(8, 11) * 20, h = R.int(4, 6) * 20, s = isPara ? R.pick([-40, 40]) : 0, x0 = 60 + Math.max(0, -s), y0 = 30;
    const P = [[x0 + s, y0], [x0, y0 + h], [x0 + w, y0 + h], [x0 + w + s, y0]];   // ㄱ ㄴ ㄷ ㄹ
    const sides = ["ㄱㄴ", "ㄴㄷ", "ㄷㄹ", "ㄱㄹ"], k = R.int(0, 3);
    const others = R.shuffle([0, 1, 2, 3].filter(i => i !== k)), ok = i => (rel === "perp" ? (i - k + 4) % 4 !== 2 : (i - k + 4) % 4 === 2);
    const name = isPara ? "평행사변형" : "직사각형";
    return { type: "choice", multi: true, text: `${name} ㄱㄴㄷㄹ에서 변 ${sides[k]}에 ${rel === "perp" ? "수직" : "평행"}인 변을 모두 고르세요.`,
      options: others.map(i => "변 " + sides[i]), answer: others.map((i, j) => (ok(i) ? j + 1 : 0)).filter(Boolean),
      figure: { w: Math.max(...P.map(p => p[0])) + 60, h: y0 + h + 40, draw: poly(P) + vlab(P, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]) } };
  };
  /** 수선 n개를 그었을 때 생기는 직각의 수 */
  G["geo.perpRight"] = R => {
    const n = R.int(1, 3), xs = R.shuffle([80, 140, 200, 260, 320]).slice(0, n).sort((a, b) => a - b);
    let draw = ln(20, 100, 390, 100) + tx(380, 90, "가");
    xs.forEach(x => (draw += ln(x, 15, x, 185) + ra(x, 100, 1, -1)));
    return cnt(`직선 가에 대한 수선을 ${n}개 그었습니다.\n직선끼리 만나서 생긴 직각은 모두 몇 개인가요?`, 4 * n, "개", { figure: { w: 400, h: 200, draw }, explain: "수선 하나가 직선 가와 만나는 곳마다 직각이 4개씩 생겨요." });
  };

  // ---------- 평행선 사이의 거리 ----------
  G["geo.whichDist"] = R => {
    const y1 = 40, y2 = y1 + R.int(4, 6) * 20, pos = R.int(0, 2), xs = [80, 200, 320], lab = ["㉠", "㉡", "㉢"];
    let draw = ln(20, y1, 390, y1) + tx(16, y1 - 10, "가") + ln(20, y2, 390, y2) + tx(16, y2 + 22, "나");
    xs.forEach((x, i) => {
      if (i === pos) draw += ln(x, y1, x, y2) + ra(x, y2, 1, -1);
      else { const dx = R.pick([-1, 1]) * R.int(3, 6) * 10; draw += ln(x - dx / 2, y1, x + dx / 2, y2); }
      draw += tx(x + 22, f1((y1 + y2) / 2 + 6), lab[i], 18);
    });
    const text = R.chance(0.5) ? "직선 가와 직선 나는 서로 평행합니다.\n평행선 사이의 거리를 나타내는 선분을 고르세요." : "직선 가와 직선 나는 서로 평행합니다.\n평행선 사이에 그은 선분 중 길이가 가장 짧은 것을 고르세요.";
    return choice(text, lab.map(l => ({ label: l })), pos + 1, { figure: { w: 400, h: y2 + 34, draw } });
  };

  // ---------- 사다리꼴·평행사변형 꼭짓점 찍기 ----------
  G["geo.pointPick"] = (R, o) => {
    const kind = o.kind || R.pick(["trap", "para"]), g = 20;
    for (let t = 0; t < 300; t++) {
      const ay = R.int(7, 8), ax = R.int(1, 4), bx = ax + R.int(5, 8), h = R.int(3, 5), C = [bx + R.int(-3, 2), ay - h], A = [ax, ay], B = [bx, ay];
      if (C[0] > 14 || C[0] <= ax + 1) continue;
      const PP = [A[0] + C[0] - B[0], C[1]];
      let D;
      if (kind === "para") D = PP;
      else { const xs = []; for (let x = 1; x < C[0] - 1; x++) if (x !== PP[0]) xs.push(x); if (!xs.length) continue; D = [R.pick(xs), C[1]]; }
      if (D[0] < 1 || D[0] > 14) continue;
      const cand = [];
      for (let x = Math.max(1, D[0] - 4); x <= Math.min(14, D[0] + 4); x++) for (let y = Math.max(1, D[1] - 3); y < ay; y++) {
        const p = [x, y];
        if (Math.hypot(x - D[0], y - D[1]) < 2 || Math.hypot(x - C[0], y - C[1]) < 2) continue;
        if (y === C[1]) continue;                                                           // 윗변이 아랫변과 평행해지는 자리 제외
        if ((x - A[0]) * (C[1] - B[1]) - (y - A[1]) * (C[0] - B[0]) === 0) continue;         // 변 ㄱㄹ이 변 ㄴㄷ과 평행해지는 자리 제외
        if (x >= Math.min(B[0], C[0]) && x <= Math.max(B[0], C[0]) && (x - B[0]) * (C[1] - B[1]) - (y - B[1]) * (C[0] - B[0]) === 0) continue;
        cand.push(p);
      }
      const pick = [];
      for (const p of R.shuffle(cand)) { if (pick.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2)) pick.push(p); if (pick.length === 3) break; }
      if (pick.length < 3) continue;
      const pts = R.shuffle([D, ...pick]), lab = ["①", "②", "③", "④"];
      let draw = ln(A[0] * g, A[1] * g, B[0] * g, B[1] * g) + ln(B[0] * g, B[1] * g, C[0] * g, C[1] * g);
      pts.forEach((p, i) => (draw += dotc(p[0] * g, p[1] * g) + tx(p[0] * g + 14, p[1] * g - 8, lab[i], 17)));
      return choice(`두 선분을 이용하여 ${kind === "para" ? "평행사변형" : "사다리꼴"}을 그리려고 합니다.\n나머지 한 꼭짓점을 어느 점에 찍어야 하나요?`, lab.map(l => ({ label: l })), pts.indexOf(D) + 1,
        { figure: { w: 300, h: 190, grid: 20, draw }, explain: kind === "para" ? "마주 보는 두 쌍의 변이 모두 평행해지는 점을 찾아요." : "주어진 선분과 평행한 변이 생기는 점을 찾아요." });
    }
  };
  /** 종이띠를 잘라 생긴 사다리꼴·평행사변형 세기 */
  G["geo.trapCut"] = (R, o) => {
    for (let t = 0; t < 200; t++) {
      const n = R.int(3, 5), span = 360 / (n + 1), cuts = [];
      for (let i = 1; i <= n; i++) cuts.push([20 * Math.round((20 + span * i) / 20) + R.pick([-20, 0, 20]), R.pick([-40, 0, 0, 40])]);
      const B = [[20, 0], ...cuts, [380, 0]];
      let ok = true;
      for (let i = 0; i < B.length - 1; i++) if (B[i + 1][0] - B[i][0] < 40 || B[i + 1][0] + B[i + 1][1] - (B[i][0] + B[i][1]) < 40) ok = false;
      if (!ok) continue;
      let par = 0; for (let i = 0; i < B.length - 1; i++) if (B[i][1] === B[i + 1][1]) par++;
      const ask = o.ask || (R.chance(0.6) ? "para" : "trap");
      if (ask === "para" && par === 0 && R.chance(0.7)) continue;
      let draw = poly([[20, 40], [380, 40], [380, 120], [20, 120]]);
      cuts.forEach(([b, d]) => (draw += ln(b, 120, b + d, 40)));
      return ask === "para"
        ? cnt("직사각형 모양의 종이띠를 선을 따라 잘랐습니다.\n잘라 낸 도형 중 평행사변형은 모두 몇 개인가요?", par, "개", { figure: { w: 400, h: 160, grid: 20, draw }, explain: "위아래 변뿐 아니라 양옆의 두 변도 서로 평행한 조각만 평행사변형이에요." })
        : cnt("직사각형 모양의 종이띠를 선을 따라 잘랐습니다.\n잘라 낸 도형 중 사다리꼴은 모두 몇 개인가요?", n + 1, "개", { figure: { w: 400, h: 160, grid: 20, draw }, explain: "종이띠의 위아래 변이 평행해서 잘라 낸 사각형이 모두 사다리꼴이에요." });
    }
  };
  G["geo.trapPerim"] = R => {
    const a = R.int(9, 16), b = R.int(3, a - 4), c = R.int(4, 9), W = 260, T = (W * b) / a, x0 = 50, y0 = 150, yt = 50;
    const P = [[x0, y0], [x0 + W, y0], [x0 + W / 2 + T / 2, yt], [x0 + W / 2 - T / 2, yt]];
    const base = poly(P) + tx(x0 + W / 2, y0 + 26, `${a} cm`, 16) + tx(x0 + W / 2, yt - 10, `${b} cm`, 16);
    const legL = tx(f1((P[0][0] + P[3][0]) / 2 - 34), (y0 + yt) / 2 + 6, `${c} cm`, 16), legR = tx(f1((P[1][0] + P[2][0]) / 2 + 34), (y0 + yt) / 2 + 6, `${c} cm`, 16);
    if (R.chance(0.4)) return cnt(`두 옆변의 길이가 같은 사다리꼴입니다.\n네 변의 길이의 합이 ${a + b + 2 * c} cm일 때, 한 옆변은 몇 cm인가요?`, c, "cm", { figure: { w: 360, h: 190, draw: base } });
    return cnt("사다리꼴의 네 변의 길이의 합은 몇 cm인가요?", a + b + 2 * c, "cm", { figure: { w: 360, h: 190, draw: base + legL + legR } });
  };
  /** 사다리꼴이 아닌 까닭 */
  G["geo.whyNot"] = R => {
    const P = makeShape(R, "irr");
    const opts = R.shuffle(["평행한 변이 없기 때문에", "네 변의 길이가 다르기 때문에", "직각이 없기 때문에", "꼭짓점이 4개이기 때문에"]);
    return choice("다음 도형이 사다리꼴이 아닌 까닭은 무엇인가요?", opts, opts.indexOf("평행한 변이 없기 때문에") + 1, { figure: bigfig(P) });
  };

  // ---------- 마름모 ----------
  G["geo.rhombDiag"] = R => {
    const a = notRight(R, 60, 120), g = rhomb(a), P = g.P, ang = R.pick(["ㄱㅇㄴ", "ㄴㅇㄷ", "ㄷㅇㄹ", "ㄱㅇㄹ"]);
    const draw = g.shape + ln(P[0][0], P[0][1], P[2][0], P[2][1]) + ln(P[1][0], P[1][1], P[3][0], P[3][1]) + tx(f1(g.cx + 14), f1(g.cy + 22), "ㅇ", 17);
    return cnt(`마름모의 마주 보는 꼭짓점끼리 이었습니다.\n각 ${ang}은 몇 도인가요?`, 90, "°", { figure: { w: g.w, h: g.h, draw }, explain: "마름모의 마주 보는 꼭짓점끼리 이은 두 선분은 서로 수직으로 만나요." });
  };
  G["geo.rhombTris"] = R => {
    const fig = { w: 300, h: 150, draw: poly([[40, 130], [160, 130], [100, 26]]) + poly([[160, 130], [220, 26], [100, 26]]) };
    if (R.chance(0.3)) {
      const opts = R.shuffle(["직사각형", "마름모", "정사각형", "삼각형"]);
      return choice("크기가 같은 정삼각형 2개를 겹치지 않게 이어 붙이면\n어떤 사각형이 되나요?", opts, opts.indexOf("마름모") + 1, { figure: fig });
    }
    const s = R.int(3, 12);
    fig.draw += tx(48, 74, `${s} cm`, 16);
    return cnt(`한 변이 ${s} cm인 정삼각형 2개를 이어 붙여 마름모를 만들었습니다.\n마름모의 네 변의 길이의 합은 몇 cm인가요?`, 4 * s, "cm", { figure: fig });
  };

  // ---------- 여러 가지 사각형 ----------
  const INC = { trap: ["trap"], para: ["para", "trap"], rect: ["rect", "para", "trap"], rhomb: ["rhomb", "para", "trap"], square: ["square", "rect", "rhomb", "para", "trap"] };
  const WHY = { para: "평행한 변이 한 쌍뿐인 사다리꼴도 있어요.", rhomb: "네 변의 길이가 모두 같지 않을 수 있어요.", rect: "네 각이 모두 직각이 아닐 수 있어요.", square: "네 변의 길이가 모두 같고 네 각이 모두 직각이어야 정사각형이에요." };
  /** ○○은(는) △△이라고 할 수 있습니다 (OX). opts.with: 꼭 들어갈 사각형 */
  G["geo.inclusion"] = (R, o) => {
    const ks = Object.keys(INC), T = [], F = [];
    ks.forEach(a => ks.forEach(b => { if (a === b || (o.with && a !== o.with && b !== o.with)) return; (INC[a].includes(b) ? T : F).push([a, b]); }));
    const yes = F.length === 0 || (T.length && R.chance(0.5)), [a, b] = R.pick(yes ? T : F);
    return { type: "ox", text: `${KNAME2[a]}은(는) ${rLa(KNAME2[b])} 할 수 있습니다.`, answer: yes ? "O" : "X", explain: yes ? `${KNAME2[a]}은(는) ${KNAME2[b]}의 성질을 모두 가지고 있어요.` : WHY[b] };
  };
  /** 그림 속 사각형을 부를 수 있는 이름 모두 */
  G["geo.namesOf"] = R => {
    const P = makeShape(R, R.pick(["square", "rect", "rhomb", "para", "trap", "rtrap"])), inf = shapeInfo(P), keys = ["trap", "para", "rhomb", "rect", "square"];
    return { type: "choice", multi: true, text: "이 사각형을 부를 수 있는 이름을 모두 고르세요.", options: keys.map(k => KNAME2[k]), answer: keys.map((k, i) => (inf.kinds.includes(k) ? i + 1 : 0)).filter(Boolean), figure: bigfig(P) };
  };
  const PROPS = [
    ["마주 보는 한 쌍 이상의 변이 서로 평행합니다.", ["trap", "para", "rect", "rhomb", "square"]],
    ["두 쌍의 마주 보는 변이 서로 평행합니다.", ["para", "rect", "rhomb", "square"]],
    ["마주 보는 두 변의 길이가 같습니다.", ["para", "rect", "rhomb", "square"]],
    ["마주 보는 두 각의 크기가 같습니다.", ["para", "rect", "rhomb", "square"]],
    ["네 변의 길이가 모두 같습니다.", ["rhomb", "square"]],
    ["네 각이 모두 직각입니다.", ["rect", "square"]],
    ["이웃한 두 각의 크기의 합이 180°입니다.", ["para", "rect", "rhomb", "square"]],
    ["마주 보는 꼭짓점끼리 이은 두 선분이 서로 수직으로 만납니다.", ["rhomb", "square"]],
    ["네 각의 크기의 합이 360°입니다.", ["trap", "para", "rect", "rhomb", "square"]],
    ["평행한 변이 한 쌍도 없습니다.", []],
    ["네 각이 모두 둔각입니다.", []],
  ];
  G["geo.propsOf"] = (R, o) => {
    const k = o.kind || R.pick(["trap", "para", "rect", "rhomb", "square"]);
    for (let t = 0; t < 100; t++) {
      const list = R.shuffle(PROPS).slice(0, 4), ans = list.map((p, i) => (p[1].includes(k) ? i + 1 : 0)).filter(Boolean);
      if (!ans.length || ans.length === 4) continue;
      return { type: "choice", multi: true, text: `${KNAME2[k]}에 대한 설명으로 항상 옳은 것을 모두 고르세요.`, options: list.map(p => p[0]), answer: ans };
    }
  };
  // =====================================================================
  // 1단원 분수의 덧셈과 뺄셈 (분모가 같은 분수)
  // 분수는 '분모가 den인 분자 수(가분수 분자)'로 계산: 2와 3/5 → num 13, den 5
  // 문제 글의 {2 3/5} 는 화면에서 위아래로 쌓인 분수가 됨
  // =====================================================================
  const fm = (num, den) => { const w = Math.floor(num / den), r = num % den; return r ? (w ? `{${w} ${r}/${den}}` : `{${r}/${den}}`) : String(w); };
  const fimp = (num, den) => `{${num}/${den}}`;
  const fa = (num, den) => { const w = Math.floor(num / den), r = num % den; return r ? (w ? `${w} ${r}/${den}` : `${r}/${den}`) : String(w); };
  const frq = (text, num, den, extra) => Object.assign({ type: "frac", text, answer: fa(num, den) }, extra || {});
  const FR_EXPLAIN = {
    "+proper": "분모는 그대로 두고 분자끼리 더해요.",
    "+mixed": "자연수끼리, 분수끼리 더해요. 분수끼리 더한 값이 가분수이면 대분수로 바꿔요.",
    "-proper": "분모는 그대로 두고 분자끼리 빼요.",
    "-one": "1을 분모가 같은 가분수로 바꾼 뒤 분자끼리 빼요.",
    "-whole": "자연수에서 1만큼을 가분수로 바꾼 뒤 빼요.",
    "-mixed": "자연수끼리, 분수끼리 빼요. 분수끼리 뺄 수 없으면 자연수에서 1을 받아내려 가분수로 바꿔요.",
  };
  /** 두 수 만들기. opts: op "+"|"-", kind proper|mixed|one|whole, carry(덧셈 받아올림), borrow(뺄셈 받아내림), dmax */
  function frPair(R, o) {
    const op = o.op || "+", kind = o.kind || "proper";
    for (let t = 0; t < 400; t++) {
      const n = R.int(o.dmin || 3, o.dmax || (kind === "proper" ? 12 : 9));
      let A, B;
      if (kind === "proper") { A = R.int(1, n - 1); B = R.int(1, n - 1); }
      else if (kind === "mixed") { A = R.int(1, 6) * n + R.int(1, n - 1); B = R.int(1, 5) * n + R.int(1, n - 1); }
      else if (kind === "one") { A = n; B = R.int(1, n - 1); }
      else if (kind === "whole") { const W = R.int(2, 7); A = W * n; B = R.chance(0.35) ? R.int(1, n - 1) : R.int(1, W - 1) * n + R.int(1, n - 1); }
      if (op === "+") {
        const c = (A % n) + (B % n) >= n;
        if (o.carry === true && !c) continue;
        if (o.carry === false && c) continue;
        return [A, B, n];
      }
      if (A === B) continue;
      if (A < B) { if (kind === "proper" || kind === "mixed") [A, B] = [B, A]; else continue; }
      if (kind === "mixed") {
        if (Math.floor(B / n) < 1) continue;
        const borrow = A % n < B % n;
        if (o.borrow === true && !borrow) continue;
        if (o.borrow === false && borrow) continue;
        if (borrow && Math.floor(A / n) <= Math.floor(B / n)) continue;
      }
      return [A, B, n];
    }
    return [3, 1, 5];
  }
  const frRes = (A, B, op) => (op === "+" ? A + B : A - B);
  const frExpr = (A, B, n, op) => `${fm(A, n)} ${op === "+" ? "+" : "−"} ${fm(B, n)}`;

  G["fr.calc"] = (R, o) => {
    const op = o.op || "+", [A, B, n] = frPair(R, o);
    return frq(`${frExpr(A, B, n, op)}을(를) 계산해 보세요.`, frRes(A, B, op), n, { explain: FR_EXPLAIN[op + (o.kind || "proper")] });
  };
  /** 단위분수 세기 */
  G["fr.unit"] = (R, o) => {
    const n = R.int(3, 12), mode = o.mode || R.pick(["count", "make"]);
    if (mode === "whole") { const W = R.int(1, 5); return cnt(`${W}은(는) {1/${n}}이(가) 몇 개인가요?`, W * n, "개"); }
    if (mode === "mixedcount") { const w = R.int(1, 4), a = R.int(1, n - 1); return cnt(`${fm(w * n + a, n)}은(는) {1/${n}}이(가) 몇 개인가요?`, w * n + a, "개"); }
    if (mode === "count") { const a = R.int(2, n - 1); return cnt(`${fm(a, n)}은(는) {1/${n}}이(가) 몇 개인가요?`, a, "개"); }
    const k = R.int(2, 2 * n - 1);
    return frq(`{1/${n}}이(가) ${k}개인 수를 분수로 나타내어 보세요.`, k, n);
  };
  /** 가분수 ↔ 대분수 */
  G["fr.convert"] = (R, o) => {
    const n = R.int(2, 9), w = R.int(1, 5), a = R.int(1, n - 1), N = w * n + a, to = o.to || R.pick(["mixed", "improper"]);
    return to === "mixed"
      ? frq(`${fimp(N, n)}을(를) 대분수로 나타내어 보세요.`, N, n, { form: "mixed" })
      : Object.assign(frq(`${fm(N, n)}을(를) 가분수로 나타내어 보세요.`, N, n, { form: "improper" }), { answer: `${N}/${n}` });
  };
  /** 그림 보고 계산 */
  function fbar(n, cells, x0, y0, W) {
    const cw = W / n; let s = "";
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      s += `<rect x="${f1(x0 + i * cw)}" y="${y0}" width="${f1(cw)}" height="44" style="fill:${c === 1 ? "#FFD36B" : c === 2 ? "#8CC1F0" : "#fff"};stroke:#1D2A44;stroke-width:2.5"/>`;
      if (c === 3) s += `<rect x="${f1(x0 + i * cw)}" y="${y0}" width="${f1(cw)}" height="44" style="fill:#FFD36B;stroke:#1D2A44;stroke-width:2.5"/>` + ln(x0 + i * cw + 6, y0 + 6, x0 + (i + 1) * cw - 6, y0 + 38, "stroke:#D9482B;stroke-width:3") + ln(x0 + (i + 1) * cw - 6, y0 + 6, x0 + i * cw + 6, y0 + 38, "stroke:#D9482B;stroke-width:3");
    }
    return s;
  }
  G["fr.pic"] = (R, o) => {
    const op = o.op || "+", n = R.int(4, 10);
    if (op === "+") {
      const a = R.int(1, n - 1), b = R.int(1, n - 1), cells = [];
      for (let i = 0; i < 2 * n; i++) cells.push(i < a ? 1 : i < a + b ? 2 : 0);
      const two = a + b > n;
      let draw = fbar(n, cells.slice(0, n), 20, 20, 360) + (two ? fbar(n, cells.slice(n), 20, 80, 360) : "");
      return frq(`그림을 보고 계산해 보세요.\n${fm(a, n)} + ${fm(b, n)} = [ ]`, a + b, n, { figure: { w: 400, h: two ? 140 : 84, draw }, explain: `{1/${n}}이(가) ${a}개와 ${b}개이면 모두 ${a + b}개예요.` });
    }
    const a = R.int(2, n - 1), b = R.int(1, a - 1), cells = [];
    for (let i = 0; i < n; i++) cells.push(i < a - b ? 1 : i < a ? 3 : 0);
    return frq(`그림을 보고 계산해 보세요.\n${fm(a, n)} − ${fm(b, n)} = [ ]`, a - b, n, { figure: { w: 400, h: 84, draw: fbar(n, cells, 20, 20, 360) }, explain: `{1/${n}}이(가) ${a}개에서 ${b}개를 빼면 ${a - b}개예요.` });
  };
  /** 문장제 */
  const FR_ADD = [
    ["예솔이는 반죽을 만드는 데 물 X컵을 사용했고, 나중에 Y컵을 더 사용했습니다.\n사용한 물은 모두 몇 컵인가요?", "컵"],
    ["빨간 리본 X m와 파란 리본 Y m가 있습니다.\n리본은 모두 몇 m인가요?", "m"],
    ["집에서 문구점까지는 X km, 문구점에서 학교까지는 Y km입니다.\n집에서 문구점을 지나 학교까지는 몇 km인가요?", "km"],
    ["주스를 어제 X L, 오늘 Y L 마셨습니다.\n이틀 동안 마신 주스는 모두 몇 L인가요?", "L"],
    ["감자를 X kg, 고구마를 Y kg 캤습니다.\n캔 감자와 고구마는 모두 몇 kg인가요?", "kg"],
    ["오전에 X시간, 오후에 Y시간 동안 책을 읽었습니다.\n책을 읽은 시간은 모두 몇 시간인가요?", "시간"],
  ];
  const FR_SUB = [
    ["리본 X m 중에서 Y m를 사용했습니다.\n남은 리본은 몇 m인가요?", "m"],
    ["우유가 X L 있었는데 Y L를 마셨습니다.\n남은 우유는 몇 L인가요?", "L"],
    ["노란 끈은 X m, 초록 끈은 Y m입니다.\n노란 끈은 초록 끈보다 몇 m 더 긴가요?", "m"],
    ["밀가루 X kg 중에서 빵을 만드는 데 Y kg를 사용했습니다.\n남은 밀가루는 몇 kg인가요?", "kg"],
    ["학교까지의 거리는 X km입니다. 지금까지 Y km를 걸었다면\n남은 거리는 몇 km인가요?", "km"],
    ["물통에 물이 X L 들어 있었습니다. 화분에 Y L를 주었다면\n물통에 남은 물은 몇 L인가요?", "L"],
  ];
  G["fr.word"] = (R, o) => {
    const op = o.op || "+", [A, B, n] = frPair(R, o), [t, u] = R.pick(op === "+" ? FR_ADD : FR_SUB);
    return frq(t.replace("X", fm(A, n)).replace("Y", fm(B, n)), frRes(A, B, op), n, { unit: u, explain: `식: ${frExpr(A, B, n, op)} = ${fm(frRes(A, B, op), n)}` });
  };
  /** □ 구하기 */
  G["fr.blank"] = (R, o) => {
    const op = o.op || "+", [A, B, n] = frPair(R, o), C = frRes(A, B, op);
    if (op === "+") return R.chance(0.5)
      ? frq(`□ 안에 알맞은 수를 구해 보세요.\n□ + ${fm(B, n)} = ${fm(C, n)}`, A, n, { explain: `□ = ${fm(C, n)} − ${fm(B, n)}` })
      : frq(`□ 안에 알맞은 수를 구해 보세요.\n${fm(A, n)} + □ = ${fm(C, n)}`, B, n, { explain: `□ = ${fm(C, n)} − ${fm(A, n)}` });
    return R.chance(0.5)
      ? frq(`□ 안에 알맞은 수를 구해 보세요.\n${fm(A, n)} − □ = ${fm(C, n)}`, B, n, { explain: `□ = ${fm(A, n)} − ${fm(C, n)}` })
      : frq(`□ 안에 알맞은 수를 구해 보세요.\n□ − ${fm(B, n)} = ${fm(C, n)}`, A, n, { explain: `□ = ${fm(C, n)} + ${fm(B, n)}` });
  };
  /** 계산이 맞았는지 OX (자주 하는 실수) */
  G["fr.mistake"] = (R, o) => {
    const kind = o.kind || "add", good = R.chance(0.5);
    let A, B, n, op, wrong, why;
    if (kind === "add") { [A, B, n] = frPair(R, { op: "+", kind: "proper" }); op = "+"; wrong = `{${A + B}/${2 * n}}`; why = "분모끼리는 더하지 않아요. 분모는 그대로 두고 분자끼리 더해요."; }
    else if (kind === "addMixed") { [A, B, n] = frPair(R, { op: "+", kind: "mixed", carry: true }); op = "+"; const r = A + B; wrong = fm(r - n, n); why = "분수끼리 더한 값이 1보다 크면 자연수 부분에 1을 더해야 해요."; }
    else if (kind === "borrow") { [A, B, n] = frPair(R, { op: "-", kind: "mixed", borrow: true }); op = "-"; const w = Math.floor(A / n) - Math.floor(B / n), r = (B % n) - (A % n); wrong = w ? `{${w} ${r}/${n}}` : `{${r}/${n}}`; why = "분자끼리 뺄 수 없을 때는 큰 분자에서 작은 분자를 빼면 안 돼요. 자연수에서 1을 받아내려 계산해요."; }
    else { [A, B, n] = frPair(R, { op: "-", kind: "whole" }); op = "-"; const w = Math.floor(A / n) - Math.floor(B / n), r = B % n; wrong = `{${w} ${r}/${n}}`; why = "자연수에서 1을 가분수로 바꾼 뒤 빼야 해요."; }
    const right = fm(frRes(A, B, op), n);
    if (wrong.replace(/[{}]/g, "") === right.replace(/[{}]/g, "")) return G["fr.mistake"](R, o);
    return { type: "ox", text: `계산이 맞으면 O, 틀리면 X를 고르세요.\n${frExpr(A, B, n, op)} = ${good ? right : wrong}`, answer: good ? "O" : "X", explain: good ? "바르게 계산했어요." : `${why} 바른 답은 ${right}예요.` };
  };
  /** 계산 결과가 가장 큰(작은) 식 */
  G["fr.best"] = (R, o) => {
    const op = o.op || "+", big = R.chance(0.5), n = R.int(4, 9);
    for (let t = 0; t < 100; t++) {
      const ps = [0, 1, 2].map(() => { const p = frPair(R, Object.assign({}, o, { dmin: n, dmax: n })); return p; });
      const rs = ps.map(([A, B]) => frRes(A, B, op)), tgt = big ? Math.max(...rs) : Math.min(...rs);
      if (rs.filter(x => x === tgt).length !== 1) continue;
      const opts = ps.map(([A, B]) => frExpr(A, B, n, op));
      if (new Set(opts).size < 3) continue;
      return choice(`계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`, opts, rs.indexOf(tgt) + 1, { explain: ps.map(([A, B], i) => `${opts[i]} = ${fm(rs[i], n)}`).join(", ") });
    }
    return G["fr.calc"](R, o);
  };
  /** 계산 결과와 분수 크기 비교 */
  G["fr.cmp"] = (R, o) => {
    const op = o.op || "+", [A, B, n] = frPair(R, o), C = frRes(A, B, op);
    const Y = R.chance(0.25) ? C : Math.max(1, C + R.pick([-2, -1, 1, 2]));
    return choice(`계산 결과를 비교하여 ○ 안에 알맞은 것을 고르세요.\n${frExpr(A, B, n, op)} ○ ${fm(Y, n)}`, CMP, C > Y ? 1 : C < Y ? 2 : 3, { explain: `${frExpr(A, B, n, op)} = ${fm(C, n)}` });
  };
  G["fr.sum3"] = R => {
    const n = R.int(5, 12), xs = [0, 1, 2].map(() => R.int(1, n - 1));
    return frq(`${xs.map(x => fm(x, n)).join(" + ")}을(를) 계산해 보세요.`, xs.reduce((a, b) => a + b, 0), n);
  };
  /** 가장 큰 수와 가장 작은 수의 차 */
  G["fr.diffext"] = R => {
    const n = R.int(3, 9), s = new Set();
    while (s.size < 3) s.add(R.int(1, 5) * n + R.int(1, n - 1));
    const v = [...s];
    return frq(`${v.map(x => fm(x, n)).join(", ")} 중에서\n가장 큰 수와 가장 작은 수의 차를 구해 보세요.`, Math.max(...v) - Math.min(...v), n);
  };
  /** 수 카드로 만든 대분수의 합·차 */
  G["fr.cards"] = (R, o) => {
    const n = R.int(5, 9), ds = R.distinct(3, 1, n - 1).sort((a, b) => a - b), big = R.chance(0.5);
    // 분모가 n이고 수 카드 3장 중 2장으로 만든 대분수(자연수·분자)
    const pairs = []; ds.forEach(a => ds.forEach(b => { if (a !== b) pairs.push(a * n + b); }));
    const target = big ? Math.max(...pairs) : Math.min(...pairs);
    return frq(`수 카드 ${R.shuffle(ds).join(", ")} 중 2장을 골라 분모가 ${n}인 대분수를 만들려고 합니다.\n만들 수 있는 가장 ${big ? "큰" : "작은"} 대분수에 {1 1/${n}}을(를) 더하면 얼마인가요?`, target + n + 1, n, { explain: `가장 ${big ? "큰" : "작은"} 대분수는 ${fm(target, n)}이에요.` });
  };
  /** 문항 틀 → 실제 문항 (같은 씨앗이면 항상 같은 문제) */
  L.instantiate = (t, seed) => {
    if (t && !t.gen && t.shuffle && Array.isArray(t.options)) {      // 고정 문항: 보기 순서만 섞기
      const R = makeRng(seed + "|shuffle"), order = R.shuffle(t.options.map((_, i) => i));
      const remap = x => order.indexOf(x - 1) + 1;
      const answer = Array.isArray(t.answer) ? t.answer.map(remap).sort((p, q) => p - q) : remap(t.answer);
      return Object.assign({}, t, { options: order.map(i => t.options[i]), answer });
    }
    if (!t || !t.gen) return t;
    const g = L.GENS[t.gen];
    if (!g) return { type: "ox", text: `(문제 틀 '${t.gen}'을 찾을 수 없어요)`, answer: "O" };
    const q = g(makeRng(seed + "|" + t.gen + "|" + JSON.stringify(t.opts || {})), t.opts || {});
    q.text = fixJosa(q.text);
    if (q.explain) q.explain = fixJosa(q.explain);
    return Object.assign({}, q, t.points != null ? { points: t.points } : {}, { _gen: t.gen });
  };
})();
