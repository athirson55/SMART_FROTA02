import "../styles/dashboard.css";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { AppIcon } from "../components/AppIcon";
import { EmptyState } from "../components/ui/EmptyState";
import { getDrivers, deleteDriver } from "../services/drivers";
import { getVehicles } from "../services/vehicles";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { AdicionarMotoristaModal } from "../components/AdicionarMotoristaModal";

const filterKeys = ["Todos", "Em rota", "Disponível", "Afastado"];

const STATUS_MAP = {
  DISPONIVEL: "Disponível",
  EM_ROTA: "Em rota",
  AFASTADO: "Afastado",
};

function normalizeStatus(raw) {
  if (!raw) return "Disponível";
  return STATUS_MAP[String(raw).toUpperCase()] ?? raw;
}

function normalizeDriver(driver) {
  const initialsSource =
    driver.initials || driver.iniciais || driver.name || driver.nome || "";
  const initials = initialsSource
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const vehicleSource = driver.vehicle || driver.veiculo || null;
  const vehicle =
    typeof vehicleSource === "object" && vehicleSource
      ? [
          vehicleSource.modelo || vehicleSource.model,
          vehicleSource.placa || vehicleSource.plate,
        ]
          .filter(Boolean)
          .join(" — ")
      : vehicleSource || "Sem veículo";

  return {
    ...driver,
    name: driver.name || driver.nome || "",
    role: driver.role || driver.cargo || "Motorista",
    email: driver.email || "",
    phone: driver.phone || driver.telefone || "",
    cnh: driver.cnh || "",
    category: driver.category || driver.cnhCategoria || "",
    status: normalizeStatus(driver.status),
    vehicle,
    initials,
    avatarTone: driver.avatarTone || driver.avatarCor || "blue",
  };
}

function statusClass(status) {
  if (status === "Em rota") {
    return "fg-drivers-badge-green";
  }

  if (status === "Disponível") {
    return "fg-drivers-badge-amber";
  }

  if (status === "Afastado") {
    return "fg-drivers-badge-red";
  }

  return "fg-drivers-badge-gray";
}

