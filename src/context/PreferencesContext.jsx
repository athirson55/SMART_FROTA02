import { createContext, useCallback, useContext, useMemo, useState } from "react";

const PreferencesContext = createContext(null);
const PREFS_KEY = "smart-frota-prefs";

const DEFAULTS = {
  currency: "BRL",
  dateFormat: "DD/MM/AAAA",
  timezone: "America/Sao_Paulo",
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefsState] = useState(loadPrefs);

  const updatePrefs = useCallback((patch) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const formatCurrency = useCallback(
    (value) => {
      const map = {
        BRL: { locale: "pt-BR", currency: "BRL" },
        USD: { locale: "en-US", currency: "USD" },
        EUR: { locale: "de-DE", currency: "EUR" },
      };
      const { locale, currency } = map[prefs.currency] ?? map.BRL;
      return Number(value).toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      });
    },
    [prefs.currency],
  );

  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return "—";
      const s = String(dateStr).slice(0, 10);
      const [year, month, day] = s.split("-");
      if (!year || !month || !day) return s;
      if (prefs.dateFormat === "MM/DD/AAAA") return `${month}/${day}/${year}`;
      if (prefs.dateFormat === "AAAA-MM-DD") return `${year}-${month}-${day}`;
      return `${day}/${month}/${year}`;
    },
    [prefs.dateFormat],
  );

  const value = useMemo(
    () => ({ prefs, updatePrefs, formatCurrency, formatDate }),
    [prefs, updatePrefs, formatCurrency, formatDate],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences deve ser usado dentro de PreferencesProvider");
  return ctx;
}
