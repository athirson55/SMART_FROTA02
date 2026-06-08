import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { AppIcon } from "../components/AppIcon";
import { EmptyState } from "../components/ui/EmptyState";
import { useUiFeedback } from "../context/UiFeedbackContext";
import { useDashboard } from "../context/DashboardContext";
import { getRoutes, createRoute, updateRoute, deleteRoute } from "../services/routes";
import { getVehicles } from "../services/vehicles";
import { Modal } from "../components/Modal";

const STATUS_OPTS = [
  { value: "PENDENTE",    label: "Pendente" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA",   label: "Concluída" },
  { value: "CANCELADA",   label: "Cancelada" },
];

const STATUS_CLASS = {
  PENDENTE:     "fg-appt-badge-blue",
  EM_ANDAMENTO: "fg-appt-badge-amber",
  CONCLUIDA:    "fg-appt-badge-green",
  CANCELADA:    "fg-appt-badge-red",
};

const DEFAULT_FORM = {
  veiculoId: "",
  origem: "",
  destino: "",
  status: "PENDENTE",
  distanciaKm: "",
  observacoes: "",
};

function normalizeRoute(item) {
  const v = item.veiculo || {};
  return {
    ...item,
    vehicleLabel: v.modelo ? `${v.modelo} — ${v.placa}` : (item.veiculoId || ""),
    motoristaNome: item.motorista?.nome || v.motorista?.nome || "—",
    statusLabel: STATUS_OPTS.find((s) => s.value === (item.status || "").toUpperCase())?.label || item.status,
    statusKey: (item.status || "PENDENTE").toUpperCase(),
    distanciaKm: item.distanciaKm ?? null,
    dataInicio: item.dataInicio ? String(item.dataInicio).slice(0, 10) : null,
    dataFim: item.dataFim ? String(item.dataFim).slice(0, 10) : null,
  };
}

function RouteFormModal({ open, onClose, onSaved, initialValues, veiculos, loading, setLoading }) {
  const { showError } = useUiFeedback();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  const selectedVehicle = veiculos.find((v) => v.id === form.veiculoId) || null;
  const selectedVehicleHasDriver = Boolean(selectedVehicle?.motoristaId || selectedVehicle?.motorista_id || selectedVehicle?.motorista?.id);

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setForm({
        veiculoId: initialValues.veiculoId || initialValues.vehicleId || "",
        origem: initialValues.origem || "",
        destino: initialValues.destino || "",
        status: (initialValues.status || "PENDENTE").toUpperCase(),
        distanciaKm: initialValues.distanciaKm != null ? String(initialValues.distanciaKm) : "",
        observacoes: initialValues.observacoes || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [open, initialValues]);

  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.veiculoId) e.veiculoId = "Selecione um veículo";
    if (!form.origem.trim()) {
      e.origem = "Origem é obrigatória";
    } else if (/^\d+$/.test(form.origem.trim())) {
      e.origem = "Origem deve conter letras. Informe rua, avenida ou cidade válida.";
    }
    if (!form.destino.trim()) {
      e.destino = "Destino é obrigatório";
    } else if (/^\d+$/.test(form.destino.trim())) {
      e.destino = "Destino deve conter letras. Informe rua, avenida ou cidade válida.";
    }
    if (form.distanciaKm !== "" && parseFloat(form.distanciaKm) < 0) {
      e.distanciaKm = "Distância não pode ser negativa.";
    }
    if (form.status === "EM_ANDAMENTO" && !selectedVehicleHasDriver) {
      e.veiculoId = "O veículo selecionado não possui motorista. Vincule um motorista antes de iniciar a rota.";
    }
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        veiculoId: form.veiculoId,
        origem: form.origem.trim(),
        destino: form.destino.trim(),
        status: form.status,
        distanciaKm: form.distanciaKm ? parseFloat(form.distanciaKm) : null,
        observacoes: form.observacoes.trim() || null,
      };
      let res;
      if (initialValues?.id) {
        res = await updateRoute(initialValues.id, payload);
      } else {
        res = await createRoute(payload);
      }
      onSaved(res.data?.data ?? res.data);
    } catch (err) {
      showError(err?.response?.data?.message || "Erro ao salvar rota.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <button type="button" className="sf-btn sf-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
      <button type="submit" form="form-rota" className="sf-btn sf-btn-primary" disabled={loading}>
        {loading ? "Salvando…" : initialValues?.id ? "Salvar alterações" : "Criar Rota"}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={initialValues?.id ? "Editar Rota" : "Nova Rota"} size="md" footer={footer}>
      <form id="form-rota" onSubmit={handleSubmit} noValidate>
        <div className="sf-form-grid">
          <div className="sf-field full">
            <label className="sf-label">Veículo <span className="sf-required">*</span></label>
            <select className={`sf-select ${errors.veiculoId ? "is-error" : ""}`} value={form.veiculoId} onChange={(e) => field("veiculoId", e.target.value)}>
              <option value="">Selecione...</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.modelo || v.model} — {v.placa || v.plate}</option>
              ))}
            </select>
            {errors.veiculoId && <span className="sf-field-error">{errors.veiculoId}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Origem <span className="sf-required">*</span></label>
            <input className={`sf-input ${errors.origem ? "is-error" : ""}`} placeholder="Ex: São Paulo, SP" value={form.origem} onChange={(e) => field("origem", e.target.value)} />
            {errors.origem && <span className="sf-field-error">{errors.origem}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Destino <span className="sf-required">*</span></label>
            <input className={`sf-input ${errors.destino ? "is-error" : ""}`} placeholder="Ex: Campinas, SP" value={form.destino} onChange={(e) => field("destino", e.target.value)} />
            {errors.destino && <span className="sf-field-error">{errors.destino}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Status</label>
            <select className="sf-select" value={form.status} onChange={(e) => field("status", e.target.value)}>
              {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label">Distância (km)</label>
            <input type="number" min="0" step="0.1" className={`sf-input ${errors.distanciaKm ? "is-error" : ""}`} placeholder="Ex: 98.5" value={form.distanciaKm} onChange={(e) => field("distanciaKm", e.target.value)} />
            {errors.distanciaKm && <span className="sf-field-error">{errors.distanciaKm}</span>}
          </div>

          <div className="sf-field full">
            <label className="sf-label">Observações</label>
            <input className="sf-input" placeholder="Notas adicionais..." value={form.observacoes} onChange={(e) => field("observacoes", e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function RotasPage() {
  const { showSuccess, showError } = useUiFeedback();
  const { refresh: refreshDashboard } = useDashboard();
  const [routes, setRoutes] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    getRoutes({ limit: 100 })
      .then((res) => setRoutes((res.data?.data ?? []).map(normalizeRoute)))
      .catch(() => setRoutes([]));
  }, []);

  function abrirModal(item = null) {
    setEditing(item);
    getVehicles({ limit: 100 })
      .then((res) => setVeiculos(res.data?.data ?? []))
      .catch(() => setVeiculos([]));
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSaved(saved) {
    const normalized = normalizeRoute(saved);
    showSuccess(editing ? "Rota atualizada!" : "Rota criada com sucesso!");
    setRoutes((prev) =>
      prev.some((r) => r.id === normalized.id)
        ? prev.map((r) => (r.id === normalized.id ? normalized : r))
        : [...prev, normalized],
    );
    fecharModal();
    refreshDashboard();
  }

  function handleDelete(id) {
    if (!window.confirm("Remover esta rota? Esta ação não pode ser desfeita.")) return;
    deleteRoute(id)
      .then(() => {
        showSuccess("Rota removida com sucesso");
        setRoutes((prev) => prev.filter((r) => r.id !== id));
        refreshDashboard();
      })
      .catch(() => showError("Erro ao remover rota"));
  }

  const counters = useMemo(() => ({
    todos: routes.length,
    PENDENTE: routes.filter((r) => r.statusKey === "PENDENTE").length,
    EM_ANDAMENTO: routes.filter((r) => r.statusKey === "EM_ANDAMENTO").length,
    CONCLUIDA: routes.filter((r) => r.statusKey === "CONCLUIDA").length,
    CANCELADA: routes.filter((r) => r.statusKey === "CANCELADA").length,
  }), [routes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((r) => {
      const matchFilter = activeFilter === "todos" || r.statusKey === activeFilter;
      const matchQuery = !q || [r.origem, r.destino, r.vehicleLabel, r.motoristaNome].join(" ").toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [routes, activeFilter, query]);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-maint-content">
        <section className="fg-maint-page-top">
          <div>
            <h3>Gestão de Rotas</h3>
            <p>Crie e acompanhe rotas de entrega da frota</p>
          </div>
          <button type="button" className="fg-home-new-btn" onClick={() => abrirModal()}>
            <span>+</span> Nova Rota
          </button>
        </section>

        <section className="fg-maint-kpi-strip">
          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-blue"><AppIcon type="pin" /></span>
            <div><strong>{counters.todos}</strong><small>Total de rotas</small></div>
          </article>
          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-purple"><AppIcon type="clock" /></span>
            <div><strong>{counters.PENDENTE}</strong><small>Pendentes</small></div>
          </article>
          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-amber"><AppIcon type="truck" /></span>
            <div><strong>{counters.EM_ANDAMENTO}</strong><small>Em andamento</small></div>
          </article>
          <article className="fg-maint-kpi-card">
            <span className="fg-maint-kpi-icon is-green"><AppIcon type="doc" /></span>
            <div><strong>{counters.CONCLUIDA}</strong><small>Concluídas</small></div>
          </article>
        </section>

        <section className="fg-maint-toolbar">
          <div className="fg-maint-filters">
            {[
              { key: "todos",       label: "Todas",       count: counters.todos },
              { key: "PENDENTE",    label: "Pendente",    count: counters.PENDENTE },
              { key: "EM_ANDAMENTO", label: "Em andamento", count: counters.EM_ANDAMENTO },
              { key: "CONCLUIDA",   label: "Concluída",   count: counters.CONCLUIDA },
              { key: "CANCELADA",   label: "Cancelada",   count: counters.CANCELADA },
            ].map((f) => (
              <button key={f.key} type="button" className={activeFilter === f.key ? "is-active" : ""} onClick={() => setActiveFilter(f.key)}>
                <span>{f.label}</span><em>{f.count}</em>
              </button>
            ))}
          </div>

          <div className="fg-maint-toolbar-right">
            <div className="fg-maint-search-wrap">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>
              </span>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar origem, destino ou veículo" />
            </div>
          </div>
        </section>

        <section className="fg-maint-table-card">
          <div className="fg-maint-table-wrap">
            <table className="fg-maint-table">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Motorista</th>
                  <th>Distância</th>
                  <th>Início</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fg-maint-vehicle-cell">
                        <span className="fg-maint-vehicle-icon"><AppIcon type="truck" /></span>
                        <div><strong>{item.vehicleLabel.split(" — ")[0]}</strong><small>{item.vehicleLabel.split(" — ")[1]}</small></div>
                      </div>
                    </td>
                    <td>{item.origem}</td>
                    <td>{item.destino}</td>
                    <td>{item.motoristaNome}</td>
                    <td>{item.distanciaKm != null ? `${Number(item.distanciaKm).toLocaleString("pt-BR")} km` : "—"}</td>
                    <td>{item.dataInicio ? item.dataInicio.split("-").reverse().join("/") : "—"}</td>
                    <td>
                      <span className={`fg-appt-badge ${STATUS_CLASS[item.statusKey] || "fg-appt-badge-blue"}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td>
                      <div className="fg-maint-actions">
                        <button type="button" aria-label="Editar rota" onClick={() => abrirModal(item)}>✎</button>
                        <button type="button" aria-label="Remover rota" onClick={() => handleDelete(item.id)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <EmptyState
                title="Nenhuma rota encontrada"
                description="Ajuste os filtros ou crie uma nova rota para sua frota."
                actionLabel="Nova rota"
                onAction={() => abrirModal()}
              />
            )}
          </div>

          <footer className="fg-maint-table-footer">
            <span>{filtered.length === 0 ? "Nenhum resultado" : `${filtered.length} rota(s) encontrada(s)`}</span>
          </footer>
        </section>
      </div>

      <RouteFormModal
        open={modalOpen}
        onClose={fecharModal}
        onSaved={handleSaved}
        initialValues={editing}
        veiculos={veiculos}
        loading={formLoading}
        setLoading={setFormLoading}
      />
    </AppLayout>
  );
}
