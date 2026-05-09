from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.fleet import DriverCreate, DriverUpdate
from app.services.fleet_service import create_driver, delete_driver, get_driver, list_drivers, serialize_driver, update_driver

router = APIRouter(prefix="/motoristas", tags=["Motoristas"])


@router.get("")
def read_drivers(
    search: str | None = None,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    items, total, meta = list_drivers(db, search=search, status_value=status, page=page, limit=limit)
    return success_response("Motoristas listados com sucesso", [serialize_driver(item) for item in items], meta={**meta, "total": total})


@router.get("/{driver_id}")
def read_driver(driver_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    driver = get_driver(db, driver_id)
    return success_response("Motorista encontrado", serialize_driver(driver))


@router.post("")
def create_driver_route(payload: DriverCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    driver = create_driver(db, payload.model_dump())
    return success_response("Motorista criado com sucesso", serialize_driver(driver), status_code=201)


@router.put("/{driver_id}")
@router.patch("/{driver_id}")
def update_driver_route(driver_id: str, payload: DriverUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    driver = get_driver(db, driver_id)
    driver = update_driver(db, driver, payload.model_dump(exclude_unset=True))
    return success_response("Motorista atualizado com sucesso", serialize_driver(driver))


@router.delete("/{driver_id}")
def delete_driver_route(driver_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    driver = get_driver(db, driver_id)
    delete_driver(db, driver)
    return success_response("Motorista removido com sucesso", {"deleted": True})
