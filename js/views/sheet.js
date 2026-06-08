// ============================================================
//  views/sheet.js — the daily entry sheet
// ============================================================
import { state } from "../state.js";
import { deliveryStats, ensureDay, outstanding } from "../calc.js";
import { rupee, esc, todayKey, dayLabel } from "../utils.js";
import { openM, closeM, toast } from "../ui.js";
import { saveDay } from "../backend.js";

let saveTimer;

export function getSheetKey() {
  const el = document.getElementById("sheetDate");
  if (!el.value) el.value = todayKey();
  return el.value;
}
export function sheetToday() {
  document.getElementById("sheetDate").value = todayKey();
  renderSheet();
  toast("Today’s sheet");
}

export function renderSheet() {
  const k = getSheetKey(), d = ensureDay(k);
  document.getElementById("rcBuy").textContent = rupee(d.buyRate);
  document.getElementById("rcSell").textContent = rupee(d.sellRate);
  document.getElementById("rcMargin").textContent = rupee((d.sellRate || 0) - (d.buyRate || 0));

  const bal = outstanding();
  const list = document.getElementById("sheetList");
  const tot = document.getElementById("sheetTotals");

  if (state.customers.length === 0) {
    list.innerHTML = `<div class="empty"><div class="big">👥</div>No customers yet.<br>Tap “＋ Add New Customer” to begin.</div>`;
    tot.style.display = "none";
    return;
  }
  tot.style.display = "";
  const defaults = state.customers.filter(c => c.isDefault);
  const others = state.customers.filter(c => !c.isDefault);
  list.innerHTML =
    (defaults.length ? `<div class="quick-card"><div class="quick-title">Default customers<small>Select the daily customer, add quantity and received price.</small></div>${renderCustomerRows(defaults, d, bal)}</div>` : "") +
    (defaults.length && others.length ? `<div class="section-h compact"><h3>Other customers</h3></div>` : "") +
    renderCustomerRows(defaults.length ? others : state.customers, d, bal);

  state.customers.forEach(c => recalcRow(c.id));
  recalcTotals();
}

function renderCustomerRows(customers, d, bal) {
  return customers.map(c => {
    const e = d.deliveries[c.id] || {};
    const eggs = e.eggs != null ? e.eggs : "";
    const rec = e.received != null ? e.received : "";
    const method = e.paymentMethod || "cash";
    const b = bal[c.id] || 0;
    const tag = b > 0 ? `<span class="baltag due">${rupee(b)} owes</span>`
      : b < 0 ? `<span class="baltag adv">${rupee(-b)} adv</span>`
      : `<span class="baltag ok">clear</span>`;
    const has = (+e.eggs > 0 || +e.received > 0) ? " has" : "";
    return `<div class="srow${has}" id="sr_${c.id}">
      <div class="srow-head"><div class="srow-name">${esc(c.name)}</div>
        <div class="srow-tools">${tag}
          <button class="iconbtn" data-act="edit-customer" data-id="${c.id}">✎</button>
          <button class="iconbtn del" data-act="del-customer" data-id="${c.id}">🗑</button></div></div>
      <div class="srow-in">
        <div class="f"><label>🥚 Eggs</label><input type="number" inputmode="numeric" id="eg_${c.id}" value="${eggs}" placeholder="0" data-sheet="${c.id}"></div>
        <div class="f"><label>💰 Received ₹</label><input type="number" inputmode="numeric" id="rc_${c.id}" value="${rec}" placeholder="0" data-sheet="${c.id}"></div>
        <div class="f pay-field"><label>Payment</label>${paymentMethodControl(c.id, method)}</div>
      </div>
      <div class="srow-calc">
        <div class="c"><div class="k">Sale</div><div class="v" id="sl_${c.id}">₹0</div></div>
        <div class="c profit"><div class="k">Profit</div><div class="v" id="pf_${c.id}">₹0</div></div>
        <div class="c pend"><div class="k">Pending</div><div class="v" id="pd_${c.id}">₹0</div></div>
      </div></div>`;
  }).join("");
}

