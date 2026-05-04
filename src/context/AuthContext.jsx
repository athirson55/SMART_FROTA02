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

const TOKEN_KEY = "smart-frota-token";
const USER_KEY = "smart-frota-user";

function readStoredUser() {
  try {
    const raw =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(token, user, manterConectado) {
  const storage = manterConectado ? localStorage : sessionStorage;
  const existingUser = readStoredUser();
  const mergedUser =
    existingUser &&
    (existingUser.id === user?.id || existingUser.email === user?.email)
      ? {
          ...existingUser,
          ...user,
          avatarFoto:
            user?.avatarFoto !== undefined
              ? user.avatarFoto
              : existingUser.avatarFoto,
        }
      : user;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(mergedUser));

  // Sempre salvar também no outro storage para persistência de foto
  const otherStorage = manterConectado ? sessionStorage : localStorage;
  otherStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
}

function clearSession() {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
  });
}

function getStoredUser() {
  return readStoredUser();
}

function getStoredToken() {
  return (
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
  );
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  // Valida o token ao montar — busca /auth/eu
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const storedUser = getStoredUser();
    api
      .get("/auth/eu")
      .then((res) => {
        const serverUser = res.data.data ?? res.data;
        // Manter foto local se existir
        const userWithPhoto = storedUser?.avatarFoto
          ? { ...serverUser, avatarFoto: storedUser.avatarFoto }
          : serverUser;
        console.log("Auth/eu response:", serverUser);
        setUser(userWithPhoto);
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
        const { token, usuario } = res.data.data;
        saveSession(token, usuario, manterConectado);
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
      const { token, usuario } = res.data.data;
      saveSession(token, usuario, true);
      flushSync(() => {
        setUser(usuario);
      });
      return usuario;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    flushSync(() => {
      setUser(updated);
    });
    const token = getStoredToken();
    if (token) {
      // Salvar em ambos os storages para garantir persistência
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
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
