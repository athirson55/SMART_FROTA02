from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.operations import RouteCreate, RouteUpdate
from app.services.operations_service import (
    create_route,
    delete_route,
    get_route,
    list_routes,
    serialize_route,
    update_route,
)

router = APIRouter(prefix="/rotas", tags=["Rotas"])


@router.get("")
def read_routes(
    search: str | None = None,
    status: str | None = None,
    veiculoId: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    items, total, meta = list_routes(db, search=search, status_value=status, vehicle_id=veiculoId, page=page, limit=limit)
    return success_response("Rotas listadas com sucesso", [serialize_route(item) for item in items], meta={**meta, "total": total})


@router.get("/{route_id}")
def read_route(route_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_route(db, route_id)
    return success_response("Rota encontrada", serialize_route(item))


@router.post("")
def create_route_endpoint(payload: RouteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = create_route(db, payload.model_dump())
    return success_response("Rota criada com sucesso", serialize_route(item), status_code=201)


@router.put("/{route_id}")
@router.patch("/{route_id}")
def update_route_endpoint(route_id: str, payload: RouteUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_route(db, route_id)
    item = update_route(db, item, payload.model_dump(exclude_unset=True))
    return success_response("Rota atualizada com sucesso", serialize_route(item))


@router.delete("/{route_id}")
def delete_route_endpoint(route_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_route(db, route_id)
    delete_route(db, item)
    return success_response("Rota removida com sucesso", {"deleted": True})
