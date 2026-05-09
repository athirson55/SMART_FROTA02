from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SystemSetting(Base):
    __tablename__ = "configuracoes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    company_name: Mapped[str] = mapped_column(String(160), nullable=False, default="Smart Frota")
    timezone: Mapped[str] = mapped_column(String(80), nullable=False, default="America/Sao_Paulo")
    theme: Mapped[str] = mapped_column(String(40), nullable=False, default="dark")
    low_km_threshold: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    low_days_threshold: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    email_notifications: Mapped[bool] = mapped_column(default=True, nullable=False)
    dashboard_refresh_minutes: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    raw_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
