import { Link, useParams } from "react-router-dom";
import { SimpleSectionPage } from "./SimpleSectionPage";
import { getPendingDetail } from "../data/fleetDashboard";

export function PendingDetailPage() {
  const { vehicleId, pendingSlug } = useParams();
  const detail = getPendingDetail(vehicleId, pendingSlug);

  if (!detail || !detail.vehicle) {
    return (
      <SimpleSectionPage title="Detalhe da pendência">
        <article className="fg-home-list-card">
          <div className="fg-home-list-head">
            <h4>Pendência não encontrada</h4>
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </div>
          <div className="fg-home-list-body">
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>
                  Não foi possível localizar o veículo ou a pendência.
                </strong>
                <p>Verifique o link e tente novamente.</p>
              </div>
            </div>
          </div>
        </article>
      </SimpleSectionPage>
    );
  }

  const { vehicle, pending } = detail;

  return (
    <SimpleSectionPage title="Detalhe da pendência">
      <section className="fg-dashboard-detail-grid">
        <article className="fg-home-summary-card">
          <div className="fg-home-summary-title-row">
            <span className="fg-home-summary-icon red">!</span>
            <h4>{pending ? pending.label : "Pendência não localizada"}</h4>
          </div>
          <p>
            {pending
              ? pending.detail
              : "Esta pendência não está disponível para consulta."}
          </p>
          <strong className="fg-home-summary-value is-red">{vehicle.id}</strong>
          <div className="fg-home-summary-footer">
            <div className="fg-home-tag-list">
              <span>{vehicle.model}</span>
              <span>{vehicle.plate}</span>
            </div>
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </div>
        </article>

        <article className="fg-home-list-card">
          <div className="fg-home-list-head">
            <h4>Informações do veículo</h4>
            <small>{vehicle.status}</small>
          </div>
          <div className="fg-home-list-body">
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Modelo / Marca</strong>
                <p>{vehicle.model}</p>
              </div>
            </div>
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Motorista responsável</strong>
                <p>{vehicle.driver}</p>
              </div>
            </div>
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Pendências abertas</strong>
                <p>{vehicle.pendencies.length} itens em acompanhamento</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <article className="fg-home-list-card">
        <div className="fg-home-list-head">
          <h4>Próximas ações</h4>
          <small className="is-red-pill">Atenção</small>
        </div>
        <div className="fg-home-list-body">
          <div className="fg-home-row">
            <div className="fg-home-row-main">
              <strong>1. Revisar o item pendente</strong>
              <p>Validar a ocorrência e atualizar o status no sistema.</p>
            </div>
          </div>
          <div className="fg-home-row">
            <div className="fg-home-row-main">
              <strong>2. Registrar evidência</strong>
              <p>
                Adicionar nota, ordem de serviço ou documento correspondente.
              </p>
            </div>
          </div>
          <div className="fg-home-row">
            <div className="fg-home-row-main">
              <strong>3. Encerrar acompanhamento</strong>
              <p>
                Concluir a pendência e liberar o veículo para operação normal.
              </p>
            </div>
          </div>
        </div>
      </article>
    </SimpleSectionPage>
  );
}
