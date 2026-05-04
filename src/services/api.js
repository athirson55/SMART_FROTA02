import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 12000,
});

// Injeta JWT em toda requisição
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("smart-frota-token") ||
    sessionStorage.getItem("smart-frota-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para /login quando o token expirar
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("smart-frota-token");
      sessionStorage.removeItem("smart-frota-token");
      window.location.hash = "#/login";
    }
    return Promise.reject(err);
  }
);
