// ============================================================
//  views/customers.js — add / edit / delete customers
// ============================================================
import { state } from "../state.js";
import { uid, esc } from "../utils.js";
import { openM, closeM, toast, confirmDo } from "../ui.js";
import { saveCustomer as saveCustomerDoc, deleteCustomerDoc } from "../backend.js";
import { renderSheet } from "./sheet.js";
import { renderToday } from "./today.js";
import { renderDues } from "./dues.js";

let editId = null;

export function openCustomer(id) {
  editId = id || null;
  const c = id ? state.customers.find(x => x.id === id) : null;
  document.getElementById("custTitle").textContent = id ? "Edit Customer" : "Add Customer";
  document.getElementById("cName").value = c ? c.name : "";
  document.getElementById("cPhone").value = c ? (c.phone || "") : "";
  document.getElementById("cDefault").checked = !!(c && c.isDefault);
  openM("mCust");
  setTimeout(() => document.getElementById("cName").focus(), 250);
}

export function saveCustomer() {
  const name = document.getElementById("cName").value.trim();
  const phone = document.getElementById("cPhone").value.trim();
  const isDefault = document.getElementById("cDefault").checked;
  if (!name) { toast("Enter a name"); return; }
  if (editId) {
    const c = state.customers.find(x => x.id === editId);
    c.name = name; c.phone = phone; c.isDefault = isDefault; saveCustomerDoc(c);
  } else {
    const nc = { id: uid(), name, phone, order: state.customers.length, isDefault };
    state.customers.push(nc); saveCustomerDoc(nc);
  }
  closeM("mCust");
  renderSheet(); renderToday();
  toast("Customer saved");
}

export function delCustomer(id) {
  const c = state.customers.find(x => x.id === id);
  if (!c) return;
  confirmDo("Delete " + c.name + "?",
    "Removes them from the sheet. Past day records remain but stop counting for this name.",
    "Delete", () => {
      state.customers = state.customers.filter(x => x.id !== id);
      deleteCustomerDoc(id);
      renderSheet(); renderToday(); renderDues();
      toast("Customer deleted");
    });
}
