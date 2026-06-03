import { api } from "./api.js";

/** Run full server-side reconciliation (fixes vehicle/driver status vs active routes). */
export const reconcile = () => api.post("/admin/reconciliar");
