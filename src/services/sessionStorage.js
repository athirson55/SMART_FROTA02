const TOKEN_KEY = "smart-frota-token";
const REFRESH_TOKEN_KEY = "smart-frota-refresh-token";
const USER_KEY = "smart-frota-user";

function getStorageOrder() {
  return [localStorage, sessionStorage];
}

export function readStoredUser() {
  try {
    const raw =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readStoredTokens() {
  return {
    token:
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      null,
    refreshToken:
      localStorage.getItem(REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
      null,
  };
}

export function getTokenStorage() {
  if (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    return localStorage;
  }
  if (
    sessionStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    return sessionStorage;
  }
  return localStorage;
}

export function saveSession(token, refreshToken, user, manterConectado) {
  const storage = manterConectado ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  storage.setItem(USER_KEY, JSON.stringify(user));

  const mirror = manterConectado ? sessionStorage : localStorage;
  mirror.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  getStorageOrder().forEach((storage) => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  });
}

export function updateStoredUser(user) {
  getStorageOrder().forEach((storage) => {
    if (storage.getItem(TOKEN_KEY) || storage.getItem(REFRESH_TOKEN_KEY)) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  });
}

export { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY };
