from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.operations import AlertCreate, AlertUpdate
from app.services.operations_service import (
    create_alert,
    delete_alert,
    generate_auto_alerts,
    get_alert,
    list_alerts,
    resolve_alert,
    serialize_alert,
    update_alert,
)

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("")
def read_alerts(search: str | None = None, status: str | None = None, page: int = Query(default=1, ge=1), limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items, total, meta = list_alerts(db, search=search, status_value=status, page=page, limit=limit)
    return success_response("Alertas listados com sucesso", [serialize_alert(item) for item in items], meta={**meta, "total": total})


@router.get("/{alert_id}")
def read_alert(alert_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_alert(db, alert_id)
    return success_response("Alerta encontrado", serialize_alert(item))


@router.post("")
def create_alert_route(payload: AlertCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = create_alert(db, payload.model_dump())
    return success_response("Alerta criado com sucesso", serialize_alert(item), status_code=201)


@router.put("/{alert_id}")
@router.patch("/{alert_id}")
def update_alert_route(alert_id: str, payload: AlertUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_alert(db, alert_id)
    item = update_alert(db, item, payload.model_dump(exclude_unset=True))
    return success_response("Alerta atualizado com sucesso", serialize_alert(item))


@router.patch("/{alert_id}/resolver")
def resolve_alert_route(alert_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_alert(db, alert_id)
    observacao = payload.get("observacao")
    item = resolve_alert(db, item, observacao=observacao)
    return success_response("Alerta resolvido com sucesso", serialize_alert(item))


@router.post("/gerar-automaticos")
def generate_alerts_route(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = generate_auto_alerts(db)
    return success_response("Alertas automáticos gerados com sucesso", [serialize_alert(item) for item in items])


@router.delete("/{alert_id}")
def delete_alert_route(alert_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_alert(db, alert_id)
    delete_alert(db, item)
    return success_response("Alerta removido com sucesso", {"deleted": True})
