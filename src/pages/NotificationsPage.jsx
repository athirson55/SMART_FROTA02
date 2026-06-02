import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { AppButton } from "../components/ui/AppButton";
import { EmptyState } from "../components/ui/EmptyState";
import { AppIcon } from "../components/AppIcon";
import { useNotifications } from "../context/NotificationsContext";
import { useUiFeedback } from "../context/UiFeedbackContext";
import {
  deleteNotification,
  generateNotifications,
  getNotifications,
  updateNotification,
} from "../services/notifications";

// ─── helpers ──────────────────────────────────────────────────────────────────

function prioridadeLabel(p) {
  if (p === "CRITICA") return "Crítica";
  if (p === "ALTA") return "Alta";
  if (p === "MEDIA") return "Média";
  return "Baixa";
}

function prioridadeTone(p) {
  if (p === "CRITICA") return "red";
  if (p === "ALTA") return "gold";
  if (p === "MEDIA") return "blue";
  return "green";
}

function tipoLabel(t) {
  const map = {
    CNH: "CNH",
    DOCUMENTO: "Documento",
    SEGURO: "Seguro",
    MANUTENCAO: "Manutenção",
    AGENDAMENTO: "Agendamento",
    ROTA: "Rota",
    PENDENCIA: "Pendência",
    INFO: "Info",
  };
  return map[t] || t;
}

function tipoRoute(notif) {
  const t = notif.referenciaTipo || "";
  if (t === "cnh" || t === "motorista") return "/motoristas";
  if (t === "crlv" || t === "seguro" || t === "revisao_km" || t === "revisao_data") return "/veiculos";
  if (t === "manutencao") return "/manutencoes";
  if (t === "agendamento") return "/agendamentos";
  if (t === "rota") return "/rotas";
  if (t === "pendencia") return "/alertas";
  return "/alertas";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

// ─── filter constants ──────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: "todos", label: "Todas" },
  { value: "false", label: "Não lidas" },
  { value: "true", label: "Lidas" },
];

const PRIORIDADE_OPTS = [
  { value: "todas", label: "Todas prioridades" },
  { value: "CRITICA", label: "Crítica" },
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Média" },
  { value: "BAIXA", label: "Baixa" },
];

const TIPO_OPTS = [
  { value: "todos", label: "Todos os tipos" },
  { value: "CNH", label: "CNH" },
  { value: "DOCUMENTO", label: "Documento" },
  { value: "SEGURO", label: "Seguro" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "AGENDAMENTO", label: "Agendamento" },
  { value: "ROTA", label: "Rota" },
  { value: "PENDENCIA", label: "Pendência" },
];

// ─── NotificationItem ──────────────────────────────────────────────────────────

function NotificationItem({ notif, onMarkRead, onDelete, onNavigate }) {
  const tone = prioridadeTone(notif.prioridade);

  return (
    <article
      className={`fg-notif-item ${notif.isRead ? "is-read" : "is-unread"}`}
      data-tone={tone}
    >
      <div className="fg-notif-item-indicator" data-tone={tone} />

      <div className="fg-notif-item-body">
        <div className="fg-notif-item-header">
          <span className={`fg-notif-item-badge is-${tone}`}>{prioridadeLabel(notif.prioridade)}</span>
          <span className="fg-notif-item-tipo">{tipoLabel(notif.tipo)}</span>
          {!notif.isRead && <span className="fg-notif-item-dot" aria-label="Não lida" />}
          <span className="fg-notif-item-date">{formatDate(notif.createdAt)}</span>
        </div>

        <button
          type="button"
          className="fg-notif-item-title"
          onClick={() => {
            if (!notif.isRead) onMarkRead(notif.id);
            onNavigate(tipoRoute(notif));
          }}
        >
          {notif.titulo}
        </button>

        <p className="fg-notif-item-msg">{notif.mensagem}</p>
      </div>

      <div className="fg-notif-item-actions">
        {!notif.isRead && (
          <button
            type="button"
            className="fg-notif-item-btn"
            title="Marcar como lida"
            onClick={() => onMarkRead(notif.id)}
          >
            <AppIcon type="check" />
          </button>
        )}
        <button
          type="button"
          className="fg-notif-item-btn is-danger"
          title="Excluir notificação"
          onClick={() => onDelete(notif.id)}
        >
          <AppIcon type="trash" />
        </button>
      </div>
    </article>
  );
}

