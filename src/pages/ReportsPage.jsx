import "../styles/reports-page.css";
import { useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MONTHLY_COSTS = [
  4200, 6800, 3500, 9200, 5100, 7400, 8600, 4900, 11200, 6300, 8900, 21535,
];

const PIE_DATA = [
  { label: "Troca de óleo", value: 28, color: "#2563EB" },
  { label: "Revisão de freios", value: 18, color: "#DC2626" },
  { label: "Inspeção preventiva", value: 16, color: "#16A34A" },
  { label: "Troca de filtros", value: 13, color: "#D97706" },
  { label: "Revisão geral", value: 11, color: "#7C3AED" },
  { label: "Outros", value: 14, color: "#7B8CA0" },
];

const BAR_DATA = [
  { veiculo: "Scania P 360", placa: "TN09KL3344", qtd: 3, custo: 14500 },
  { veiculo: "Volvo FH 460", placa: "MH02AB1234", qtd: 3, custo: 10880 },
  { veiculo: "Tata Prima 4928S", placa: "DL1PC4421", qtd: 2, custo: 3020 },
  { veiculo: "Eicher Pro 2059", placa: "GJ28HT2889", qtd: 2, custo: 1300 },
  { veiculo: "Iveco Stralis 460", placa: "WB28CD4499", qtd: 1, custo: 3200 },
  { veiculo: "Ashok Leyland 3718", placa: "KA05MN9087", qtd: 2, custo: 3985 },
  { veiculo: "Mercedes Actros 2546", placa: "UP32GH7712", qtd: 1, custo: 250 },
  { veiculo: "Tata 407 Gold", placa: "RJ14CD5566", qtd: 1, custo: 600 },
];

const TABLE_DATA = [
  {
    veiculo: "Scania P 360",
    placa: "TN09KL3344",
    qtd: 3,
    custo: 14500,
    ultima: "23 Jul 2024",
    alertas: 2,
    perf: 40,
  },
  {
    veiculo: "Volvo FH 460",
    placa: "MH02AB1234",
    qtd: 3,
    custo: 10880,
    ultima: "22 Jul 2024",
    alertas: 2,
    perf: 45,
  },
  {
    veiculo: "Ashok Leyland 3718",
    placa: "KA05MN9087",
    qtd: 2,
    custo: 3985,
    ultima: "18 Jul 2024",
    alertas: 1,
    perf: 70,
  },
  {
    veiculo: "Iveco Stralis 460",
    placa: "WB28CD4499",
    qtd: 1,
    custo: 3200,
    ultima: "28 Jun 2024",
    alertas: 0,
    perf: 90,
  },
  {
    veiculo: "Tata Prima 4928S",
    placa: "DL1PC4421",
    qtd: 2,
    custo: 3020,
    ultima: "05 Jul 2024",
    alertas: 2,
    perf: 60,
  },
  {
    veiculo: "Eicher Pro 2059",
    placa: "GJ28HT2889",
    qtd: 2,
    custo: 1300,
    ultima: "10 Jun 2024",
    alertas: 2,
    perf: 62,
  },
  {
    veiculo: "Tata 407 Gold",
    placa: "RJ14CD5566",
    qtd: 1,
    custo: 600,
    ultima: "24 Jul 2024",
    alertas: 1,
    perf: 78,
  },
  {
    veiculo: "Mercedes Actros 2546",
    placa: "UP32GH7712",
    qtd: 1,
    custo: 250,
    ultima: "20 Jul 2024",
    alertas: 0,
    perf: 95,
  },
];

const DONUT_DATA = [
  { label: "Disponíveis", value: 3, color: "#16A34A" },
  { label: "Em rota", value: 3, color: "#2563EB" },
  { label: "Manutenção", value: 2, color: "#DC2626" },
];

const PERIOD_FACTOR = {
  7: 0.3,
  30: 1,
  90: 2.7,
  180: 5.2,
  365: 10.5,
};

function formatCurrency(value) {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

function toPieSlicePath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);

  const x3 = cx + innerR * Math.cos(endAngle);
  const y3 = cy + innerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(startAngle);
  const y4 = cy + innerR * Math.sin(startAngle);

  return [
    `M${x4},${y4}`,
    `L${x1},${y1}`,
    `A${outerR},${outerR},0,${largeArc},1,${x2},${y2}`,
    `L${x3},${y3}`,
    `A${innerR},${innerR},0,${largeArc},0,${x4},${y4}`,
    "Z",
  ].join(" ");
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
    </svg>
  );
}

