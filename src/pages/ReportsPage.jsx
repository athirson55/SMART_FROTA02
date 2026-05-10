import "../styles/reports-page.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { AppHeader } from "../components/AppHeader";
import { exportExcelReport, getCompleteReport } from "../services/reports.js";
import { getVehicles } from "../services/vehicles.js";

function formatCurrency(value) {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

function formatDelta(value) {
  if (value === 0) return { text: "→ Sem alteração", cls: "neutral" };
  if (value > 0) return { text: `↑ ${value}% vs período anterior`, cls: "up" };
  return { text: `↓ ${Math.abs(value)}% vs período anterior`, cls: "down" };
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
  return [`M${x4},${y4}`, `L${x1},${y1}`, `A${outerR},${outerR},0,${largeArc},1,${x2},${y2}`, `L${x3},${y3}`, `A${innerR},${innerR},0,${largeArc},0,${x4},${y4}`, "Z"].join(" ");
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div className="reports-loading">
      <div className="reports-loading-spinner" />
      <p>Carregando dados do banco...</p>
    </div>
  );
}

export function ReportsPage() {
  const [periodo, setPeriodo] = useState("30");
  const [veiculoId, setVeiculoId] = useState("todos");
  const [barMode, setBarMode] = useState("custo");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const abortRef = useRef(null);

  const fetchReport = useCallback(
    (dias, vId) => {
      if (abortRef.current) abortRef.current = false;
      const token = {};
      abortRef.current = token;
      setLoading(true);
      const params = { dias };
      if (vId && vId !== "todos") params.veiculo_id = vId;
      getCompleteReport(params)
        .then((res) => {
          if (abortRef.current !== token) return;
          setReport(res.data?.data ?? null);
        })
        .catch(() => {
          if (abortRef.current !== token) return;
          setReport(null);
        })
        .finally(() => {
          if (abortRef.current !== token) return;
          setLoading(false);
        });
    },
    [],
  );

  useEffect(() => {
    getVehicles({ limit: 200 })
      .then((res) => setVehicles(res.data?.data ?? []))
      .catch(() => setVehicles([]));
  }, []);

  useEffect(() => {
    fetchReport(periodo, veiculoId);
  }, [periodo, veiculoId, fetchReport]);

  function fireToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function exportExcel() {
    setExporting(true);
    const params = { dias: periodo };
    if (veiculoId && veiculoId !== "todos") params.veiculo_id = veiculoId;
    exportExcelReport(params)
      .then((res) => {
        const url = URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `smart-frota-relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        fireToast("Excel exportado com sucesso!");
      })
      .catch(() => fireToast("Erro ao exportar Excel. Tente novamente."))
      .finally(() => setExporting(false));
  }

  function exportCSV() {
    if (!report?.vehicleStats?.length) {
      fireToast("Sem dados para exportar");
      return;
    }
    const header = ["Veículo", "Placa", "Manutenções", "Custo Total (R$)", "Custo Médio (R$)", "Última Manutenção", "Alertas Ativos", "Performance (%)"];
    const rows = report.vehicleStats.map((v) => [
      v.modelo, v.placa, v.qtd,
      Math.round(v.totalCost), Math.round(v.avgCost),
      v.lastMaintenance, v.alerts, v.performance,
    ]);
    const csv = [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-frota-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    fireToast("CSV exportado com sucesso!");
  }

  // --- Derived chart data ---
  const lineChart = useMemo(() => {
    const raw = report?.monthlyCosts ?? [];
    if (!raw.length) return null;
    const values = raw.map((m) => m.cost);
    const W = 520, H = 200, padL = 52, padR = 16, padT = 16, padB = 32;
    const cW = W - padL - padR, cH = H - padT - padB;
    const max = Math.max(...values, 1) * 1.15;
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const stepX = cW / Math.max(values.length - 1, 1);
    const toY = (v) => padT + cH - (v / max) * cH;
    const points = values.map((v, i) => ({ x: padL + i * stepX, y: toY(v), value: v }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${points[points.length - 1].x},${padT + cH} L${points[0].x},${padT + cH} Z`;
    return { points, line, area, max, avg, labels: raw.map((m) => m.month), W, H, padL, padR, padT, padB, cH };
  }, [report]);

  const pieSlices = useMemo(() => {
    const source = report?.maintenanceByType ?? [];
    const total = source.reduce((s, item) => s + item.value, 0) || 1;
    let angle = -Math.PI / 2;
    return {
      total,
      list: source.map((item) => {
        const sweep = (item.value / total) * Math.PI * 2;
        const path = toPieSlicePath(80, 80, 64, 36, angle, angle + sweep);
        angle += sweep;
        return { ...item, path, percent: Math.round((item.value / total) * 100) };
      }),
    };
  }, [report]);

  const donutSlices = useMemo(() => {
    const source = report?.fleetStatus ?? [];
    const total = source.reduce((s, item) => s + item.value, 0) || 1;
    let angle = -Math.PI / 2;
    return {
      total,
      list: source.map((item) => {
        const sweep = (item.value / total) * Math.PI * 2;
        const path = toPieSlicePath(70, 70, 58, 38, angle, angle + sweep);
        angle += sweep;
        return { ...item, path };
      }),
    };
  }, [report]);

  const filteredBar = useMemo(() => {
    const source = report?.vehicleStats ?? [];
    return source.slice().sort((a, b) => b[barMode === "custo" ? "totalCost" : "qtd"] - a[barMode === "custo" ? "totalCost" : "qtd"]);
  }, [report, barMode]);

  const maxBar = useMemo(() => Math.max(...filteredBar.map((v) => barMode === "custo" ? v.totalCost : v.qtd), 1), [filteredBar, barMode]);

  const kpis = report?.kpis ?? {};
  const delta = formatDelta(kpis.deltaCost ?? 0);

  const BAR_COLORS = ["#2563EB", "#7C3AED", "#DC2626", "#D97706", "#16A34A", "#0891B2", "#EC4899", "#F59E0B"];

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content fg-reports-page">
        <div className="page-top">
          <div>
            <div className="page-title">Relatórios e Análises</div>
            <div className="page-sub">Visão consolidada da performance e custos da frota</div>
          </div>
          <div className="export-actions">
            <button className="export-btn" type="button" onClick={exportCSV}>
              Exportar CSV
            </button>
            <button className="export-btn export-btn-excel" type="button" onClick={exportExcel} disabled={exporting}>
              {exporting ? "Gerando..." : "Exportar Excel"}
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <div className="filter-label">Período</div>
            <select className="filter-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
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
            <select className="filter-select" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}>
              <option value="todos">Todos os veículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.modelo || v.model} — {v.placa || v.plate}</option>
              ))}
            </select>
          </div>

          <div className="filter-bar-right">
            <button className="reset-btn" type="button" onClick={() => { setPeriodo("30"); setVeiculoId("todos"); }}>
              Limpar
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="insight-card">
              <div className="insight-icon">$</div>
              <div className="insight-text">
                <div className="insight-title">Resumo do período selecionado</div>
                <div className="insight-desc">Dados reais de manutenção, agendamentos e alertas da frota.</div>
              </div>
              <div className="insight-stats">
                <div className="ins-stat">
                  <div className="ins-num">{formatCurrency(kpis.totalCost ?? 0)}</div>
                  <div className="ins-lbl">Custo total</div>
                </div>
                <div className="ins-stat">
                  <div className="ins-num">{kpis.maintenanceCount ?? 0}</div>
                  <div className="ins-lbl">Manutenções</div>
                </div>
                <div className="ins-stat">
                  <div className="ins-num">{kpis.openAlerts ?? 0}</div>
                  <div className="ins-lbl">Alertas</div>
                </div>
              </div>
            </div>

            <div className="kpi-strip">
              <div className="kpi-card kb">
                <div className="kpi-icon purple">$</div>
                <div className="kpi-data">
                  <div className="kpi-val is-purple">{formatCurrency(kpis.totalCost ?? 0)}</div>
                  <div className="kpi-label">Custo total da frota</div>
                  <div className={`kpi-delta ${delta.cls}`}>{delta.text}</div>
                </div>
              </div>
              <div className="kpi-card ka">
                <div className="kpi-icon blue">⚙</div>
                <div className="kpi-data">
                  <div className="kpi-val is-blue">{kpis.maintenanceCount ?? 0}</div>
                  <div className="kpi-label">Total de manutenções</div>
                  <div className={`kpi-delta ${(kpis.deltaCount ?? 0) <= 0 ? "down" : "up"}`}>
                    {(kpis.deltaCount ?? 0) === 0 ? "→ Sem alteração" : `${kpis.deltaCount > 0 ? "↑" : "↓"} ${Math.abs(kpis.deltaCount ?? 0)} vs período anterior`}
                  </div>
                </div>
              </div>
              <div className="kpi-card kg">
                <div className="kpi-icon green"><TruckIcon /></div>
                <div className="kpi-data">
                  <div className="kpi-val is-green">{kpis.activeVehicles ?? 0}</div>
                  <div className="kpi-label">Veículos disponíveis</div>
                  <div className="kpi-delta neutral">→ Status atual</div>
                </div>
              </div>
              <div className="kpi-card kr">
                <div className="kpi-icon red">!</div>
                <div className="kpi-data">
                  <div className="kpi-val is-red">{kpis.openAlerts ?? 0}</div>
                  <div className="kpi-label">Alertas ativos</div>
                  <div className="kpi-delta neutral">→ Sem resolução</div>
                </div>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Custo por mês</div>
                    <div className="chart-sub">Evolução do custo acumulado de manutenção (R$)</div>
                  </div>
                </div>
                <div className="chart-body">
                  {lineChart ? (
                    <svg viewBox="0 0 520 200" className="line-svg">
                      {[0, 0.25, 0.5, 0.75, 1].map((scale) => {
                        const y = lineChart.padT + lineChart.cH * (1 - scale);
                        const label = Math.round((lineChart.max * scale) / 1000);
                        return (
                          <g key={scale}>
                            <line x1={lineChart.padL} y1={y} x2={lineChart.W - lineChart.padR} y2={y} stroke="#E5E9F2" strokeWidth="1" />
                            <text x={lineChart.padL - 6} y={y + 4} textAnchor="end" className="axis-label">R${label}k</text>
                          </g>
                        );
                      })}
                      <defs>
                        <linearGradient id="reportsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line
                        x1={lineChart.padL} y1={lineChart.padT + lineChart.cH - (lineChart.avg / lineChart.max) * lineChart.cH}
                        x2={lineChart.W - lineChart.padR} y2={lineChart.padT + lineChart.cH - (lineChart.avg / lineChart.max) * lineChart.cH}
                        stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.5"
                      />
                      <path d={lineChart.area} fill="url(#reportsAreaGrad)" />
                      <path d={lineChart.line} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {lineChart.points.map((point, index) => (
                        <g key={lineChart.labels[index]}>
                          <circle cx={point.x} cy={point.y} r={index === lineChart.points.length - 1 ? 5 : 3.5} fill={index === lineChart.points.length - 1 ? "#2563EB" : "white"} stroke="#2563EB" strokeWidth="2" />
                          <text x={point.x} y={lineChart.padT + lineChart.cH + 18} textAnchor="middle" className="axis-label">{lineChart.labels[index]}</text>
                        </g>
                      ))}
                    </svg>
                  ) : (
                    <div className="chart-empty">Sem dados de manutenção no período</div>
                  )}
                  <div className="chart-legend">
                    <div className="legend-item"><span className="legend-rect is-blue" /> Custo de manutenção</div>
                    <div className="legend-item"><span className="legend-rect is-purple" /> Média mensal</div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Manutenções por tipo</div>
                    <div className="chart-sub">Distribuição dos serviços realizados</div>
                  </div>
                </div>
                <div className="chart-body pie-wrap">
                  {pieSlices.list.length > 0 ? (
                    <>
                      <svg viewBox="0 0 160 160" className="pie-svg">
                        {pieSlices.list.map((slice) => (
                          <path key={slice.label} d={slice.path} fill={slice.color} opacity="0.92" />
                        ))}
                        <circle cx="80" cy="80" r="36" fill="white" />
                        <text x="80" y="76" textAnchor="middle" className="center-big">{pieSlices.total}</text>
                        <text x="80" y="92" textAnchor="middle" className="center-small">serviços</text>
                      </svg>
                      <div className="pie-legend">
                        {pieSlices.list.map((item) => (
                          <div className="legend-item pie-item" key={item.label}>
                            <span className="legend-dot" style={{ background: item.color }} />
                            <span>{item.label}</span>
                            <strong>{item.percent}%</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="chart-empty">Sem manutenções no período</div>
                  )}
                </div>
              </div>
            </div>

            <div className="charts-row-3">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Veículos com mais manutenções</div>
                    <div className="chart-sub">Quantidade e custo acumulado por veículo</div>
                  </div>
                  <div className="bar-switch">
                    <button type="button" className={barMode === "qtd" ? "active" : ""} onClick={() => setBarMode("qtd")}>Qtd.</button>
                    <button type="button" className={barMode === "custo" ? "active" : ""} onClick={() => setBarMode("custo")}>Custo</button>
                  </div>
                </div>
                <div className="chart-body">
                  {filteredBar.length > 0 ? (
                    <svg viewBox="0 0 480 200" className="bar-svg">
                      {[0, 0.33, 0.66, 1].map((scale) => {
                        const y = 16 + (200 - 16 - 48) * (1 - scale);
                        return <line key={scale} x1="16" y1={y} x2="464" y2={y} stroke="#E5E9F2" strokeWidth="1" />;
                      })}
                      {filteredBar.slice(0, 8).map((item, index) => {
                        const value = barMode === "custo" ? item.totalCost : item.qtd;
                        const cW = 480 - 16 - 16;
                        const count = Math.min(filteredBar.length, 8);
                        const gap = cW / count;
                        const barW = gap * 0.55;
                        const x = 16 + index * gap + (gap - barW) / 2;
                        const h = (value / maxBar) * (200 - 16 - 48);
                        const y = 16 + (200 - 16 - 48) - h;
                        const shortName = item.modelo.split(" ").slice(0, 2).join(" ");
                        const color = BAR_COLORS[index % BAR_COLORS.length];
                        return (
                          <g key={item.id}>
                            <rect x={x} y={y} width={barW} height={h} rx="4" fill={color} opacity="0.85" />
                            <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="bar-value" fill={color}>
                              {barMode === "custo" ? `R$${Math.round(item.totalCost / 1000)}k` : item.qtd}
                            </text>
                            <text x={x + barW / 2} y={166} textAnchor="middle" className="axis-label">{shortName}</text>
                          </g>
                        );
                      })}
                    </svg>
                  ) : (
                    <div className="chart-empty">Sem dados no período</div>
                  )}
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
                  {donutSlices.list.length > 0 ? (
                    <>
                      <svg viewBox="0 0 140 140" className="donut-svg">
                        {donutSlices.list.map((slice) => (
                          <path key={slice.label} d={slice.path} fill={slice.color} opacity="0.88" />
                        ))}
                        <circle cx="70" cy="70" r="38" fill="white" />
                        <text x="70" y="66" textAnchor="middle" className="center-big">{donutSlices.total}</text>
                        <text x="70" y="82" textAnchor="middle" className="center-small">veículos</text>
                      </svg>
                      <div className="donut-legend">
                        {donutSlices.list.map((item) => (
                          <div className="donut-item" key={item.label}>
                            <span className="legend-dot" style={{ background: item.color }} />
                            <span>{item.label}</span>
                            <strong style={{ color: item.color }}>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="chart-empty">Sem veículos cadastrados</div>
                  )}
                </div>
              </div>
            </div>

            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <div className="chart-title">Resumo por Veículo</div>
                  <div className="chart-sub">Performance individual de cada veículo no período</div>
                </div>
              </div>
              <div className="table-wrap">
                {report?.vehicleStats?.length > 0 ? (
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
                      {report.vehicleStats.map((item) => {
                        const perfClass = item.performance >= 85 ? "badge-green" : item.performance >= 65 ? "badge-amber" : "badge-red";
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="vc">
                                <div className="vc-av"><TruckIcon /></div>
                                <div>
                                  <div className="vc-name">{item.modelo}</div>
                                  <div className="vc-plate">{item.placa}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="table-big-blue">{item.qtd}</span></td>
                            <td>
                              <div className="table-money">{formatCurrency(item.totalCost)}</div>
                              <div className="bar-cell">
                                <div className="bar-bg"><div className="bar-fill" style={{ width: `${item.costPct}%` }} /></div>
                                <div className="bar-pct">{item.costPct}%</div>
                              </div>
                            </td>
                            <td>{formatCurrency(item.avgCost)}</td>
                            <td>{item.lastMaintenance}</td>
                            <td>
                              {item.alerts > 0 ? (
                                <span className="badge badge-red">{item.alerts} alerta{item.alerts > 1 ? "s" : ""}</span>
                              ) : (
                                <span className="badge badge-green">Nenhum</span>
                              )}
                            </td>
                            <td>
                              <div className="perf-wrap">
                                <div className="perf-bar-bg"><div className="perf-bar-fill" style={{ width: `${item.performance}%` }} /></div>
                                <span className={`badge ${perfClass}`}>{item.performance}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="chart-empty" style={{ padding: "32px" }}>
                    Nenhuma manutenção registrada no período selecionado.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={`reports-toast ${toast ? "show" : ""}`}>{toast}</div>
    </AppLayout>
  );
}
