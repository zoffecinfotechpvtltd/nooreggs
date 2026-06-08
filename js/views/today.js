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
  renderCollectionSplit(st);

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

function renderCollectionSplit(st) {
  const card = document.getElementById("collectSplitCard");
  if (!card) return;
  const { cash, gpay, got } = st;
  if (got <= 0) { card.style.display = "none"; return; }
  card.style.display = "";
  document.getElementById("splitDonut").innerHTML = collectionDonut(cash, gpay);
  document.getElementById("splitCash").textContent = rupee(cash);
  document.getElementById("splitGpay").textContent = rupee(gpay);
  const cashPct = Math.round((cash / got) * 100);
  document.getElementById("splitCashPct").textContent = cashPct + "%";
  document.getElementById("splitGpayPct").textContent = (100 - cashPct) + "%";
}

function collectionDonut(cash, gpay) {
  const total = cash + gpay;
  const R = 30, cx = 44, cy = 44, sw = 13;
  const C = +(2 * Math.PI * R).toFixed(2);
  if (total <= 0) {
    return `<svg width="88" height="88" viewBox="0 0 88 88"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="${sw}" opacity=".5"/></svg>`;
  }
  const cashLen = +((cash / total) * C).toFixed(2);
  const gpayLen = +((gpay / total) * C).toFixed(2);
  let cashArc = "", gpayArc = "";
  if (cash > 0 && gpay === 0) {
    cashArc = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#34A853" stroke-width="${sw}"/>`;
  } else if (gpay > 0 && cash === 0) {
    gpayArc = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#4285F4" stroke-width="${sw}"/>`;
  } else {
    cashArc = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#34A853" stroke-width="${sw}" stroke-dasharray="${cashLen} ${C}" stroke-dashoffset="0"/>`;
    gpayArc = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#4285F4" stroke-width="${sw}" stroke-dasharray="${gpayLen} ${C}" stroke-dashoffset="${+(C - cashLen).toFixed(2)}"/>`;
  }
  return `<svg width="88" height="88" viewBox="0 0 88 88" style="transform:rotate(-90deg)">${cashArc}${gpayArc}</svg>`;
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
