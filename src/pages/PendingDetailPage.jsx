import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { getVehicle } from "../services/vehicles";

function normalizePending(pending) {
  return {
    id: pending.id,
    slug: pending.slug,
    label: pending.label,
    detail: pending.detalhe || pending.detail || "",
    tone: String(pending.tone || "amber").toLowerCase(),
  };
}

function normalizeVehicle(vehicle) {
  const rawStatus = vehicle.status || "ATIVO";
  const statusMap = {
    MANUTENCAO: "Em manutenção",
    EM_ROTA: "Em rota",
    INATIVO: "Inativo",
    ATIVO: "Ativo",
  };
  return {
    id: vehicle.id,
    model: vehicle.modelo || vehicle.model || "",
    brand: vehicle.marca || "",
    plate: vehicle.placa || vehicle.plate || "",
    year: vehicle.ano || null,
    km: vehicle.km ?? 0,
    fuel: vehicle.combustivel || "",
    tipoVeiculo: vehicle.tipoVeiculo || "",
    capacity: vehicle.capacidade || "",
    status: statusMap[rawStatus] || rawStatus,
    statusRaw: rawStatus,
    driver: vehicle.motorista?.nome || vehicle.motorista?.name || vehicle.driver || "Sem motorista",
    driverCnh: vehicle.motorista?.cnh || "",
    driverCargo: vehicle.motorista?.cargo || "",
    vencimentoCRLV: vehicle.vencimentoCRLV || null,
    vencimentoSeguro: vehicle.vencimentoSeguro || null,
    proximaRevisaoKm: vehicle.proximaRevisaoKm || null,
    proximaRevisaoData: vehicle.proximaRevisaoData || null,
    pendencies: (vehicle.pendencias ?? []).map(normalizePending),
  };
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function StatusBadge({ status, rawStatus }) {
  const colors = {
    ATIVO: { bg: "#DCFCE7", color: "#16A34A" },
    EM_ROTA: { bg: "#EFF6FF", color: "#2563EB" },
    MANUTENCAO: { bg: "#FEE2E2", color: "#DC2626" },
    INATIVO: { bg: "#F1F5F9", color: "#64748B" },
  };
  const style = colors[rawStatus] || colors.ATIVO;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: style.bg, color: style.color,
      fontSize: 12, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, border: `1.5px solid ${style.color}22`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: style.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function InfoRow({ label, value, mono = false }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 13, color: "#64748B", flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", textAlign: "right", fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </div>
  );
}

function SectionCard({ title, children, accent }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0",
      overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid #E2E8F0",
        background: accent || "#F8FAFC",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <strong style={{ fontSize: 13, color: "#1E293B" }}>{title}</strong>
      </div>
      <div style={{ padding: "4px 20px 12px" }}>{children}</div>
    </div>
  );
}

function PendingItem({ pending }) {
  const colors = {
    red: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", dot: "#DC2626" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", dot: "#D97706" },
    green: { bg: "#F0FDF4", border: "#BBF7D0", color: "#16A34A", dot: "#16A34A" },
  };
  const c = colors[pending.tone] || colors.amber;
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: "10px 14px", marginTop: 10,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0, marginTop: 4 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{pending.label}</div>
        {pending.detail && (
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{pending.detail}</div>
        )}
      </div>
    </div>
  );
}