// ─── NotificationsPage ─────────────────────────────────────────────────────────

export function NotificationsPage() {
  const navigate = useNavigate();
  const { markAllRead, refresh: refreshContext } = useNotifications();
  const { showSuccess, showError } = useUiFeedback();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [statusFilter, setStatusFilter] = useState("todos");
  const [prioridadeFilter, setPrioridadeFilter] = useState("todas");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const LIMIT = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter !== "todos") params.isRead = statusFilter === "true";
      if (prioridadeFilter !== "todas") params.prioridade = prioridadeFilter;
      if (tipoFilter !== "todos") params.tipo = tipoFilter;
      if (search.trim()) params.search = search.trim();
      const res = await getNotifications(params);
      setItems(res.data?.data ?? []);
      setTotal(res.data?.meta?.total ?? 0);
    } catch {
      showError("Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, prioridadeFilter, tipoFilter, search, showError]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleMarkRead(id) {
    try {
      await updateNotification(id, { isRead: true });
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      refreshContext();
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      refreshContext();
    } catch {
      showError("Erro ao excluir notificação.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showSuccess("Todas as notificações marcadas como lidas.");
    } catch {
      showError("Erro ao marcar todas como lidas.");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateNotifications();
      const count = res.data?.data?.length ?? 0;
      showSuccess(`${count} notificação(ões) gerada(s) com sucesso.`);
      fetchItems();
      refreshContext();
    } catch {
      showError("Erro ao gerar notificações automáticas.");
    } finally {
      setGenerating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content">
        {/* Page header */}
        <div className="fg-home-section-head">
          <h3>Central de Notificações</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--sf-text-muted)" }}>
            {total} notificação{total !== 1 ? "ões" : ""}
          </span>
        </div>

        {/* Summary banner */}
        {unreadCount > 0 && (
          <div className="fg-notif-page-banner">
            <span>
              Você tem <strong>{unreadCount}</strong> notificação{unreadCount !== 1 ? "ões" : ""} não{unreadCount !== 1 ? "" : ""} lida{unreadCount !== 1 ? "s" : ""}.
            </span>
            <button type="button" className="fg-notif-mark-all" onClick={handleMarkAllRead}>
              Marcar todas como lidas
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="fg-notif-page-toolbar">
          <div className="fg-notif-page-filters">
            <div className="fg-dashboard-status-filters" aria-label="Status">
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={statusFilter === opt.value ? "is-active" : ""}
                  onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              className="fg-notif-page-select"
              value={prioridadeFilter}
              onChange={(e) => { setPrioridadeFilter(e.target.value); setPage(1); }}
              aria-label="Filtrar por prioridade"
            >
              {PRIORIDADE_OPTS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              className="fg-notif-page-select"
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              aria-label="Filtrar por tipo"
            >
              {TIPO_OPTS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="fg-dashboard-toolbar-input-wrap" style={{ minWidth: "200px" }}>
              <span className="fg-dashboard-toolbar-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar notificação..."
              />
            </div>
          </div>

          <div className="fg-dashboard-quick-actions">
            <AppButton
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Gerando…" : "Gerar alertas"}
            </AppButton>
            <AppButton onClick={handleMarkAllRead}>
              Marcar todas lidas
            </AppButton>
          </div>
        </div>

        {/* List */}
        <div className="fg-notif-page-list">
          {loading ? (
            <div className="fg-notif-page-loading">Carregando notificações…</div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nenhuma notificação encontrada"
              description="Quando houver prazo próximo, vencimento ou pendência crítica, as notificações aparecerão aqui."
              actionLabel="Gerar alertas agora"
              onAction={handleGenerate}
            />
          ) : (
            items.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onNavigate={(route) => navigate(route)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="fg-notif-page-pagination">
            <button
              type="button"
              className="fg-notif-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              type="button"
              className="fg-notif-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
