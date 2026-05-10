import { api } from "./api.js";
export const getDashboardReport = ()  => api.get("/relatorios/dashboard");
export const getFleetReport     = (p) => api.get("/relatorios/frota",    { params: p });
export const getCostsReport     = (p) => api.get("/relatorios/custos",   { params: p });
export const getCompleteReport  = (p) => api.get("/relatorios/completo", { params: p });
export const exportExcelReport  = (p) => api.get("/relatorios/exportar-excel", { params: p, responseType: "blob" });
