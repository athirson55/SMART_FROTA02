import "../styles/dashboard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AppIcon } from "../components/AppIcon";
import { AppHeader } from "../components/AppHeader";
import { QuickInfoModal } from "../components/QuickInfoModal";
import { useAuth } from "../context/AuthContext";

const summaryCards = [
  {
    title: "Documentos prestes a vencer",
    description:
      "Veículos com CRLV, seguro ou licença expirando em menos de 30 dias.",
    value: "7",
    valueClass: "is-gold",
    tags: ["3 críticos", "4 atenção"],
    action: "Ver detalhes",
    route: "/alertas",
    icon: "doc",
    iconTone: "gold",
  },
  {
    title: "Manutenções próximas",
    description:
      "Veículos com revisão, troca de óleo ou inspeção preventiva agendada.",
    value: "4",
    valueClass: "is-red",
    tags: ["1 urgente", "3 esta semana"],
    action: "Ver agenda",
    route: "/manutencoes",
    icon: "wrench",
    iconTone: "red",
  },
  {
    title: "Entregas atrasadas",
    description: "Pedidos com prazo de entrega vencido ou em risco de atraso.",
    value: "3",
    valueClass: "is-purple",
    tags: ["2 em rota", "1 parado"],
    action: "Acompanhar",
    route: "/agendamentos",
    icon: "clock",
    iconTone: "purple",
  },
  {
    title: "Frota disponível",
    description: "Veículos prontos para receber novos carregamentos agora.",
    value: "12",
    valueClass: "is-green",
    tags: ["12 livres", "de 38 total"],
    action: "Alocar frota",
    route: "/veiculos",
    icon: "truck",
    iconTone: "green",
  },
];

const quickActions = [
  {
    title: "Novo Pedido",
    subtitle: "Criar agora",
    icon: "plus",
    tone: "blue",
    route: "/agendamentos",
  },
  {
    title: "Rastrear Veículo",
    subtitle: "Tempo real",
    icon: "pin",
    tone: "green",
    route: "/veiculos",
  },
  {
    title: "Documentos",
    subtitle: "Gerir arquivos",
    icon: "doc",
    tone: "gold",
    route: "/alertas",
  },
  {
    title: "Relatórios",
    subtitle: "Exportar dados",
    icon: "chart",
    tone: "purple",
    route: "/relatorios",
  },
];

const documentRows = [
  ["GJ28HT2889 - Eicher Pro 2059", "CRLV - Vence em 3 dias", "3 dias", "red"],
  [
    "DL1PC4421 - Tata 407",
    "Seguro obrigatório - Vence em 5 dias",
    "5 dias",
    "red",
  ],
  [
    "MH02AB1234 - Volvo FH",
    "Licença ambiental - Vence em 7 dias",
    "7 dias",
    "red",
  ],
  ["KA05MN9087 - Ashok Leyland", "CRLV - Vence em 18 dias", "18 dias", "amber"],
  [
    "RJ14CD5566 - Tata Prima",
    "Vistoria técnica - Vence em 24 dias",
    "24 dias",
    "amber",
  ],
];

const maintenanceRows = [
  ["SHP003 - GJ28HT2889", "Troca de óleo - Amanhã às 08:00", "Amanhã", "red"],
  ["SHP005 - DL1PC4421", "Revisão de freios - 25 Jul 2024", "3 dias", "amber"],
  [
    "SHP008 - MH02AB1234",
    "Alinhamento e balanceamento - 27 Jul 2024",
    "5 dias",
    "amber",
  ],
  [
    "SHP010 - KA05MN9087",
    "Inspeção preventiva - 02 Ago 2024",
    "11 dias",
    "green",
  ],
  ["SHP012 - RJ14CD5566", "Troca de filtros - 05 Ago 2024", "14 dias", "green"],
];

