from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Route(Base):
    __tablename__ = "rotas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    motorista_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("motoristas.id", ondelete="SET NULL"), nullable=True)
    origem: Mapped[str] = mapped_column(String(200), nullable=False)
    destino: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="PENDENTE")
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    distancia_km: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="rotas")
    motorista = relationship("Driver")


class Maintenance(Base):
    __tablename__ = "manutencoes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(40), nullable=False, default="PREVENTIVA")
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    custo: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="PENDENTE")
    prioridade: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIA")
    mecanico: Mapped[str | None] = mapped_column(String(120), nullable=True)
    oficina: Mapped[str | None] = mapped_column(String(120), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="manutencoes")


class Appointment(Base):
    __tablename__ = "agendamentos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(120), nullable=False)
    data: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    hora: Mapped[str] = mapped_column(String(10), nullable=False)
    km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    local: Mapped[str | None] = mapped_column(String(160), nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="AGENDADO")
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="agendamentos")


class Alert(Base):
    __tablename__ = "alertas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("veiculos.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo: Mapped[str] = mapped_column(String(40), nullable=False, default="OUTRO")
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    prioridade: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIO")
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="PENDENTE")
    km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    acao: Mapped[str | None] = mapped_column(String(160), nullable=True)
    responsavel: Mapped[str | None] = mapped_column(String(120), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolvido_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="alertas")


class Notification(Base):
    __tablename__ = "notificacoes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    alert_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("alertas.id", ondelete="SET NULL"), nullable=True, index=True)
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(40), nullable=False, default="INFO")
    is_read: Mapped[bool] = mapped_column(default=False, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

