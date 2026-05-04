import { api } from "./api.js";
export const getAppointments     = (p)    => api.get("/agendamentos",         { params: p });
export const getAppointmentStats = ()     => api.get("/agendamentos/stats");
export const getAppointment      = (id)   => api.get(`/agendamentos/${id}`);
export const createAppointment   = (d)    => api.post("/agendamentos",         d);
export const updateAppointment   = (id,d) => api.patch(`/agendamentos/${id}`,  d);
export const deleteAppointment   = (id)   => api.delete(`/agendamentos/${id}`);
