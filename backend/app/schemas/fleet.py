from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class DriverBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    email: EmailStr
    telefone: str | None = None
    cnh: str = Field(min_length=5, max_length=40)
    cnhCategoria: str = Field(default="D", max_length=10)
    cnhVencimento: datetime | None = None
    status: str = Field(default="DISPONIVEL", max_length=30)
    cargo: str = Field(default="Motorista", max_length=120)
    avatarCor: str | None = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    telefone: str | None = None
    cnh: str | None = Field(default=None, min_length=5, max_length=40)
    cnhCategoria: str | None = Field(default=None, max_length=10)
    cnhVencimento: datetime | None = None
    status: str | None = Field(default=None, max_length=30)
    cargo: str | None = Field(default=None, max_length=120)
    avatarCor: str | None = None


class VehicleBase(BaseModel):
    modelo: str = Field(min_length=2, max_length=160)
    marca: str | None = None
    placa: str = Field(min_length=5, max_length=20)
    ano: int | None = None
    status: str = Field(default="ATIVO", max_length=30)
    combustivel: str | None = None
    chassi: str | None = None
    km: int = 0
    motoristaId: str | None = None
    vencimentoCRLV: datetime | None = None
    vencimentoSeguro: datetime | None = None
    proximaRevisaoKm: int | None = None
    proximaRevisaoData: datetime | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    modelo: str | None = Field(default=None, min_length=2, max_length=160)
    marca: str | None = None
    placa: str | None = Field(default=None, min_length=5, max_length=20)
    ano: int | None = None
    status: str | None = Field(default=None, max_length=30)
    combustivel: str | None = None
    chassi: str | None = None
    km: int | None = None
    motoristaId: str | None = None
    vencimentoCRLV: datetime | None = None
    vencimentoSeguro: datetime | None = None
    proximaRevisaoKm: int | None = None
    proximaRevisaoData: datetime | None = None


class PendenciaCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=120)
    label: str = Field(min_length=2, max_length=160)
    detail: str | None = None
    tone: str = Field(default="AMBER", max_length=20)


class PendenciaRead(BaseModel):
    id: str
    slug: str
    label: str
    detail: str | None = None
    tone: str
    sourceType: str | None = None
    sourceId: str | None = None
    resolvedAt: datetime | None = None


class DriverRead(DriverBase):
    id: str
    isActive: bool | None = True
    createdAt: datetime
    updatedAt: datetime


class VehicleRead(VehicleBase):
    id: str
    motorista: DriverRead | None = None
    createdAt: datetime
    updatedAt: datetime
