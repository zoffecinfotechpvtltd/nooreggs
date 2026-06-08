// ============================================================
//  backend.js - local-only data layer
// ============================================================
import { state, session } from "./state.js";
import { uid } from "./utils.js";

const LOCAL_KEY = "noor_data_local";

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function legacyData() {
  const last = localStorage.getItem("noor_session");
  return last ? readJson("noor_data_" + last) : null;
}

function snapshot() {
  return {
    settings: state.settings,
    customers: state.customers,
    days: state.days
  };
}

function persistLocal() {
  writeJson(LOCAL_KEY, snapshot());
}

// ---------- init ----------
export async function initBackend() {
  session.cloud = false;
  session.user = { email: "Danish Shaikh", uid: "local" };
}

// ---------- load everything ----------
export async function loadAll() {
  const data = readJson(LOCAL_KEY) || legacyData() || {
    settings: { buyRate: 0, sellRate: 0 },
    customers: [],
    days: {}
  };

  state.settings = data.settings || { buyRate: 0, sellRate: 0 };
  state.customers = data.customers || [];
  state.days = data.days || {};
  persistLocal();
}

// ---------- writes ----------
export function saveSettings() {
  persistLocal();
  return Promise.resolve();
}

export function saveCustomer() {
  persistLocal();
  return Promise.resolve();
}

export function deleteCustomerDoc() {
  persistLocal();
  return Promise.resolve();
}

export function saveDay() {
  persistLocal();
  return Promise.resolve();
}

export function deleteDayDoc(k) {
  delete state.days[k];
  persistLocal();
  return Promise.resolve();
}

export async function deleteAllUserData() {
  state.settings = { buyRate: 0, sellRate: 0 };
  state.customers = [];
  state.days = {};
  persistLocal();
}

export async function pushAll() {
  persistLocal();
}

export { uid };
