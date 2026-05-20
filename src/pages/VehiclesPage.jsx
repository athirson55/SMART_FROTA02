import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppIcon } from "../components/AppIcon";
import { AppHeader } from "../components/AppHeader";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/ui/EmptyState";
import { getVehicles, deleteVehicle } from "../services/vehicles";
import { getRoutes } from "../services/routes";
import { getDrivers } from "../services/drivers";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { NovoVeiculoModal } from "../components/NovoVeiculoModal";

function TrackingModal({ vehicle, onClose }) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicle) return;
    setLoading(true);
    getRoutes({ veiculoId: vehicle.id, status: "EM_ANDAMENTO", limit: 1 })
      .then((res) => {
        const routes = res.data?.data ?? [];
        setActiveRoute(routes[0] ?? null);
      })
      .catch(() => setActiveRoute(null))
      .finally(() => setLoading(false));
  }, [vehicle]);

  if (!vehicle) return null;

  const statusColor =
    vehicle.status === "Em rota" ? "#2563EB" :
    vehicle.status === "Em manutenção" ? "#DC2626" : "#16A34A";

  return (
    <div className="drawer-overlay open" onClick={onClose}>
      <div className="drawer" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-icon" style={{ background: "#EFF6FF" }}>
            <svg viewBox="0 0 24 24" style={{ fill: "#2563EB", width: 22, height: 22 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="drawer-head-text">
            <div className="drawer-htitle">Rastreamento — {vehicle.model}</div>
            <div className="drawer-hsub">{vehicle.plate}</div>
          </div>
          <button className="drawer-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          <div style={{ background: "#F1F5F9", borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📍</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B" }}>{vehicle.model}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>{vehicle.plate}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 600, color: statusColor, border: `1.5px solid ${statusColor}` }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
              {vehicle.status}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>GPS simulado — integração disponível via API</div>
          </div>

          <section className="drawer-section">
            <div className="drawer-section-title">Informações do veículo</div>
            <div className="drawer-row"><div className="drawer-label">Motorista</div><div className="drawer-value">{vehicle.driver}</div></div>
            <div className="drawer-row"><div className="drawer-label">Km atual</div><div className="drawer-value mono">{(vehicle.km ?? 0).toLocaleString("pt-BR")} km</div></div>
            <div className="drawer-row">
              <div className="drawer-label">Status</div>
              <div className="drawer-value" style={{ color: statusColor, fontWeight: 600 }}>{vehicle.status}</div>
            </div>
          </section>

          {loading ? (
            <div style={{ textAlign: "center", padding: 16, color: "#64748B", fontSize: 13 }}>Carregando rota ativa...</div>
          ) : activeRoute ? (
            <section className="drawer-section">
              <div className="drawer-section-title">Rota em andamento</div>
              <div className="drawer-row"><div className="drawer-label">Origem</div><div className="drawer-value">{activeRoute.origem}</div></div>
              <div className="drawer-row"><div className="drawer-label">Destino</div><div className="drawer-value">{activeRoute.destino}</div></div>
              {activeRoute.distanciaKm != null && (
                <div className="drawer-row"><div className="drawer-label">Distância</div><div className="drawer-value mono">{Number(activeRoute.distanciaKm).toLocaleString("pt-BR")} km</div></div>
              )}
            </section>
          ) : (
            <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "14px 16px", fontSize: 13, color: "#64748B", textAlign: "center" }}>
              Nenhuma rota em andamento para este veículo.
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn-full ghost" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}


function normalizeVehicle(vehicle) {
  const motorist = vehicle.motorista || vehicle.driverRelation || {};
  const rawPendencies = vehicle.pendencies || vehicle.pendencias || [];
  const pendencies = rawPendencies.map((p) => ({
    ...p,
    tone: String(p.tone || "amber").toLowerCase(),
  }));
  const rawStatus = vehicle.status || "ATIVO";
  const statusLabel =
    rawStatus === "MANUTENCAO" ? "Em manutenção" :
    rawStatus === "EM_ROTA" ? "Em rota" :
    rawStatus === "INATIVO" ? "Reserva" : "Ativo";

  return {
    ...vehicle,
    model: vehicle.model || vehicle.modelo || "",
    plate: vehicle.plate || vehicle.placa || "",
    driver: vehicle.driver || motorist.nome || motorist.name || "Sem motorista",
    status: statusLabel,
    km: vehicle.km ?? 0,
    capacidade: vehicle.capacidade || null,
    tipoVeiculo: vehicle.tipoVeiculo || null,
    combustivel: vehicle.combustivel || null,
    ano: vehicle.ano || null,
    pendencies,
  };
}

function getCardTone(vehicle) {
  if (vehicle.status === "Em manutenção") {
    return "red";
  }

  if (vehicle.pendencies.length > 0) {
    return "amber";
  }

  return "green";
}

function getStatusBadgeClass(vehicle) {
  if (vehicle.status === "Em manutenção") {
    return "fg-vehicles-badge-red";
  }

  if (vehicle.status === "Em rota") {
    return "fg-vehicles-badge-blue";
  }

  if (vehicle.status === "Reserva") {
    return "fg-vehicles-badge-purple";
  }

  if (vehicle.pendencies.length === 0) {
    return "fg-vehicles-badge-green";
  }

  return "fg-vehicles-badge-blue";
}

export function VehiclesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showInfo, showError } = useUiFeedback();
  const [vehicles, setVehicles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [trackingVehicle, setTrackingVehicle] = useState(null);
  const [motoristas, setMotoristas] = useState([]);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");

  // Carregar veículos da API
  useEffect(() => {
    getVehicles({ limit: 100 })
      .then((res) => {
        const data = res.data?.data ?? [];
        setVehicles(data.map(normalizeVehicle));
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos:", err);
        setVehicles([]);
      });
  }, []);

  function carregarMotoristas() {
    getDrivers({ limit: 100 })
      .then((res) => {
        setMotoristas(res.data?.data ?? []);
      })
      .catch(() => setMotoristas([]));
  }

  function abrirModal() {
    setEditingVehicle(null);
    carregarMotoristas();
    setModalOpen(true);
  }

  function abrirEdicao(vehicle) {
    setEditingVehicle(vehicle);
    carregarMotoristas();
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditingVehicle(null);
  }

  function handleVeiculoCriado(novoVeiculo) {
    const normalizedVehicle = normalizeVehicle(novoVeiculo);
    showSuccess(`Veículo ${normalizedVehicle.plate || ""} cadastrado!`);
    setModalOpen(false);
    setEditingVehicle(null);
    setVehicles((prev) =>
      prev.some((vehicle) => vehicle.id === normalizedVehicle.id)
        ? prev.map((vehicle) =>
            vehicle.id === normalizedVehicle.id ? normalizedVehicle : vehicle,
          )
        : [...prev, normalizedVehicle],
    );
  }

  function handleVeiculoAtualizado(veiculoAtualizado) {
    const normalizedVehicle = normalizeVehicle(veiculoAtualizado);
    showSuccess(`Veículo ${normalizedVehicle.plate || ""} atualizado!`);
    setModalOpen(false);
    setEditingVehicle(null);
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === normalizedVehicle.id ? normalizedVehicle : vehicle,
      ),
    );
  }

  function handleDeleteVehicle(vehicleId, vehiclePlate) {
    if (!window.confirm(`Remover o veículo ${vehiclePlate}? Esta ação não pode ser desfeita.`)) return;
    deleteVehicle(vehicleId)
      .then(() => {
        showSuccess(`Veículo ${vehiclePlate} removido com sucesso`);
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      })
      .catch((err) => {
        console.error("Erro ao remover veículo:", err);
        showError("Erro ao remover veículo");
      });
  }

  useEffect(() => {
    const routeSearch = searchParams.get("search") ?? "";
    setQuery(routeSearch);
  }, [searchParams]);

  useEffect(() => {
    const normalized = query.trim();

    if (!normalized) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("search");
        return next;
      });
      return;
    }

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("search", normalized);
      return next;
    });
  }, [query, setSearchParams]);

  const vehicleList = useMemo(() => vehicles, [vehicles]);

  const filterCounters = useMemo(() => {
    const all = vehicleList.length;
    const active = vehicleList.filter(
      (vehicle) => vehicle.status === "Ativo",
    ).length;
    const withPending = vehicleList.filter(
      (vehicle) => vehicle.pendencies.length > 0,
    ).length;
    const inMaintenance = vehicleList.filter(
      (vehicle) => vehicle.status === "Em manutenção",
    ).length;
    const available = vehicleList.filter(
      (vehicle) =>
        vehicle.pendencies.length === 0 && vehicle.status !== "Em manutenção",
    ).length;

    return {
      Todos: all,
      Ativos: active,
      "Com Pendências": withPending,
      "Em Manutenção": inMaintenance,
      Disponíveis: available,
    };
  }, [vehicleList]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vehicleList.filter((vehicle) => {
      const matchFilter =
        activeFilter === "Todos" ||
        (activeFilter === "Ativos" && vehicle.status === "Ativo") ||
        (activeFilter === "Com Pendências" && vehicle.pendencies.length > 0) ||
        (activeFilter === "Em Manutenção" &&
          vehicle.status === "Em manutenção") ||
        (activeFilter === "Disponíveis" &&
          vehicle.pendencies.length === 0 &&
          vehicle.status !== "Em manutenção");

      const matchQuery =
        normalizedQuery.length === 0 ||
        [vehicle.id, vehicle.model, vehicle.plate, vehicle.driver]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchFilter && matchQuery;
    });
  }, [activeFilter, query, vehicleList]);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-vehicles-content">
        <section className="fg-vehicles-top-panel">
          <div className="fg-vehicles-top-head">
            <h3>
              Todos os Veículos
              <span className="fg-vehicles-subtitle">
                {" "}
                - {filteredVehicles.length} encontrados
              </span>
            </h3>

            <div className="fg-vehicles-top-actions">
              <div className="fg-vehicles-view-switch">
                <button type="button" aria-label="Visualização em grade">
                  <AppIcon type="grid" />
                </button>
                <button type="button" aria-label="Visualização em lista">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 6h2v2H4zM8 6h12v2H8zM4 11h2v2H4zM8 11h12v2H8zM4 16h2v2H4zM8 16h12v2H8z" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                className="fg-home-new-btn"
                onClick={abrirModal}
              >
                <span>+</span> Cadastrar Veículo
              </button>
            </div>
          </div>

          <div className="fg-vehicles-toolbar">
            <div className="fg-vehicles-search-wrap">
              <span className="fg-vehicles-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar veículo, placa ou motorista"
              />
            </div>

            <button
              type="button"
              className="fg-ui-button"
              onClick={() => {
                showInfo("Abrindo agenda para manutenção");
                navigate("/agendamentos");
              }}
            >
              Agendar manutenção
            </button>
          </div>

          <div
            className="fg-vehicles-filter-bar"
            role="tablist"
            aria-label="Filtros de veículos"
          >
            {Object.keys(filterCounters).map((filterName) => (
              <button
                key={filterName}
                type="button"
                role="tab"
                aria-selected={activeFilter === filterName}
                className={activeFilter === filterName ? "is-active" : ""}
                onClick={() => setActiveFilter(filterName)}
              >
                <span>{filterName}</span>
                <em>{filterCounters[filterName]}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="fg-vehicles-grid">
          {filteredVehicles.map((vehicle) => {
            const tone = getCardTone(vehicle);
            const firstPending = vehicle.pendencies[0];
            const navigateTo = firstPending
              ? `/pendencias/${vehicle.id}/${firstPending.slug}`
              : `/veiculos`;

            return (
              <article
                key={vehicle.id}
                className={`fg-vehicle-card is-${tone}`}
                onClick={() => navigate(navigateTo)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(navigateTo);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="fg-vehicle-card-head">
                  <span className={`fg-vehicle-icon is-${tone}`}>
                    <AppIcon type="truck" />
                  </span>

                  <div className="fg-vehicle-head-meta">
                    <h4>{vehicle.model}</h4>
                    <p>{vehicle.plate}</p>
                  </div>

                  <span
                    className={`fg-vehicle-status ${getStatusBadgeClass(vehicle)}`}
                  >
                    {vehicle.status}
                  </span>
                  <div className="fg-vehicle-card-actions">
                    <button
                      type="button"
                      className="fg-vehicle-action-btn"
                      aria-label={`Rastrear ${vehicle.plate}`}
                      title="Rastrear veículo"
                      onClick={(event) => {
                        event.stopPropagation();
                        setTrackingVehicle(vehicle);
                      }}
                    >
                      <AppIcon type="pin" />
                    </button>
                    <button
                      type="button"
                      className="fg-vehicle-action-btn"
                      aria-label={`Editar ${vehicle.plate}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirEdicao(vehicle);
                      }}
                    >
                      <AppIcon type="wrench" />
                    </button>
                    <button
                      type="button"
                      className="fg-vehicle-action-btn is-danger"
                      aria-label={`Remover ${vehicle.plate}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteVehicle(vehicle.id, vehicle.plate);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="fg-vehicle-specs">
                  <div>
                    <small>Km atual</small>
                    <strong>{(vehicle.km ?? 0).toLocaleString("pt-BR")}</strong>
                  </div>
                  <div>
                    <small>{vehicle.capacidade ? "Capacidade" : (vehicle.tipoVeiculo ? "Tipo" : "Combustível")}</small>
                    <strong>{vehicle.capacidade || vehicle.tipoVeiculo || vehicle.combustivel || "—"}</strong>
                  </div>
                  <div>
                    <small>Motorista</small>
                    <strong>{vehicle.driver}</strong>
                  </div>
                </div>

                {vehicle.pendencies.length > 0 ? (
                  <div className="fg-vehicle-pending-list">
                    {vehicle.pendencies.map((pending) => (
                      <button
                        key={`${vehicle.id}-${pending.slug}-${pending.label}`}
                        type="button"
                        className={`fg-vehicle-pending-item is-${pending.tone}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          showSuccess("Pendência selecionada");
                          navigate(`/pendencias/${vehicle.id}/${pending.slug}`);
                        }}
                      >
                        <span>{pending.label}</span>
                        <small>{pending.detail}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="fg-vehicle-ok">
                    Sem pendências - tudo em dia
                  </div>
                )}
              </article>
            );
          })}

          {filteredVehicles.length === 0 ? (
            <EmptyState
              title="Nenhum veículo cadastrado"
              description="Ajuste os filtros ou adicione um novo veículo para começar."
              actionLabel="Adicionar veículo"
              onAction={abrirModal}
            />
          ) : null}
        </section>
      </div>
      <NovoVeiculoModal
        open={modalOpen}
        onClose={fecharModal}
        motoristas={motoristas}
        onCreated={handleVeiculoCriado}
        onUpdated={handleVeiculoAtualizado}
        initialValues={editingVehicle}
        title={editingVehicle ? "Editar Veículo" : "Cadastro de Veículo"}
        submitLabel={editingVehicle ? "Salvar alterações" : "Cadastrar Veículo"}
      />

      {trackingVehicle && (
        <TrackingModal vehicle={trackingVehicle} onClose={() => setTrackingVehicle(null)} />
      )}
    </AppLayout>
  );
}
