import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AppIcon } from "../components/AppIcon";
import { AppHeader } from "../components/AppHeader";
import { QuickInfoModal } from "../components/QuickInfoModal";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";

const quickActions = [
  {
    title: "Novo Pedido",
    subtitle: "Criar agora",
    icon: "plus",
    tone: "blue",
    route: "/agendamentos",
  },
  {
    title: "Rastrear Veículo",
    subtitle: "Tempo real",
    icon: "pin",
    tone: "green",
    route: "/veiculos",
  },
  {
    title: "Documentos",
    subtitle: "Gerir arquivos",
    icon: "doc",
    tone: "gold",
    route: "/alertas",
  },
  {
    title: "Relatórios",
    subtitle: "Exportar dados",
    icon: "chart",
    tone: "purple",
    route: "/relatorios",
  },
];

function buildSummaryCards(report, isLoading) {
  const n = (val) => (isLoading ? "–" : String(val ?? 0));
  return [
    {
      title: "Documentos prestes a vencer",
      description:
        "Alertas operacionais e documentos que precisam de atenção imediata.",
      value: n(report.alertas?.pendentes),
      valueClass: "is-gold",
      tags: [
        `${isLoading ? "–" : (report.alertas?.criticos ?? 0)} críticos`,
        `${isLoading ? "–" : (report.alertas?.pendentes ?? 0)} abertos`,
      ],
      action: "Ver detalhes",
      route: "/alertas",
      icon: "doc",
      iconTone: "gold",
    },
    {
      title: "Manutenções próximas",
      description:
        "Veículos com manutenção pendente ou em andamento no banco real.",
      value: isLoading
        ? "–"
        : String(
            (report.manutencoes?.pendentes ?? 0) +
              (report.manutencoes?.emAndamento ?? 0),
          ),
      valueClass: "is-red",
      tags: [
        `${isLoading ? "–" : (report.manutencoes?.pendentes ?? 0)} pendentes`,
        `${isLoading ? "–" : (report.manutencoes?.emAndamento ?? 0)} em andamento`,
      ],
      action: "Ver agenda",
      route: "/manutencoes",
      icon: "wrench",
      iconTone: "red",
    },
    {
      title: "Agendamentos atrasados",
      description:
        "Agendamentos que passaram da data prevista e ainda não foram concluídos.",
      value: n(report.agendamentos?.atrasados),
      valueClass: "is-purple",
      tags: [
        `${isLoading ? "–" : (report.agendamentos?.atrasados ?? 0)} atrasados`,
        `${isLoading ? "–" : (report.agendamentos?.proximos ?? 0)} próximos`,
      ],
      action: "Acompanhar",
      route: "/agendamentos",
      icon: "clock",
      iconTone: "purple",
    },
    {
      title: "Frota disponível",
      description: "Veículos ativos e prontos para operação.",
      value: n(report.veiculos?.ativos),
      valueClass: "is-green",
      tags: [
        `${isLoading ? "–" : (report.veiculos?.ativos ?? 0)} ativos`,
        `${isLoading ? "–" : (report.veiculos?.total ?? 0)} total`,
      ],
      action: "Alocar frota",
      route: "/veiculos",
      icon: "truck",
      iconTone: "green",
    },
  ];
}

function buildAlertRows(report) {
  return (report.alertasRecentes ?? []).map((alert) => [
    `${alert.veiculo?.placa || ""} - ${alert.veiculo?.modelo || "Sem veículo"}`.trim(),
    `${alert.titulo}${alert.prioridade ? ` - ${String(alert.prioridade).toLowerCase()}` : ""}`,
    alert.status === "RESOLVIDO" ? "Resolvido" : "Em aberto",
    alert.status === "RESOLVIDO"
      ? "green"
      : alert.prioridade === "CRITICO"
        ? "red"
        : "amber",
  ]);
}

function buildMaintenanceRows(report) {
  return (report.veiculosComPendencias ?? []).map((vehicle) => [
    `${vehicle.placa} - ${vehicle.modelo}`,
    `${vehicle.pendencias?.[0]?.label || "Pendência registrada"}`,
    vehicle.pendencias?.length
      ? `${vehicle.pendencias.length} pendência(s)`
      : "Sem pendências",
    vehicle.pendencias?.length > 1 ? "red" : "amber",
  ]);
}

