// ============================================================
//  views/dues.js — who owes money + collect payments
// ============================================================
import { state } from "../state.js";
import { outstanding, ensureDay, paymentAmount } from "../calc.js";
import { rupee, esc, todayKey } from "../utils.js";
import { openM, closeM, toast } from "../ui.js";
import { saveDay } from "../backend.js";

export function dueRow(c, b, withCall = true) {
  const phone = c.phone ? `<div class="mt">📞 ${esc(c.phone)}</div>` : "";
  const call = withCall && c.phone
    ? `<a class="btn btn-ghost" href="tel:${esc(c.phone)}">📞 Call</a>` : "";
  return `<div class="lrow"><div class="lrow-top">
      <div><div class="nm">${esc(c.name)}</div>${phone}</div>
      <div style="text-align:right"><div class="amt">${rupee(b)}</div><div class="mt">pending</div></div>
    </div>
    <div class="acts"><button class="btn btn-mint" data-act="open-collect" data-id="${c.id}">💰 Collect</button>${call}</div></div>`;
}

export function renderDues() {
  const bal = outstanding();
  const list = state.customers
    .map(c => ({ c, b: bal[c.id] || 0 }))
    .filter(x => x.b > 0)
    .sort((a, b) => b.b - a.b);
  let total = 0; list.forEach(x => (total += x.b));
  document.getElementById("dTotal").textContent = rupee(total);
  document.getElementById("dCount").textContent = list.length;
  document.getElementById("duesList").innerHTML = list.length
    ? list.map(x => dueRow(x.c, x.b)).join("")
    : `<div class="empty"><div class="big">🎉</div>All clear! Nobody owes you money right now.</div>`;
}

let collectId = null;
export function openCollect(id) {
  collectId = id;
  const b = outstanding()[id] || 0;
  const c = state.customers.find(x => x.id === id);
  document.getElementById("colSub").textContent = "From " + (c ? c.name : "");
  document.getElementById("colBal").textContent = "Pending " + rupee(b > 0 ? b : 0);
  document.getElementById("colAmt").value = "";
  const cash = document.querySelector('input[name="collectMethod"][value="cash"]');
  if (cash) cash.checked = true;
  openM("mCollect");
}
export function collectFull() {
  const b = outstanding()[collectId] || 0;
  document.getElementById("colAmt").value = b > 0 ? Math.round(b) : 0;
}
export function saveCollect(afterSave) {
  const amt = parseFloat(document.getElementById("colAmt").value);
  if (isNaN(amt) || amt <= 0) { toast("Enter amount"); return; }
  const k = todayKey(), d = ensureDay(k);
  const methodInput = document.querySelector('input[name="collectMethod"]:checked');
  const method = methodInput ? methodInput.value : "cash";
  const previous = d.payments[collectId];
  const prevCash = previous && previous.cash != null ? (previous.cash || 0)
    : (previous && previous.method !== "gpay" ? paymentAmount(previous) : 0);
  const prevGpay = previous && previous.gpay != null ? (previous.gpay || 0)
    : (previous && previous.method === "gpay" ? paymentAmount(previous) : 0);
  d.payments[collectId] = {
    amount: paymentAmount(previous) + amt,
    cash: prevCash + (method === "cash" ? amt : 0),
    gpay: prevGpay + (method === "gpay" ? amt : 0)
  };
  saveDay(k);
  closeM("mCollect");
  renderDues();
  if (afterSave) afterSave();
  toast("Collected " + rupee(amt));
}
