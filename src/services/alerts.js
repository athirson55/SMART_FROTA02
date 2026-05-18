import { api } from "./api.js";
export const getAlerts           = (p)    => api.get("/alertas",              { params: p });
export const getAlert            = (id)   => api.get(`/alertas/${id}`);
export const createAlert         = (d)    => api.post("/alertas",              d);
export const updateAlert         = (id,d) => api.patch(`/alertas/${id}`,       d);
export const resolveAlert        = (id,d) => api.patch(`/alertas/${id}/resolver`, d);
export const unresolveAlert      = (id)   => api.patch(`/alertas/${id}/reabrir`);
export const deleteAlert         = (id)   => api.delete(`/alertas/${id}`);
export const generateAutoAlerts  = (d)    => api.post("/alertas/gerar-automaticos", d || {});