export function DriversPage() {
  const isMobile = useIsMobile(900);
  const { showInfo, showSuccess, showError } = useUiFeedback();
  const [drivers, setDrivers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState("table");
  const [vehicleMap, setVehicleMap] = useState({});

  // Carregar motoristas e veículos da API
  useEffect(() => {
    Promise.all([
      getDrivers({ limit: 100 }),
      getVehicles({ limit: 100 }),
    ])
      .then(([driverRes, vehicleRes]) => {
        const vehicleData = vehicleRes.data?.data ?? [];
        // Build map: motorista_id → vehicle info
        const map = {};
        vehicleData.forEach((v) => {
          const mid = v.motoristaId || v.motorista_id || v.motorista?.id;
          if (mid) {
            map[mid] = {
              placa: v.placa || v.plate || "",
              modelo: v.modelo || v.model || "",
              status: v.status || "ATIVO",
            };
          }
        });
        startTransition(() => {
          setVehicleMap(map);
          setDrivers((driverRes.data?.data ?? []).map(normalizeDriver));
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar motoristas:", err);
        setDrivers([]);
      });
  }, []);

  function handleMotoristaCriado(novoMotorista) {
    const normalizedDriver = normalizeDriver(novoMotorista);
    showSuccess("Motorista " + (normalizedDriver.name || "") + " adicionado!");
    setModalOpen(false);
    setEditingDriver(null);
    setDrivers((prev) =>
      prev.some((driver) => driver.id === normalizedDriver.id)
        ? prev.map((driver) =>
            driver.id === normalizedDriver.id ? normalizedDriver : driver,
          )
        : [...prev, normalizedDriver],
    );
  }

  function handleMotoristaAtualizado(motoristaAtualizado) {
    const normalizedDriver = normalizeDriver(motoristaAtualizado);
    showSuccess("Motorista atualizado com sucesso!");
    setModalOpen(false);
    setEditingDriver(null);
    setDrivers((prev) =>
      prev.map((driver) =>
        driver.id === normalizedDriver.id ? normalizedDriver : driver,
      ),
    );
  }

  function handleDeleteDriver(driverId, driverName) {
    if (!window.confirm(`Remover o motorista ${driverName}? Esta ação não pode ser desfeita.`)) return;
    deleteDriver(driverId)
      .then(() => {
        showSuccess(`${driverName} removido com sucesso`);
        setDrivers((prev) => prev.filter((d) => d.id !== driverId));
      })
      .catch((err) => {
        console.error("Erro ao remover motorista:", err);
        showError("Erro ao remover motorista");
      });
  }

  function abrirModal() {
    window.requestAnimationFrame(() => {
      startTransition(() => {
        setEditingDriver(null);
        setModalOpen(true);
      });
    });
  }

  function abrirEdicao(driver) {
    window.requestAnimationFrame(() => {
      startTransition(() => {
        setEditingDriver(driver);
        setModalOpen(true);
      });
    });
  }

  function fecharModal() {
    setModalOpen(false);
    setEditingDriver(null);
  }

  const counters = useMemo(() => {
    const total = drivers.length;
    const emRota = drivers.filter(
      (driver) => driver.status === "Em rota",
    ).length;
    const disponivel = drivers.filter(
      (driver) => driver.status === "Disponível",
    ).length;
    const afastado = drivers.filter(
      (driver) => driver.status === "Afastado",
    ).length;

    return {
      Todos: total,
      "Em rota": emRota,
      Disponível: disponivel,
      Afastado: afastado,
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchFilter =
        activeFilter === "Todos" || driver.status === activeFilter;

      const matchQuery =
        normalized.length === 0 ||
        [
          driver.id,
          driver.name,
          driver.email,
          driver.phone,
          driver.cnh,
          driver.vehicle,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return matchFilter && matchQuery;
    });
  }, [activeFilter, query, drivers]);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-drivers-content">
        <section className="fg-drivers-page-top">
          <div>
            <h3>Gestão de Motoristas</h3>
            <p>Visualize, cadastre e gerencie os motoristas da sua frota</p>
          </div>

          <button
            type="button"
            className="fg-home-new-btn"
            onClick={abrirModal}
          >
            <span>+</span> Adicionar Motorista
          </button>
        </section>

        <section className="fg-drivers-kpi-strip">
          <article className="fg-drivers-kpi-card">
            <span className="fg-drivers-kpi-icon is-blue">
              <AppIcon type="users" />
            </span>
            <div>
              <strong>{counters.Todos}</strong>
              <small>Total de motoristas</small>
            </div>
          </article>

          <article className="fg-drivers-kpi-card">
            <span className="fg-drivers-kpi-icon is-green">
              <AppIcon type="pin" />
            </span>
            <div>
              <strong>{counters["Em rota"]}</strong>
              <small>Em rota</small>
            </div>
          </article>

          <article className="fg-drivers-kpi-card">
            <span className="fg-drivers-kpi-icon is-amber">
              <AppIcon type="clock" />
            </span>
            <div>
              <strong>{counters["Disponível"]}</strong>
              <small>Disponíveis</small>
            </div>
          </article>

          <article className="fg-drivers-kpi-card">
            <span className="fg-drivers-kpi-icon is-red">
              <AppIcon type="doc" />
            </span>
            <div>
              <strong>{counters.Afastado}</strong>
              <small>Afastados</small>
            </div>
          </article>
        </section>

        <section className="fg-drivers-toolbar-wrap">
          <div className="fg-drivers-toolbar-left">
            {filterKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={activeFilter === key ? "is-active" : ""}
                onClick={() => setActiveFilter(key)}
              >
                <span>{key}</span>
                <em>{counters[key]}</em>
              </button>
            ))}
          </div>

          <div className="fg-drivers-toolbar-right">
            <div className="fg-drivers-search-wrap">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, email, telefone ou CNH"
              />
            </div>

            <div className="fg-drivers-view-switch">
              <button
                type="button"
                className={viewMode === "table" ? "is-active" : ""}
                onClick={() => setViewMode("table")}
                aria-label="Visualização tabela"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6h2v2H4zM8 6h12v2H8zM4 11h2v2H4zM8 11h12v2H8zM4 16h2v2H4zM8 16h12v2H8z" />
                </svg>
              </button>

              <button
                type="button"
                className={viewMode === "cards" ? "is-active" : ""}
                onClick={() => setViewMode("cards")}
                aria-label="Visualização cards"
              >
                <AppIcon type="grid" />
              </button>
            </div>
          </div>
        </section>

        {viewMode === "table" ? (
          <section className="fg-drivers-table-card">
            <div className="fg-drivers-table-wrap">
              <table className="fg-drivers-table">
                <thead>
                  <tr>
                    <th>Motorista</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>CNH</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Veículo</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td>
                        <div className="fg-driver-cell">
                          <span
                            className={`fg-driver-avatar is-${driver.avatarTone}`}
                          >
                            {driver.initials}
                          </span>
                          <div>
                            <strong>{driver.name}</strong>
                            <small>{driver.role}</small>
                          </div>
                        </div>
                      </td>
                      <td>{driver.email}</td>
                      <td>{driver.phone}</td>
                      <td>
                        <span className="fg-driver-cnh">{driver.cnh}</span>
                      </td>
                      <td>
                        <span className="fg-driver-category">
                          {driver.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`fg-driver-status ${statusClass(driver.status)}`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td>
                        {vehicleMap[driver.id] ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <strong style={{ fontSize: 13 }}>{vehicleMap[driver.id].modelo}</strong>
                            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748B" }}>{vehicleMap[driver.id].placa}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: 12 }}>Sem veículo</span>
                        )}
                      </td>
                      <td>
                        <div className="fg-driver-actions">
                          <button
                            type="button"
                            aria-label={`Editar ${driver.name}`}
                            onClick={() => abrirEdicao(driver)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            aria-label={`Remover ${driver.name}`}
                            onClick={() =>
                              handleDeleteDriver(driver.id, driver.name)
                            }
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDrivers.length === 0 ? (
                <EmptyState
                  title="Nenhum motorista encontrado"
                  description="Refine a busca ou cadastre um novo motorista."
                  actionLabel="Cadastrar motorista"
                  onAction={() => setModalOpen(true)}
                />
              ) : null}
            </div>
          </section>
        ) : (
          <section className="fg-drivers-cards-grid">
            {filteredDrivers.map((driver) => (
              <article key={driver.id} className="fg-driver-card">
                <div className="fg-driver-card-head">
                  <span className={`fg-driver-avatar is-${driver.avatarTone}`}>
                    {driver.initials}
                  </span>
                  <div>
                    <h4>{driver.name}</h4>
                    <p>{driver.role}</p>
                  </div>
                </div>

                <div
                  className="fg-driver-actions"
                  style={{ justifyContent: "flex-end", marginTop: 12 }}
                >
                  <button
                    type="button"
                    aria-label={`Editar ${driver.name}`}
                    onClick={() => abrirEdicao(driver)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${driver.name}`}
                    onClick={() => handleDeleteDriver(driver.id, driver.name)}
                  >
                    ×
                  </button>
                </div>

                <div className="fg-driver-card-rows">
                  <div>
                    <small>Email</small>
                    <strong>{driver.email}</strong>
                  </div>
                  <div>
                    <small>Telefone</small>
                    <strong>{driver.phone}</strong>
                  </div>
                  <div>
                    <small>Veículo</small>
                    <strong>{driver.vehicle}</strong>
                  </div>
                </div>

                <div className="fg-driver-card-foot">
                  <span
                    className={`fg-driver-status ${statusClass(driver.status)}`}
                  >
                    {driver.status}
                  </span>
                  <span className="fg-driver-cnh">CNH {driver.cnh}</span>
                </div>
              </article>
            ))}

            {filteredDrivers.length === 0 ? (
              <EmptyState
                title="Nenhum motorista encontrado"
                description="Refine a busca ou cadastre um novo motorista."
                actionLabel="Cadastrar motorista"
                onAction={() => setModalOpen(true)}
              />
            ) : null}
          </section>
        )}
      </div>
      <AdicionarMotoristaModal
        open={modalOpen}
        onClose={fecharModal}
        onCreated={handleMotoristaCriado}
        onUpdated={handleMotoristaAtualizado}
        initialValues={editingDriver}
        title={editingDriver ? "Editar Motorista" : "Adicionar Motorista"}
        submitLabel={
          editingDriver ? "Salvar alterações" : "Adicionar Motorista"
        }
      />
    </AppLayout>
  );
}
