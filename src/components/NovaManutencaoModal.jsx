import { useState } from "react";
import { Modal } from "./Modal";
import { createMaintenance } from "../services/maintenances";
import { useUiFeedback } from "../context/UiFeedbackContext";

const TIPO_OPTS = [
  { value:"PREVENTIVA", label:"Preventiva" },
  { value:"CORRETIVA",  label:"Corretiva" },
  { value:"PREDITIVA",  label:"Preditiva" },
  { value:"EMERGENCIAL",label:"Emergencial" },
];

const STATUS_OPTS = [
  { value:"PENDENTE",     label:"Pendente" },
  { value:"AGENDADA",     label:"Agendada" },
  { value:"EM_ANDAMENTO", label:"Em andamento" },
  { value:"CONCLUIDA",    label:"Concluída" },
];

const PRIO_OPTS = [
  { value:"BAIXA",  label:"Baixa" },
  { value:"MEDIA",  label:"Média" },
  { value:"ALTA",   label:"Alta" },
  { value:"CRITICA",label:"Crítica" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function NovaManutencaoModal({ open, onClose, onCreated, veiculos = [] }) {
  const { showSuccess, showError } = useUiFeedback();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    veiculoId: "", tipo: "PREVENTIVA", descricao: "",
    data: today(), km: "", custo: "",
    status: "PENDENTE", prioridade: "MEDIA",
    mecanico: "", oficina: "", observacoes: "",
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.veiculoId)        e.veiculoId  = "Selecione um veículo";
    if (!form.descricao.trim()) e.descricao  = "Descrição é obrigatória";
    if (!form.data)             e.data       = "Data é obrigatória";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const payload = {
        veiculoId:   form.veiculoId,
        tipo:        form.tipo,
        descricao:   form.descricao.trim(),
        data:        new Date(form.data).toISOString(),
        km:          form.km    ? Number(form.km)    : 0,
        custo:       form.custo ? Number(form.custo)  : 0,
        status:      form.status,
        prioridade:  form.prioridade,
        mecanico:    form.mecanico.trim(),
        oficina:     form.oficina.trim(),
        observacoes: form.observacoes.trim(),
      };
      const res = await createMaintenance(payload);
      showSuccess("Manutenção registrada com sucesso!");
      onCreated?.(res.data.data ?? res.data);
      onClose();
      setForm({ veiculoId:"",tipo:"PREVENTIVA",descricao:"",data:today(),km:"",custo:"",status:"PENDENTE",prioridade:"MEDIA",mecanico:"",oficina:"",observacoes:"" });
    } catch (err) {
      showError(err?.response?.data?.message || "Erro ao registrar manutenção.");
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <>
      <button type="button" className="sf-btn sf-btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
      <button type="submit" form="form-manutencao" className="sf-btn sf-btn-primary" disabled={loading}>
        {loading ? "Salvando…" : "Registrar Manutenção"}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title="Nova Manutenção" size="lg" footer={footer}>
      <form id="form-manutencao" onSubmit={handleSubmit} noValidate>
        <div className="sf-form-grid">

          <span className="sf-section-label">Identificação</span>

          <div className="sf-field full">
            <label className="sf-label">Veículo <span className="sf-required">*</span></label>
            <select className={`sf-select ${errors.veiculoId?"is-error":""}`}
              value={form.veiculoId} onChange={(e) => set("veiculoId", e.target.value)}>
              <option value="">Selecione o veículo…</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.modelo} — {v.placa}</option>
              ))}
            </select>
            {errors.veiculoId && <span className="sf-field-error">{errors.veiculoId}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Tipo</label>
            <select className="sf-select" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {TIPO_OPTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label">Prioridade</label>
            <select className="sf-select" value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
              {PRIO_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="sf-field full">
            <label className="sf-label">Descrição <span className="sf-required">*</span></label>
            <textarea className={`sf-textarea ${errors.descricao?"is-error":""}`}
              placeholder="Descreva o serviço a ser realizado…"
              value={form.descricao} onChange={(e) => set("descricao", e.target.value)} />
            {errors.descricao && <span className="sf-field-error">{errors.descricao}</span>}
          </div>

          <span className="sf-section-label">Execução</span>

          <div className="sf-field">
            <label className="sf-label">Data <span className="sf-required">*</span></label>
            <input type="date" className={`sf-input ${errors.data?"is-error":""}`}
              value={form.data} onChange={(e) => set("data", e.target.value)} />
            {errors.data && <span className="sf-field-error">{errors.data}</span>}
          </div>

          <div className="sf-field">
            <label className="sf-label">Status</label>
            <select className="sf-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="sf-field">
            <label className="sf-label">KM na execução</label>
            <input type="number" min="0" className="sf-input" placeholder="Ex: 87420"
              value={form.km} onChange={(e) => set("km", e.target.value)} />
          </div>

          <div className="sf-field">
            <label className="sf-label">Custo (R$)</label>
            <input type="number" min="0" step="0.01" className="sf-input" placeholder="Ex: 380.00"
              value={form.custo} onChange={(e) => set("custo", e.target.value)} />
          </div>

          <div className="sf-field">
            <label className="sf-label">Mecânico</label>
            <input className="sf-input" placeholder="Nome do mecânico responsável"
              value={form.mecanico} onChange={(e) => set("mecanico", e.target.value)} />
          </div>

          <div className="sf-field">
            <label className="sf-label">Oficina</label>
            <input className="sf-input" placeholder="Ex: Auto Center VH"
              value={form.oficina} onChange={(e) => set("oficina", e.target.value)} />
          </div>

          <div className="sf-field full">
            <label className="sf-label">Observações</label>
            <textarea className="sf-textarea" placeholder="Informações adicionais, peças substituídas, próximos passos…"
              value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>

        </div>
      </form>
    </Modal>
  );
}
