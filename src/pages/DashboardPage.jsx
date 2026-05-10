import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { AppIcon } from "../components/AppIcon";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { QuickInfoModal } from "../components/QuickInfoModal";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { TableRow } from "../components/ui/TableRow";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { getVehicles } from "../services/vehicles";
import { getDashboardReport } from "../services/reports";

function normalizeDashboardVehicle(vehicle) {
  const pendencies = (vehicle.pendencias ?? []).map((pending) => ({
    slug: pending.slug,
    label: pending.label,
    detail: pending.detalhe || pending.detail || "",
    tone:
      String(pending.tom || pending.tone || "AMBER").toLowerCase() === "red"
        ? "red"
        : "gold",
  }));

  const status = vehicle.status || "ATIVO";
  const statusTone =
    status === "MANUTENCAO" ||
    pendencies.some((pending) => pending.tone === "red")
      ? "red"
      : pendencies.length > 0
        ? "gold"
        : "green";

  return {
    id: vehicle.id,
    model: vehicle.modelo || vehicle.model || "",
    plate: vehicle.placa || vehicle.plate || "",
    driver:
      vehicle.motorista?.nome ||
      vehicle.motorista?.name ||
      vehicle.driver ||
      "Sem motorista",
    status:
      status === "MANUTENCAO"
        ? "Em manutenção"
        : status === "INATIVO"
          ? "Reserva"
          : status === "EM_ROTA"
            ? "Em rota"
            : "Ativo",
    statusTone,
    pendencies,
  };
}

function buildFleetSummary(vehicles) {
  const pendingVehicles = vehicles.filter(
    (vehicle) => vehicle.pendencies.length > 0,
  );
  const maintenancePending = vehicles.filter((vehicle) =>
    vehicle.pendencies.some(
      (pending) =>
        pending.slug.includes("manutencao") ||
        pending.slug.includes("troca") ||
        pending.slug.includes("oleo"),
    ),
  ).length;
  const documentsPending = vehicles.filter((vehicle) =>
    vehicle.pendencies.some(
      (pending) =>
        pending.slug.includes("documento") ||
        pending.slug.includes("crlv") ||
        pending.slug.includes("licenciamento") ||
        pending.slug.includes("seguro"),
    ),
  ).length;

  return {
    total: vehicles.length,
    withPendencies: pendingVehicles.length,
    maintenancePending,
    documentsPending,
  };
}

const summaryCards = [
  {
    key: "total",
    title: "Total de veículos",
    description: "Unidades cadastradas na frota.",
    icon: "truck",
    iconTone: "green",
    valueClass: "is-green",
    route: "/veiculos",
    actionLabel: "Ver veículos",
  },
  {
    key: "withPendencies",
    title: "Veículos com pendências",
    description: "Veículos que precisam de atenção.",
    icon: "clock",
    iconTone: "red",
    valueClass: "is-red",
    route: "/alertas",
    actionLabel: "Ver pendências",
  },
  {
    key: "maintenancePending",
    title: "Manutenções próximas",
    description: "Itens de manutenção em aberto.",
    icon: "wrench",
    iconTone: "gold",
    valueClass: "is-gold",
    route: "/manutencoes",
    actionLabel: "Ver agenda",
  },
  {
    key: "documentsPending",
    title: "Documentos próximos do vencimento",
    description: "Documentos que exigem acompanhamento.",
    icon: "doc",
    iconTone: "purple",
    valueClass: "is-purple",
    route: "/alertas",
    actionLabel: "Ver documentos",
  },
];

const statusFilters = ["Todos", "Ativo", "Em rota", "Em manutenção", "Reserva"];

