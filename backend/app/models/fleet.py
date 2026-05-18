from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Driver(Base):
    __tablename__ = "motoristas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    nome: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    telefone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    cnh: Mapped[str] = mapped_column(String(40), unique=True, nullable=False, index=True)
    cnh_categoria: Mapped[str] = mapped_column(String(10), nullable=False, default="D")
    cnh_vencimento: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="DISPONIVEL")
    cargo: Mapped[str] = mapped_column(String(120), nullable=False, default="Motorista")
    avatar_cor: Mapped[str | None] = mapped_column(String(20), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicles = relationship("Vehicle", back_populates="motorista")


class Vehicle(Base):
    __tablename__ = "veiculos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    modelo: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    marca: Mapped[str | None] = mapped_column(String(120), nullable=True)
    placa: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    ano: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ATIVO")
    combustivel: Mapped[str | None] = mapped_column(String(30), nullable=True)
    chassi: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    km: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    capacidade: Mapped[str | None] = mapped_column(String(40), nullable=True)
    tipo_veiculo: Mapped[str | None] = mapped_column(String(60), nullable=True)
    motorista_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("motoristas.id", ondelete="SET NULL"), nullable=True, index=True)
    vencimento_crlv: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    vencimento_seguro: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    proxima_revisao_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proxima_revisao_data: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    motorista = relationship("Driver", back_populates="vehicles")
    pendencias = relationship("VehiclePendencia", back_populates="vehicle", cascade="all, delete-orphan")
    manutencoes = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
    agendamentos = relationship("Appointment", back_populates="vehicle", cascade="all, delete-orphan")
    alertas = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    rotas = relationship("Route", back_populates="vehicle", cascade="all, delete-orphan")


class VehiclePendencia(Base):
    __tablename__ = "veiculo_pendencias"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("veiculos.id", ondelete="CASCADE"), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(160), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    tone: Mapped[str] = mapped_column(String(20), nullable=False, default="AMBER")
    source_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="pendencias")
