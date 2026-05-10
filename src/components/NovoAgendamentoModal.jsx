import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { createAppointment, updateAppointment } from "../services/appointments";
import { useUiFeedback } from "../context/UiFeedbackContext";

const TIPOS = [
  "Troca de óleo",
  "Revisão de freios",
  "Alinhamento e balanceamento",
  "Troca de pneus",
  "Revisão geral",
  "Inspeção preventiva",
  "Manutenção corretiva",
  "Troca de correia",
  "Outro",
];

const STATUS_OPTS = [
  { value: "AGENDADO", label: "Agendado" },
  { value: "CONFIRMADO", label: "Confirmado" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FORM = {
  veiculoId: "",
  tipo: "",
  tipoCustom: "",
  data: today(),
  hora: "08:00",
  km: "",
  local: "",
  responsavel: "",
  status: "AGENDADO",
  observacoes: "",
};

function buildForm(item) {
  if (!item) return DEFAULT_FORM;

  return {
    veiculoId: item.veiculoId || item.vehicleId || "",
    tipo: item.tipo || item.type || "",
    tipoCustom: "",
    data:
      item.data || item.date
        ? String(item.data || item.date).slice(0, 10)
        : today(),
    hora: item.hora || item.time || "08:00",
    km: item.km ? String(item.km) : "",
    local: item.local || item.office || "",
    responsavel: item.responsavel || item.owner || "",
    status: STATUS_OPTS.some((o) => o.value === (item.status || "").toUpperCase())
      ? (item.status || "AGENDADO").toUpperCase()
      : "AGENDADO",
    observacoes: item.observacoes || "",
  };
}

export function NovoAgendamentoModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialValues = null,
  veiculos = [],
  title = "Novo Agendamento",
  submitLabel = "Criar Agendamento",
}) {
  const { showSuccess, showError } = useUiFeedback();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(buildForm(initialValues));
    setErrors({});
  }, [open, initialValues]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.veiculoId) e.veiculoId = "Selecione um veículo";
    if (!form.tipo) e.tipo = "Informe o tipo de serviço";
    if (form.tipo === "Outro" && !form.tipoCustom.trim())
      e.tipoCustom = "Descreva o tipo";
    if (!form.data) e.data = "Informe a data";
    if (!form.hora) e.hora = "Informe o horário";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const payload = {
        veiculoId: form.veiculoId,
        tipo: form.tipo === "Outro" ? form.tipoCustom.trim() : form.tipo,
        data: new Date(form.data).toISOString(),
        hora: form.hora,
        km: form.km ? Number(form.km) : 0,
        local: form.local.trim(),
        responsavel: form.responsavel.trim(),
        status: form.status,
        observacoes: form.observacoes.trim(),
      };
      const res = initialValues?.id
        ? await updateAppointment(initialValues.id, payload)
        : await createAppointment(payload);
      const saved = res.data.data ?? res.data;
      showSuccess(
        initialValues?.id
          ? "Agendamento atualizado com sucesso!"
          : "Agendamento criado com sucesso!",
      );
      if (initialValues?.id) {
        onUpdated?.(saved);
      } else {
        onCreated?.(saved);
      }
      onClose();
      setForm(DEFAULT_FORM);
    } catch (err) {
      showError(err?.response?.data?.message || "Erro ao criar agendamento.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <button
        type="button"
        className="sf-btn sf-btn-ghost"
        onClick={onClose}
        disabled={loading}
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="form-agendamento"
        className="sf-btn sf-btn-primary"
        disabled={loading}
      >
        {loading ? "Salvando…" : submitLabel}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={footer}
    >
      <form id="form-agendamento" onSubmit={handleSubmit} noValidate>
        <div className="sf-form-grid">
          {/* Veículo */}
          <div className="sf-field full">
            <label className="sf-label">
              Veículo <span className="sf-required">*</span>
            </label>
            <select
              className={`sf-select ${errors.veiculoId ? "is-error" : ""}`}
              value={form.veiculoId}
              onChange={(e) => set("veiculoId", e.target.value)}
            >
              <option value="">Selecione um veículo…</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.modelo} — {v.placa}
                </option>
              ))}
            </select>
            {errors.veiculoId && (
              <span className="sf-field-error">{errors.veiculoId}</span>
            )}
          </div>

          {/* Tipo de serviço */}
          <div className="sf-field full">
            <label className="sf-label">
              Tipo de serviço <span className="sf-required">*</span>
            </label>
            <select
              className={`sf-select ${errors.tipo ? "is-error" : ""}`}
              value={form.tipo}
              onChange={(e) => set("tipo", e.target.value)}
            >
              <option value="">Selecione o tipo…</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <span className="sf-field-error">{errors.tipo}</span>
            )}
          </div>

          {form.tipo === "Outro" && (
            <div className="sf-field full">
              <label className="sf-label">
                Descreva o serviço <span className="sf-required">*</span>
              </label>
              <input
                className={`sf-input ${errors.tipoCustom ? "is-error" : ""}`}
                placeholder="Ex: Troca de amortecedor traseiro"
                value={form.tipoCustom}
                onChange={(e) => set("tipoCustom", e.target.value)}
              />
              {errors.tipoCustom && (
                <span className="sf-field-error">{errors.tipoCustom}</span>
              )}
            </div>
          )}

          {/* Data e Hora */}
          <div className="sf-field">
            <label className="sf-label">
              Data <span className="sf-required">*</span>
            </label>
            <input
              type="date"
              className={`sf-input ${errors.data ? "is-error" : ""}`}
              value={form.data}
              onChange={(e) => set("data", e.target.value)}
            />
            {errors.data && (
              <span className="sf-field-error">{errors.data}</span>
            )}
          </div>

          <div className="sf-field">
            <label className="sf-label">
              Horário <span className="sf-required">*</span>
            </label>
            <input
              type="time"
              className={`sf-input ${errors.hora ? "is-error" : ""}`}
              value={form.hora}
              onChange={(e) => set("hora", e.target.value)}
            />
            {errors.hora && (
              <span className="sf-field-error">{errors.hora}</span>
            )}
          </div>

          {/* KM e Status */}
          <div className="sf-field">
            <label className="sf-label">KM previsto</label>
            <input
              type="number"
              min="0"
              className="sf-input"
              placeholder="Ex: 95000"
              value={form.km}
              onChange={(e) => set("km", e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">Status</label>
            <select
              className="sf-select"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Local e Responsável */}
          <div className="sf-field">
            <label className="sf-label">Local / Oficina</label>
            <input
              className="sf-input"
              placeholder="Ex: Auto Center VH"
              value={form.local}
              onChange={(e) => set("local", e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">Responsável</label>
            <input
              className="sf-input"
              placeholder="Ex: Dep. Técnico"
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="sf-field full">
            <label className="sf-label">Observações</label>
            <textarea
              className="sf-textarea"
              placeholder="Detalhes adicionais sobre o agendamento…"
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
