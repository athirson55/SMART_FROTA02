import { api } from "./api.js";
export const getMaintenances     = (p)    => api.get("/manutencoes",         { params: p });
export const getMaintenanceStats = ()     => api.get("/manutencoes/stats");
export const getMaintenance      = (id)   => api.get(`/manutencoes/${id}`);
export const createMaintenance   = (d)    => api.post("/manutencoes",         d);
export const updateMaintenance   = (id,d) => api.patch(`/manutencoes/${id}`,  d);
export const deleteMaintenance   = (id)   => api.delete(`/manutencoes/${id}`);
