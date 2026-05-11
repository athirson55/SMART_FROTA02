import { api } from "./api.js";
export const loginRequest = (d) => api.post("/auth/login", d);
export const registerRequest = (d) => api.post("/auth/registrar", d);
export const verifyEmailRequest = (d) => api.post("/auth/verificar-email", d);
export const resendVerificationRequest = (d) =>
  api.post("/auth/reenviar-verificacao", d);
export const recoverPasswordRequest = (d) =>
  api.post("/auth/recuperar-senha", d);
export const resetPasswordRequest = (d) => api.post("/auth/redefinir-senha", d);
export const getMeRequest = () => api.get("/auth/eu");
export const updateMeRequest = (d) => api.patch("/auth/eu", d);
export const changePasswordRequest = (d) => api.post("/auth/trocar-senha", d);
