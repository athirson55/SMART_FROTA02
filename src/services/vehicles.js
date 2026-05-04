import { api } from "./api.js";
export const getVehicles          = (p)    => api.get("/veiculos",                   { params: p });
export const getVehicle           = (id)   => api.get(`/veiculos/${id}`);
export const createVehicle        = (d)    => api.post("/veiculos",                  d);
export const updateVehicle        = (id,d) => api.patch(`/veiculos/${id}`,           d);
export const deleteVehicle        = (id)   => api.delete(`/veiculos/${id}`);
export const getVehiclePendencias = (id)   => api.get(`/veiculos/${id}/pendencias`);
export const addPendencia         = (id,d) => api.post(`/veiculos/${id}/pendencias`, d);
export const removePendencia      = (id,pid)=>api.delete(`/veiculos/${id}/pendencias/${pid}`);
