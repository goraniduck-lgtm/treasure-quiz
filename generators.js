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
  const fixJosa = t => t.replace(/([0-9가-힣])('?)(을\(를\)|은\(는\)|이\(가\)|와\(과\)|이에요)/g, (m, ch, q, p) => ch + q + PAIRS[p][hasB(ch) ? 0 : 1]);
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
