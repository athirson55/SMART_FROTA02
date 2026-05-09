from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import create_user, delete_user, get_user, list_users, serialize_user, update_user

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


def _require_admin(current_user):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito")


@router.get("")
def read_users(
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(current_user)
    items, total = list_users(db, search=search, page=page, limit=limit)
    return success_response("Usuários listados com sucesso", [serialize_user(item) for item in items], meta={"page": page, "limit": limit, "total": total})


@router.get("/{user_id}")
def read_user(user_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _require_admin(current_user)
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return success_response("Usuário encontrado", serialize_user(user))


@router.post("")
def create_user_route(payload: UserCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _require_admin(current_user)
    user = create_user(db, payload.model_dump())
    return success_response("Usuário criado com sucesso", serialize_user(user), status_code=201)


@router.put("/{user_id}")
@router.patch("/{user_id}")
def update_user_route(user_id: str, payload: UserUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _require_admin(current_user)
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    user = update_user(db, user, payload.model_dump(exclude_unset=True))
    return success_response("Usuário atualizado com sucesso", serialize_user(user))


@router.delete("/{user_id}")
def delete_user_route(user_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _require_admin(current_user)
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    delete_user(db, user)
    return success_response("Usuário removido com sucesso", {"deleted": True})
