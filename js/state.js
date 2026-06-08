// ============================================================
//  state.js — single shared in-memory store
//  (mutate fields, never reassign the exported object)
// ============================================================
export const state = {
  settings: { buyRate: 0, sellRate: 0 },
  customers: [],   // [{id, name, phone, order}]
  days: {}         // { "YYYY-MM-DD": { buyRate, sellRate, deliveries:{cid:{eggs,received,paymentMethod}}, payments:{cid:{amount,method}} } }
};

export const session = {
  cloud: false,
  user: { email: "Danish Shaikh", uid: "local" }
};