function rowRead(cid) {
  const eggs = parseFloat(document.getElementById("eg_" + cid).value) || 0;
  const rec = parseFloat(document.getElementById("rc_" + cid).value) || 0;
  const pm = document.querySelector(`input[name="pm_${cid}"]:checked`);
  return { eggs, received: rec, paymentMethod: pm ? pm.value : "cash" };
}

function paymentMethodControl(cid, method) {
  return `<div class="pay-method">
    <label><input type="radio" name="pm_${cid}" value="cash" data-pay-method="${cid}"${method === "cash" ? " checked" : ""}><span>Cash</span></label>
    <label><input type="radio" name="pm_${cid}" value="gpay" data-pay-method="${cid}"${method === "gpay" ? " checked" : ""}><span class="gpay-option"><span class="gpay-mark" aria-hidden="true"></span><span>GPay</span></span></label>
  </div>`;
}
function recalcRow(cid) {
  const d = ensureDay(getSheetKey()), v = rowRead(cid);
  const s = deliveryStats(v, d);
  const pend = s.pending;
  document.getElementById("sl_" + cid).textContent = rupee(s.sale);
  document.getElementById("pf_" + cid).textContent = rupee(s.profit);
  const pd = document.getElementById("pd_" + cid), pc = pd.parentNode;
  pd.textContent = pend > 0 ? rupee(pend) : (pend < 0 ? rupee(-pend) + " adv" : "₹0");
  pc.classList.toggle("zero", pend <= 0);
  document.getElementById("sr_" + cid).classList.toggle("has", v.eggs > 0 || v.received > 0);
}
function recalcTotals() {
  const d = ensureDay(getSheetKey());
  let eggs = 0, sale = 0, cost = 0, rec = 0;
  state.customers.forEach(c => {
    const s = deliveryStats(rowRead(c.id), d);
    eggs += s.eggs; sale += s.sale;
    cost += s.buy; rec += s.received;
  });
  const profit = sale - cost, pend = sale - rec;
  document.getElementById("sheetTotals").innerHTML = `
    <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-family:'DM Sans';font-weight:700;margin-bottom:13px">📋 Day Totals</h3>
    <div class="grid2">
      <div class="stat flat saffron"><div class="k">🥚 Eggs sold</div><div class="v">${eggs.toLocaleString("en-IN")}</div></div>
      <div class="stat flat"><div class="k">Selling total</div><div class="v">${rupee(sale)}</div></div>
      <div class="stat flat"><div class="k">Buying total</div><div class="v">${rupee(cost)}</div></div>
      <div class="stat flat mint"><div class="k">Profit today</div><div class="v">${rupee(profit)}</div></div>
      <div class="stat flat mint"><div class="k">Received</div><div class="v">${rupee(rec)}</div></div>
      <div class="stat flat clay"><div class="k">Pending today</div><div class="v">${rupee(pend)}</div></div>
    </div>`;
}

// called from delegated input handler
export function onSheetInput(cid) {
  const k = getSheetKey(), d = ensureDay(k), v = rowRead(cid);
  if (v.eggs <= 0 && v.received <= 0) delete d.deliveries[cid];
  else d.deliveries[cid] = { eggs: v.eggs, received: v.received, paymentMethod: v.paymentMethod };
  recalcRow(cid);
  recalcTotals();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDay(k), 500);
}
export function forceSaveSheet(afterSave) {
  const k = getSheetKey();
  saveDay(k).then(() => { toast("Sheet saved"); if (afterSave) afterSave(); });
}

// per-day rate editor
export function openRates() {
  const k = getSheetKey(), d = ensureDay(k);
  document.getElementById("ratesSub").textContent = "For " + dayLabel(k);
  document.getElementById("rBuy").value = d.buyRate || "";
  document.getElementById("rSell").value = d.sellRate || "";
  openM("mRates");
}
export function saveDayRates() {
  const k = getSheetKey(), d = ensureDay(k);
  d.buyRate = parseFloat(document.getElementById("rBuy").value) || 0;
  d.sellRate = parseFloat(document.getElementById("rSell").value) || 0;
  saveDay(k); closeM("mRates"); renderSheet(); toast("Rates updated");
}
