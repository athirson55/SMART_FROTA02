import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

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
from app.models.email_verification import EmailVerificationToken
from app.models.session_token import RefreshToken
from app.models.user import User

settings = get_settings()
logger = logging.getLogger(__name__)


def _email_delivery_failed(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=message)


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "role": user.role,
        "avatarFoto": user.avatar_foto,
        "isActive": user.is_active,
        "emailVerified": user.email_verified,
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


# ─────────────────────────────────────────────
# Email Verification
# ─────────────────────────────────────────────

def _invalidate_verification_tokens(db: Session, user_id: str) -> None:
    pending = db.scalars(
        select(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user_id,
            EmailVerificationToken.used_at.is_(None),
        )
    ).all()
    now = datetime.now(timezone.utc)
    for tok in pending:
        tok.used_at = now
    db.flush()


def _create_verification_token(db: Session, user: User) -> str:
    _invalidate_verification_tokens(db, user.id)
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.email_verify_expire_hours)
    db.add(EmailVerificationToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.flush()
    return raw_token


def send_verification_for_user(db: Session, user: User) -> str:
    """Generate token and send verification email. Returns raw token (for dev logging)."""
    from app.core.email import send_verification_email

    raw_token = _create_verification_token(db, user)
    verify_url = f"{settings.frontend_url}/#/verificar-email?token={raw_token}"
    if not send_verification_email(user.email, user.nome, verify_url, settings):
        # Mantem o cadastro pendente de verificacao para evitar falso negativo
        # no fluxo quando o provedor aceita mas a confirmacao local falha.
        logger.error("Falha ao enviar verificacao para %s; usuario mantido pendente", user.email)
    db.commit()
    return raw_token


def verify_email_token(db: Session, raw_token: str) -> User:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token_row = db.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
    )
    if not token_row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado")
    if token_row.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token já utilizado")
    if token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite o reenvio do e-mail de confirmação.",
        )
    user = get_user_by_id(db, token_row.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário não encontrado")

    now = datetime.now(timezone.utc)
    user.email_verified = True
    user.email_verified_at = now
    user.is_active = True
    token_row.used_at = now
    db.add(user)
    db.add(token_row)
    db.commit()
    db.refresh(user)
    return user


def resend_verification_email(db: Session, email: str) -> str | None:
    """Silently regenerates and resends verification token. Never reveals if email exists."""
    user = get_user_by_email(db, email)
    if not user or user.email_verified:
        return None
    return send_verification_for_user(db, user)


# ─────────────────────────────────────────────
# Registration
# ─────────────────────────────────────────────

def register_user(
    db: Session,
    *,
    nome: str,
    email: str,
    senha: str,
    role: str = "USER",
    avatar_foto: str | None = None,
    skip_verification: bool = False,
) -> tuple[User, str | None]:
    ensure_user_unique(db, email)
    verified_at = datetime.now(timezone.utc) if skip_verification else None
    user = User(
        nome=nome.strip(),
        email=email.lower().strip(),
        senha_hash=hash_password(senha),
        role=role,
        avatar_foto=avatar_foto,
        is_active=skip_verification,
        email_verified=skip_verification,
        email_verified_at=verified_at,
    )
    db.add(user)
    db.flush()

    verification_token = None

    if not skip_verification:
        verification_token = send_verification_for_user(db, user)

    db.commit()
    db.refresh(user)
    return user, verification_token


# ─────────────────────────────────────────────
# Authentication
# ─────────────────────────────────────────────

def authenticate_user(db: Session, email: str, senha: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(senha, user.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="EMAIL_NOT_VERIFIED",
        )
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

    # Revoke old refresh token (rotation: each token is single-use)
    now_rot = datetime.now(timezone.utc)
    token_row.revoked_at = now_rot
    token_row.last_used_at = now_rot
    db.add(token_row)

    access_token, _, _ = create_token(
        subject=user.id,
        token_type="access",
        expires_delta=token_expiration_from_minutes(settings.access_token_expire_minutes),
        extra_claims={"email": user.email, "role": user.role},
    )
    new_refresh_token, new_refresh_jti, new_refresh_expires_at = create_token(
        subject=user.id,
        token_type="refresh",
        expires_delta=token_expiration_from_days(settings.refresh_token_expire_days),
        extra_claims={"email": user.email, "role": user.role},
    )
    _store_refresh_token(db, user, new_refresh_jti, new_refresh_expires_at)
    return {
        "token": access_token,
        "refreshToken": new_refresh_token,
        "expiresIn": settings.access_token_expire_minutes * 60,
        "refreshExpiresIn": settings.refresh_token_expire_days * 86400,
        "usuario": serialize_user(user),
    }


def update_me(db: Session, user: User, data: dict) -> User:
    if data.get("nome"):
        user.nome = data["nome"].strip()
    if "avatarFoto" in data:
        user.avatar_foto = data["avatarFoto"]
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, senha_atual: str, nova_senha: str) -> None:
    if not verify_password(senha_atual, user.senha_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta")
    user.senha_hash = hash_password(nova_senha)
    db.add(user)
    db.commit()


# ─────────────────────────────────────────────
# Password Reset
# ─────────────────────────────────────────────

def create_password_reset_token(db: Session, email: str) -> str | None:
    """Generate a one-time reset token. Silently returns if email not found."""
    from app.core.email import send_password_reset_email
    from app.models.password_reset import PasswordResetToken

    user = get_user_by_email(db, email)
    if not user:
        return  # Never reveal whether the e-mail exists

    pending = db.scalars(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    ).all()
    for tok in pending:
        tok.used_at = datetime.now(timezone.utc)
    db.flush()

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)

    db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))

    reset_url = f"{settings.frontend_url}/#/redefinir-senha?token={raw_token}"
    if not send_password_reset_email(user.email, reset_url, settings):
        db.rollback()
        raise _email_delivery_failed(
            "Não foi possível enviar o e-mail de recuperação de senha. Tente novamente em instantes."
        )
    db.commit()
    return raw_token


def consume_password_reset_token(db: Session, raw_token: str, nova_senha: str) -> User:
    from app.core.email import send_password_reset_success_email
    from app.models.password_reset import PasswordResetToken

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    token_row = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash))

    if not token_row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado")
    if token_row.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token já utilizado")
    if token_row.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite um novo link.",
        )

    user = get_user_by_id(db, token_row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário inválido")

    user.senha_hash = hash_password(nova_senha)
    token_row.used_at = datetime.now(timezone.utc)
    db.add(user)
    db.add(token_row)
    db.commit()
    db.refresh(user)

    send_password_reset_success_email(user.email, user.nome, settings)
    return user


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