function Row({ row }) {
  return (
    <div className="fg-home-row">
      <span className={`fg-dot ${row[3]}`} />
      <div className="fg-home-row-main">
        <strong>{row[0]}</strong>
        <p>{row[1]}</p>
      </div>
      <span className={`fg-home-deadline ${row[3]}`}>{row[2]}</span>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summaryModal, setSummaryModal] = useState(null);

  const displayName = user?.nome || user?.name || "Usuário";

  function openSummaryModal(card) {
    const itemsByTitle = {
      "Documentos prestes a vencer": [
        {
          title: "GJ28HT2889 - Eicher Pro 2059",
          subtitle: "CRLV e seguro com vencimento curto",
        },
        {
          title: "DL1PC4421 - Tata 407",
          subtitle: "Seguro obrigatório próximo do prazo",
        },
        {
          title: "RJ14CD5566 - Tata Prima",
          subtitle: "Vistoria técnica em janela crítica",
        },
      ],
      "Manutenções próximas": [
        {
          title: "SHP003 - GJ28HT2889",
          subtitle: "Troca de óleo marcada para amanhã",
        },
        {
          title: "SHP005 - DL1PC4421",
          subtitle: "Revisão de freios pendente",
        },
        {
          title: "SHP008 - MH02AB1234",
          subtitle: "Alinhamento programado esta semana",
        },
      ],
      "Entregas atrasadas": [
        {
          title: "Pedido #4321",
          subtitle: "Atraso por retenção em rota",
        },
        {
          title: "Pedido #4288",
          subtitle: "Chegada acima do SLA previsto",
        },
        {
          title: "Pedido #4269",
          subtitle: "Veículo parado aguardando liberação",
        },
      ],
      "Frota disponível": [
        {
          title: "12 veículos liberados",
          subtitle: "Prontos para novo carregamento",
        },
        {
          title: "8 já em trânsito",
          subtitle: "Cobertura operacional ativa",
        },
        {
          title: "18 com janela flexível",
          subtitle: "Podem ser realocados no turno",
        },
      ],
    };

    setSummaryModal({
      title: card.title,
      items: itemsByTitle[card.title] ?? [],
      route: card.route,
    });
  }

  return (
    <AppLayout>
      <AppHeader />

      <div className="fg-home-content">
        <section className="fg-home-welcome-card">
          <span className="fg-home-badge">Tela Inicial</span>
          <div className="fg-home-welcome-grid">
            <div>
              <h2>Bem-vindo de volta, {displayName} 👋</h2>
              <p>
                Aqui está um resumo do seu dia. Confira os alertas importantes
                antes de acessar o sistema completo.
              </p>
            </div>
            <div className="fg-home-kpis">
              <article>
                <strong>24</strong>
                <span>Pedidos hoje</span>
              </article>
              <article>
                <strong>8</strong>
                <span>Em trânsito</span>
              </article>
              <article>
                <strong>5</strong>
                <span>Alertas</span>
              </article>
            </div>
          </div>
        </section>

        <div className="fg-home-section-head">
          <h3>Alertas Importantes</h3>
          <button type="button" onClick={() => navigate("/alertas")}>
            Ver todos
          </button>
        </div>

        <section className="fg-home-summary-grid">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className="fg-home-summary-card fg-interactive-card"
              onClick={() => openSummaryModal(card)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSummaryModal(card);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="fg-home-summary-title-row">
                <span className={`fg-home-summary-icon ${card.iconTone}`}>
                  <AppIcon type={card.icon} />
                </span>
                <h4>{card.title}</h4>
              </div>
              <p>{card.description}</p>
              <strong className={`fg-home-summary-value ${card.valueClass}`}>
                {card.value}
              </strong>
              <div className="fg-home-summary-footer">
                <div className="fg-home-tag-list">
                  <span>{card.tags[0]}</span>
                  <span>{card.tags[1]}</span>
                </div>
                <button
                  type="button"
                  className="fg-interactive-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(card.route);
                  }}
                >
                  {card.action}
                </button>
              </div>
            </article>
          ))}
        </section>

        <div className="fg-home-section-head">
          <h3>Ações Rápidas</h3>
        </div>

        <section className="fg-home-actions-grid">
          {quickActions.map((action) => (
            <article
              key={action.title}
              className="fg-home-action-card fg-interactive-card"
              onClick={() => navigate(action.route)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(action.route);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className={`fg-home-action-icon ${action.tone}`}>
                <AppIcon type={action.icon} />
              </span>
              <h4>{action.title}</h4>
              <p>{action.subtitle}</p>
            </article>
          ))}
        </section>

        <div className="fg-home-section-head">
          <h3>Detalhamento dos Alertas</h3>
          <button type="button" onClick={() => navigate("/alertas")}>
            Ver todos
          </button>
        </div>

        <section className="fg-home-details-grid">
          <article
            className="fg-home-list-card fg-interactive-card"
            onClick={() => navigate("/alertas")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/alertas");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="fg-home-list-head">
              <div>
                <span className="fg-home-summary-icon gold">
                  <AppIcon type="doc" />
                </span>
                <h4>Documentos prestes a vencer</h4>
              </div>
              <small>7 veículos</small>
            </div>
            <div className="fg-home-list-body">
              {documentRows.map((row) => (
                <Row key={row[0]} row={row} />
              ))}
            </div>
          </article>

          <article
            className="fg-home-list-card fg-interactive-card"
            onClick={() => navigate("/manutencoes")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/manutencoes");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="fg-home-list-head">
              <div>
                <span className="fg-home-summary-icon red">
                  <AppIcon type="wrench" />
                </span>
                <h4>Manutenções próximas</h4>
              </div>
              <small className="is-red-pill">4 veículos</small>
            </div>
            <div className="fg-home-list-body">
              {maintenanceRows.map((row) => (
                <Row key={row[0]} row={row} />
              ))}
            </div>
          </article>
        </section>
      </div>

      <QuickInfoModal
        isOpen={Boolean(summaryModal)}
        title={summaryModal?.title ?? "Resumo"}
        items={summaryModal?.items ?? []}
        onClose={() => setSummaryModal(null)}
        onViewMore={() => {
          if (summaryModal?.route) {
            navigate(summaryModal.route);
          }
          setSummaryModal(null);
        }}
        viewMoreLabel="Ver mais detalhes"
      />
    </AppLayout>
  );
}
