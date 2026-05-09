from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_token,
    hash_password,
    token_expiration_from_days,
    token_expiration_from_minutes,
    verify_password,
)
from app.models.session_token import RefreshToken
from app.models.user import User

settings = get_settings()


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "role": user.role,
        "avatarFoto": user.avatar_foto,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at,
    }


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower().strip()))


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)


def ensure_user_unique(db: Session, email: str) -> None:
    if get_user_by_email(db, email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")


def register_user(db: Session, *, nome: str, email: str, senha: str, role: str = "ADMIN", avatar_foto: str | None = None) -> User:
    ensure_user_unique(db, email)
    user = User(
        nome=nome.strip(),
        email=email.lower().strip(),
        senha_hash=hash_password(senha),
        role=role,
        avatar_foto=avatar_foto,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, senha: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(senha, user.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário inativo")
    return user


def _store_refresh_token(db: Session, user: User, jti: str, expires_at) -> RefreshToken:
    refresh_token = RefreshToken(user_id=user.id, jti=jti, expires_at=expires_at)
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    return refresh_token


def issue_token_pair(db: Session, user: User, keep_logged_in: bool = False) -> dict:
    access_token, _, access_expires_at = create_token(
        subject=user.id,
        token_type="access",
        expires_delta=token_expiration_from_minutes(settings.access_token_expire_minutes),
        extra_claims={"email": user.email, "role": user.role},
    )
    refresh_token, refresh_jti, refresh_expires_at = create_token(
        subject=user.id,
        token_type="refresh",
        expires_delta=token_expiration_from_days(settings.refresh_token_expire_days),
        extra_claims={"email": user.email, "role": user.role},
    )
    _store_refresh_token(db, user, refresh_jti, refresh_expires_at)
    return {
        "token": access_token,
        "refreshToken": refresh_token,
        "expiresIn": settings.access_token_expire_minutes * 60,
        "refreshExpiresIn": settings.refresh_token_expire_days * 86400,
        "keepLoggedIn": keep_logged_in,
        "usuario": serialize_user(user),
    }


def refresh_session(db: Session, refresh_token_raw: str) -> dict:
    from jose import JWTError

    from app.core.security import safe_decode_token

    payload = safe_decode_token(refresh_token_raw)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    jti = payload.get("jti")
    subject = payload.get("sub")
    if not jti or not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    token_row = db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
    if not token_row or token_row.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada")
    if token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada")

    user = get_user_by_id(db, subject)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inválido")

    token_row.last_used_at = datetime.now(timezone.utc)
    db.add(token_row)
    db.commit()

    access_token, _, _ = create_token(
        subject=user.id,
        token_type="access",
        expires_delta=token_expiration_from_minutes(settings.access_token_expire_minutes),
        extra_claims={"email": user.email, "role": user.role},
    )
    return {
        "token": access_token,
        "refreshToken": refresh_token_raw,
        "expiresIn": settings.access_token_expire_minutes * 60,
        "refreshExpiresIn": settings.refresh_token_expire_days * 86400,
        "usuario": serialize_user(user),
    }


def revoke_refresh_token(db: Session, refresh_token_raw: str) -> None:
    from app.core.security import safe_decode_token

    payload = safe_decode_token(refresh_token_raw)
    if not payload:
        return
    jti = payload.get("jti")
    if not jti:
        return
    token_row = db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))
    if token_row and token_row.revoked_at is None:
        token_row.revoked_at = datetime.now(timezone.utc)
        db.add(token_row)
        db.commit()
