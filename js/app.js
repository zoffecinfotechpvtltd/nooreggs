// ============================================================
//  app.js - entry point: boot, routing, events
// ============================================================
import { session } from "./state.js";
import { initBackend, loadAll } from "./backend.js";
import { initials, dayLabel, todayKey } from "./utils.js";
import { wireModalBackgrounds, closeM } from "./ui.js";
import { registerRoutes, navigate } from "./router.js";

import { renderToday } from "./views/today.js";
import { renderSheet, sheetToday, onSheetInput, forceSaveSheet, openRates, saveDayRates } from "./views/sheet.js";
import { renderDues, openCollect, collectFull, saveCollect } from "./views/dues.js";
import { renderRecords, setRecRange, setRecDate, clearRecDate, deleteRecordDay } from "./views/records.js";
import { renderMore, saveSettingsRates, exportData, importData, clearAllData } from "./views/more.js";
import { openCustomer, saveCustomer, delCustomer } from "./views/customers.js";

// ---------- routes ----------
registerRoutes({ today: renderToday, sheet: onEnterSheet, dues: renderDues, records: renderRecords, more: renderMore });
function onEnterSheet() {
  const sd = document.getElementById("sheetDate");
  if (!sd.value) sd.value = todayKey();
  renderSheet();
}

function refreshSyncedViews() {
  renderToday();
  renderDues();
  renderRecords();
  renderMore();
  const sd = document.getElementById("sheetDate");
  if (sd && sd.value) renderSheet();
}

async function startApp() {
  document.getElementById("screen-loading").style.display = "flex";
  try {
    await loadAll();
    document.getElementById("screen-loading").style.display = "none";
    document.getElementById("app").classList.add("show");
    document.getElementById("uAvatar").textContent = initials(session.user.email);
    document.getElementById("barDate").textContent = dayLabel(todayKey());
    navigate("today");
  } catch (e) {
    console.error(e);
    document.getElementById("screen-loading").style.display = "none";
    alert("Could not load your local data. Try refreshing the page.");
  }
}

// ---------- delegated events ----------
function wireEvents() {
  wireModalBackgrounds();

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-nav],[data-act],[data-close],[data-range]");
    if (!t) return;
    const nav = t.getAttribute("data-nav");
    if (nav) { navigate(nav); return; }
    const close = t.getAttribute("data-close");
    if (close) { closeM(close); return; }
    const range = t.getAttribute("data-range");
    if (range != null) { setRecRange(parseInt(range, 10)); return; }

    const act = t.getAttribute("data-act");
    const id = t.getAttribute("data-id");
    switch (act) {
      case "open-customer": openCustomer(null); break;
      case "edit-customer": openCustomer(id); break;
      case "del-customer": delCustomer(id); break;
      case "save-customer": saveCustomer(); break;
      case "sheet-today": sheetToday(); break;
      case "open-rates": openRates(); break;
      case "save-day-rates": saveDayRates(); break;
      case "force-save-sheet": forceSaveSheet(() => renderToday()); break;
      case "clear-rec-date": clearRecDate(); break;
      case "delete-day": deleteRecordDay(id, refreshSyncedViews); break;
      case "open-collect": openCollect(id); break;
      case "collect-full": collectFull(); break;
      case "save-collect": saveCollect(() => { renderToday(); }); break;
      case "save-settings": saveSettingsRates(() => renderToday()); break;
      case "delete-all-data": clearAllData(refreshSyncedViews); break;
      case "export": exportData(); break;
      case "import": document.getElementById("impFile").click(); break;
    }
  });

  document.addEventListener("input", e => {
    const cid = e.target.getAttribute && e.target.getAttribute("data-sheet");
    if (cid) onSheetInput(cid);
  });

  document.addEventListener("change", e => {
    const cid = e.target.getAttribute && e.target.getAttribute("data-pay-method");
    if (cid) onSheetInput(cid);
  });

  document.getElementById("sheetDate").addEventListener("change", () => renderSheet());
  document.getElementById("recDate").addEventListener("change", e => setRecDate(e.target.value));
  document.getElementById("impFile").addEventListener("change", ev => importData(ev, () => navigate("today")));
}

// ---------- boot ----------
(async function boot() {
  wireEvents();
  await initBackend();
  await startApp();
})();
