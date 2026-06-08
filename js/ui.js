// ============================================================
//  ui.js — toast, modals, confirm dialog
// ============================================================
let toastT;
export function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 1900);
}

export function openM(id) { document.getElementById(id).classList.add("show"); }
export function closeM(id) { document.getElementById(id).classList.remove("show"); }

export function confirmDo(title, msg, yes, cb) {
  document.getElementById("cfTitle").textContent = title;
  document.getElementById("cfMsg").textContent = msg;
  const b = document.getElementById("cfYes");
  b.textContent = yes || "Yes";
  const fresh = b.cloneNode(true);          // clear old listeners
  b.parentNode.replaceChild(fresh, b);
  fresh.addEventListener("click", () => { closeM("mConfirm"); cb(); });
  openM("mConfirm");
}

// close modal when tapping the dim background
export function wireModalBackgrounds() {
  document.querySelectorAll(".mbg").forEach(m =>
    m.addEventListener("click", e => { if (e.target === m) m.classList.remove("show"); }));
}
