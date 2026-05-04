import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { AppIcon } from "../components/AppIcon";
import { EmptyState } from "../components/ui/EmptyState";
import { useIsMobile } from "../hooks/useIsMobile";
import { getAppointments, deleteAppointment } from "../services/appointments";
import { getVehicles } from "../services/vehicles";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { NovoAgendamentoModal } from "../components/NovoAgendamentoModal";

const scheduleSeed = [
  {
    id: 1,
    vehicle: "Eicher Pro 2059",
    plate: "GJ28HT2889",
    type: "Troca de oleo",
    date: "2026-04-21",
    time: "08:00",
    km: 90000,
    owner: "Frota Plus",
    done: false,
  },
  {
    id: 2,
    vehicle: "Tata Prima 4928S",
    plate: "DL1PC4421",
    type: "Revisao de freios",
    date: "2026-04-27",
    time: "09:00",
    km: 126000,
    owner: "Oficina Central",
    done: false,
  },
  {
    id: 3,
    vehicle: "Volvo FH 460",
    plate: "MH02AB1234",
    type: "Alinhamento",
    date: "2026-04-30",
    time: "10:00",
    km: 215000,
    owner: "Auto Center VH",
    done: false,
  },
  {
    id: 4,
    vehicle: "Scania P 360",
    plate: "TN09KL3344",
    type: "Corretiva",
    date: "2026-04-20",
    time: "07:00",
    km: 180000,
    owner: "Scania Service",
    done: false,
  },
  {
    id: 5,
    vehicle: "Iveco Stralis 460",
    plate: "WB28CD4499",
    type: "Troca de pneus",
    date: "2026-05-15",
    time: "13:00",
    km: 24000,
    owner: "Pneus Express",
    done: true,
  },
  {
    id: 6,
    vehicle: "Tata 407 Gold",
    plate: "RJ14CD5566",
    type: "Troca de filtros",
    date: "2026-05-02",
    time: "11:30",
    km: 33000,
    owner: "Frota Plus",
    done: true,
  },
];

const filterItems = [
  { key: "todos", label: "Todos" },
  { key: "agendado", label: "Agendado" },
  { key: "proximo", label: "Proximo" },
  { key: "atrasado", label: "Atrasado" },
  { key: "concluido", label: "Concluido" },
];

function classify(item) {
  if (item.done) {
    return "concluido";
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(item.date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - now) / 86400000);

  if (diff < 0) {
    return "atrasado";
  }
  if (diff <= 7) {
    return "proximo";
  }
  return "agendado";
}

function statusClass(status) {
  if (status === "concluido") {
    return "fg-appt-badge-green";
  }
  if (status === "proximo") {
    return "fg-appt-badge-amber";
  }
  if (status === "atrasado") {
    return "fg-appt-badge-red";
  }
  return "fg-appt-badge-blue";
}

