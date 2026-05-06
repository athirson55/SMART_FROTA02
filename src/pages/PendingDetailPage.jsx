import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SimpleSectionPage } from "./SimpleSectionPage";
import { getVehicle } from "../services/vehicles";

function normalizePending(pending) {
  return {
    slug: pending.slug,
    label: pending.label,
    detail: pending.detalhe || pending.detail || "",
  };
}

function normalizeVehicle(vehicle) {
  return {
    id: vehicle.id,
    model: vehicle.modelo || vehicle.model || "",
    plate: vehicle.placa || vehicle.plate || "",
    status: vehicle.status || "ATIVO",
    driver:
      vehicle.motorista?.nome ||
      vehicle.motorista?.name ||
      vehicle.driver ||
      "",
    pendencies: (vehicle.pendencias ?? []).map(normalizePending),
  };
}

export function PendingDetailPage() {
  const { vehicleId, pendingSlug } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let active = true;

    getVehicle(vehicleId)
      .then((res) => {
        if (!active) return;

        const vehicle = normalizeVehicle(res.data?.data ?? {});
        const pending =
          vehicle.pendencies.find((item) => item.slug === pendingSlug) ?? null;

        setDetail({ vehicle, pending });
      })
      .catch((err) => {
        console.error("Erro ao carregar detalhe da pendência:", err);
        if (active) setDetail(null);
      });

    return () => {
      active = false;
    };
  }, [pendingSlug, vehicleId]);

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
            <h4>
              {detail.pending
                ? detail.pending.label
                : "Pendência não localizada"}
            </h4>
          </div>
          <p>
            {detail.pending
              ? detail.pending.detail
              : "Esta pendência não está disponível para consulta."}
          </p>
          <strong className="fg-home-summary-value is-red">
            {detail.vehicle.id}
          </strong>
          <div className="fg-home-summary-footer">
            <div className="fg-home-tag-list">
              <span>{detail.vehicle.model}</span>
              <span>{detail.vehicle.plate}</span>
            </div>
            <Link to="/dashboard">Voltar ao dashboard</Link>
          </div>
        </article>

        <article className="fg-home-list-card">
          <div className="fg-home-list-head">
            <h4>Informações do veículo</h4>
            <small>{detail.vehicle.status}</small>
          </div>
          <div className="fg-home-list-body">
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Modelo / Marca</strong>
                <p>{detail.vehicle.model}</p>
              </div>
            </div>
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Motorista responsável</strong>
                <p>{detail.vehicle.driver}</p>
              </div>
            </div>
            <div className="fg-home-row">
              <div className="fg-home-row-main">
                <strong>Pendências abertas</strong>
                <p>
                  {detail.vehicle.pendencies.length} itens em acompanhamento
                </p>
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