function Row({ row }) {
  return (
    <div className="fg-home-row">
      <span className={`fg-dot ${row[3]}`} />
      <div className="fg-home-row-main">
        <strong>{row[0]}</strong>
        <p>{row[1]}</p>
      </div>
      <span className={`fg-home-deadline ${row[3]}`}>{row[2]}</span>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboard, loading, hasData, refresh } = useDashboard();
  const [summaryModal, setSummaryModal] = useState(null);

  // Re-fetch fresh data every time the user navigates to the Home page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  const displayName = user?.nome || user?.name || "Usuário";

  const summaryCards = useMemo(
    () => buildSummaryCards(dashboard, loading && !hasData),
    [dashboard, loading, hasData],
  );
  const documentRows = useMemo(() => buildAlertRows(dashboard), [dashboard]);
  const maintenanceRows = useMemo(
    () => buildMaintenanceRows(dashboard),
    [dashboard],
  );

  function openSummaryModal(card) {
    const itemsByTitle = {
      "Documentos prestes a vencer": (dashboard.alertasRecentes ?? [])
        .slice(0, 3)
        .map((alert) => ({
          title: `${alert.veiculo?.placa || ""} - ${alert.veiculo?.modelo || "Sem veículo"}`,
          subtitle: alert.titulo,
        })),
      "Manutenções próximas": (dashboard.veiculosComPendencias ?? [])
        .slice(0, 3)
        .map((vehicle) => ({
          title: `${vehicle.placa} - ${vehicle.modelo}`,
          subtitle: vehicle.pendencias?.[0]?.label || "Pendência registrada",
        })),
      "Agendamentos atrasados": [
        {
          title: `${dashboard.agendamentos?.proximos ?? 0} agendamentos próximos`,
          subtitle: "Acesse Agendamentos para acompanhar os compromissos em andamento",
        },
      ],
      "Frota disponível": [
        {
          title: `${dashboard.veiculos?.ativos ?? 0} veículos ativos`,
          subtitle: "Dados carregados via API real",
        },
      ],
    };

    setSummaryModal({
      title: card.title,
      items: itemsByTitle[card.title] ?? [],
      route: card.route,
    });
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content">
        <section className="fg-home-welcome-card">
          <span className="fg-home-badge">Tela Inicial</span>
          <div className="fg-home-welcome-grid">
            <div>
              <h2>Bem-vindo de volta, {displayName} 👋</h2>
              <p>
                Aqui está um resumo do seu dia. Confira os alertas importantes
                antes de acessar o sistema completo.
              </p>
            </div>
            <div className="fg-home-kpis">
              <article>
                <strong>{(loading && !hasData) ? "–" : (dashboard.agendamentos?.atrasados ?? 0)}</strong>
                <span>Atrasados</span>
              </article>
              <article>
                <strong>{(loading && !hasData) ? "–" : (dashboard.veiculos?.emRota ?? 0)}</strong>
                <span>Em trânsito</span>
              </article>
              <article>
                <strong>{(loading && !hasData) ? "–" : (dashboard.alertas?.pendentes ?? 0)}</strong>
                <span>Alertas</span>
              </article>
            </div>
          </div>
        </section>

        <div className="fg-home-section-head">
          <h3>
            Alertas Importantes
            {loading && !hasData && (
              <span style={{ fontSize: 11, fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
                carregando…
              </span>
            )}
          </h3>
          <button type="button" onClick={() => navigate("/alertas")}>
            Ver todos
          </button>
        </div>

        <section className="fg-home-summary-grid">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="fg-home-summary-card fg-interactive-card"
              onClick={() => openSummaryModal(card)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSummaryModal(card);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="fg-home-summary-title-row">
                <span className={`fg-home-summary-icon ${card.iconTone}`}>
                  <AppIcon type={card.icon} />
                </span>
                <h4>{card.title}</h4>
              </div>
              <p>{card.description}</p>
              <strong className={`fg-home-summary-value ${card.valueClass}`}>
                {card.value}
              </strong>
              <div className="fg-home-summary-footer">
                <div className="fg-home-tag-list">
                  <span>{card.tags[0]}</span>
                  <span>{card.tags[1]}</span>
                </div>
                <button
                  type="button"
                  className="fg-interactive-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(card.route);
                  }}
                >
                  {card.action}
                </button>
              </div>
            </article>
          ))}
        </section>

        <div className="fg-home-section-head">
          <h3>Ações Rápidas</h3>
        </div>

        <section className="fg-home-actions-grid">
          {quickActions.map((action) => (
            <article
              key={action.title}
              className="fg-home-action-card fg-interactive-card"
              onClick={() => navigate(action.route)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(action.route);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className={`fg-home-action-icon ${action.tone}`}>
                <AppIcon type={action.icon} />
              </span>
              <h4>{action.title}</h4>
              <p>{action.subtitle}</p>
            </article>
          ))}
        </section>

        <div className="fg-home-section-head">
          <h3>Detalhamento dos Alertas</h3>
          <button type="button" onClick={() => navigate("/alertas")}>
            Ver todos
          </button>
        </div>

        <section className="fg-home-details-grid">
          <article
            className="fg-home-list-card fg-interactive-card"
            onClick={() => navigate("/alertas")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/alertas");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="fg-home-list-head">
              <div>
                <span className="fg-home-summary-icon gold">
                  <AppIcon type="doc" />
                </span>
                <h4>Documentos prestes a vencer</h4>
              </div>
              {documentRows.length > 0 && (
                <small>{documentRows.length} alerta{documentRows.length !== 1 ? "s" : ""}</small>
              )}
            </div>
            <div className="fg-home-list-body">
              {documentRows.length > 0
                ? documentRows.map((row) => <Row key={row[0]} row={row} />)
                : <p className="fg-home-empty-row">Nenhum alerta no momento</p>
              }
            </div>
          </article>

          <article
            className="fg-home-list-card fg-interactive-card"
            onClick={() => navigate("/manutencoes")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/manutencoes");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="fg-home-list-head">
              <div>
                <span className="fg-home-summary-icon red">
                  <AppIcon type="wrench" />
                </span>
                <h4>Manutenções próximas</h4>
              </div>
              {maintenanceRows.length > 0 && (
                <small className="is-red-pill">{maintenanceRows.length} veículo{maintenanceRows.length !== 1 ? "s" : ""}</small>
              )}
            </div>
            <div className="fg-home-list-body">
              {maintenanceRows.length > 0
                ? maintenanceRows.map((row) => <Row key={row[0]} row={row} />)
                : <p className="fg-home-empty-row">Sem pendências de manutenção</p>
              }
            </div>
          </article>
        </section>
      </div>

      <QuickInfoModal
        isOpen={Boolean(summaryModal)}
        title={summaryModal?.title ?? "Resumo"}
        items={summaryModal?.items ?? []}
        onClose={() => setSummaryModal(null)}
        onViewMore={() => {
          if (summaryModal?.route) {
            navigate(summaryModal.route);
          }
          setSummaryModal(null);
        }}
        viewMoreLabel="Ver mais detalhes"
      />
    </AppLayout>
  );
}
