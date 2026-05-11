import axios from "axios";
import {
  clearSession,
  getTokenStorage,
  readStoredTokens,
  saveSession,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "./sessionStorage.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "https://smart-frota02-1.onrender.com");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

let refreshingPromise = null;

// Injeta JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = readStoredTokens().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para /login quando o token expirar
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || "").includes("/auth/refresh")
    ) {
      const { refreshToken } = readStoredTokens();
      if (!refreshToken) {
        clearSession();
        window.location.hash = "#/login";
        return Promise.reject(err);
      }

      originalRequest._retry = true;

      try {
        if (!refreshingPromise) {
          refreshingPromise = refreshApi
            .post("/auth/refresh", { refreshToken })
            .then((res) => res.data?.data ?? res.data)
            .finally(() => {
              refreshingPromise = null;
            });
        }

        const tokens = await refreshingPromise;
        const storage = getTokenStorage();
        storage.setItem(TOKEN_KEY, tokens.token);
        storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken || refreshToken);
        if (tokens.usuario) {
          storage.setItem(USER_KEY, JSON.stringify(tokens.usuario));
          sessionStorage.setItem(USER_KEY, JSON.stringify(tokens.usuario));
        }
        originalRequest.headers.Authorization = `Bearer ${tokens.token}`;
        return api.request(originalRequest);
      } catch (refreshError) {
        clearSession();
        window.location.hash = "#/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);
