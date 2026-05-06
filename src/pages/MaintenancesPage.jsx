import "../styles/dashboard.css";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { AppIcon } from "../components/AppIcon";
import { getMaintenances, deleteMaintenance } from "../services/maintenances";
import { getVehicles } from "../services/vehicles";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { NovaManutencaoModal } from "../components/NovaManutencaoModal";

const typeLabels = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  preditiva: "Preditiva",
  revisao: "Revisão",
};

const statusLabels = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const priorityLabels = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

function normalizeMaintenance(item) {
  const vehicleInfo = item.veiculo || {};
  const vehicleSource =
    item.vehicle || item.veiculoLabel || item.veiculo || null;
  const vehicleLabel =
    typeof vehicleSource === "object" && vehicleSource
      ? [
          vehicleSource.modelo || vehicleSource.model,
          vehicleSource.placa || vehicleSource.plate,
        ]
          .filter(Boolean)
          .join(" — ")
      : vehicleSource ||
        [
          vehicleInfo.modelo || vehicleInfo.model,
          vehicleInfo.placa || vehicleInfo.plate,
        ]
          .filter(Boolean)
          .join(" — ");

  const rawDate = item.date || item.data || "";
  const normalizedDate = rawDate ? String(rawDate).slice(0, 10) : "";

  return {
    ...item,
    vehicle: vehicleLabel,
    type: item.type || item.tipo || "preventiva",
    description: item.description || item.descricao || "",
    date: normalizedDate,
    km: Number(item.km ?? item.quilometragem ?? 0),
    cost: Number(item.cost ?? item.custo ?? 0),
    priority: item.priority || item.prioridade || "media",
    status: item.status || "pendente",
  };
}

function statusClass(status) {
  if (status === "pendente") {
    return "fg-maint-badge-amber";
  }
  if (status === "em_andamento") {
    return "fg-maint-badge-blue";
  }
  return "fg-maint-badge-green";
}

function typeClass(type) {
  if (type === "corretiva") {
    return "fg-maint-type-red";
  }
  if (type === "preditiva") {
    return "fg-maint-type-purple";
  }
  if (type === "revisao") {
    return "fg-maint-type-green";
  }
  return "fg-maint-type-blue";
}

function priorityClass(priority) {
  if (priority === "alta") {
    return "fg-maint-badge-red";
  }
  if (priority === "media") {
    return "fg-maint-badge-amber";
  }
  return "fg-maint-badge-green";
}

