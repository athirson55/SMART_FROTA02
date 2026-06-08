import { createContext, useContext, useEffect, useState } from "react";
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

  function doFetch(attempt = 0) {
    if (attempt === 0) setLoading(true);
    getDashboardReport()
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setDashboard(data);
          setHasData(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (attempt < 8) {
          setTimeout(() => doFetch(attempt + 1), 8_000);
        } else {
          setLoading(false);
        }
      });
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setDashboard(INITIAL_STATE);
      setHasData(false);
      setLoading(false);
      return;
    }

    doFetch();

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
    }, 90_000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
