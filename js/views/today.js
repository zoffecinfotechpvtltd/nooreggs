// ============================================================
//  views/today.js — dashboard
// ============================================================
import { state } from "../state.js";
import { dayStats, outstanding, totalDues } from "../calc.js";
import { rupee, todayKey, lastNKeys } from "../utils.js";
import { dueRow } from "./dues.js";

export function renderToday() {
  const k = todayKey(), st = dayStats(k);
  const pe = document.getElementById("hProfit");
  pe.textContent = rupee(st.profit);
  pe.className = "big " + (st.profit < 0 ? "neg" : "pos");
  document.getElementById("hSell").textContent = rupee(st.sell);
  document.getElementById("hBuy").textContent = rupee(st.buy);
  document.getElementById("hEggs").textContent = st.eggs.toLocaleString("en-IN");
  document.getElementById("hGot").textContent = rupee(st.got);
  document.getElementById("hPendDay").textContent = rupee(st.pend);
  document.getElementById("hDuesAll").textContent = rupee(totalDues());
  renderSpark();

  const bal = outstanding();
  const top = state.customers
    .map(c => ({ c, b: bal[c.id] || 0 }))
    .filter(x => x.b > 0)
    .sort((a, b) => b.b - a.b)
    .slice(0, 3);
  document.getElementById("todayDues").innerHTML = top.length
    ? top.map(x => dueRow(x.c, x.b, false)).join("")
    : `<div class="empty"><div class="big">✅</div>No pending payments. Everyone has paid!</div>`;
}

function renderSpark() {
  const keys = lastNKeys(7);
  const vals = keys.map(k => dayStats(k).profit);
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const rng = (max - min) || 1, W = 96, H = 36, n = vals.length;
  const pts = vals.map((v, i) => {
    const x = n < 2 ? W : (i / (n - 1)) * W;
    const y = H - 5 - ((v - min) / rng) * (H - 10);
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  document.getElementById("spark").innerHTML =
    `<path d="${d}" fill="none" stroke="#ffdf9c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.8" fill="#fff"/>`;
}
