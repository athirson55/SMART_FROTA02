from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_admin
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.settings import SystemSettingUpdate
from app.services.settings_service import get_or_create_settings, serialize_settings, update_settings

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])


@router.get("")
def read_settings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    settings = get_or_create_settings(db)
    return success_response("Configurações carregadas com sucesso", serialize_settings(settings))


@router.patch("")
def update_settings_route(payload: SystemSettingUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    settings = get_or_create_settings(db)
    settings = update_settings(settings, payload.model_dump(exclude_unset=True))
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return success_response("Configurações atualizadas com sucesso", serialize_settings(settings))
