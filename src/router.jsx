import { Navigate, createHashRouter } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { RecoverPasswordPage } from "./pages/RecoverPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { EmailSentPage } from "./pages/EmailSentPage";
import { EmailVerificationPage } from "./pages/EmailVerificationPage";
import { ResetPasswordSuccessPage } from "./pages/ResetPasswordSuccessPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { PendingDetailPage } from "./pages/PendingDetailPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { DriversPage } from "./pages/DriversPage";
import { MaintenancesPage } from "./pages/MaintenancesPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { RotasPage } from "./pages/RotasPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
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
    path: "/rotas",
    element: <RotasPage />,
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
  {
    path: "/notificacoes",
    element: <NotificationsPage />,
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
    element: <ResetPasswordPage />,
  },
  {
    path: "/verificar-email",
    element: <EmailVerificationPage />,
  },
  {
    path: "/email-enviado",
    element: <EmailSentPage />,
  },
  {
    path: "/senha-redefinida",
    element: <ResetPasswordSuccessPage />,
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
