// ============================================================
//  views/more.js — account, rates, backup
// ============================================================
import { state } from "../state.js";
import { ensureDay } from "../calc.js";
import { todayKey, pad2, initials } from "../utils.js";
import { toast, confirmDo } from "../ui.js";
import { saveSettings, saveDay, pushAll, deleteAllUserData } from "../backend.js";

export function renderMore() {
  document.getElementById("mAv").textContent = initials("Danish Shaikh");
  document.getElementById("mEmail").textContent = "Danish Shaikh";
  document.getElementById("mMode").textContent = "Proprietor of Noor Eggs · local device storage";
  document.getElementById("setBuy").value = state.settings.buyRate || "";
  document.getElementById("setSell").value = state.settings.sellRate || "";
}

export function saveSettingsRates(afterSave) {
  const b = parseFloat(document.getElementById("setBuy").value);
  const s = parseFloat(document.getElementById("setSell").value);
  if (isNaN(b) || b < 0 || isNaN(s) || s < 0) { toast("Enter valid rates"); return; }
  state.settings.buyRate = b;
  state.settings.sellRate = s;
  saveSettings();
  // always apply to today — "old days keep their own rates" means past days, not today
  const k = todayKey();
  const d = ensureDay(k); d.buyRate = b; d.sellRate = s; saveDay(k);
  toast("Rates saved");
  if (afterSave) afterSave();
}

export function exportData() {
  const data = JSON.stringify({ settings: state.settings, customers: state.customers, days: state.days }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const d = new Date();
  a.href = url;
  a.download = `noor-eggs-backup-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Backup downloaded");
}

export function importData(ev, afterRestore) {
  const file = ev.target.files[0];
  if (!file) return;
  confirmDo("Restore backup?", "This REPLACES your current customers and days with the file’s data.", "Restore", () => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        state.settings = d.settings || { buyRate: 0, sellRate: 0 };
        state.customers = d.customers || [];
        state.days = d.days || {};
        pushAll();
        toast("Data restored");
        if (afterRestore) afterRestore();
      } catch { toast("Could not read file"); }
    };
    r.readAsText(file);
  });
  ev.target.value = "";
}

export function clearAllData(afterClear) {
  confirmDo("Delete all data?", "This removes all customers, daily sheets, records, dues, and rates from this device.", "Delete All", async () => {
    try {
      state.settings = { buyRate: 0, sellRate: 0 };
      state.customers = [];
      state.days = {};
      await deleteAllUserData();
      document.getElementById("setBuy").value = "";
      document.getElementById("setSell").value = "";
      if (afterClear) afterClear();
      toast("Data deleted");
    } catch (e) {
      console.error(e);
      toast("Could not delete data");
    }
  });
}
