import "../styles/alerts-page.css";
import { useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";

const TYPE_CONFIG = {
  documento: {
    label: "Documento",
    bg: "#FEF3C7",
    color: "#D97706",
    path: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  },
  manutencao: {
    label: "Manutenção",
    bg: "#FEE2E2",
    color: "#DC2626",
    path: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
  },
  combustivel: {
    label: "Combustível",
    bg: "#EDE9FE",
    color: "#7C3AED",
    path: "M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6C4.9 3 4 3.9 4 5v16h10V13.5h1.5v4c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z",
  },
  pneu: {
    label: "Pneu",
    bg: "#DCFCE7",
    color: "#16A34A",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
  },
  revisao: {
    label: "Revisão",
    bg: "#EFF6FF",
    color: "#2563EB",
    path: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
  },
  vencimento: {
    label: "Vencimento",
    bg: "#FEE2E2",
    color: "#DC2626",
    path: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.01 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",
  },
  seguro: {
    label: "Seguro",
    bg: "#FEF3C7",
    color: "#D97706",
    path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  },
};

const PRI_CONFIG = {
  critico: { label: "Crítico", cls: "badge-red" },
  medio: { label: "Médio", cls: "badge-amber" },
  baixo: { label: "Baixo", cls: "badge-blue" },
};

const STA_CONFIG = {
  pendente: { label: "Pendente", cls: "badge-red" },
  em_analise: { label: "Em análise", cls: "badge-amber" },
  resolvido: { label: "Resolvido", cls: "badge-green" },
};

const alertsSeed = [
  {
    id: 1,
    veiculo: "Eicher Pro 2059",
    placa: "GJ28HT2889",
    tipo: "documento",
    titulo: "CRLV prestes a vencer",
    desc: "CRLV do veículo vence em 3 dias. Renovação obrigatória para operação.",
    prioridade: "critico",
    status: "pendente",
    data: "2024-07-22",
    km: 87420,
    acao: "Renovar no DETRAN",
    responsavel: "Dep. Administrativo",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 2,
    veiculo: "Tata Prima 4928S",
    placa: "DL1PC4421",
    tipo: "manutencao",
    titulo: "Troca de óleo atrasada",
    desc: "Veículo ultrapassou o intervalo de troca de óleo em 1.800 km.",
    prioridade: "critico",
    status: "pendente",
    data: "2024-07-20",
    km: 124300,
    acao: "Agendar troca imediata",
    responsavel: "Oficina Central",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 3,
    veiculo: "Volvo FH 460",
    placa: "MH02AB1234",
    tipo: "manutencao",
    titulo: "Revisão de freios urgente",
    desc: "Sistema de freios com pressão abaixo do ideal. Risco de operação.",
    prioridade: "critico",
    status: "em_analise",
    data: "2024-07-21",
    km: 213800,
    acao: "Parar veículo e revisar",
    responsavel: "Scania Service",
    resolvedAt: null,
    obs: "Veículo em análise na oficina.",
  },
  {
    id: 4,
    veiculo: "Scania P 360",
    placa: "TN09KL3344",
    tipo: "manutencao",
    titulo: "Falha no motor",
    desc: "Sensor de temperatura do motor acusando superaquecimento acima de 110°C.",
    prioridade: "critico",
    status: "em_analise",
    data: "2024-07-23",
    km: 178900,
    acao: "Diagnóstico imediato",
    responsavel: "Scania Service",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 5,
    veiculo: "Ashok Leyland 3718",
    placa: "KA05MN9087",
    tipo: "documento",
    titulo: "Licença ambiental vencendo",
    desc: "Licença ambiental do veículo vence em 7 dias.",
    prioridade: "medio",
    status: "pendente",
    data: "2024-07-18",
    km: 56200,
    acao: "Renovar licença",
    responsavel: "Dep. Administrativo",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 6,
    veiculo: "Tata 407 Gold",
    placa: "RJ14CD5566",
    tipo: "revisao",
    titulo: "Inspeção preventiva próxima",
    desc: "Inspeção preventiva dos 32.000 km. Veículo disponível para agendamento.",
    prioridade: "medio",
    status: "pendente",
    data: "2024-07-19",
    km: 31800,
    acao: "Agendar inspeção",
    responsavel: "Frota Plus",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 7,
    veiculo: "Mercedes Actros 2546",
    placa: "UP32GH7712",
    tipo: "pneu",
    titulo: "Desgaste nos pneus traseiros",
    desc: "Pneus traseiros com desgaste acima de 70%. Substituição recomendada.",
    prioridade: "medio",
    status: "pendente",
    data: "2024-07-17",
    km: 44100,
    acao: "Substituir pneus",
    responsavel: "Pneus Express",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 8,
    veiculo: "Eicher Pro 2059",
    placa: "GJ28HT2889",
    tipo: "seguro",
    titulo: "Seguro obrigatório a vencer",
    desc: "Seguro DPVAT vence em 12 dias. Renovação necessária para circulação legal.",
    prioridade: "medio",
    status: "pendente",
    data: "2024-07-16",
    km: 87420,
    acao: "Renovar seguro",
    responsavel: "Corretora Frota",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 9,
    veiculo: "Iveco Stralis 460",
    placa: "WB28CD4499",
    tipo: "combustivel",
    titulo: "Consumo elevado de combustível",
    desc: "Consumo 18% acima da média dos últimos 30 dias. Verificar injeção.",
    prioridade: "medio",
    status: "em_analise",
    data: "2024-07-15",
    km: 22500,
    acao: "Verificar sistema de injeção",
    responsavel: "Mecânica Rápida",
    resolvedAt: null,
    obs: "Em análise de telemetria.",
  },
  {
    id: 10,
    veiculo: "Tata Prima 4928S",
    placa: "DL1PC4421",
    tipo: "vencimento",
    titulo: "Tacógrafo com calibração vencida",
    desc: "Tacógrafo com lacre vencido há 22 dias. Multa em caso de fiscalização.",
    prioridade: "medio",
    status: "pendente",
    data: "2024-07-14",
    km: 124300,
    acao: "Calibrar tacógrafo",
    responsavel: "Oficina Autorizada",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 11,
    veiculo: "Volvo FH 460",
    placa: "MH02AB1234",
    tipo: "documento",
    titulo: "RNTRC prestes a vencer",
    desc: "RNTRC (Registro Nacional de Transportadores) vence em 18 dias.",
    prioridade: "baixo",
    status: "pendente",
    data: "2024-07-13",
    km: 213800,
    acao: "Renovar RNTRC",
    responsavel: "Dep. Administrativo",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 12,
    veiculo: "Ashok Leyland 3718",
    placa: "KA05MN9087",
    tipo: "manutencao",
    titulo: "Alinhamento recomendado",
    desc: "Quilometragem indica necessidade de alinhamento e balanceamento.",
    prioridade: "baixo",
    status: "pendente",
    data: "2024-07-12",
    km: 56200,
    acao: "Agendar alinhamento",
    responsavel: "Auto Center VH",
    resolvedAt: null,
    obs: "",
  },
  {
    id: 13,
    veiculo: "Scania P 360",
    placa: "TN09KL3344",
    tipo: "revisao",
    titulo: "Troca de filtros programada",
    desc: "Filtros de ar e combustível atingiram intervalo de substituição.",
    prioridade: "baixo",
    status: "resolvido",
    data: "2024-07-10",
    km: 178500,
    acao: "",
    responsavel: "Frota Plus",
    resolvedAt: "2024-07-11 09:30",
    obs: "Filtros substituídos com sucesso.",
  },
  {
    id: 14,
    veiculo: "Tata 407 Gold",
    placa: "RJ14CD5566",
    tipo: "documento",
    titulo: "Renovação de CRLV concluída",
    desc: "CRLV renovado e atualizado no sistema.",
    prioridade: "baixo",
    status: "resolvido",
    data: "2024-07-08",
    km: 31600,
    acao: "",
    responsavel: "Dep. Administrativo",
    resolvedAt: "2024-07-09 14:15",
    obs: "Documento físico arquivado.",
  },
];

const activitySeed = [
  {
    title: "CRLV do Tata 407 renovado",
    time: "Hoje · 14:15",
    color: "var(--green)",
  },
  {
    title: "Filtros do Scania substituídos",
    time: "Ontem · 09:30",
    color: "var(--green)",
  },
  { title: "Falha no motor do Scania", time: "Há 2 dias", color: "var(--red)" },
  {
    title: "Inspeção do Volvo iniciada",
    time: "Há 3 dias",
    color: "var(--amber)",
  },
  {
    title: "Alerta de combustível gerado",
    time: "Há 4 dias",
    color: "var(--amber)",
  },
];

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getType(tipo) {
  return TYPE_CONFIG[tipo] || TYPE_CONFIG.manutencao;
}

function priorityRank(prioridade) {
  if (prioridade === "critico") return 0;
  if (prioridade === "medio") return 1;
  return 2;
}

function InfoIcon({ type }) {
  const config = getType(type);
  return (
    <div className="arc-icon" style={{ background: config.bg }}>
      <svg viewBox="0 0 24 24" style={{ fill: config.color }}>
        <path d={config.path} />
      </svg>
    </div>
  );
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState(alertsSeed);
  const [activity, setActivity] = useState(activitySeed);
  const [query, setQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState("todos");
  const [currentPriFilter, setCurrentPriFilter] = useState("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState("");

  const selectedAlert = alerts.find((alert) => alert.id === selectedId) || null;

  const filteredAlerts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let data = alerts.slice();

    if (currentFilter !== "todos") {
      data = data.filter((item) => item.status === currentFilter);
    }

    if (currentPriFilter !== "all") {
      if (currentPriFilter === "resolved") {
        data = data.filter((item) => item.status === "resolvido");
      } else {
        data = data.filter(
          (item) =>
            item.prioridade === currentPriFilter && item.status !== "resolvido",
        );
      }
    }

    if (normalized) {
      data = data.filter((item) =>
        [
          item.veiculo,
          item.placa,
          item.titulo,
          item.desc,
          getType(item.tipo).label,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      );
    }

    data.sort((a, b) => {
      if (sortNewest) {
        return b.data.localeCompare(a.data);
      }
      return a.data.localeCompare(b.data);
    });

    if (currentFilter === "todos" && currentPriFilter === "all") {
      data.sort((a, b) => {
        if (a.status === "resolvido" && b.status !== "resolvido") return 1;
        if (b.status === "resolvido" && a.status !== "resolvido") return -1;
        return priorityRank(a.prioridade) - priorityRank(b.prioridade);
      });
    }

    return data;
  }, [alerts, currentFilter, currentPriFilter, query, sortNewest]);

  const counters = useMemo(() => {
    const active = alerts.filter((item) => item.status !== "resolvido");
    return {
      critico: active.filter((item) => item.prioridade === "critico").length,
      medio: active.filter((item) => item.prioridade === "medio").length,
      baixo: active.filter((item) => item.prioridade === "baixo").length,
      resolvido: alerts.filter((item) => item.status === "resolvido").length,
      todos: alerts.length,
      pendente: alerts.filter((item) => item.status === "pendente").length,
      analise: alerts.filter((item) => item.status === "em_analise").length,
    };
  }, [alerts]);

  const groupedByType = useMemo(() => {
    const active = alerts.filter((item) => item.status !== "resolvido");
    const bucket = {};
    active.forEach((item) => {
      bucket[item.tipo] = (bucket[item.tipo] || 0) + 1;
    });
    return Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  const groupedByVehicle = useMemo(() => {
    const active = alerts.filter((item) => item.status !== "resolvido");
    const bucket = {};
    active.forEach((item) => {
      bucket[item.veiculo] = (bucket[item.veiculo] || 0) + 1;
    });
    return Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [alerts]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  }

  function resolveAlert(id) {
    const original = alerts.find((item) => item.id === id);
    if (!original || original.status === "resolvido") return;

    setAlerts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "resolvido",
              resolvedAt: new Date().toLocaleString("pt-BR"),
            }
          : item,
      ),
    );

    setActivity((prev) => {
      const next = [
        {
          title: `${original.titulo} resolvido`,
          time: "Agora",
          color: "var(--green)",
        },
        ...prev,
      ];
      return next.slice(0, 6);
    });

    showToast("Alerta marcado como resolvido!");
  }

  function resolveAllVisible() {
    const target = filteredAlerts.filter((item) => item.status !== "resolvido");

    if (target.length === 0) {
      showToast("Nenhum alerta para resolver.");
      return;
    }

    const ids = new Set(target.map((item) => item.id));

    setAlerts((prev) =>
      prev.map((item) =>
        ids.has(item.id)
          ? {
              ...item,
              status: "resolvido",
              resolvedAt: new Date().toLocaleString("pt-BR"),
            }
          : item,
      ),
    );

    setActivity((prev) => {
      const next = [
        {
          title: `${target.length} alertas resolvidos`,
          time: "Agora",
          color: "var(--green)",
        },
        ...prev,
      ];
      return next.slice(0, 6);
    });

    showToast(`${target.length} alertas marcados como resolvidos!`);
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-alerts-page">
        <div className="page-top">
          <div>
            <div className="page-title">Central de Alertas</div>
            <div className="page-sub">
              Monitore e resolva os alertas da sua frota em tempo real
            </div>
          </div>
          <button
            className="mark-all-btn"
            type="button"
            onClick={resolveAllVisible}
          >
            Resolver todos visíveis
          </button>
        </div>

        <div className="kpi-strip">
          <button
            className={`kpi-card k-red ${currentPriFilter === "critico" ? "kpi-active" : ""}`}
            type="button"
            onClick={() => {
              setCurrentFilter("todos");
              setCurrentPriFilter("critico");
            }}
          >
            <div className="kpi-icon red" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </div>
            <div>
              <div className="kpi-num" style={{ color: "var(--red)" }}>
                {counters.critico}
              </div>
              <div className="kpi-label">Críticos</div>
              <div className="kpi-sub" style={{ color: "var(--red)" }}>
                Ação imediata
              </div>
            </div>
          </button>

          <button
            className={`kpi-card k-amber ${currentPriFilter === "medio" ? "kpi-active" : ""}`}
            type="button"
            onClick={() => {
              setCurrentFilter("todos");
              setCurrentPriFilter("medio");
            }}
          >
            <div className="kpi-icon amber" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <div>
              <div className="kpi-num" style={{ color: "var(--amber)" }}>
                {counters.medio}
              </div>
              <div className="kpi-label">Moderados</div>
              <div className="kpi-sub" style={{ color: "var(--amber)" }}>
                Atenção necessária
              </div>
            </div>
          </button>

          <button
            className={`kpi-card k-blue ${currentPriFilter === "baixo" ? "kpi-active" : ""}`}
            type="button"
            onClick={() => {
              setCurrentFilter("todos");
              setCurrentPriFilter("baixo");
            }}
          >
            <div className="kpi-icon blue" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" />
              </svg>
            </div>
            <div>
              <div className="kpi-num" style={{ color: "var(--blue)" }}>
                {counters.baixo}
              </div>
              <div className="kpi-label">Baixos</div>
              <div className="kpi-sub" style={{ color: "var(--blue)" }}>
                Monitoramento
              </div>
            </div>
          </button>

          <button
            className={`kpi-card k-green ${currentPriFilter === "resolved" ? "kpi-active" : ""}`}
            type="button"
            onClick={() => {
              setCurrentFilter("todos");
              setCurrentPriFilter("resolved");
            }}
          >
            <div className="kpi-icon green">✓</div>
            <div>
              <div className="kpi-num" style={{ color: "var(--green)" }}>
                {counters.resolvido}
              </div>
              <div className="kpi-label">Resolvidos</div>
              <div className="kpi-sub" style={{ color: "var(--green)" }}>
                Hoje
              </div>
            </div>
          </button>
        </div>

        <div className="main-layout">
          <div>
            <div className="toolbar">
              <button
                className={`filter-tab ${currentFilter === "todos" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setCurrentFilter("todos");
                  setCurrentPriFilter("all");
                }}
              >
                Todos <span className="filter-count">{counters.todos}</span>
              </button>

              <button
                className={`filter-tab ${currentFilter === "pendente" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setCurrentFilter("pendente");
                  setCurrentPriFilter("all");
                }}
              >
                Pendentes{" "}
                <span className="filter-count is-red">{counters.pendente}</span>
              </button>

              <button
                className={`filter-tab ${currentFilter === "em_analise" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setCurrentFilter("em_analise");
                  setCurrentPriFilter("all");
                }}
              >
                Em análise{" "}
                <span className="filter-count is-amber">
                  {counters.analise}
                </span>
              </button>

              <button
                className={`filter-tab ${currentFilter === "resolvido" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setCurrentFilter("resolvido");
                  setCurrentPriFilter("all");
                }}
              >
                Resolvidos{" "}
                <span className="filter-count is-green">
                  {counters.resolvido}
                </span>
              </button>

              <div className="toolbar-right">
                <button
                  className="sort-btn"
                  type="button"
                  onClick={() => setSortNewest((old) => !old)}
                  title="Alternar ordenação"
                >
                  ⇵
                </button>
              </div>
            </div>

            <div className="search-area">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Buscar por veículo, tipo de alerta..."
              />
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <div className="empty-title">Nenhum alerta encontrado</div>
                <div className="empty-sub">
                  Todos os alertas foram resolvidos ou o filtro não retornou
                  resultados.
                </div>
              </div>
            ) : (
              <div className="alert-list">
                {filteredAlerts.map((alert, index) => {
                  const type = getType(alert.tipo);
                  const pri = PRI_CONFIG[alert.prioridade] || PRI_CONFIG.baixo;
                  const sta = STA_CONFIG[alert.status] || STA_CONFIG.pendente;
                  const isResolved = alert.status === "resolvido";

                  return (
                    <article
                      key={alert.id}
                      className={`alert-row-card pri-${alert.prioridade} ${isResolved ? "resolved" : ""}`}
                      style={{ animationDelay: `${index * 0.04}s` }}
                      onClick={() => setSelectedId(alert.id)}
                    >
                      <InfoIcon type={alert.tipo} />

                      <div className="arc-body">
                        <div className="arc-top">
                          <div className="arc-title">{alert.titulo}</div>
                          <span className={`badge ${pri.cls} dot`}>
                            {pri.label}
                          </span>
                          <span className={`badge ${sta.cls}`}>
                            {sta.label}
                          </span>
                        </div>
                        <div className="arc-desc">{alert.desc}</div>
                        <div className="arc-meta">
                          <div className="arc-meta-item">
                            <span>{alert.veiculo}</span>
                          </div>
                          <div className="arc-meta-item">
                            <span className="mono">{alert.placa}</span>
                          </div>
                          <div className="arc-meta-item">
                            <span>{formatDate(alert.data)}</span>
                          </div>
                          <div className="arc-meta-item">
                            <span>{alert.km.toLocaleString("pt-BR")} km</span>
                          </div>
                          <div className="arc-meta-item">
                            <span>{alert.responsavel}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="arc-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {isResolved ? (
                          <span className="arc-btn resolved-label">
                            Resolvido
                          </span>
                        ) : (
                          <button
                            className="arc-btn resolve"
                            type="button"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            ✓ Resolver
                          </button>
                        )}
                        <button
                          className="arc-btn"
                          type="button"
                          onClick={() => setSelectedId(alert.id)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                          Detalhes
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="side-panel">
            <div className="side-card">
              <div className="side-card-header">
                <div className="side-card-title">Alertas por tipo</div>
                <span className="badge badge-gray">
                  {alerts.filter((item) => item.status !== "resolvido").length}{" "}
                  ativos
                </span>
              </div>
              <div className="side-card-body">
                {groupedByType.map(([tipo, qtd]) => {
                  const type = getType(tipo);
                  const max = groupedByType[0]?.[1] || 1;
                  const pct = Math.round((qtd / max) * 100);
                  return (
                    <div key={tipo} className="stat-block">
                      <div className="stat-row">
                        <div className="stat-row-left">
                          <div
                            className="stat-dot"
                            style={{ background: type.color }}
                          />
                          <div className="stat-label">{type.label}</div>
                        </div>
                        <div className="stat-val">{qtd}</div>
                      </div>
                      <div className="mini-bar">
                        <div
                          className="mini-fill"
                          style={{ width: `${pct}%`, background: type.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="side-card">
              <div className="side-card-header">
                <div className="side-card-title">Veículos com mais alertas</div>
              </div>
              <div className="side-card-body">
                {groupedByVehicle.map(([name, qtd]) => {
                  const max = groupedByVehicle[0]?.[1] || 1;
                  const pct = Math.round((qtd / max) * 100);
                  const color =
                    qtd >= 3
                      ? "var(--red)"
                      : qtd >= 2
                        ? "var(--amber)"
                        : "var(--blue)";
                  return (
                    <div key={name} className="stat-block">
                      <div className="stat-row">
                        <div className="stat-row-left">
                          <div
                            className="stat-dot"
                            style={{ background: color }}
                          />
                          <div className="stat-label vehicle-label">{name}</div>
                        </div>
                        <div className="stat-val">{qtd}</div>
                      </div>
                      <div className="mini-bar">
                        <div
                          className="mini-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="side-card">
              <div className="side-card-header">
                <div className="side-card-title">Atividade recente</div>
              </div>
              <div className="side-card-body activity-list">
                {activity.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="act-item">
                    <div className="act-dot-wrap">
                      <div
                        className="act-dot"
                        style={{ background: item.color }}
                      />
                      <div className="act-connector" />
                    </div>
                    <div className="act-info">
                      <div className="act-title">{item.title}</div>
                      <div className="act-time">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <div
          className={`drawer-overlay ${selectedAlert ? "open" : ""}`}
          onClick={() => setSelectedId(null)}
        >
          {selectedAlert ? (
            <div
              className="drawer"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="drawer-header">
                <div
                  className="drawer-icon"
                  style={{ background: getType(selectedAlert.tipo).bg }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    style={{ fill: getType(selectedAlert.tipo).color }}
                  >
                    <path d={getType(selectedAlert.tipo).path} />
                  </svg>
                </div>
                <div className="drawer-head-text">
                  <div className="drawer-htitle">{selectedAlert.titulo}</div>
                  <div className="drawer-hsub">
                    {selectedAlert.veiculo} — {selectedAlert.placa}
                  </div>
                </div>
                <button
                  className="drawer-close"
                  type="button"
                  onClick={() => setSelectedId(null)}
                >
                  ×
                </button>
              </div>

              <div className="drawer-body">
                <div className="drawer-badges">
                  <span
                    className={`badge ${(PRI_CONFIG[selectedAlert.prioridade] || PRI_CONFIG.baixo).cls} dot`}
                  >
                    {
                      (PRI_CONFIG[selectedAlert.prioridade] || PRI_CONFIG.baixo)
                        .label
                    }
                  </span>
                  <span
                    className={`badge ${(STA_CONFIG[selectedAlert.status] || STA_CONFIG.pendente).cls}`}
                  >
                    {
                      (STA_CONFIG[selectedAlert.status] || STA_CONFIG.pendente)
                        .label
                    }
                  </span>
                  <span className="badge badge-gray">
                    {getType(selectedAlert.tipo).label}
                  </span>
                </div>

                <section className="drawer-section">
                  <div className="drawer-section-title">Descrição</div>
                  <div className="drawer-row only-value">
                    <div className="drawer-value">{selectedAlert.desc}</div>
                  </div>
                </section>

                <section className="drawer-section">
                  <div className="drawer-section-title">Identificação</div>
                  <div className="drawer-row">
                    <div className="drawer-label">Veículo</div>
                    <div className="drawer-value">{selectedAlert.veiculo}</div>
                  </div>
                  <div className="drawer-row">
                    <div className="drawer-label">Placa</div>
                    <div className="drawer-value mono">
                      {selectedAlert.placa}
                    </div>
                  </div>
                  <div className="drawer-row">
                    <div className="drawer-label">Tipo de alerta</div>
                    <div className="drawer-value">
                      {getType(selectedAlert.tipo).label}
                    </div>
                  </div>
                  <div className="drawer-row">
                    <div className="drawer-label">Data gerado</div>
                    <div className="drawer-value">
                      {formatDate(selectedAlert.data)}
                    </div>
                  </div>
                  <div className="drawer-row">
                    <div className="drawer-label">Quilometragem</div>
                    <div className="drawer-value mono">
                      {selectedAlert.km.toLocaleString("pt-BR")} km
                    </div>
                  </div>
                  <div className="drawer-row">
                    <div className="drawer-label">Responsável</div>
                    <div className="drawer-value">
                      {selectedAlert.responsavel}
                    </div>
                  </div>
                </section>

                {selectedAlert.acao ? (
                  <section className="drawer-section">
                    <div className="drawer-section-title">Ação recomendada</div>
                    <div className="drawer-row only-value">
                      <div className="drawer-value">{selectedAlert.acao}</div>
                    </div>
                  </section>
                ) : null}

                {selectedAlert.obs ? (
                  <section className="drawer-section">
                    <div className="drawer-section-title">Observações</div>
                    <div className="drawer-row only-value">
                      <div className="drawer-value">{selectedAlert.obs}</div>
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="drawer-footer">
                <button
                  className="btn-full ghost"
                  type="button"
                  onClick={() => setSelectedId(null)}
                >
                  Fechar
                </button>
                <button
                  className="btn-full success"
                  type="button"
                  disabled={selectedAlert.status === "resolvido"}
                  onClick={() => {
                    resolveAlert(selectedAlert.id);
                    setSelectedId(null);
                  }}
                >
                  {selectedAlert.status === "resolvido"
                    ? "Já resolvido"
                    : "Marcar como resolvido"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      </div>
    </AppLayout>
  );
}
