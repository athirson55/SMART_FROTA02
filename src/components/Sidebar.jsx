import { useNavigate } from "react-router-dom";
import { AppIcon } from "./AppIcon";
import { SidebarItem } from "./SidebarItem";
import { useAuth } from "../context/AuthContext";

const sidebarItems = [
  { key: "home", label: "Home", icon: "home", to: "/home", end: true },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "grid",
    to: "/dashboard",
    end: true,
  },
  { key: "veiculos", label: "Veículos", icon: "truck", to: "/veiculos" },
  {
    key: "motoristas",
    label: "Motoristas",
    icon: "users",
    to: "/motoristas",
  },
  {
    key: "manutencoes",
    label: "Manutenções",
    icon: "wrench",
    to: "/manutencoes",
  },
  {
    key: "agendamentos",
    label: "Agendamentos",
    icon: "calendar",
    to: "/agendamentos",
  },
  { key: "alertas", label: "Alertas", icon: "bell", to: "/alertas" },
  {
    key: "relatorios",
    label: "Relatórios",
    icon: "chart",
    to: "/relatorios",
  },
  {
    key: "configuracoes",
    label: "Configurações",
    icon: "settings",
    to: "/configuracoes",
  },
];

export function Sidebar({
  isOpen,
  isMobile = false,
  onMouseEnter,
  onMouseLeave,
  onClose,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    if (isMobile) {
      onClose?.();
    }
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={`fg-home-sidebar ${isOpen ? "" : "is-collapsed"}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="fg-home-sidebar-top">
        <div className="fg-home-brand-link" aria-hidden="true">
          <span className="fg-home-brand-icon" aria-hidden="true">
            <AppIcon type="truck" />
          </span>
          <span className="fg-home-brand-label">Smart Frota</span>
        </div>

        <nav className="fg-home-nav">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.key}
              to={item.to}
              label={item.label}
              icon={item.icon}
              end={item.end}
              isCollapsed={!isOpen && !isMobile}
              onSelect={isMobile ? onClose : undefined}
            />
          ))}
        </nav>
      </div>

      <button type="button" className="fg-home-logout" onClick={handleLogout}>
        <span className="fg-home-logout__icon">
          <AppIcon type="logout" />
        </span>
        <span className="fg-home-logout__label">Sair</span>
      </button>
    </aside>
  );
}
