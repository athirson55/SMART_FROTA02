import { api } from "./api.js";
export const getRoutes    = (p)    => api.get("/rotas",           { params: p });
export const getRoute     = (id)   => api.get(`/rotas/${id}`);
export const createRoute  = (d)    => api.post("/rotas",          d);
export const updateRoute  = (id,d) => api.patch(`/rotas/${id}`,   d);
export const deleteRoute  = (id)   => api.delete(`/rotas/${id}`);
