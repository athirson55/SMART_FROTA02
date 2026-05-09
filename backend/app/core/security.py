from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_token(*, subject: str, token_type: str, expires_delta: timedelta, extra_claims: dict | None = None) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta
    jti = str(uuid4())
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")
    return token, jti, expires_at


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=["HS256"])


def token_expiration_from_minutes(minutes: int) -> timedelta:
    return timedelta(minutes=minutes)


def token_expiration_from_days(days: int) -> timedelta:
    return timedelta(days=days)


def safe_decode_token(token: str) -> dict | None:
    try:
        return decode_token(token)
    except JWTError:
        return None
