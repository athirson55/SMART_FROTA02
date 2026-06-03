"""
Database initialization — runs on every startup (controlled by SEED_ON_STARTUP env var).

Creates only what is REQUIRED for the system to work:
  1. Default admin account   (admin@smartfrota.local / Admin@12345)
     → Change password on first login in /configuracoes
  2. SystemSetting row       (required by the settings module)

NO demo/test/fixture data is created here.
To load demo data for development, use:
    python manage_seed.py --demo   (if available)
or create records directly via the API.
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.settings import SystemSetting
from app.models.user import User


def seed_database(db: Session) -> None:
    # ── 1. Admin user ─────────────────────────────────────────────────────────
    if not db.scalar(select(User).where(User.email == "admin@smartfrota.local")):
        admin = User(
            nome="Administrador",
            email="admin@smartfrota.local",
            senha_hash=hash_password("Admin@12345"),
            role="ADMIN",
            avatar_foto=None,
            is_active=True,
            email_verified=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(admin)

    # ── 2. System settings (required singleton) ───────────────────────────────
    if not db.scalar(select(SystemSetting)):
        db.add(SystemSetting())

    db.commit()
