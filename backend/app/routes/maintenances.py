from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.operations import MaintenanceCreate, MaintenanceUpdate
from app.services.operations_service import (
    create_maintenance,
    delete_maintenance,
    get_maintenance,
    list_maintenances,
    maintenances_stats,
    serialize_maintenance,
    update_maintenance,
)

router = APIRouter(prefix="/manutencoes", tags=["Manutenções"])


@router.get("")
def read_maintenances(search: str | None = None, status: str | None = None, page: int = Query(default=1, ge=1), limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items, total, meta = list_maintenances(db, search=search, status_value=status, page=page, limit=limit)
    return success_response("Manutenções listadas com sucesso", [serialize_maintenance(item) for item in items], meta={**meta, "total": total})


@router.get("/stats")
def read_maintenance_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Estatísticas carregadas com sucesso", maintenances_stats(db))


@router.get("/{maintenance_id}")
def read_maintenance(maintenance_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_maintenance(db, maintenance_id)
    return success_response("Manutenção encontrada", serialize_maintenance(item))


@router.post("")
def create_maintenance_route(payload: MaintenanceCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = create_maintenance(db, payload.model_dump())
    return success_response("Manutenção criada com sucesso", serialize_maintenance(item), status_code=201)


@router.put("/{maintenance_id}")
@router.patch("/{maintenance_id}")
def update_maintenance_route(maintenance_id: str, payload: MaintenanceUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_maintenance(db, maintenance_id)
    item = update_maintenance(db, item, payload.model_dump(exclude_unset=True))
    return success_response("Manutenção atualizada com sucesso", serialize_maintenance(item))


@router.delete("/{maintenance_id}")
def delete_maintenance_route(maintenance_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_maintenance(db, maintenance_id)
    delete_maintenance(db, item)
    return success_response("Manutenção removida com sucesso", {"deleted": True})