export function PendingDetailPage() {
  const navigate = useNavigate();
  const { vehicleId, pendingSlug } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getVehicle(vehicleId)
      .then((res) => {
        if (!active) return;
        const vehicle = normalizeVehicle(res.data?.data ?? {});
        const pending = vehicle.pendencies.find((item) => item.slug === pendingSlug) ?? null;
        setDetail({ vehicle, pending });
      })
      .catch((err) => {
        console.error("Erro ao carregar detalhe da pendência:", err);
        if (active) setDetail(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pendingSlug, vehicleId]);

  return (
    <AppLayout>
      <AppHeader />
      <div className="fg-home-content" style={{ maxWidth: 820 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "#64748B" }}>
          <button type="button" onClick={() => navigate("/veiculos")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontWeight: 600, padding: 0 }}>
            Veículos
          </button>
          <span>›</span>
          <span>Pendência</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#64748B" }}>Carregando...</div>
        ) : !detail?.vehicle ? (
          <SectionCard title="Pendência não encontrada">
            <p style={{ color: "#64748B", fontSize: 13, padding: "12px 0" }}>
              Não foi possível localizar o veículo ou a pendência. Verifique o link e tente novamente.
            </p>
            <button type="button" onClick={() => navigate("/veiculos")}
              style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              ← Voltar para veículos
            </button>
          </SectionCard>
        ) : (
          <>
            {/* Header card */}
            <div style={{
              background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
              borderRadius: 16, padding: "24px 28px", marginBottom: 20, color: "#fff",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  {detail.vehicle.model}
                </div>
                <div style={{ fontSize: 15, opacity: 0.8, fontFamily: "monospace", marginBottom: 12 }}>
                  {detail.vehicle.plate}
                </div>
                <StatusBadge status={detail.vehicle.status} rawStatus={detail.vehicle.statusRaw} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Pendências abertas</div>
                <div style={{
                  fontSize: 32, fontWeight: 800, lineHeight: 1,
                  color: detail.vehicle.pendencies.length > 0 ? "#FCD34D" : "#86EFAC",
                }}>
                  {detail.vehicle.pendencies.length}
                </div>
              </div>
            </div>

            {/* Pendência destacada */}
            {detail.pending ? (
              <div style={{
                background: "#FFF7ED", border: "2px solid #FED7AA", borderRadius: 12,
                padding: "16px 20px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                  Pendência selecionada
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>{detail.pending.label}</div>
                {detail.pending.detail && (
                  <div style={{ fontSize: 13, color: "#64748B" }}>{detail.pending.detail}</div>
                )}
              </div>
            ) : (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 600 }}>Pendência não localizada neste veículo.</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Vehicle info */}
              <SectionCard title="Dados do veículo">
                <InfoRow label="Modelo" value={detail.vehicle.model} />
                <InfoRow label="Marca" value={detail.vehicle.brand} />
                <InfoRow label="Placa" value={detail.vehicle.plate} mono />
                <InfoRow label="Ano" value={detail.vehicle.year} />
                <InfoRow label="Tipo" value={detail.vehicle.tipoVeiculo} />
                <InfoRow label="Combustível" value={detail.vehicle.fuel} />
                <InfoRow label="Capacidade" value={detail.vehicle.capacity} />
                <InfoRow label="KM atual" value={detail.vehicle.km ? `${detail.vehicle.km.toLocaleString("pt-BR")} km` : null} />
              </SectionCard>

              {/* Driver + Docs */}
              <div>
                <SectionCard title="Motorista responsável">
                  <InfoRow label="Nome" value={detail.vehicle.driver} />
                  <InfoRow label="CNH" value={detail.vehicle.driverCnh} mono />
                  <InfoRow label="Cargo" value={detail.vehicle.driverCargo} />
                </SectionCard>

                <SectionCard title="Documentos">
                  <InfoRow label="Venc. CRLV" value={formatDate(detail.vehicle.vencimentoCRLV)} />
                  <InfoRow label="Venc. Seguro" value={formatDate(detail.vehicle.vencimentoSeguro)} />
                  <InfoRow label="Próx. revisão km" value={detail.vehicle.proximaRevisaoKm ? `${Number(detail.vehicle.proximaRevisaoKm).toLocaleString("pt-BR")} km` : null} />
                  <InfoRow label="Próx. revisão data" value={formatDate(detail.vehicle.proximaRevisaoData)} />
                </SectionCard>
              </div>
            </div>

            {/* All pending items */}
            {detail.vehicle.pendencies.length > 0 && (
              <SectionCard title={`Todas as pendências (${detail.vehicle.pendencies.length})`}>
                {detail.vehicle.pendencies.map((p) => (
                  <PendingItem key={p.id || p.slug} pending={p} />
                ))}
              </SectionCard>
            )}

            {/* Next steps */}
            <SectionCard title="Próximas ações">
              {[
                ["1. Revisar o item pendente", "Validar a ocorrência e atualizar o status no sistema."],
                ["2. Registrar evidência", "Adicionar nota, ordem de serviço ou documento correspondente."],
                ["3. Encerrar acompanhamento", "Concluir a pendência e liberar o veículo para operação normal."],
              ].map(([title, desc]) => (
                <div key={title} style={{ padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
                </div>
              ))}
            </SectionCard>

            <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
              <button type="button" onClick={() => navigate("/veiculos")}
                style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                ← Voltar para veículos
              </button>
              <button type="button" onClick={() => navigate("/alertas")}
                style={{ fontSize: 13, color: "#D97706", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Ver alertas →
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
