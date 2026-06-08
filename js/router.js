// ============================================================
//  router.js — view switching + render dispatch
// ============================================================
import { dayLabel, todayKey } from "./utils.js";

let routes = {};
let current = "today";

export function registerRoutes(r) { routes = r; }
export function currentView() { return current; }

export function navigate(view) {
  current = view;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = document.getElementById("view-" + view);
  if (el) el.classList.add("active");
  document.querySelectorAll("nav.tabs button").forEach(b =>
    b.classList.toggle("on", b.getAttribute("data-nav") === view));
  const bd = document.getElementById("barDate");
  if (bd) bd.textContent = dayLabel(todayKey());
  window.scrollTo(0, 0);
  if (routes[view]) routes[view]();
}
