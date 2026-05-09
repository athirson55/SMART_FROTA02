from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.fleet import PendenciaCreate, VehicleCreate, VehicleUpdate
from app.services.fleet_service import (
    add_vehicle_pendencia,
    create_vehicle,
    delete_vehicle,
    get_vehicle,
    list_vehicle_pendencias,
    list_vehicles,
    remove_vehicle_pendencia,
    serialize_pendencia,
    serialize_vehicle,
    update_vehicle,
)

router = APIRouter(prefix="/veiculos", tags=["Veículos"])


@router.get("")
def read_vehicles(
    search: str | None = None,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    items, total, meta = list_vehicles(db, search=search, status_value=status, page=page, limit=limit)
    return success_response("Veículos listados com sucesso", [serialize_vehicle(item) for item in items], meta={**meta, "total": total})


@router.get("/{vehicle_id}")
def read_vehicle(vehicle_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    return success_response("Veículo encontrado", serialize_vehicle(vehicle))


@router.post("")
def create_vehicle_route(payload: VehicleCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = create_vehicle(db, payload.model_dump())
    return success_response("Veículo criado com sucesso", serialize_vehicle(vehicle), status_code=201)


@router.put("/{vehicle_id}")
@router.patch("/{vehicle_id}")
def update_vehicle_route(vehicle_id: str, payload: VehicleUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    vehicle = update_vehicle(db, vehicle, payload.model_dump(exclude_unset=True))
    return success_response("Veículo atualizado com sucesso", serialize_vehicle(vehicle))


@router.delete("/{vehicle_id}")
def delete_vehicle_route(vehicle_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    delete_vehicle(db, vehicle)
    return success_response("Veículo removido com sucesso", {"deleted": True})


@router.get("/{vehicle_id}/pendencias")
def read_vehicle_pendencias(vehicle_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    pendencias = list_vehicle_pendencias(db, vehicle.id)
    return success_response("Pendências listadas com sucesso", [serialize_pendencia(item) for item in pendencias])


@router.post("/{vehicle_id}/pendencias")
def add_vehicle_pendencia_route(vehicle_id: str, payload: PendenciaCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    pendencia = add_vehicle_pendencia(db, vehicle, payload.model_dump())
    return success_response("Pendência criada com sucesso", serialize_pendencia(pendencia), status_code=201)


@router.delete("/{vehicle_id}/pendencias/{pendencia_id}")
def delete_vehicle_pendencia_route(vehicle_id: str, pendencia_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    vehicle = get_vehicle(db, vehicle_id)
    remove_vehicle_pendencia(db, vehicle, pendencia_id)
    return success_response("Pendência removida com sucesso", {"deleted": True})
