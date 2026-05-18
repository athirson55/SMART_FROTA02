from datetime import datetime

from pydantic import BaseModel, Field


class MaintenanceBase(BaseModel):
    veiculoId: str = Field(min_length=1)
    tipo: str = Field(default="PREVENTIVA", max_length=40)
    descricao: str = Field(min_length=2)
    data: datetime
    km: int = 0
    custo: float = 0
    status: str = Field(default="PENDENTE", max_length=40)
    prioridade: str = Field(default="MEDIA", max_length=20)
    mecanico: str | None = None
    oficina: str | None = None
    observacoes: str | None = None


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    veiculoId: str | None = None
    tipo: str | None = Field(default=None, max_length=40)
    descricao: str | None = None
    data: datetime | None = None
    km: int | None = None
    custo: float | None = None
    status: str | None = Field(default=None, max_length=40)
    prioridade: str | None = Field(default=None, max_length=20)
    mecanico: str | None = None
    oficina: str | None = None
    observacoes: str | None = None


class AppointmentBase(BaseModel):
    veiculoId: str = Field(min_length=1)
    tipo: str = Field(min_length=2, max_length=120)
    data: datetime
    hora: str = Field(min_length=3, max_length=10)
    km: int = 0
    local: str | None = None
    responsavel: str | None = None
    status: str = Field(default="AGENDADO", max_length=40)
    observacoes: str | None = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    veiculoId: str | None = None
    tipo: str | None = Field(default=None, max_length=120)
    data: datetime | None = None
    hora: str | None = Field(default=None, max_length=10)
    km: int | None = None
    local: str | None = None
    responsavel: str | None = None
    status: str | None = Field(default=None, max_length=40)
    observacoes: str | None = None


class AlertBase(BaseModel):
    veiculoId: str | None = None
    tipo: str = Field(default="OUTRO", max_length=40)
    titulo: str = Field(min_length=2, max_length=160)
    mensagem: str = Field(min_length=2)
    prioridade: str = Field(default="MEDIO", max_length=20)
    status: str = Field(default="PENDENTE", max_length=40)
    km: int = 0
    acao: str | None = None
    responsavel: str | None = None
    observacao: str | None = None


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    veiculoId: str | None = None
    tipo: str | None = Field(default=None, max_length=40)
    titulo: str | None = Field(default=None, min_length=2, max_length=160)
    mensagem: str | None = None
    prioridade: str | None = Field(default=None, max_length=20)
    status: str | None = Field(default=None, max_length=40)
    km: int | None = None
    acao: str | None = None
    responsavel: str | None = None
    observacao: str | None = None


class RouteBase(BaseModel):
    veiculoId: str = Field(min_length=1)
    motoristaId: str | None = None
    origem: str = Field(min_length=2, max_length=200)
    destino: str = Field(min_length=2, max_length=200)
    status: str = Field(default="PENDENTE", max_length=40)
    dataInicio: datetime | None = None
    dataFim: datetime | None = None
    distanciaKm: float | None = None
    observacoes: str | None = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    veiculoId: str | None = None
    motoristaId: str | None = None
    origem: str | None = Field(default=None, min_length=2, max_length=200)
    destino: str | None = Field(default=None, min_length=2, max_length=200)
    status: str | None = Field(default=None, max_length=40)
    dataInicio: datetime | None = None
    dataFim: datetime | None = None
    distanciaKm: float | None = None
    observacoes: str | None = None


class NotificationBase(BaseModel):
    titulo: str = Field(min_length=2, max_length=160)
    mensagem: str = Field(min_length=2)
    tipo: str = Field(default="INFO", max_length=40)
    userId: str | None = None
    alertId: str | None = None
    payloadJson: str | None = None
    isRead: bool = False


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=2, max_length=160)
    mensagem: str | None = None
    tipo: str | None = Field(default=None, max_length=40)
    userId: str | None = None
    alertId: str | None = None
    payloadJson: str | None = None
    isRead: bool | None = None