export function ReportsPage() {
  const [periodo, setPeriodo] = useState("30");
  const [veiculo, setVeiculo] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [barMode, setBarMode] = useState("qtd");
  const [toast, setToast] = useState("");

  const filteredTable = useMemo(() => {
    if (veiculo === "todos") {
      return TABLE_DATA;
    }
    return TABLE_DATA.filter((item) => item.veiculo === veiculo);
  }, [veiculo]);

  const filteredBar = useMemo(() => {
    const source =
      veiculo === "todos"
        ? BAR_DATA
        : BAR_DATA.filter((item) => item.veiculo === veiculo);
    return source.slice().sort((a, b) => b[barMode] - a[barMode]);
  }, [veiculo, barMode]);

  const derived = useMemo(() => {
    const factor = PERIOD_FACTOR[periodo] || 1;
    const totalCostBase = filteredTable.reduce(
      (sum, item) => sum + item.custo,
      0,
    );
    const totalMaintBase = filteredTable.reduce(
      (sum, item) => sum + item.qtd,
      0,
    );
    const activeVehicles = filteredTable.length;
    const activeAlerts = filteredTable.reduce(
      (sum, item) => sum + item.alertas,
      0,
    );

    let tipoFactor = 1;
    if (tipo !== "todos") {
      const entry = PIE_DATA.find((item) => item.label === tipo);
      const total = PIE_DATA.reduce((sum, item) => sum + item.value, 0) || 1;
      tipoFactor = entry ? entry.value / total : 0.25;
    }

    const cost = totalCostBase * factor * tipoFactor;
    const manut = Math.max(1, Math.round(totalMaintBase * factor * tipoFactor));
    const alerts = Math.max(0, Math.round(activeAlerts * tipoFactor));

    return {
      cost,
      manut,
      activeVehicles,
      alerts,
    };
  }, [filteredTable, periodo, tipo]);

  const lineChart = useMemo(() => {
    const values = MONTHLY_COSTS.map(
      (value) => value * (PERIOD_FACTOR[periodo] || 1),
    );
    const W = 520;
    const H = 200;
    const padL = 52;
    const padR = 16;
    const padT = 16;
    const padB = 32;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const max = Math.max(...values) * 1.15;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stepX = cW / (values.length - 1);
    const y = (v) => padT + cH - (v / max) * cH;

    const points = values.map((v, i) => ({
      x: padL + i * stepX,
      y: y(v),
      value: v,
    }));

    const line = points
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
    const area = `${line} L${points[points.length - 1].x},${padT + cH} L${points[0].x},${padT + cH} Z`;

    return { points, line, area, max, avg, W, H, padL, padR, padT, padB, cH };
  }, [periodo]);

  const pieSlices = useMemo(() => {
    let source = PIE_DATA;
    if (tipo !== "todos") {
      source = PIE_DATA.filter((item) => item.label === tipo);
    }
    const total = source.reduce((sum, item) => sum + item.value, 0) || 1;
    let angle = -Math.PI / 2;
    return {
      total,
      list: source.map((item) => {
        const sweep = (item.value / total) * Math.PI * 2;
        const path = toPieSlicePath(80, 80, 64, 36, angle, angle + sweep);
        angle += sweep;
        return {
          ...item,
          path,
          percent: Math.round((item.value / total) * 100),
        };
      }),
    };
  }, [tipo]);

  const donutSlices = useMemo(() => {
    const total = DONUT_DATA.reduce((sum, item) => sum + item.value, 0) || 1;
    let angle = -Math.PI / 2;
    return {
      total,
      list: DONUT_DATA.map((item) => {
        const sweep = (item.value / total) * Math.PI * 2;
        const path = toPieSlicePath(70, 70, 58, 38, angle, angle + sweep);
        angle += sweep;
        return item.path ? item : { ...item, path };
      }),
    };
  }, []);

  function fireToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  function applyFilters() {
    const labels = {
      7: "7 dias",
      30: "30 dias",
      90: "3 meses",
      180: "6 meses",
      365: "1 ano",
    };
    fireToast(`Filtros aplicados — Período: ${labels[periodo]}`);
  }

  function resetFilters() {
    setPeriodo("30");
    setVeiculo("todos");
    setTipo("todos");
    fireToast("Filtros resetados");
  }

  const maxTableCost = Math.max(...filteredTable.map((item) => item.custo), 1);
  const maxBar = Math.max(...filteredBar.map((item) => item[barMode]), 1);

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-reports-page">
        <div className="page-top">
          <div>
            <div className="page-title">Relatórios e Análises</div>
            <div className="page-sub">
              Visão consolidada da performance e custos da frota
            </div>
          </div>

          <button
            className="export-btn"
            type="button"
            onClick={() => fireToast("Relatório exportado como PDF!")}
          >
            Exportar PDF
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <div className="filter-label">Período</div>
            <select
              className="filter-select"
              value={periodo}
              onChange={(event) => setPeriodo(event.target.value)}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 3 meses</option>
              <option value="180">Últimos 6 meses</option>
              <option value="365">Último ano</option>
            </select>
          </div>

          <div className="filter-divider" />

          <div className="filter-group">
            <div className="filter-label">Veículo</div>
            <select
              className="filter-select"
              value={veiculo}
              onChange={(event) => setVeiculo(event.target.value)}
            >
              <option value="todos">Todos os veículos</option>
              {BAR_DATA.map((item) => (
                <option key={item.veiculo} value={item.veiculo}>
                  {item.veiculo}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-divider" />

          <div className="filter-group">
            <div className="filter-label">Tipo de manutenção</div>
            <select
              className="filter-select"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              {PIE_DATA.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-bar-right">
            <button className="reset-btn" type="button" onClick={resetFilters}>
              Limpar
            </button>
            <button className="apply-btn" type="button" onClick={applyFilters}>
              Aplicar
            </button>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">$</div>
          <div className="insight-text">
            <div className="insight-title">Resumo do período selecionado</div>
            <div className="insight-desc">
              Análise consolidada com base nos dados de manutenção, agendamentos
              e alertas da frota.
            </div>
          </div>

          <div className="insight-stats">
            <div className="ins-stat">
              <div className="ins-num">{formatCurrency(derived.cost)}</div>
              <div className="ins-lbl">Custo total</div>
            </div>
            <div className="ins-stat">
              <div className="ins-num">{derived.manut}</div>
              <div className="ins-lbl">Manutenções</div>
            </div>
            <div className="ins-stat">
              <div className="ins-num">{derived.alerts}</div>
              <div className="ins-lbl">Alertas</div>
            </div>
          </div>
        </div>

        <div className="kpi-strip">
          <div className="kpi-card kb">
            <div className="kpi-icon purple">$</div>
            <div className="kpi-data">
              <div className="kpi-val is-purple">
                {formatCurrency(derived.cost)}
              </div>
              <div className="kpi-label">Custo total da frota</div>
              <div className="kpi-delta up">↑ 12% vs mês anterior</div>
            </div>
          </div>

          <div className="kpi-card ka">
            <div className="kpi-icon blue">⚙</div>
            <div className="kpi-data">
              <div className="kpi-val is-blue">{derived.manut}</div>
              <div className="kpi-label">Total de manutenções</div>
              <div className="kpi-delta down">↓ 3 vs mês anterior</div>
            </div>
          </div>

          <div className="kpi-card kg">
            <div className="kpi-icon green">
              <TruckIcon />
            </div>
            <div className="kpi-data">
              <div className="kpi-val is-green">{derived.activeVehicles}</div>
              <div className="kpi-label">Veículos ativos</div>
              <div className="kpi-delta neutral">→ Sem alteração</div>
            </div>
          </div>

          <div className="kpi-card kr">
            <div className="kpi-icon red">!</div>
            <div className="kpi-data">
              <div className="kpi-val is-red">{derived.alerts}</div>
              <div className="kpi-label">Alertas ativos</div>
              <div className="kpi-delta down">↑ 2 novos hoje</div>
            </div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Custo por mês</div>
                <div className="chart-sub">
                  Evolução do custo acumulado de manutenção (R$)
                </div>
              </div>
            </div>

            <div className="chart-body">
              <svg viewBox="0 0 520 200" className="line-svg">
                {[0, 0.25, 0.5, 0.75, 1].map((scale) => {
                  const y = lineChart.padT + lineChart.cH * (1 - scale);
                  const label = Math.round((lineChart.max * scale) / 1000);
                  return (
                    <g key={scale}>
                      <line
                        x1={lineChart.padL}
                        y1={y}
                        x2={lineChart.W - lineChart.padR}
                        y2={y}
                        stroke="#E5E9F2"
                        strokeWidth="1"
                      />
                      <text
                        x={lineChart.padL - 6}
                        y={y + 4}
                        textAnchor="end"
                        className="axis-label"
                      >
                        R${label}k
                      </text>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient
                    id="reportsAreaGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <line
                  x1={lineChart.padL}
                  y1={
                    lineChart.padT +
                    lineChart.cH -
                    (lineChart.avg / lineChart.max) * lineChart.cH
                  }
                  x2={lineChart.W - lineChart.padR}
                  y2={
                    lineChart.padT +
                    lineChart.cH -
                    (lineChart.avg / lineChart.max) * lineChart.cH
                  }
                  stroke="#7C3AED"
                  strokeWidth="1.5"
                  strokeDasharray="5,4"
                  opacity="0.5"
                />

                <path d={lineChart.area} fill="url(#reportsAreaGrad)" />
                <path
                  d={lineChart.line}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {lineChart.points.map((point, index) => (
                  <g key={MONTH_LABELS[index]}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={index === lineChart.points.length - 1 ? 5 : 3.5}
                      fill={
                        index === lineChart.points.length - 1
                          ? "#2563EB"
                          : "white"
                      }
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                    <text
                      x={point.x}
                      y={lineChart.padT + lineChart.cH + 18}
                      textAnchor="middle"
                      className="axis-label"
                    >
                      {MONTH_LABELS[index]}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-rect is-blue" /> Custo de manutenção
                </div>
                <div className="legend-item">
                  <span className="legend-rect is-purple" /> Média mensal
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Manutenções por tipo</div>
                <div className="chart-sub">
                  Distribuição dos serviços realizados
                </div>
              </div>
            </div>

            <div className="chart-body pie-wrap">
              <svg viewBox="0 0 160 160" className="pie-svg">
                {pieSlices.list.map((slice) => (
                  <path
                    key={slice.label}
                    d={slice.path}
                    fill={slice.color}
                    opacity="0.92"
                  />
                ))}
                <circle cx="80" cy="80" r="36" fill="white" />
                <text x="80" y="76" textAnchor="middle" className="center-big">
                  {pieSlices.total}
                </text>
                <text
                  x="80"
                  y="92"
                  textAnchor="middle"
                  className="center-small"
                >
                  serviços
                </text>
              </svg>

              <div className="pie-legend">
                {pieSlices.list.map((item) => (
                  <div className="legend-item pie-item" key={item.label}>
                    <span
                      className="legend-dot"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="charts-row-3">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Veículos com mais manutenções</div>
                <div className="chart-sub">
                  Quantidade e custo acumulado por veículo
                </div>
              </div>
              <div className="bar-switch">
                <button
                  type="button"
                  className={barMode === "qtd" ? "active" : ""}
                  onClick={() => setBarMode("qtd")}
                >
                  Qtd.
                </button>
                <button
                  type="button"
                  className={barMode === "custo" ? "active" : ""}
                  onClick={() => setBarMode("custo")}
                >
                  Custo
                </button>
              </div>
            </div>

            <div className="chart-body">
              <svg viewBox="0 0 480 200" className="bar-svg">
                {[0, 0.33, 0.66, 1].map((scale) => {
                  const y = 16 + (200 - 16 - 48) * (1 - scale);
                  return (
                    <line
                      key={scale}
                      x1="16"
                      y1={y}
                      x2="464"
                      y2={y}
                      stroke="#E5E9F2"
                      strokeWidth="1"
                    />
                  );
                })}

                {filteredBar.map((item, index) => {
                  const value = item[barMode];
                  const cW = 480 - 16 - 16;
                  const gap = cW / filteredBar.length;
                  const barW = gap * 0.55;
                  const x = 16 + index * gap + (gap - barW) / 2;
                  const h = (value / maxBar) * (200 - 16 - 48);
                  const y = 16 + (200 - 16 - 48) - h;
                  const shortName = item.veiculo
                    .split(" ")
                    .slice(0, 2)
                    .join(" ");
                  const colors = [
                    "#2563EB",
                    "#7C3AED",
                    "#DC2626",
                    "#D97706",
                    "#16A34A",
                    "#0891B2",
                    "#EC4899",
                    "#F59E0B",
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <g key={item.veiculo}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="4"
                        fill={color}
                        opacity="0.85"
                      />
                      <text
                        x={x + barW / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className="bar-value"
                        fill={color}
                      >
                        {barMode === "custo"
                          ? `R$${Math.round(item.custo / 1000)}k`
                          : item.qtd}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={166}
                        textAnchor="middle"
                        className="axis-label"
                      >
                        {shortName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Status da frota</div>
                <div className="chart-sub">Distribuição atual</div>
              </div>
            </div>

            <div className="chart-body donut-wrap">
              <svg viewBox="0 0 140 140" className="donut-svg">
                {donutSlices.list.map((slice) => (
                  <path
                    key={slice.label}
                    d={slice.path}
                    fill={slice.color}
                    opacity="0.88"
                  />
                ))}
                <circle cx="70" cy="70" r="38" fill="white" />
                <text x="70" y="66" textAnchor="middle" className="center-big">
                  {donutSlices.total}
                </text>
                <text
                  x="70"
                  y="82"
                  textAnchor="middle"
                  className="center-small"
                >
                  veículos
                </text>
              </svg>

              <div className="donut-legend">
                {donutSlices.list.map((item) => (
                  <div className="donut-item" key={item.label}>
                    <span
                      className="legend-dot"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                    <strong style={{ color: item.color }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <div className="chart-title">Resumo por Veículo</div>
              <div className="chart-sub">
                Performance individual de cada veículo no período
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Manutenções</th>
                  <th>Custo acumulado</th>
                  <th>Custo médio</th>
                  <th>Última manutenção</th>
                  <th>Alertas ativos</th>
                  <th>Performance</th>
                </tr>
              </thead>

              <tbody>
                {filteredTable.map((item) => {
                  const costPct = Math.round((item.custo / maxTableCost) * 100);
                  const perfClass =
                    item.perf >= 85
                      ? "badge-green"
                      : item.perf >= 65
                        ? "badge-amber"
                        : "badge-red";

                  return (
                    <tr key={item.placa}>
                      <td>
                        <div className="vc">
                          <div className="vc-av">
                            <TruckIcon />
                          </div>
                          <div>
                            <div className="vc-name">{item.veiculo}</div>
                            <div className="vc-plate">{item.placa}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-big-blue">{item.qtd}</span>
                      </td>
                      <td>
                        <div className="table-money">
                          {formatCurrency(item.custo)}
                        </div>
                        <div className="bar-cell">
                          <div className="bar-bg">
                            <div
                              className="bar-fill"
                              style={{ width: `${costPct}%` }}
                            />
                          </div>
                          <div className="bar-pct">{costPct}%</div>
                        </div>
                      </td>
                      <td>
                        {formatCurrency(Math.round(item.custo / item.qtd))}
                      </td>
                      <td>{item.ultima}</td>
                      <td>
                        {item.alertas > 0 ? (
                          <span className="badge badge-red">
                            {item.alertas} alerta{item.alertas > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="badge badge-green">Nenhum</span>
                        )}
                      </td>
                      <td>
                        <div className="perf-wrap">
                          <div className="perf-bar-bg">
                            <div
                              className="perf-bar-fill"
                              style={{ width: `${item.perf}%` }}
                            />
                          </div>
                          <span className={`badge ${perfClass}`}>
                            {item.perf}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`reports-toast ${toast ? "show" : ""}`}>{toast}</div>
    </AppLayout>
  );
}
