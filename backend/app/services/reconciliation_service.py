"""
Reconciliation service — fixes historical inconsistencies across vehicles,
drivers, routes, and alerts so all dashboard counters are in sync.

Run automatically on startup via lifespan hook; also exposed at
POST /admin/reconciliar for manual on-demand execution.
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.fleet import Driver, Vehicle
from app.models.operations import Alert, Appointment, Route

# Display-format → DB-format maps (fixes data saved by the old status bug)
_VEHICLE_STATUS_MAP = {
    "Ativo": "ATIVO",
    "ativo": "ATIVO",
    "Em rota": "EM_ROTA",
    "em rota": "EM_ROTA",
    "Em manutenção": "MANUTENCAO",
    "em manutenção": "MANUTENCAO",
    "Manutenção": "MANUTENCAO",
    "Reserva": "INATIVO",
    "reserva": "INATIVO",
    "Inativo": "INATIVO",
    "inativo": "INATIVO",
}

_DRIVER_STATUS_MAP = {
    "Disponível": "DISPONIVEL",
    "disponível": "DISPONIVEL",
    "Disponivel": "DISPONIVEL",
    "Em rota": "EM_ROTA",
    "em rota": "EM_ROTA",
    "Afastado": "AFASTADO",
    "afastado": "AFASTADO",
    "Inativo": "INATIVO",
    "inativo": "INATIVO",
}


def normalize_statuses(db: Session) -> dict:
    """Convert any display-format status values back to DB-canonical uppercase form.

    Vehicles saved while the old NovoVeiculoModal bug was active may have
    status = 'Ativo' (display label) instead of 'ATIVO' (DB value). This
    causes dashboard queries like `Vehicle.status == 'ATIVO'` to return 0.
    """
    stats = {"vehicles_normalized": 0, "drivers_normalized": 0}

    for v in db.scalars(select(Vehicle)).all():
        canonical = _VEHICLE_STATUS_MAP.get(v.status)
        if canonical:
            v.status = canonical
            db.add(v)
            stats["vehicles_normalized"] += 1

    for d in db.scalars(select(Driver)).all():
        canonical = _DRIVER_STATUS_MAP.get(d.status)
        if canonical:
            d.status = canonical
            db.add(d)
            stats["drivers_normalized"] += 1

    db.commit()
    return stats


def reconcile_route_statuses(db: Session) -> dict:
    """Sync vehicle.status and driver.status with their EM_ANDAMENTO routes.

    Any vehicle/driver with an active route must be EM_ROTA.
    Any vehicle/driver with NO active route must not be stuck on EM_ROTA.
    """
    stats = {"vehicles_fixed": 0, "drivers_fixed": 0, "routes_checked": 0}

    active_routes = db.scalars(
        select(Route).where(Route.status == "EM_ANDAMENTO")
    ).all()

    em_rota_vehicle_ids: set[str] = {r.vehicle_id for r in active_routes if r.vehicle_id}
    em_rota_driver_ids: set[str] = {r.motorista_id for r in active_routes if r.motorista_id}
    stats["routes_checked"] = len(active_routes)

    for v in db.scalars(select(Vehicle)).all():
        should = v.id in em_rota_vehicle_ids
        if should and v.status != "EM_ROTA":
            v.status = "EM_ROTA"
            db.add(v)
            stats["vehicles_fixed"] += 1
        elif not should and v.status == "EM_ROTA":
            v.status = "ATIVO"
            db.add(v)
            stats["vehicles_fixed"] += 1

    for d in db.scalars(select(Driver)).all():
        should = d.id in em_rota_driver_ids
        if should and d.status != "EM_ROTA":
            d.status = "EM_ROTA"
            db.add(d)
            stats["drivers_fixed"] += 1
        elif not should and d.status == "EM_ROTA":
            d.status = "DISPONIVEL"
            db.add(d)
            stats["drivers_fixed"] += 1

    db.commit()
    return stats


def reconcile_vehicle_availability(db: Session) -> dict:
    """SPEC 05: Set vehicle.status = MANUTENCAO when they have active (EM_ANDAMENTO)
    maintenances, and restore to ATIVO when the maintenance is done and no active
    route holds the vehicle.
    """
    from app.models.operations import Maintenance, Route

    stats = {"vehicles_set_manutencao": 0, "vehicles_restored": 0}

    active_maint_vehicle_ids = {
        row[0]
        for row in db.execute(
            select(Maintenance.vehicle_id).where(Maintenance.status == "EM_ANDAMENTO").distinct()
        ).all()
        if row[0]
    }

    active_route_vehicle_ids = {
        row[0]
        for row in db.execute(
            select(Route.vehicle_id).where(Route.status == "EM_ANDAMENTO").distinct()
        ).all()
        if row[0]
    }

    for v in db.scalars(select(Vehicle)).all():
        if v.id in active_maint_vehicle_ids and v.status not in ("MANUTENCAO", "EM_ROTA"):
            v.status = "MANUTENCAO"
            db.add(v)
            stats["vehicles_set_manutencao"] += 1
        elif (
            v.id not in active_maint_vehicle_ids
            and v.id not in active_route_vehicle_ids
            and v.status == "MANUTENCAO"
        ):
            v.status = "ATIVO"
            db.add(v)
            stats["vehicles_restored"] += 1

    db.commit()
    return stats


def reconcile_stale_alerts(db: Session) -> dict:
    """Resolve auto-generated alerts whose underlying condition no longer applies,
    and create new ones for conditions that are now active.
    """
    from app.services.operations_service import generate_auto_alerts
    created = generate_auto_alerts(db)
    return {"alerts_generated": len(created)}


def run_full_reconciliation(db: Session) -> dict:
    """Run all reconciliation steps and return a combined stats dict."""
    norm_stats = normalize_statuses(db)
    route_stats = reconcile_route_statuses(db)
    avail_stats = reconcile_vehicle_availability(db)
    alert_stats = reconcile_stale_alerts(db)
    return {
        **norm_stats,
        **route_stats,
        **avail_stats,
        **alert_stats,
        "reconciled_at": datetime.now(timezone.utc).isoformat(),
    }
