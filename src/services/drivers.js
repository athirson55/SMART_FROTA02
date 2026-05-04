import { api } from "./api.js";
export const getDrivers   = (p)    => api.get("/motoristas",       { params: p });
export const getDriver    = (id)   => api.get(`/motoristas/${id}`);
export const createDriver = (d)    => api.post("/motoristas",       d);
export const updateDriver = (id,d) => api.patch(`/motoristas/${id}`,d);
export const deleteDriver = (id)   => api.delete(`/motoristas/${id}`);
