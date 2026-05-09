from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.operations import NotificationCreate, NotificationUpdate
from app.services.operations_service import (
    create_notification,
    delete_notification,
    get_notification,
    list_notifications,
    serialize_notification,
    update_notification,
)

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("")
def read_notifications(search: str | None = None, page: int = Query(default=1, ge=1), limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items, total, meta = list_notifications(db, search=search, page=page, limit=limit)
    return success_response("Notificações listadas com sucesso", [serialize_notification(item) for item in items], meta={**meta, "total": total})


@router.get("/{notification_id}")
def read_notification(notification_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_notification(db, notification_id)
    return success_response("Notificação encontrada", serialize_notification(item))


@router.post("")
def create_notification_route(payload: NotificationCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = create_notification(db, payload.model_dump())
    return success_response("Notificação criada com sucesso", serialize_notification(item), status_code=201)


@router.put("/{notification_id}")
@router.patch("/{notification_id}")
def update_notification_route(notification_id: str, payload: NotificationUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_notification(db, notification_id)
    item = update_notification(db, item, payload.model_dump(exclude_unset=True))
    return success_response("Notificação atualizada com sucesso", serialize_notification(item))


@router.delete("/{notification_id}")
def delete_notification_route(notification_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_notification(db, notification_id)
    delete_notification(db, item)
    return success_response("Notificação removida com sucesso", {"deleted": True})
