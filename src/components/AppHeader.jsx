import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppIcon } from "./AppIcon";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { getVehicles } from "../services/vehicles";

function buildSearchPool(vehicles) {
  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    model: vehicle.model,
    plate: vehicle.plate,
    driver: vehicle.driver,
    searchText: [vehicle.id, vehicle.model, vehicle.plate, vehicle.driver]
      .join(" ")
      .toLowerCase(),
  }));
}

function useOutsideClick(containerRef, onOutsideClick) {
  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target)) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [containerRef, onOutsideClick]);
}

function ProfileMenu({ navigate, onClose, onLogout }) {
  return (
    <div className="fg-header-dropdown fg-header-profile-dropdown">
      <button
        type="button"
        className="fg-header-dropdown-item"
        onClick={() => {
          navigate("/configuracoes");
          onClose();
        }}
      >
        <strong>Ver perfil</strong>
        <span>Dados do usuário e permissões</span>
      </button>

      <button
        type="button"
        className="fg-header-dropdown-item"
        onClick={() => {
          navigate("/configuracoes");
          onClose();
        }}
      >
        <strong>Configurações</strong>
        <span>Preferências do sistema</span>
      </button>

      <button
        type="button"
        className="fg-header-dropdown-item is-danger"
        onClick={onLogout}
      >
        <strong>Sair</strong>
        <span>Encerrar sessão atual</span>
      </button>
    </div>
  );
}

function getDisplayName(user) {
  return user?.nome || user?.name || "Usuário";
}

function getRoleLabel(user) {
  const role = user?.role || "";
  if (role === "ADMIN") return "Administrador";
  if (role === "GESTOR") return "Gestor";
  if (role === "MOTORISTA") return "Motorista";
  return "Gestor de Frota";
}

