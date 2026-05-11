import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { api } from "../services/api.js";
import {
  clearSession,
  readStoredTokens,
  readStoredUser,
  saveSession,
  updateStoredUser,
} from "../services/sessionStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { token } = readStoredTokens();
    if (!token) return;
    api
      .get("/auth/eu")
      .then((res) => {
        const serverUser = res.data.data ?? res.data;
        setUser(serverUser);
        updateStoredUser(serverUser);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, []);

  const login = useCallback(
    async ({ email, senha, manterConectado = false }) => {
      setLoading(true);
      try {
        const res = await api.post("/auth/login", {
          email,
          senha,
          manterConectado,
        });
        const { token, refreshToken, usuario } = res.data.data;
        saveSession(token, refreshToken, usuario, manterConectado);
        flushSync(() => setUser(usuario));
        return usuario;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const registrar = useCallback(async ({ nome, email, senha }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/registrar", { nome, email, senha });
      const data = res.data.data;
      // New flow: email verification required — no tokens yet
      if (data?.requiresEmailVerification) {
        return { requiresEmailVerification: true, email: data.email };
      }
      // Legacy / skip-verification path
      const { token, refreshToken, usuario } = data;
      saveSession(token, refreshToken, usuario, true);
      flushSync(() => setUser(usuario));
      return usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  // Called after email verification succeeds — stores session and sets user
  const acceptVerification = useCallback((token, refreshToken, usuario) => {
    saveSession(token, refreshToken, usuario, true);
    flushSync(() => setUser(usuario));
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = readStoredTokens();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch {
      // ignore remote logout failure
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated) => {
    flushSync(() => setUser(updated));
    updateStoredUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      registrar,
      acceptVerification,
      logout,
      updateUser,
    }),
    [user, loading, login, registrar, acceptVerification, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
