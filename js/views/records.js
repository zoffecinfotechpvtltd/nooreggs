// ============================================================
//  views/records.js - daily history and date-wise inspection
// ============================================================
import { state } from "../state.js";
import { dayStats, deliveryStats, paymentAmount } from "../calc.js";
import { rupee, dayLabelShort, weekday, dayLabel, esc } from "../utils.js";
import { deleteDayDoc } from "../backend.js";
import { toast, confirmDo } from "../ui.js";

let range = 10;
let pickedDate = "";

export function setRecRange(n) {
  range = n;
  pickedDate = "";
  const dateEl = document.getElementById("recDate");
  if (dateEl) dateEl.value = "";
  syncRangePills();
  renderRecords();
}

export function setRecDate(k) {
  pickedDate = k || "";
  syncRangePills();
  renderRecords();
}

export function clearRecDate() {
  pickedDate = "";
  const dateEl = document.getElementById("recDate");
  if (dateEl) dateEl.value = "";
  syncRangePills();
  renderRecords();
}

function syncRangePills() {
  document.getElementById("fp10").classList.toggle("on", !pickedDate && range === 10);
  document.getElementById("fp30").classList.toggle("on", !pickedDate && range === 30);
  document.getElementById("fpAll").classList.toggle("on", !pickedDate && range === 0);
}

export function renderRecords() {
  syncRangePills();
  let keys = Object.keys(state.days)
    .filter(k => { const s = dayStats(k); return s.eggs > 0 || s.got > 0; })
    .sort().reverse();

  const dateMode = !!pickedDate;
  if (dateMode) keys = keys.filter(k => k === pickedDate);
  else if (range > 0) keys = keys.slice(0, range);

  let eggs = 0, profit = 0, got = 0, sell = 0;
  keys.forEach(k => {
    const s = dayStats(k);
    eggs += s.eggs;
    profit += s.profit;
    got += s.got;
    sell += s.sell;
  });

  const sm = document.getElementById("recSummary");
  if (keys.length) {
    sm.style.display = "";
    sm.innerHTML = `
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-family:'DM Sans';font-weight:700;margin-bottom:13px">Summary · ${dateMode ? dayLabel(pickedDate) : (range ? "last " + keys.length + " days" : "all " + keys.length + " days")}</h3>
      <div class="grid2">
        <div class="stat flat saffron"><div class="k">Eggs sold</div><div class="v">${eggs.toLocaleString("en-IN")}</div></div>
        <div class="stat flat"><div class="k">Selling total</div><div class="v">${rupee(sell)}</div></div>
        <div class="stat flat mint"><div class="k">Total profit</div><div class="v">${rupee(profit)}</div></div>
        <div class="stat flat mint"><div class="k">Total collected</div><div class="v">${rupee(got)}</div></div>
      </div>`;
  } else sm.style.display = "none";

  const box = document.getElementById("recList");
  if (!keys.length) {
    box.innerHTML = `<div class="empty"><div class="big">Records</div>${dateMode ? "No data for this date." : "No records yet."}<br>${dateMode ? "Choose another date or fill that day's sheet." : "Fill the sheet to start your history."}</div>`;
    return;
  }

  box.innerHTML = keys.map(k => {
    const s = dayStats(k);
    return `<div class="daycard">
      <div class="dh"><div class="dt">${dayLabelShort(k)}<small>${weekday(k)} · ${s.eggs.toLocaleString("en-IN")} eggs</small></div>
        <div class="pf"><b class="${s.profit < 0 ? "neg" : ""}">${rupee(s.profit)}</b><small>profit</small></div></div>
      <div class="figs">
        <div class="fg sell"><div class="k">Selling</div><div class="v">${rupee(s.sell)}</div></div>
        <div class="fg"><div class="k">Buying</div><div class="v">${rupee(s.buy)}</div></div>
        <div class="fg got"><div class="k">Got</div><div class="v">${rupee(s.got)}</div></div>
      </div>
      <div class="figs" style="margin-top:7px"><div class="fg ${s.pend > 0 ? "pend" : "got"}" style="grid-column:1/-1"><div class="k">Pending generated this day</div><div class="v">${s.pend > 0 ? rupee(s.pend) : "₹0"}</div></div></div>
      ${dateMode ? recordCustomerRows(k) : ""}
      <button class="btn btn-clay btn-sm day-delete" data-act="delete-day" data-id="${k}">Delete this day</button>
    </div>`;
  }).join("");
}

export function deleteRecordDay(k, afterDelete) {
  if (!k || !state.days[k]) { toast("Day not found"); return; }
  confirmDo("Delete " + dayLabel(k) + "?", "This removes that day's sheet, payments, profit, and pending history from this device.", "Delete Day", async () => {
    try {
      await deleteDayDoc(k);
      if (pickedDate === k) {
        pickedDate = "";
        const dateEl = document.getElementById("recDate");
        if (dateEl) dateEl.value = "";
      }
      renderRecords();
      if (afterDelete) afterDelete();
      toast("Day deleted");
    } catch (e) {
      console.error(e);
      toast("Could not delete the day");
    }
  });
}

function recordCustomerRows(k) {
  const d = state.days[k] || {};
  const rows = [];
  for (const cid in (d.deliveries || {})) {
    const e = d.deliveries[cid] || {};
    const s = deliveryStats(e, d);
    if (s.eggs <= 0 && s.received <= 0) continue;
    const c = state.customers.find(x => x.id === cid);
    const extraPay = paymentAmount((d.payments || {})[cid]);
    rows.push({ name: c ? c.name : "Old customer", eggs: s.eggs, sale: s.sale, rec: s.received + extraPay, pending: s.pending - extraPay, method: e.paymentMethod || "" });
  }
  for (const cid in (d.payments || {})) {
    const pay = d.payments[cid];
    const amt = paymentAmount(pay);
    if (amt <= 0 || (d.deliveries || {})[cid]) continue;
    const c = state.customers.find(x => x.id === cid);
    rows.push({ name: c ? c.name : "Old customer", eggs: 0, sale: 0, rec: amt, pending: -amt, method: pay && pay.method ? pay.method : "" });
  }
  if (!rows.length) return "";
  return `<div class="rec-breakdown"><div class="rb-title">Customer details</div>${rows.map(r => `
    <div class="rb-row">
      <div><b>${esc(r.name)}</b><small>${r.eggs.toLocaleString("en-IN")} eggs${r.method ? " · " + paymentLabel(r.method) : ""}</small></div>
      <div><span>${rupee(r.sale)}</span><small>sale</small></div>
      <div><span>${rupee(r.rec)}</span><small>got</small></div>
      <div><span class="${r.pending > 0 ? "neg" : ""}">${r.pending < 0 ? rupee(-r.pending) + " adv" : rupee(r.pending)}</span><small>pending</small></div>
    </div>`).join("")}</div>`;
}

function paymentLabel(method) {
  return method === "gpay" ? "GPay" : "Cash";
}
