import { api } from "./api.js";
export const getDashboardReport = ()  => api.get("/relatorios/dashboard");
export const getFleetReport     = (p) => api.get("/relatorios/frota",   { params: p });
export const getCostsReport     = (p) => api.get("/relatorios/custos",  { params: p });