function getUserInitials(user) {
  const displayName = getDisplayName(user);
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileAvatar({ user }) {
  if (user?.avatarFoto) {
    return (
      <img
        className="fg-home-user-avatar-image"
        src={user.avatarFoto}
        alt="Foto de perfil"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "999px",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
      />
    );
  }

  return <div className="fg-home-user-avatar">{getUserInitials(user)}</div>;
}

export function AppHeader({ isMobile = false, onMenuToggle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const headerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchPool, setSearchPool] = useState([]);
  const isMobileViewport = useIsMobile(900);
  const mobileMode = isMobile || isMobileViewport;

  const { notifications: rawNotifications, unreadCount, markAsRead, markAllRead, dismiss } = useNotifications();

  // Map context notifications to the shape used by the dropdown
  const notifications = useMemo(() =>
    rawNotifications.map((n) => ({
      id: n.id,
      label: n.titulo,
      detail: n.mensagem,
      prioridade: n.prioridade || "MEDIA",
      isRead: n.isRead,
      route: (() => {
        const t = n.referenciaTipo || "";
        if (t === "cnh") return "/motoristas";
        if (t === "crlv" || t === "seguro" || t === "revisao_km" || t === "revisao_data") return "/veiculos";
        if (t === "manutencao") return "/manutencoes";
        if (t === "agendamento") return "/agendamentos";
        if (t === "rota") return "/rotas";
        return "/notificacoes";
      })(),
    })),
    [rawNotifications],
  );

  useEffect(() => {
    let active = true;

    getVehicles({ limit: 100 })
      .then((res) => {
        if (!active) return;
        const data = res.data?.data ?? [];
        setSearchPool(
          buildSearchPool(
            data.map((vehicle) => ({
              id: vehicle.id,
              model: vehicle.modelo || vehicle.model || "",
              plate: vehicle.placa || vehicle.plate || "",
              driver:
                vehicle.motorista?.nome ||
                vehicle.motorista?.name ||
                vehicle.driver ||
                "",
            })),
          ),
        );
      })
      .catch(() => {
        if (active) setSearchPool([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return searchPool
      .filter((item) => item.searchText.includes(query))
      .slice(0, 6);
  }, [searchPool, searchQuery]);

  const closeHeaderMenus = useCallback(() => {
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
  }, []);

  useOutsideClick(headerRef, closeHeaderMenus);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchQuery.trim();

    if (query.length === 0) {
      navigate("/veiculos");
      return;
    }

    navigate(`/veiculos?search=${encodeURIComponent(query)}`);
  }

  function handleQuickSearch(item) {
    setSearchQuery(item.id);
    navigate(`/veiculos?search=${encodeURIComponent(item.id)}`);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleMenuOpen() {
    if (onMenuToggle) {
      onMenuToggle();
      return;
    }

    window.dispatchEvent(new Event("smart-frota:open-sidebar"));
  }

  return (
    <header className="fg-home-header" ref={headerRef}>
      {mobileMode ? (
        <div className="fg-home-mobile-header-row">
          <button
            type="button"
            className="fg-home-icon-btn fg-mobile-menu-btn"
            aria-label="Abrir menu"
            onClick={handleMenuOpen}
          >
            <AppIcon type="menu" />
          </button>

          <div className="fg-home-mobile-brand" aria-hidden="true">
            <span className="fg-home-brand-icon">
              <AppIcon type="truck" />
            </span>
            <strong>Smart Frota</strong>
          </div>

          <button
            type="button"
            className="fg-home-icon-btn"
            aria-label="Perfil"
            title="Perfil"
            aria-expanded={isProfileOpen}
            onClick={() => {
              setIsProfileOpen((value) => !value);
              setIsNotificationOpen(false);
            }}
          >
            <AppIcon type="users" />
          </button>

          {isProfileOpen ? (
            <ProfileMenu
              navigate={navigate}
              onClose={() => setIsProfileOpen(false)}
              onLogout={handleLogout}
            />
          ) : null}
        </div>
      ) : null}

      <div className="fg-home-header-left">
        <form className="fg-home-search-wrap" onSubmit={handleSearchSubmit}>
          <label className="fg-home-search" htmlFor="global-search">
            <input
              id="global-search"
              className="fg-home-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por veículo, placa, motorista ou ID..."
              autoComplete="off"
            />

            <button
              type="submit"
              className="fg-home-search-submit"
              aria-label="Pesquisar"
              title="Pesquisar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6" />
                <path d="M16 16l4 4" />
              </svg>
            </button>
          </label>

          {searchMatches.length > 0 ? (
            <div
              className="fg-header-dropdown fg-header-search-results"
              role="listbox"
            >
              {searchMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="fg-header-dropdown-item"
                  onClick={() => handleQuickSearch(item)}
                >
                  <strong>{item.id}</strong>
                  <span>
                    {item.model} · {item.plate}
                  </span>
                  <small>{item.driver}</small>
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            className="fg-home-filter-btn"
            aria-label="Filtros"
            title="Filtros"
            onClick={() => navigate("/veiculos")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 6h16l-6 7v5l-4 2v-7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </form>
      </div>

      <div className="fg-home-header-right">
        <button
          type="button"
          className="fg-home-new-btn"
          onClick={() => navigate("/agendamentos")}
        >
          <span>+</span> Novo Pedido
        </button>

        <div className="fg-header-menu-wrap">
          <button
            type="button"
            className="fg-home-icon-btn"
            aria-label="Notificações"
            title="Notificações"
            aria-expanded={isNotificationOpen}
            onClick={() => {
              setIsNotificationOpen((v) => !v);
              setIsProfileOpen(false);
            }}
          >
            <AppIcon type="bell" />
            {unreadCount > 0 ? (
              <span className="fg-home-icon-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>

          {isNotificationOpen ? (
            <div className="fg-header-dropdown fg-header-notification-dropdown">
              <div className="fg-notif-header">
                <strong>Notificações</strong>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="fg-notif-mark-all"
                      onClick={() => { markAllRead(); }}
                    >
                      Marcar lidas
                    </button>
                  )}
                  <button
                    type="button"
                    className="fg-notif-mark-all"
                    onClick={() => { navigate("/notificacoes"); setIsNotificationOpen(false); }}
                  >
                    Ver todas
                  </button>
                </div>
              </div>
              {notifications.length > 0 ? (
                notifications.map((item) => {
                  const tone = item.prioridade === "CRITICA" ? "red" : item.prioridade === "ALTA" ? "gold" : "blue";
                  return (
                    <div
                      key={item.id}
                      className={`fg-header-dropdown-item fg-notif-wrapper ${item.isRead ? "is-read" : "is-unread"}`}
                    >
                      <button
                        type="button"
                        className="fg-notif-content"
                        onClick={() => {
                          markAsRead(item.id);
                          navigate(item.route);
                          setIsNotificationOpen(false);
                        }}
                      >
                        <span className={`fg-notif-priority-dot is-${tone}`} />
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                      </button>
                      <button
                        type="button"
                        className="fg-notif-dismiss"
                        aria-label="Descartar notificação"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(item.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="fg-header-dropdown-empty">
                  <span>Nenhuma notificação recente</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="fg-header-menu-wrap">
          <button
            type="button"
            className="fg-home-user-chip-btn"
            aria-label="Perfil"
            title="Perfil"
            aria-expanded={isProfileOpen}
            onClick={() => {
              setIsProfileOpen((value) => !value);
              setIsNotificationOpen(false);
            }}
          >
            <div className="fg-home-user-chip">
              <ProfileAvatar user={user} />
              <div className="fg-home-user-info">
                <strong>{getDisplayName(user)}</strong>
                <p>{getRoleLabel(user)}</p>
              </div>
            </div>
          </button>

          {isProfileOpen ? (
            <ProfileMenu
              navigate={navigate}
              onClose={() => setIsProfileOpen(false)}
              onLogout={handleLogout}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
