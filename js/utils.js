// ============================================================
//  utils.js — pure helpers, no app state
// ============================================================
export const pad2 = n => (n < 10 ? "0" : "") + n;

export function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
export function keyToDate(k) {
  const p = k.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
}
export function rupee(n) {
  n = Math.round(n || 0);
  const neg = n < 0;
  n = Math.abs(n);
  return (neg ? "-₹" : "₹") + n.toLocaleString("en-IN");
}
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dayLabel(k) {
  const d = keyToDate(k);
  return WD[d.getDay()] + ", " + d.getDate() + " " + MO[d.getMonth()] + " " + d.getFullYear();
}
export function dayLabelShort(k) {
  const d = keyToDate(k);
  return d.getDate() + " " + MO[d.getMonth()];
}
export function weekday(k) { return WD[keyToDate(k).getDay()]; }

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function initials(s) {
  s = (s || "?").trim();
  return (s[0] || "?").toUpperCase();
}
export function lastNKeys(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()));
  }
  return arr;
}
