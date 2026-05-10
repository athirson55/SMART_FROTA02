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

  // Valida o token ao montar — busca /auth/eu (server é fonte da verdade)
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
        flushSync(() => {
          setUser(usuario);
        });
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
      const { token, refreshToken, usuario } = res.data.data;
      saveSession(token, refreshToken, usuario, true);
      flushSync(() => {
        setUser(usuario);
      });
      return usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = readStoredTokens();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignora falha no logout remoto e encerra a sessão localmente.
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated) => {
    flushSync(() => {
      setUser(updated);
    });
    updateStoredUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      registrar,
      logout,
      updateUser,
    }),
    [user, loading, login, registrar, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
