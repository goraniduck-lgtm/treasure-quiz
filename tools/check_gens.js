// 문제 틀 검사: node tools/check_gens.js
// 틀마다 2000번 만들어 보고 정답·보기·글자를 확인하고, 계산식은 따로 다시 계산해 맞춰 본다.
const fs = require("fs"), path = require("path");
global.window = global;
const root = path.join(__dirname, "..");
new Function(fs.readFileSync(path.join(root, "common.js"), "utf8"))();
new Function(fs.readFileSync(path.join(root, "generators.js"), "utf8"))();
const L = global.LQ;
const milli = s => { const [i, f = ""] = String(s).split("."); return Number(i) * 1000 + Number((f + "000").slice(0, 3)); };
let bad = 0;
const files = fs.readdirSync(path.join(root, "quizzes")).filter(f => f.endsWith(".js"));
for (const f of files) {
  const Q = new Function(fs.readFileSync(path.join(root, "quizzes", f), "utf8") + ";return QUIZ")();
  Q.questions.forEach((t, i) => {
    if (!t.gen) return;
    const seen = new Set();
    for (let k = 0; k < 2000; k++) {
      let q; const where = `${f} #${i + 1} ${t.gen} seed${k}`;
      try { q = L.instantiate(t, "s" + k); } catch (e) { console.log("ERROR", where, e.message); bad++; break; }
      const txt = JSON.stringify(q);
      if (/undefined|NaN|Infinity|null/.test(txt)) { console.log("BAD TEXT", where, q.text); bad++; break; }
      seen.add(q.text + JSON.stringify(q.figure || "") + JSON.stringify(q.options || ""));
      if (q.type === "number") {
        if (!(q.answer >= 0) || !Number.isFinite(q.answer)) { console.log("BAD ANSWER", where, q.answer); bad++; break; }
        if ((String(q.answer).split(".")[1] || "").length > 3) { console.log("TOO MANY DECIMALS", where, q.answer); bad++; break; }
        const m = q.text.match(/^([\d.]+) ([+-]) ([\d.]+)[을를] 계산/);
        if (m) { const r = m[2] === "+" ? milli(m[1]) + milli(m[3]) : milli(m[1]) - milli(m[3]); if (milli(q.answer) !== r) { console.log("WRONG", where, q.text, q.answer); bad++; break; } }
        const s3 = q.text.match(/^([\d.]+) \+ ([\d.]+) \+ ([\d.]+)[을를] /);
        if (s3 && milli(q.answer) !== milli(s3[1]) + milli(s3[2]) + milli(s3[3])) { console.log("WRONG SUM3", where); bad++; break; }
      }
      if (q.type === "choice") {
        const a = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (a.some(x => x < 1 || x > q.options.length)) { console.log("BAD CHOICE", where); bad++; break; }
        if (new Set(q.options.map(o => typeof o === "string" ? o : JSON.stringify(o))).size !== q.options.length) { console.log("DUP OPTIONS", where, q.options); bad++; break; }
        const bm = q.text.match(/가장 (큰|작은) 것을/);
        if (bm && t.gen === "dec.best") {
          const rs = q.options.map(o => { const p = o.split(" "); return p[1] === "+" ? milli(p[0]) + milli(p[2]) : milli(p[0]) - milli(p[2]); });
          const tgt = bm[1] === "큰" ? Math.max(...rs) : Math.min(...rs);
          if (rs[q.answer - 1] !== tgt || rs.filter(x => x === tgt).length !== 1) { console.log("WRONG BEST", where); bad++; break; }
        }
        const cm = q.text.match(/\n([\d.]+) \[ \] ([\d.]+)$/);
        if (cm) { const x = milli(cm[1]), y = milli(cm[2]); if ((x > y ? 1 : x < y ? 2 : 3) !== q.answer) { console.log("WRONG CMP", where); bad++; break; } }
      }
      if (q.type === "short" && !(Array.isArray(q.answer) && q.answer.length)) { console.log("BAD SHORT", where); bad++; break; }
    }
    if (seen.size < 15) console.log(`  적은 변형: ${f} #${i + 1} ${t.gen} → ${seen.size}가지`);
  });
}
console.log(bad ? `문제 ${bad}건` : "모든 문제 틀 통과");
process.exit(bad ? 1 : 0);
