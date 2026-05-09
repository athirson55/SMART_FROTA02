from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Driver, Vehicle, VehiclePendencia
from app.models.operations import Alert, Appointment, Maintenance
from app.models.report import ReportSnapshot
from app.services.fleet_service import serialize_vehicle
from app.services.operations_service import serialize_alert


def _persist_snapshot(db: Session, report_type: str, params: dict, payload: dict, created_by: str | None = None):
    snapshot = ReportSnapshot(
        report_type=report_type,
        params_json=str(params) if params else None,
        payload_json=str(payload) if payload else None,
        created_by=created_by,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def dashboard_report(db: Session):
    total_vehicles = db.scalar(select(func.count()).select_from(Vehicle)) or 0
    total_drivers = db.scalar(select(func.count()).select_from(Driver)) or 0
    active_vehicles = db.scalar(select(func.count()).select_from(Vehicle).where(Vehicle.status == "ATIVO")) or 0
    in_maintenance = db.scalar(select(func.count()).select_from(Vehicle).where(Vehicle.status == "MANUTENCAO")) or 0
    alerts_open = db.scalar(select(func.count()).select_from(Alert).where(Alert.status != "RESOLVIDO")) or 0
    maintenances_open = db.scalar(select(func.count()).select_from(Maintenance).where(Maintenance.status != "CONCLUIDA")) or 0
    appointments_total = db.scalar(select(func.count()).select_from(Appointment)) or 0
    pending_items = db.scalar(select(func.count()).select_from(VehiclePendencia).where(VehiclePendencia.resolved_at.is_(None))) or 0
    payload = {
        "summary": {
            "vehicles": total_vehicles,
            "drivers": total_drivers,
            "activeVehicles": active_vehicles,
            "inMaintenance": in_maintenance,
            "alertsOpen": alerts_open,
            "maintenancesOpen": maintenances_open,
            "appointmentsTotal": appointments_total,
            "pendingItems": pending_items,
        },
        "generatedAt": datetime.now(timezone.utc),
    }
    _persist_snapshot(db, "dashboard", {}, payload)
    return payload


def fleet_report(db: Session, search: str | None = None):
    query = select(Vehicle).options(joinedload(Vehicle.motorista)).order_by(Vehicle.created_at.desc())
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Vehicle.modelo.ilike(term)) | (Vehicle.placa.ilike(term)) | (Vehicle.marca.ilike(term)))
    vehicles = db.scalars(query).unique().all()
    items = []
    for vehicle in vehicles:
        pendencias = db.scalars(select(VehiclePendencia).where(VehiclePendencia.vehicle_id == vehicle.id, VehiclePendencia.resolved_at.is_(None))).all()
        items.append({
            **serialize_vehicle(vehicle),
            "pendencias": [{"slug": p.slug, "label": p.label, "detail": p.detail, "tone": p.tone} for p in pendencias],
        })
    payload = {"generatedAt": datetime.now(timezone.utc), "items": items, "summary": {"total": len(items)}}
    _persist_snapshot(db, "fleet", {"search": search}, payload)
    return payload


def costs_report(db: Session, search: str | None = None):
    query = select(Maintenance).options(joinedload(Maintenance.vehicle).joinedload(Vehicle.motorista)).order_by(Maintenance.data.desc())
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Maintenance.descricao.ilike(term)) | (Maintenance.oficina.ilike(term)) | (Maintenance.mecanico.ilike(term)))
    items = []
    total = 0.0
    for maintenance in db.scalars(query).unique().all():
        total += float(maintenance.custo or 0)
        items.append({
            "id": maintenance.id,
            "veiculo": serialize_vehicle(maintenance.vehicle) if maintenance.vehicle else None,
            "descricao": maintenance.descricao,
            "custo": float(maintenance.custo or 0),
            "data": maintenance.data,
            "status": maintenance.status,
            "prioridade": maintenance.prioridade,
        })
    payload = {"generatedAt": datetime.now(timezone.utc), "items": items, "summary": {"total": total, "count": len(items)}}
    _persist_snapshot(db, "costs", {"search": search}, payload)
    return payload