function PendingChip({ vehicle, pending, onOpenModal }) {
  const icon = pending.slug.includes("documento") ? "⚠️" : "🔧";

  return (
    <button
      type="button"
      className={`fg-dashboard-pending-chip is-${pending.tone}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenModal(vehicle, pending);
      }}
    >
      {icon} {pending.label}
    </button>
  );
}

export function DashboardPage() {
  const isMobile = useIsMobile(900);
  const navigate = useNavigate();
  const { showInfo, showSuccess } = useUiFeedback();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [summaryModal, setSummaryModal] = useState(null);
  const [pendingModal, setPendingModal] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [dashboardKpis, setDashboardKpis] = useState(null);

  useEffect(() => {
    let active = true;

    getVehicles({ limit: 100 })
      .then((res) => {
        if (!active) return;
        const data = res.data?.data ?? [];
        setVehicles(data.map(normalizeDashboardVehicle));
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos do dashboard:", err);
        if (active) setVehicles([]);
      });

    getDashboardReport()
      .then((res) => {
        if (!active) return;
        setDashboardKpis(res.data?.data ?? null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => buildFleetSummary(vehicles), [vehicles]);

  const insights = useMemo(() => {
    const maintenanceWeight = (vehicle) =>
      vehicle.pendencies.filter(
        (pending) =>
          pending.slug.includes("manutencao") ||
          pending.slug.includes("troca") ||
          pending.slug.includes("oleo"),
      ).length;

    const mostMaintenanceVehicle =
      vehicles
        .slice()
        .sort((a, b) => maintenanceWeight(b) - maintenanceWeight(a))[0] ?? null;

    const totalMaintenanceCost = dashboardKpis?.manutencoes?.custoTotal ?? null;
    const criticalAlerts = dashboardKpis?.alertas?.criticos ?? vehicles.reduce(
      (count, vehicle) =>
        count + vehicle.pendencies.filter((pending) => pending.tone === "red").length,
      0,
    );

    return { mostMaintenanceVehicle, totalMaintenanceCost, criticalAlerts };
  }, [vehicles, dashboardKpis]);

  const filteredVehicles = useMemo(() => {
    const query = vehicleFilter.trim().toLowerCase();

    return vehicles
      .filter((vehicle) => {
        const matchesStatus =
          statusFilter === "Todos" || vehicle.status === statusFilter;

        const matchesVehicle =
          query.length === 0 ||
          [vehicle.id, vehicle.model, vehicle.plate, vehicle.driver]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesVehicle;
      })
      .slice()
      .sort((left, right) => {
        const leftScore = left.pendencies.length;
        const rightScore = right.pendencies.length;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return left.id.localeCompare(right.id);
      });
  }, [statusFilter, vehicleFilter, vehicles]);

  const highestPendingCount = filteredVehicles.reduce(
    (max, vehicle) => Math.max(max, vehicle.pendencies.length),
    0,
  );

  function openSummaryModal(card) {
    const documentMatcher = /(doc|crlv|seguro|licen|vistoria)/i;
    const maintenanceMatcher = /(manuten|revis|oleo|óleo|freio|alinh)/i;

    const items = vehicles
      .filter((vehicle) => {
        if (card.key === "total") {
          return true;
        }

        if (card.key === "withPendencies") {
          return vehicle.pendencies.length > 0;
        }

        if (card.key === "maintenancePending") {
          return vehicle.pendencies.some((pending) =>
            maintenanceMatcher.test(
              `${pending.slug} ${pending.label} ${pending.detail}`,
            ),
          );
        }

        if (card.key === "documentsPending") {
          return vehicle.pendencies.some((pending) =>
            documentMatcher.test(
              `${pending.slug} ${pending.label} ${pending.detail}`,
            ),
          );
        }

        return false;
      })
      .slice(0, 6)
      .map((vehicle) => {
        const summaryText =
          vehicle.pendencies.length > 0
            ? `${vehicle.id} • ${vehicle.model} (${vehicle.pendencies.length} pendência${vehicle.pendencies.length > 1 ? "s" : ""})`
            : `${vehicle.id} • ${vehicle.model} (${vehicle.status})`;

        return {
          title: summaryText,
          subtitle: `${vehicle.plate} • ${vehicle.driver}`,
        };
      });

    setSummaryModal({
      title: card.title,
      items,
      route: card.route,
      buttonLabel: card.actionLabel,
    });
  }

  function openPendingModal(vehicle, pending) {
    setPendingModal({
      title: pending.label,
      route: `/pendencias/${vehicle.id}/${pending.slug}`,
      items: [
        { title: `Veículo: ${vehicle.id} • ${vehicle.model}` },
        { title: `Placa: ${vehicle.plate} • Motorista: ${vehicle.driver}` },
        { title: pending.detail },
      ],
    });
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content">
        <div className="fg-home-section-head">
          <h3>Visão geral da frota</h3>
          <button type="button">Ordenado por pendências</button>
        </div>

        <section className="fg-home-summary-grid">
          {summaryCards.map((card) => (
            <article
              key={card.key}
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
                {summary[card.key]}
              </strong>
              <div className="fg-home-summary-footer">
                <div className="fg-home-tag-list">
                  <span>
                    {card.key === "total" ? "frota ativa" : "em atenção"}
                  </span>
                  <span>
                    {card.key === "documentsPending"
                      ? "prazo curto"
                      : card.key === "maintenancePending"
                        ? "revisão"
                        : "acompanhamento"}
                  </span>
                </div>
                <button
                  type="button"
                  className="fg-interactive-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(card.route);
                  }}
                >
                  {card.actionLabel}
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="fg-dashboard-insights">
          <AppCard className="fg-home-summary-card">
            <h4>Veículo com mais pendências</h4>
            <p>
              {insights.mostMaintenanceVehicle
                ? `${insights.mostMaintenanceVehicle.model} • ${insights.mostMaintenanceVehicle.plate}`
                : "Sem pendências"}
            </p>
          </AppCard>

          <AppCard className="fg-home-summary-card">
            <h4>Custo total de manutenções</h4>
            <p>
              {insights.totalMaintenanceCost !== null
                ? `R$ ${Math.round(insights.totalMaintenanceCost).toLocaleString("pt-BR")}`
                : "—"}
            </p>
          </AppCard>

          <AppCard className="fg-home-summary-card">
            <h4>Alertas críticos</h4>
            <p>{insights.criticalAlerts} {insights.criticalAlerts === 1 ? "alerta" : "alertas"} de alta prioridade</p>
          </AppCard>
        </section>

        <div className="fg-dashboard-toolbar">
          <label className="fg-dashboard-toolbar-field">
            <span>Filtrar por veículo</span>
            <div className="fg-dashboard-toolbar-input-wrap">
              <span
                className="fg-dashboard-toolbar-input-icon"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" role="img">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
              </span>
              <input
                type="text"
                value={vehicleFilter}
                onChange={(event) => setVehicleFilter(event.target.value)}
                placeholder="ID, modelo, placa ou motorista"
              />
            </div>
          </label>

          <div
            className="fg-dashboard-status-filters"
            aria-label="Filtros por status"
          >
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? "is-active" : ""}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="fg-dashboard-quick-actions">
            <AppButton
              className="fg-home-filter-btn"
              onClick={() => {
                showSuccess("Pendências visíveis marcadas para resolução");
                navigate("/alertas");
              }}
            >
              Resolver pendência
            </AppButton>
            <AppButton
              className="fg-home-filter-btn"
              onClick={() => {
                showInfo("Abrindo agenda de manutenção");
                navigate("/agendamentos");
              }}
            >
              Agendar manutenção
            </AppButton>
          </div>
        </div>

        <div className="fg-home-section-head">
          <h3>Lista principal de veículos</h3>
          <button type="button">{filteredVehicles.length} resultados</button>
        </div>

        <article className="fg-home-list-card fg-dashboard-table-card">
          <div className="fg-dashboard-table-wrap">
            <table className="fg-dashboard-table">
              <thead>
                <tr>
                  <th>ID do veículo</th>
                  <th>Modelo</th>
                  <th>Placa</th>
                  <th>Motorista responsável</th>
                  <th>Status</th>
                  <th>Pendências</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const isTopIssue =
                    highestPendingCount > 0 &&
                    vehicle.pendencies.length === highestPendingCount;
                  const targetPending = vehicle.pendencies[0];
                  const rowTarget = targetPending
                    ? `/pendencias/${vehicle.id}/${targetPending.slug}`
                    : null;

                  return (
                    <TableRow
                      key={vehicle.id}
                      className={`${isTopIssue ? "is-priority" : ""} ${rowTarget ? "is-clickable" : ""}`}
                      onClick={
                        rowTarget ? () => navigate(rowTarget) : undefined
                      }
                      onKeyDown={
                        rowTarget
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                navigate(rowTarget);
                              }
                            }
                          : undefined
                      }
                      tabIndex={rowTarget ? 0 : -1}
                    >
                      <td>
                        <strong>{vehicle.id}</strong>
                        {isTopIssue ? (
                          <span className="fg-dashboard-row-flag">
                            Mais pendências
                          </span>
                        ) : null}
                      </td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.plate}</td>
                      <td>{vehicle.driver}</td>
                      <td>
                        <span
                          className={`fg-dashboard-status-pill is-${vehicle.statusTone}`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td>
                        <div className="fg-dashboard-pending-list">
                          {vehicle.pendencies.length > 0 ? (
                            vehicle.pendencies.map((pending) => (
                              <PendingChip
                                key={`${vehicle.id}-${pending.slug}-${pending.label}`}
                                vehicle={vehicle}
                                pending={pending}
                                onOpenModal={openPendingModal}
                              />
                            ))
                          ) : (
                            <span className="fg-dashboard-no-pending">
                              Sem pendências
                            </span>
                          )}
                        </div>
                      </td>
                    </TableRow>
                  );
                })}
              </tbody>
            </table>

            {filteredVehicles.length === 0 ? (
              <EmptyState
                title="Nenhum veículo encontrado"
                description="Ajuste os filtros para visualizar os veículos da frota."
                actionLabel="Limpar filtros"
                onAction={() => {
                  setStatusFilter("Todos");
                  setVehicleFilter("");
                }}
              />
            ) : null}
          </div>
        </article>
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
        viewMoreLabel={summaryModal?.buttonLabel ?? "Ver mais detalhes"}
      />

      <QuickInfoModal
        isOpen={Boolean(pendingModal)}
        title={pendingModal?.title ?? "Pendência"}
        items={pendingModal?.items ?? []}
        onClose={() => setPendingModal(null)}
        onViewMore={() => {
          if (pendingModal?.route) {
            navigate(pendingModal.route);
          }
          setPendingModal(null);
        }}
        viewMoreLabel="Ver mais detalhes"
      />
    </AppLayout>
  );
}
