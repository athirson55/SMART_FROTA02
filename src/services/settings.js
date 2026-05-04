import { api } from "./api.js";
export const getSettings    = ()  => api.get("/configuracoes");
export const updateSettings = (d) => api.patch("/configuracoes", d);
