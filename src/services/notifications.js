import { api } from "./api.js";

export const getNotifications       = (p)    => api.get("/notificacoes",                       { params: p });
export const getNotification        = (id)   => api.get(`/notificacoes/${id}`);
export const createNotification     = (d)    => api.post("/notificacoes",                       d);
export const updateNotification     = (id,d) => api.patch(`/notificacoes/${id}`,                d);
export const deleteNotification     = (id)   => api.delete(`/notificacoes/${id}`);
export const markAllNotificationsRead = ()   => api.post("/notificacoes/marcar-todas-lidas");
export const generateNotifications  = ()     => api.post("/notificacoes/gerar");
export const getUnreadCount         = ()     => api.get("/notificacoes/nao-lidas/contagem");
export const getNotificationsSummary = ()    => api.get("/notificacoes/resumo");