export function MaintenancesPage() {
  const isMobile = useIsMobile(900);
  const { showSuccess, showError } = useUiFeedback();
  const [maintenances, setMaintenances] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("data_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [veiculos, setVeiculos] = useState([]);

  // Carregar manutenções da API
  useEffect(() => {
    getMaintenances({ limit: 100 })
      .then((res) => {
        const data = res.data?.data ?? [];
        startTransition(() => {
          setMaintenances(data.map(normalizeMaintenance));
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar manutenções:", err);
        setMaintenances([]);
      });
  }, []);

  async function abrirModal() {
    setEditingMaintenance(null);
    try {
      const res = await getVehicles({ limit: 100 });
      startTransition(() => {
        setVeiculos(res.data?.data ?? []);
      });
    } catch {
      setVeiculos([]);
    }

    window.requestAnimationFrame(() => {
      startTransition(() => {
        setModalOpen(true);
      });
    });
  }

  async function abrirEdicao(item) {
    setEditingMaintenance(item);
    try {
      const res = await getVehicles({ limit: 100 });
      startTransition(() => {
        setVeiculos(res.data?.data ?? []);
      });
    } catch {
      setVeiculos([]);
    }

    window.requestAnimationFrame(() => {
      startTransition(() => {
        setModalOpen(true);
      });
    });
  }

  function fecharModal() {
    setModalOpen(false);
    setEditingMaintenance(null);
  }

  function handleManutencaoCriada(nova) {
    showSuccess("Manutenção criada com sucesso!");
    setModalOpen(false);
    setEditingMaintenance(null);
    const normalized = normalizeMaintenance(nova);
    setMaintenances((prev) =>
      prev.some((item) => item.id === normalized.id)
        ? prev.map((item) => (item.id === normalized.id ? normalized : item))
        : [...prev, normalized],
    );
  }

  function handleManutencaoAtualizada(atualizada) {
    const normalized = normalizeMaintenance(atualizada);
    showSuccess("Manutenção atualizada com sucesso!");
    setModalOpen(false);
    setEditingMaintenance(null);
    setMaintenances((prev) =>
      prev.map((item) => (item.id === normalized.id ? normalized : item)),
    );
  }

  function handleDeleteMaintenance(maintId) {
    deleteMaintenance(maintId)
      .then(() => {
        showSuccess("Manutenção removida com sucesso");
        setMaintenances((prev) => prev.filter((m) => m.id !== maintId));
      })
      .catch((err) => {
        console.error("Erro ao remover manutenção:", err);
        showError("Erro ao remover manutenção");
      });
  }

  const counters = useMemo(() => {
    const total = maintenances.length;
    const pendente = maintenances.filter(
      (item) => item.status === "pendente",
    ).length;
    const andamento = maintenances.filter(
      (item) => item.status === "em_andamento",
    ).length;
    const concluida = maintenances.filter(
      (item) => item.status === "concluida",
    ).length;
    const preventiva = maintenances.filter(
      (item) => item.type === "preventiva",
    ).length;
    const corretiva = maintenances.filter(
      (item) => item.type === "corretiva",
    ).length;

    return { total, pendente, andamento, concluida, preventiva, corretiva };
  }, [maintenances]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const list = maintenances.filter((item) => {
      const filterMatch =
        activeFilter === "todos" ||
        item.status === activeFilter ||
        item.type === activeFilter;

      const queryMatch =
        normalized.length === 0 ||
        [
          item.vehicle,
          item.description,
          typeLabels[item.type],
          statusLabels[item.status],
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      return filterMatch && queryMatch;
    });

    const sorted = list.slice().sort((a, b) => {
      if (sortBy === "data_desc") {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === "data_asc") {
        return a.date.localeCompare(b.date);
      }
      if (sortBy === "custo_desc") {
        return b.cost - a.cost;
      }
      if (sortBy === "custo_asc") {
        return a.cost - b.cost;
      }
      if (sortBy === "veiculo") {
        return a.vehicle.localeCompare(b.vehicle);
      }
      return 0;
    });

    return sorted;
  }, [activeFilter, query, sortBy, maintenances]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function formatDate(dateText) {
    const [year, month, day] = dateText.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    });
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-maint-content">
        <section className="fg-maint-page-top">
          <div>
            <h3>Gestão de Manutenções</h3>
            <p>Histórico completo e agendamentos da frota</p>
          </div>

          <button
            type="button"
            className="fg-home-new-btn"
            onClick={abrirModal}
          >
            <span>+</span> Nova Manutenção
          </button>
        </section>

        <section className="fg-maint-kpi-strip">
          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-blue">
              <AppIcon type="wrench" />
            </span>
            <div>
              <strong>{counters.total}</strong>
              <small>Total de registros</small>
            </div>
          </article>

          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-amber">
              <AppIcon type="clock" />
            </span>
            <div>
              <strong>{counters.pendente}</strong>
              <small>Pendentes</small>
            </div>
          </article>

          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-purple">
              <AppIcon type="chart" />
            </span>
            <div>
              <strong>{counters.andamento}</strong>
              <small>Em andamento</small>
            </div>
          </article>

          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-green">
              <AppIcon type="doc" />
            </span>
            <div>
              <strong>{counters.concluida}</strong>
              <small>Concluídas</small>
            </div>
          </article>

          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-red">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
            </span>
            <div>
              <strong>
                {formatCurrency(
                  maintenances.reduce((sum, item) => sum + item.cost, 0),
                )}
              </strong>
              <small>Custo total</small>
            </div>
          </article>
        </section>

        <section className="fg-maint-toolbar">
          <div className="fg-maint-filters">
            {[
              { key: "todos", label: "Todos", count: counters.total },
              { key: "pendente", label: "Pendente", count: counters.pendente },
              {
                key: "em_andamento",
                label: "Em andamento",
                count: counters.andamento,
              },
              {
                key: "concluida",
                label: "Concluída",
                count: counters.concluida,
              },
              {
                key: "preventiva",
                label: "Preventiva",
                count: counters.preventiva,
              },
              {
                key: "corretiva",
                label: "Corretiva",
                count: counters.corretiva,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={activeFilter === filter.key ? "is-active" : ""}
                onClick={() => {
                  setActiveFilter(filter.key);
                  setCurrentPage(1);
                }}
              >
                <span>{filter.label}</span>
                <em>{filter.count}</em>
              </button>
            ))}
          </div>

          <div className="fg-maint-toolbar-right">
            <div className="fg-maint-search-wrap">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar veículo, tipo ou descrição"
              />
            </div>

            <select
              className="fg-maint-sort-select"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="data_desc">Data ↓ Recente</option>
              <option value="data_asc">Data ↑ Antiga</option>
              <option value="custo_desc">Custo ↓</option>
              <option value="custo_asc">Custo ↑</option>
              <option value="veiculo">Veículo A-Z</option>
            </select>
          </div>
        </section>

        <section className="fg-maint-table-card">
          <div className="fg-maint-table-wrap">
            <table className="fg-maint-table">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Quilometragem</th>
                  <th>Custo</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((item) => {
                  const [model, plate] = item.vehicle.split(" — ");

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="fg-maint-vehicle-cell">
                          <span className="fg-maint-vehicle-icon">
                            <AppIcon type="truck" />
                          </span>
                          <div>
                            <strong>{model}</strong>
                            <small>{plate}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`fg-maint-type ${typeClass(item.type)}`}
                        >
                          {typeLabels[item.type]}
                        </span>
                        <p className="fg-maint-description">
                          {item.description}
                        </p>
                      </td>

                      <td>{formatDate(item.date)}</td>
                      <td>{item.km.toLocaleString("pt-BR")} km</td>
                      <td>{formatCurrency(item.cost)}</td>
                      <td>
                        <span
                          className={`fg-maint-badge ${priorityClass(item.priority)}`}
                        >
                          {priorityLabels[item.priority]}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`fg-maint-badge ${statusClass(item.status)}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </td>
                      <td>
                        <div className="fg-maint-actions">
                          <button
                            type="button"
                            aria-label="Visualizar manutenção"
                            onClick={() => showSuccess(item.description)}
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            aria-label="Editar manutenção"
                            onClick={() => abrirEdicao(item)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            aria-label="Remover manutenção"
                            onClick={() => handleDeleteMaintenance(item.id)}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="fg-maint-empty">
                Nenhuma manutenção encontrada.
              </div>
            ) : null}
          </div>

          <footer className="fg-maint-table-footer">
            <span>
              {filtered.length === 0
                ? "Nenhum resultado"
                : `Exibindo ${(safePage - 1) * pageSize + 1}–${Math.min(
                    safePage * pageSize,
                    filtered.length,
                  )} de ${filtered.length} registros`}
            </span>

            <div className="fg-maint-pagination">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  className={safePage === index + 1 ? "is-active" : ""}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </footer>
        </section>
      </div>
      <NovaManutencaoModal
        open={modalOpen}
        onClose={fecharModal}
        veiculos={veiculos}
        onCreated={handleManutencaoCriada}
        onUpdated={handleManutencaoAtualizada}
        initialValues={editingMaintenance}
        title={editingMaintenance ? "Editar Manutenção" : "Nova Manutenção"}
        submitLabel={
          editingMaintenance ? "Salvar alterações" : "Registrar Manutenção"
        }
      />
    </AppLayout>
  );
}
