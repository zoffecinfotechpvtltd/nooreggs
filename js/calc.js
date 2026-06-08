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

// per-day numbers
export function dayStats(k) {
  const d = state.days[k];
  if (!d) return { eggs: 0, sell: 0, buy: 0, profit: 0, got: 0, pend: 0 };
  let eggs = 0, recv = 0, pay = 0;
  for (const cid in (d.deliveries || {})) {
    eggs += +d.deliveries[cid].eggs || 0;
    recv += +d.deliveries[cid].received || 0;
  }
  for (const cid in (d.payments || {})) pay += paymentAmount(d.payments[cid]);
  const sell = (eggs / 100) * (d.sellRate || 0);
  const buy = (eggs / 100) * (d.buyRate || 0);
  return { eggs, sell, buy, profit: sell - buy, got: recv + pay, pend: sell - recv };
}

// cumulative balance per customer across ALL days
// positive = owes you, negative = advance/credit
export function outstanding() {
  const bal = {};
  state.customers.forEach(c => (bal[c.id] = 0));
  for (const k in state.days) {
    const d = state.days[k];
    for (const cid in (d.deliveries || {})) {
      const e = d.deliveries[cid];
      const sale = (+e.eggs || 0) / 100 * (d.sellRate || 0);
      bal[cid] = (bal[cid] || 0) + sale - (+e.received || 0);
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
