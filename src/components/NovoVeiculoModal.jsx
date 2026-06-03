import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { createVehicle, updateVehicle } from "../services/vehicles";
import { useUiFeedback } from "../context/UiFeedbackContext";

const STATUS_OPTS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "EM_ROTA", label: "Em rota" },
  { value: "MANUTENCAO", label: "Em manutenção" },
  { value: "INATIVO", label: "Inativo" },
];

const STATUS_DISPLAY_TO_DB = {
  Ativo: "ATIVO",
  "Em rota": "EM_ROTA",
  "Em manutenção": "MANUTENCAO",
  Reserva: "INATIVO",
  Inativo: "INATIVO",
};

function toDbStatus(val) {
  return STATUS_DISPLAY_TO_DB[val] || val || "ATIVO";
}
const TIPO_OPTS = [
  { value: "", label: "Selecione..." },
  { value: "Caminhão leve", label: "Caminhão leve" },
  { value: "Caminhão médio", label: "Caminhão médio" },
  { value: "Caminhão pesado", label: "Caminhão pesado" },
  { value: "Caminhão extrapesado", label: "Caminhão extrapesado" },
  { value: "Van", label: "Van" },
  { value: "Utilitário", label: "Utilitário" },
  { value: "Ônibus", label: "Ônibus" },
  { value: "Trator", label: "Trator" },
];
const COMB_OPTS = [
  { value: "DIESEL", label: "Diesel" },
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Etanol" },
  { value: "FLEX", label: "Flex" },
  { value: "ELETRICO", label: "Elétrico" },
  { value: "GNV", label: "GNV" },
];
const currentYear = new Date().getFullYear();

const DEFAULT_FORM = {
  modelo: "",
  marca: "",
  placa: "",
  ano: String(currentYear),
  status: "ATIVO",
  combustivel: "DIESEL",
  chassi: "",
  km: "",
  capacidade: "",
  tipoVeiculo: "",
  motoristaId: "",
  vencimentoCRLV: "",
  vencimentoSeguro: "",
  proximaRevisaoKm: "",
  proximaRevisaoData: "",
};

function toDateInput(iso) {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ""; }
}

