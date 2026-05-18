import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { createDriver, updateDriver } from "../services/drivers";
import { useUiFeedback } from "../context/UiFeedbackContext";

const STATUS_OPTS = [
  { value: "DISPONIVEL", label: "Disponível" },
  { value: "EM_ROTA", label: "Em rota" },
  { value: "AFASTADO", label: "Afastado" },
  { value: "INATIVO", label: "Inativo" },
];

const CNH_CATS = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"];

const AVATAR_CORES = [
  "#2f67d8",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#ea580c",
];

const DEFAULT_FORM = {
  nome: "",
  email: "",
  telefone: "",
  cnh: "",
  cnhCategoria: "D",
  cnhVencimento: "",
  status: "DISPONIVEL",
  cargo: "Motorista",
  avatarCor: AVATAR_CORES[0],
};

function getStatusValue(status) {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized.includes("rota")) return "EM_ROTA";
  if (normalized.includes("afast")) return "AFASTADO";
  if (normalized.includes("inativ")) return "INATIVO";
  return "DISPONIVEL";
}

function buildForm(initialValues) {
  if (!initialValues) return DEFAULT_FORM;

  return {
    nome: initialValues.nome || initialValues.name || "",
    email: initialValues.email || "",
    telefone: initialValues.telefone || initialValues.phone || "",
    cnh: initialValues.cnh || "",
    cnhCategoria: initialValues.cnhCategoria || initialValues.category || "D",
    cnhVencimento: initialValues.cnhVencimento
      ? String(initialValues.cnhVencimento).slice(0, 10)
      : "",
    status: getStatusValue(initialValues.status),
    cargo: initialValues.cargo || initialValues.role || "Motorista",
    avatarCor: initialValues.avatarCor || AVATAR_CORES[0],
  };
}

export function AdicionarMotoristaModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  initialValues = null,
  title = "Adicionar Motorista",
  submitLabel = "Adicionar Motorista",
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
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.email.trim()) e.email = "E-mail é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido";
    if (!form.cnh.trim()) e.cnh = "CNH é obrigatória";
    else if (!/^\d{9}$/.test(form.cnh.trim())) e.cnh = "CNH deve ter exatamente 9 dígitos numéricos";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim(),
        cnh: form.cnh.trim(),
        cnhCategoria: form.cnhCategoria,
        cnhVencimento: form.cnhVencimento
          ? new Date(form.cnhVencimento).toISOString()
          : null,
        status: form.status,
        cargo: form.cargo.trim() || "Motorista",
        avatarCor: form.avatarCor,
      };
      const res = initialValues?.id
        ? await updateDriver(initialValues.id, payload)
        : await createDriver(payload);
      const saved = res.data.data ?? res.data;
      showSuccess(
        initialValues?.id
          ? "Motorista atualizado com sucesso!"
          : "Motorista adicionado com sucesso!",
      );
      if (initialValues?.id) {
        onUpdated?.(saved);
      } else {
        onCreated?.(saved);
      }
      onClose();
      setForm(DEFAULT_FORM);
    } catch (err) {
      showError(err?.response?.data?.message || "Erro ao cadastrar motorista.");
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
        form="form-motorista"
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
      <form id="form-motorista" onSubmit={handleSubmit} noValidate>
        <div className="sf-form-grid">
          <span className="sf-section-label">Dados pessoais</span>

          <div className="sf-field full">
            <label className="sf-label">
              Nome completo <span className="sf-required">*</span>
            </label>
            <input
              className={`sf-input ${errors.nome ? "is-error" : ""}`}
              placeholder="Ex: João Silva"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
            {errors.nome && (
              <span className="sf-field-error">{errors.nome}</span>
            )}
          </div>

          <div className="sf-field">
            <label className="sf-label">
              E-mail <span className="sf-required">*</span>
            </label>
            <input
              type="email"
              className={`sf-input ${errors.email ? "is-error" : ""}`}
              placeholder="joao@exemplo.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && (
              <span className="sf-field-error">{errors.email}</span>
            )}
          </div>

          <div className="sf-field">
            <label className="sf-label">Telefone</label>
            <input
              className="sf-input"
              placeholder="+55 11 99999-0000"
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">Cargo</label>
            <input
              className="sf-input"
              placeholder="Ex: Motorista Sênior"
              value={form.cargo}
              onChange={(e) => set("cargo", e.target.value)}
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

          <span className="sf-section-label">Habilitação</span>

          <div className="sf-field">
            <label className="sf-label">
              Número da CNH <span className="sf-required">*</span>
            </label>
            <input
              className={`sf-input ${errors.cnh ? "is-error" : ""}`}
              placeholder="Ex: 012345678"
              value={form.cnh}
              maxLength={9}
              inputMode="numeric"
              onChange={(e) => set("cnh", e.target.value.replace(/\D/g, "").slice(0, 9))}
            />
            {errors.cnh && <span className="sf-field-error">{errors.cnh}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Categoria</label>
            <select
              className="sf-select"
              value={form.cnhCategoria}
              onChange={(e) => set("cnhCategoria", e.target.value)}
            >
              {CNH_CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sf-field full">
            <label className="sf-label">Vencimento da CNH</label>
            <input
              type="date"
              className="sf-input"
              value={form.cnhVencimento}
              onChange={(e) => set("cnhVencimento", e.target.value)}
            />
          </div>

          <span className="sf-section-label">Cor do avatar</span>

          <div className="sf-field full">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AVATAR_CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: cor,
                    border: "none",
                    cursor: "pointer",
                    outline:
                      form.avatarCor === cor ? `3px solid ${cor}` : "none",
                    outlineOffset: 2,
                    transform:
                      form.avatarCor === cor ? "scale(1.15)" : "scale(1)",
                    transition: "transform .15s ease, outline .15s ease",
                  }}
                  onClick={() => set("avatarCor", cor)}
                  aria-label={`Cor ${cor}`}
                />
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