function formatDate(dateText) {
  const [year, month, day] = dateText.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeAppointment(item) {
  const vehicleInfo = item.veiculo || {};
  const vehicle =
    item.vehicle ||
    [
      vehicleInfo.modelo || vehicleInfo.model,
      vehicleInfo.placa || vehicleInfo.plate,
    ]
      .filter(Boolean)
      .join(" — ");

  const rawDate = item.date || item.data || "";
  const date = rawDate ? String(rawDate).slice(0, 10) : "";

  return {
    ...item,
    vehicle,
    plate: item.plate || vehicleInfo.placa || vehicleInfo.plate || "",
    type: item.type || item.tipo || "",
    date,
    time: item.time || item.hora || "08:00",
    km: Number(item.km ?? 0),
    owner: item.owner || item.responsavel || item.local || "",
    done: Boolean(item.done ?? item.concluido ?? false),
  };
}

function AppointmentCard({ item }) {
  return (
    <article className="fg-appt-mobile-card">
      <div className="fg-appt-mobile-card-head">
        <span className="fg-appt-mobile-card-icon">
          <AppIcon type="truck" />
        </span>
        <div className="fg-appt-mobile-card-title">
          <strong>{item.vehicle}</strong>
          <small>{item.plate}</small>
        </div>
        <span className={`fg-appt-badge ${statusClass(item.status)}`}>
          {item.status}
        </span>
      </div>

      <div className="fg-appt-mobile-card-grid">
        <div>
          <span>Tipo</span>
          <strong>{item.type}</strong>
        </div>
        <div>
          <span>Data</span>
          <strong>
            {formatDate(item.date)} • {item.time}
          </strong>
        </div>
        <div>
          <span>Km previsto</span>
          <strong>{item.km.toLocaleString("pt-BR")} km</strong>
        </div>
        <div>
          <span>Responsável</span>
          <strong>{item.owner}</strong>
        </div>
      </div>
    </article>
  );
}

export function AppointmentsPage() {
  const { showSuccess, showError } = useUiFeedback();
  const [appointments, setAppointments] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [monthOffset, setMonthOffset] = useState(0);
  const isMobile = useIsMobile(900);
  const [modalOpen, setModalOpen] = useState(false);
  const [veiculos, setVeiculos] = useState([]);

  // Carregar agendamentos da API
  useEffect(() => {
    getAppointments({ limit: 100 })
      .then((res) => {
        const data = res.data?.data ?? [];
        setAppointments(data.map(normalizeAppointment));
      })
      .catch((err) => {
        console.error("Erro ao carregar agendamentos:", err);
        setAppointments(scheduleSeed); // Fallback
      });
  }, []);

  // Carrega veículos para o select do modal
  function abrirModal() {
    getVehicles({ limit: 100 })
      .then((res) => {
        setVeiculos(res.data?.data ?? []);
      })
      .catch(() => setVeiculos([]));
    setModalOpen(true);
  }

  function handleAgendamentoCriado(novoAgend) {
    showSuccess("Agendamento criado com sucesso!");
    setModalOpen(false);
    setAppointments((prev) => [...prev, normalizeAppointment(novoAgend)]);
  }

  function handleDeleteAppointment(apptId) {
    deleteAppointment(apptId)
      .then(() => {
        showSuccess("Agendamento removido com sucesso");
        setAppointments((prev) => prev.filter((a) => a.id !== apptId));
      })
      .catch((err) => {
        console.error("Erro ao remover agendamento:", err);
        showError("Erro ao remover agendamento");
      });
  }

  const enriched = useMemo(
    () => appointments.map((item) => ({ ...item, status: classify(item) })),
    [appointments],
  );

  const counters = useMemo(
    () => ({
      todos: enriched.length,
      agendado: enriched.filter((item) => item.status === "agendado").length,
      proximo: enriched.filter((item) => item.status === "proximo").length,
      atrasado: enriched.filter((item) => item.status === "atrasado").length,
      concluido: enriched.filter((item) => item.status === "concluido").length,
    }),
    [enriched],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return enriched
      .filter(
        (item) => activeFilter === "todos" || item.status === activeFilter,
      )
      .filter((item) => {
        if (!normalized) {
          return true;
        }

        return [item.vehicle, item.plate, item.type, item.owner]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeFilter, enriched, query]);

  const now = new Date();
  const monthBase = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
  );
  const monthName = monthBase.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const firstWeekDay = monthBase.getDay();
  const monthDays = new Date(
    monthBase.getFullYear(),
    monthBase.getMonth() + 1,
    0,
  ).getDate();

  const daySet = new Set(
    enriched
      .filter((item) => {
        const d = new Date(item.date);
        return (
          d.getFullYear() === monthBase.getFullYear() &&
          d.getMonth() === monthBase.getMonth()
        );
      })
      .map((item) => Number(item.date.split("-")[2])),
  );

  const days = [];
  for (let i = 0; i < firstWeekDay; i += 1) {
    days.push({ day: null, ghost: true });
  }
  for (let day = 1; day <= monthDays; day += 1) {
    days.push({ day, ghost: false, hasEvent: daySet.has(day) });
  }
  while (days.length < 42) {
    days.push({ day: null, ghost: true });
  }

  const upcoming = enriched
    .filter((item) => item.status !== "concluido")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-appt-content">
        <section className="fg-appt-page-top">
          <div>
            <h3>Gestao de Agendamentos</h3>
            <p>Planeje e acompanhe manutencoes preventivas e corretivas</p>
          </div>
          <button
            type="button"
            className="fg-home-new-btn"
            onClick={abrirModal}
          >
            <span>+</span> Novo Agendamento
          </button>
        </section>

        <section className="fg-appt-kpi-strip">
          <article className="fg-appt-kpi-card">
            <span className="fg-appt-kpi-icon is-blue">
              <AppIcon type="calendar" />
            </span>
            <div>
              <strong>{counters.todos}</strong>
              <small>Total agendados</small>
            </div>
          </article>

          <article className="fg-appt-kpi-card">
            <span className="fg-appt-kpi-icon is-amber">
              <AppIcon type="clock" />
            </span>
            <div>
              <strong>{counters.proximo}</strong>
              <small>Proximos 7 dias</small>
            </div>
          </article>

          <article className="fg-appt-kpi-card">
            <span className="fg-appt-kpi-icon is-red">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            <div>
              <strong>{counters.atrasado}</strong>
              <small>Atrasados</small>
            </div>
          </article>

          <article className="fg-appt-kpi-card">
            <span className="fg-appt-kpi-icon is-green">
              <AppIcon type="doc" />
            </span>
            <div>
              <strong>{counters.concluido}</strong>
              <small>Concluidos</small>
            </div>
          </article>
        </section>

        <section className="fg-appt-main-grid">
          {isMobile ? null : (
            <aside className="fg-appt-calendar-card">
              <header className="fg-appt-calendar-head">
                <strong>{monthName}</strong>
                <div>
                  <button
                    type="button"
                    onClick={() => setMonthOffset((old) => old - 1)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthOffset((old) => old + 1)}
                  >
                    ›
                  </button>
                </div>
              </header>

              <div className="fg-appt-weekdays">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>

              <div className="fg-appt-days-grid">
                {days.map((dayObj, index) => (
                  <button
                    key={`${dayObj.day ?? "x"}-${index}`}
                    type="button"
                    className={`
                      ${dayObj.ghost ? "is-ghost" : ""}
                      ${dayObj.hasEvent ? "has-event" : ""}
                    `}
                    disabled={dayObj.ghost}
                  >
                    {dayObj.day ?? ""}
                  </button>
                ))}
              </div>

              <div className="fg-appt-upcoming">
                <small>Proximos eventos</small>
                {upcoming.map((item) => (
                  <div key={item.id}>
                    <span>{item.type}</span>
                    <em>
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </em>
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div>
            <section className="fg-appt-toolbar">
              <div className="fg-appt-filters">
                {filterItems.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={activeFilter === filter.key ? "is-active" : ""}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <em>{counters[filter.key]}</em>
                  </button>
                ))}
              </div>

              <div className="fg-appt-search-wrap">
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
                  placeholder="Buscar veiculo, placa, tipo ou responsavel"
                />
              </div>
            </section>

            <section className="fg-appt-table-card">
              {isMobile ? (
                <div className="fg-appt-mobile-list">
                  {filtered.map((item) => (
                    <AppointmentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="fg-appt-table-wrap">
                  <table className="fg-appt-table">
                    <thead>
                      <tr>
                        <th>Veiculo</th>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Km previsto</th>
                        <th>Status</th>
                        <th>Responsavel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="fg-appt-vehicle-cell">
                              <span>
                                <AppIcon type="truck" />
                              </span>
                              <div>
                                <strong>{item.vehicle}</strong>
                                <small>{item.plate}</small>
                              </div>
                            </div>
                          </td>
                          <td>{item.type}</td>
                          <td>
                            {new Date(item.date).toLocaleDateString("pt-BR")} •{" "}
                            {item.time}
                          </td>
                          <td>{item.km.toLocaleString("pt-BR")} km</td>
                          <td>
                            <span
                              className={`fg-appt-badge ${statusClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>{item.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  title="Nenhum agendamento encontrado"
                  description="Ajuste os filtros ou crie um novo agendamento para sua frota."
                  actionLabel="Novo agendamento"
                  onAction={() => setActiveFilter("todos")}
                />
              ) : null}
            </section>
          </div>
        </section>
      </div>
      <NovoAgendamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        veiculos={veiculos}
        onCreated={handleAgendamentoCriado}
      />
    </AppLayout>
  );
}
