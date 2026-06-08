// ============================================================
//  calc.js — the finance logic (pure, reads shared state)
// ============================================================
import { state } from "./state.js";

export function blankDay() {
  return {
    buyRate: state.settings.buyRate || 0,
    sellRate: state.settings.sellRate || 0,
    deliveries: {},
    payments: {}
  };
}

// returns the day object, creating + normalising it if needed
export function ensureDay(k) {
  if (!state.days[k]) state.days[k] = blankDay();
  const d = state.days[k];
  if (!d.deliveries) d.deliveries = {};
  if (!d.payments) d.payments = {};
  if (d.buyRate == null) d.buyRate = state.settings.buyRate || 0;
  if (d.sellRate == null) d.sellRate = state.settings.sellRate || 0;
  return d;
}

export function deliveryStats(entry, day) {
  const eggs = +(entry && entry.eggs) || 0;
  const received = +(entry && entry.received) || 0;
  const sellRate = +(day && day.sellRate) || 0;
  const buyRate = +(day && day.buyRate) || 0;
  const sale = eggs / 100 * sellRate;
  const buy = eggs / 100 * buyRate;
  return {
    eggs,
    received,
    sale,
    buy,
    profit: sale - buy,
    pending: sale - received
  };
}

// per-day numbers
export function dayStats(k) {
  const d = state.days[k];
  if (!d) return { eggs: 0, sell: 0, buy: 0, profit: 0, got: 0, pend: 0, cash: 0, gpay: 0 };
  let eggs = 0, sell = 0, buy = 0, recv = 0, pay = 0, cash = 0, gpay = 0;
  for (const cid in (d.deliveries || {})) {
    const s = deliveryStats(d.deliveries[cid], d);
    const entry = d.deliveries[cid];
    eggs += s.eggs;
    sell += s.sale;
    buy += s.buy;
    recv += s.received;
    if (entry.paymentMethod === "gpay") gpay += s.received;
    else cash += s.received;
  }
  for (const cid in (d.payments || {})) {
    const p = d.payments[cid];
    const amt = paymentAmount(p);
    pay += amt;
    if (p && typeof p === "object" && p.method === "gpay") gpay += amt;
    else cash += amt;
  }
  return { eggs, sell, buy, profit: sell - buy, got: recv + pay, pend: sell - recv, cash, gpay };
}

// cumulative balance per customer across ALL days
// positive = owes you, negative = advance/credit
export function outstanding() {
  const bal = {};
  state.customers.forEach(c => (bal[c.id] = 0));
  for (const k in state.days) {
    const d = state.days[k];
    for (const cid in (d.deliveries || {})) {
      const s = deliveryStats(d.deliveries[cid], d);
      bal[cid] = (bal[cid] || 0) + s.pending;
    }
    for (const cid in (d.payments || {})) {
      bal[cid] = (bal[cid] || 0) - paymentAmount(d.payments[cid]);
    }
  }
  return bal;
}

export function totalDues() {
  const bal = outstanding();
  let t = 0;
  for (const c in bal) if (bal[c] > 0) t += bal[c];
  return t;
}

export function paymentAmount(payment) {
  if (typeof payment === "number") return payment || 0;
  if (payment && typeof payment === "object") return +payment.amount || 0;
  return +payment || 0;
}