export function NovoVeiculoModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialValues = null,
  motoristas = [],
  title = "Cadastro de Veículo",
  submitLabel = "Cadastrar Veículo",
}) {
  const { showSuccess, showError } = useUiFeedback();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setForm({
          modelo: initialValues.modelo || initialValues.model || "",
          marca: initialValues.marca || "",
          placa: initialValues.placa || initialValues.plate || "",
          ano: String(initialValues.ano || currentYear),
          status: toDbStatus(initialValues.status),
          combustivel: initialValues.combustivel || "DIESEL",
          chassi: initialValues.chassi || "",
          km: String(initialValues.km ?? ""),
          capacidade: initialValues.capacidade || "",
          tipoVeiculo: initialValues.tipoVeiculo || "",
          motoristaId: initialValues.motoristaId || initialValues.motorista_id || "",
          vencimentoCRLV: toDateInput(initialValues.vencimentoCRLV),
          vencimentoSeguro: toDateInput(initialValues.vencimentoSeguro),
          proximaRevisaoKm: String(initialValues.proximaRevisaoKm ?? ""),
          proximaRevisaoData: toDateInput(initialValues.proximaRevisaoData),
        });
      } else {
        setForm(DEFAULT_FORM);
      }
      setErrors({});
    }
  }, [open, initialValues]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.modelo.trim()) e.modelo = "Modelo é obrigatório";
    if (!form.placa.trim()) e.placa = "Placa é obrigatória";
    if (form.placa.trim().length < 5)
      e.placa = "Placa inválida (mínimo 5 caracteres)";
    if (form.ano && (Number(form.ano) < 1980 || Number(form.ano) > currentYear + 1))
      e.ano = "Ano inválido";
    if (form.km !== "" && Number(form.km) < 0)
      e.km = "Quilometragem não pode ser negativa";
    if (form.proximaRevisaoKm !== "" && Number(form.proximaRevisaoKm) < 0)
      e.proximaRevisaoKm = "Valor não pode ser negativo";
    const today = new Date().toISOString().slice(0, 10);
    if (form.vencimentoCRLV && form.vencimentoCRLV < today)
      e.vencimentoCRLV = "Data de vencimento do CRLV está no passado";
    if (form.vencimentoSeguro && form.vencimentoSeguro < today)
      e.vencimentoSeguro = "Data de vencimento do seguro está no passado";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const payload = {
        modelo: form.modelo.trim(),
        marca: form.marca.trim() || null,
        placa: form.placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
        ano: Number(form.ano) || currentYear,
        status: form.status,
        combustivel: form.combustivel || null,
        chassi: form.chassi.trim() || null,
        km: form.km ? Number(form.km) : 0,
        capacidade: form.capacidade.trim() || null,
        tipoVeiculo: form.tipoVeiculo || null,
        motoristaId: form.motoristaId || null,
        vencimentoCRLV: form.vencimentoCRLV ? new Date(form.vencimentoCRLV).toISOString() : null,
        vencimentoSeguro: form.vencimentoSeguro ? new Date(form.vencimentoSeguro).toISOString() : null,
        proximaRevisaoKm: form.proximaRevisaoKm ? Number(form.proximaRevisaoKm) : null,
        proximaRevisaoData: form.proximaRevisaoData ? new Date(form.proximaRevisaoData).toISOString() : null,
      };
      const res = initialValues?.id
        ? await updateVehicle(initialValues.id, payload)
        : await createVehicle(payload);
      const saved = res.data?.data ?? res.data;
      showSuccess(
        initialValues?.id
          ? "Veículo atualizado com sucesso!"
          : "Veículo cadastrado com sucesso!",
      );
      if (initialValues?.id) onUpdated?.(saved);
      else onCreated?.(saved);
      setForm(DEFAULT_FORM);
      setLoading(false);
    } catch (err) {
      showError(err?.response?.data?.message || "Erro ao cadastrar veículo.");
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
        form="form-veiculo"
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
      size="lg"
      footer={footer}
    >
      <form id="form-veiculo" onSubmit={handleSubmit} noValidate>
        <div className="sf-form-grid">
          <span className="sf-section-label">Dados do veículo</span>

          <div className="sf-field">
            <label className="sf-label">
              Modelo <span className="sf-required">*</span>
            </label>
            <input
              className={`sf-input ${errors.modelo ? "is-error" : ""}`}
              placeholder="Ex: Volvo FH 460"
              value={form.modelo}
              onChange={(e) => set("modelo", e.target.value)}
            />
            {errors.modelo && (
              <span className="sf-field-error">{errors.modelo}</span>
            )}
          </div>

          <div className="sf-field">
            <label className="sf-label">Marca</label>
            <input
              className="sf-input"
              placeholder="Ex: Volvo"
              value={form.marca}
              onChange={(e) => set("marca", e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">
              Placa <span className="sf-required">*</span>
            </label>
            <input
              className={`sf-input ${errors.placa ? "is-error" : ""}`}
              placeholder="Ex: ABC1D23"
              value={form.placa}
              onChange={(e) => set("placa", e.target.value.toUpperCase())}
            />
            {errors.placa && (
              <span className="sf-field-error">{errors.placa}</span>
            )}
            <span className="sf-field-hint">Sem traço ou espaço</span>
          </div>

          <div className="sf-field">
            <label className="sf-label">Ano</label>
            <input
              type="number"
              min="1980"
              max={currentYear + 1}
              className={`sf-input ${errors.ano ? "is-error" : ""}`}
              placeholder={String(currentYear)}
              value={form.ano}
              onChange={(e) => set("ano", e.target.value)}
            />
            {errors.ano && <span className="sf-field-error">{errors.ano}</span>}
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

          <div className="sf-field">
            <label className="sf-label">Combustível</label>
            <select
              className="sf-select"
              value={form.combustivel}
              onChange={(e) => set("combustivel", e.target.value)}
            >
              {COMB_OPTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label">KM atual</label>
            <input
              type="number"
              min="0"
              className={`sf-input ${errors.km ? "is-error" : ""}`}
              placeholder="Ex: 87420"
              value={form.km}
              onChange={(e) => set("km", e.target.value)}
            />
            {errors.km && <span className="sf-field-error">{errors.km}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Capacidade de carga</label>
            <input
              className="sf-input"
              placeholder="Ex: 12 ton"
              value={form.capacidade}
              onChange={(e) => set("capacidade", e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">Tipo de veículo</label>
            <select
              className="sf-select"
              value={form.tipoVeiculo}
              onChange={(e) => set("tipoVeiculo", e.target.value)}
            >
              {TIPO_OPTS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label">Chassi</label>
            <input
              className="sf-input"
              placeholder="Número do chassi"
              value={form.chassi}
              onChange={(e) => set("chassi", e.target.value)}
            />
          </div>

          <div className="sf-field full">
            <label className="sf-label">Motorista responsável</label>
            <select
              className="sf-select"
              value={form.motoristaId}
              onChange={(e) => set("motoristaId", e.target.value)}
            >
              <option value="">Sem motorista</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <span className="sf-section-label">Datas de vencimento</span>

          <div className="sf-field">
            <label className="sf-label">Vencimento do CRLV</label>
            <input
              type="date"
              className={`sf-input ${errors.vencimentoCRLV ? "is-error" : ""}`}
              value={form.vencimentoCRLV}
              onChange={(e) => set("vencimentoCRLV", e.target.value)}
            />
            {errors.vencimentoCRLV && <span className="sf-field-error">{errors.vencimentoCRLV}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Vencimento do seguro</label>
            <input
              type="date"
              className={`sf-input ${errors.vencimentoSeguro ? "is-error" : ""}`}
              value={form.vencimentoSeguro}
              onChange={(e) => set("vencimentoSeguro", e.target.value)}
            />
            {errors.vencimentoSeguro && <span className="sf-field-error">{errors.vencimentoSeguro}</span>}
          </div>

          <span className="sf-section-label">Próxima revisão</span>

          <div className="sf-field">
            <label className="sf-label">Por KM</label>
            <input
              type="number"
              min="0"
              className={`sf-input ${errors.proximaRevisaoKm ? "is-error" : ""}`}
              placeholder="Ex: 100000"
              value={form.proximaRevisaoKm}
              onChange={(e) => set("proximaRevisaoKm", e.target.value)}
            />
            {errors.proximaRevisaoKm && <span className="sf-field-error">{errors.proximaRevisaoKm}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Por data</label>
            <input
              type="date"
              className="sf-input"
              value={form.proximaRevisaoData}
              onChange={(e) => set("proximaRevisaoData", e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
