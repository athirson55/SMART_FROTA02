import { Navigate, createHashRouter } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { RecoverPasswordPage } from "./pages/RecoverPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { PendingDetailPage } from "./pages/PendingDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { DriversPage } from "./pages/DriversPage";
import { MaintenancesPage } from "./pages/MaintenancesPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GuestOnlyRoute, ProtectedRoute } from "./components/RouteGuards";

const privateRoutes = [
  {
    path: "/home",
    element: <HomePage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/pendencias/:vehicleId/:pendingSlug",
    element: <PendingDetailPage />,
  },
  {
    path: "/veiculos",
    element: <VehiclesPage />,
  },
  {
    path: "/motoristas",
    element: <DriversPage />,
  },
  {
    path: "/manutencoes",
    element: <MaintenancesPage />,
  },
  {
    path: "/agendamentos",
    element: <AppointmentsPage />,
  },
  {
    path: "/alertas",
    element: <AlertsPage />,
  },
  {
    path: "/relatorios",
    element: <ReportsPage />,
  },
  {
    path: "/configuracoes",
    element: <SettingsPage />,
  },
];

const routes = [
  ...privateRoutes.map((route) => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>,
  })),
  {
    path: "/login",
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/cadastro",
    element: (
      <GuestOnlyRoute>
        <CadastroPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/recuperar-senha",
    element: (
      <GuestOnlyRoute>
        <RecoverPasswordPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/redefinir-senha",
    element: (
      <GuestOnlyRoute>
        <ResetPasswordPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
];

export const router = createHashRouter(routes);
