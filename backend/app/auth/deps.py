from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import safe_decode_token
from app.database.session import get_db
from app.models.user import User
from app.services.auth_service import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=False)


def extract_token(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]) -> str:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado")
    return credentials.credentials


def get_current_user(
    token: Annotated[str, Depends(extract_token)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user_id = payload.get("sub")
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inválido")
    return user
