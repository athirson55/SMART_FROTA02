import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getDashboardReport } from "../services/reports";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext(null);

const INITIAL_STATE = {
  veiculos: {},
  motoristas: {},
  manutencoes: {},
  alertas: {},
  agendamentos: {},
  veiculosComPendencias: [],
  alertasRecentes: [],
};

export function DashboardProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Stable ref so retry timeouts always invoke the latest fetch logic
  const fetchRef = useRef(null);
  // Tracks whether we've ever successfully loaded data — avoids showing
  // the loading skeleton on subsequent navigations when data already exists
  const hasDataRef = useRef(false);

  const doFetch = useCallback((attempt = 0) => {
    // Only show loading skeleton on the very first fetch (no data yet)
    if (attempt === 0 && !hasDataRef.current) setLoading(true);
    getDashboardReport()
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setDashboard(data);
          setHasData(true);
          hasDataRef.current = true;
        }
        setLoading(false);
      })
      .catch(() => {
        if (attempt < 8) {
          setTimeout(() => fetchRef.current?.(attempt + 1), 8_000);
        } else {
          setLoading(false);
        }
      });
  }, []);

  // Keep fetchRef pointing to the latest doFetch so retries are always current
  fetchRef.current = doFetch;

  useEffect(() => {
    if (!isAuthenticated) {
      setDashboard(INITIAL_STATE);
      setHasData(false);
      setLoading(false);
      hasDataRef.current = false;
      return;
    }

    doFetch();

    // Background polling every 60 s — keeps dashboard fresh passively
    const interval = setInterval(() => {
      getDashboardReport()
        .then((res) => {
          const data = res.data?.data;
          if (data) {
            setDashboard(data);
            setHasData(true);
          }
        })
        .catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, doFetch]);

  return (
    <DashboardContext.Provider value={{ dashboard, loading, hasData, refresh: doFetch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard deve ser usado dentro de DashboardProvider");
  return ctx;
}
