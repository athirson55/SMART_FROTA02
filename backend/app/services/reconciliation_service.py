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


def reconcile_stale_alerts(db: Session) -> dict:
    """Resolve auto-generated alerts whose underlying condition no longer applies,
    and create new ones for conditions that are now active.
    """
    from app.services.operations_service import generate_auto_alerts
    created = generate_auto_alerts(db)
    return {"alerts_generated": len(created)}


def run_full_reconciliation(db: Session) -> dict:
    """Run all reconciliation steps and return a combined stats dict."""
    route_stats = reconcile_route_statuses(db)
    alert_stats = reconcile_stale_alerts(db)
    return {
        **route_stats,
        **alert_stats,
        "reconciled_at": datetime.now(timezone.utc).isoformat(),
    }
