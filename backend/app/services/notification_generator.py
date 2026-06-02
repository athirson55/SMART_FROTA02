"""
Auto-generates preventive notifications by scanning real DB data.

Rules applied:
  - CNH vence em ≤30 dias           → ALTA
  - CNH vence em ≤15 dias / vencida  → CRITICA
  - CRLV/Licenciamento vence em ≤30d → ALTA
  - CRLV vencido                     → CRITICA
  - Seguro vence em ≤30d             → ALTA
  - Seguro vencido                   → CRITICA
  - Manutenção pendente em ≤7 dias   → ALTA
  - Manutenção vencida (data < hoje) → CRITICA
  - Agendamento em ≤2 dias           → MEDIA
  - Rota PENDENTE com data_fim < hoje→ CRITICA
  - Pendência com tone=RED           → ALTA
  - Pendência com tone!=RED          → MEDIA

Each check uses a composite "source key" to avoid duplicate notifications per user.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Driver, Vehicle, VehiclePendencia
from app.models.operations import Appointment, Maintenance, Notification, Route
from app.models.user import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _days_until(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = dt - _now()
    return delta.days


def _source_key(tipo: str, ref_id: str) -> str:
    return f"{tipo}::{ref_id}"


def _existing_keys(db: Session, user_id: str) -> set[str]:
    """Return set of 'tipo::ref_id' for all unread notifications already present for this user."""
    rows = db.execute(
        select(Notification.referencia_tipo, Notification.referencia_id).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.referencia_tipo.isnot(None),
            Notification.referencia_id.isnot(None),
        )
    ).all()
    return {_source_key(r.referencia_tipo, r.referencia_id) for r in rows}


def _make(
    user_id: str,
    titulo: str,
    mensagem: str,
    tipo: str,
    prioridade: str,
    referencia_tipo: str,
    referencia_id: str,
) -> Notification:
    return Notification(
        id=str(uuid4()),
        user_id=user_id,
        titulo=titulo,
        mensagem=mensagem,
        tipo=tipo,
        prioridade=prioridade,
        is_read=False,
        referencia_tipo=referencia_tipo,
        referencia_id=referencia_id,
    )


# ─── individual checkers ───────────────────────────────────────────────────────

def _check_cnh(driver: Driver, user_id: str, existing: set) -> list[Notification]:
    days = _days_until(driver.cnh_vencimento)
    if days is None:
        return []
    ref_tipo = "cnh"
    ref_id = driver.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    if days < 0:
        return [_make(
            user_id,
            f"CNH vencida: {driver.nome}",
            f"A CNH do motorista {driver.nome} venceu há {abs(days)} dia(s). Regularize imediatamente.",
            "CNH",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 15:
        return [_make(
            user_id,
            f"CNH vence em {days} dia(s): {driver.nome}",
            f"A CNH do motorista {driver.nome} vence em {days} dia(s). Renove com urgência.",
            "CNH",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 30:
        return [_make(
            user_id,
            f"CNH próxima do vencimento: {driver.nome}",
            f"A CNH do motorista {driver.nome} vence em {days} dia(s). Programe a renovação.",
            "CNH",
            "ALTA",
            ref_tipo,
            ref_id,
        )]
    return []


def _check_crlv(vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    days = _days_until(vehicle.vencimento_crlv)
    if days is None:
        return []
    ref_tipo = "crlv"
    ref_id = vehicle.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa or vehicle.id
    if days < 0:
        return [_make(
            user_id,
            f"CRLV/Licenciamento vencido: {placa}",
            f"O licenciamento do veículo {vehicle.modelo} ({placa}) venceu há {abs(days)} dia(s). Regularize urgentemente.",
            "DOCUMENTO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 30:
        prioridade = "CRITICA" if days <= 15 else "ALTA"
        return [_make(
            user_id,
            f"CRLV vence em {days} dia(s): {placa}",
            f"O licenciamento do veículo {vehicle.modelo} ({placa}) vence em {days} dia(s).",
            "DOCUMENTO",
            prioridade,
            ref_tipo,
            ref_id,
        )]
    return []


def _check_seguro(vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    days = _days_until(vehicle.vencimento_seguro)
    if days is None:
        return []
    ref_tipo = "seguro"
    ref_id = vehicle.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa or vehicle.id
    if days < 0:
        return [_make(
            user_id,
            f"Seguro vencido: {placa}",
            f"O seguro do veículo {vehicle.modelo} ({placa}) venceu há {abs(days)} dia(s). Renove o quanto antes.",
            "SEGURO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 30:
        prioridade = "CRITICA" if days <= 15 else "ALTA"
        return [_make(
            user_id,
            f"Seguro vence em {days} dia(s): {placa}",
            f"O seguro do veículo {vehicle.modelo} ({placa}) vence em {days} dia(s).",
            "SEGURO",
            prioridade,
            ref_tipo,
            ref_id,
        )]
    return []


def _check_revisao_km(vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    if vehicle.proxima_revisao_km is None:
        return []
    ref_tipo = "revisao_km"
    ref_id = vehicle.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa or vehicle.id
    diff = vehicle.km - vehicle.proxima_revisao_km
    if diff >= 0:
        return [_make(
            user_id,
            f"Revisão vencida por km: {placa}",
            f"O veículo {vehicle.modelo} ({placa}) ultrapassou a quilometragem limite de revisão em {diff:,} km.",
            "MANUTENCAO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if diff >= -2000:
        return [_make(
            user_id,
            f"Revisão próxima por km: {placa}",
            f"O veículo {vehicle.modelo} ({placa}) tem revisão em {abs(diff):,} km (limite: {vehicle.proxima_revisao_km:,} km).",
            "MANUTENCAO",
            "ALTA",
            ref_tipo,
            ref_id,
        )]
    return []


def _check_revisao_data(vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    days = _days_until(vehicle.proxima_revisao_data)
    if days is None:
        return []
    ref_tipo = "revisao_data"
    ref_id = vehicle.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa or vehicle.id
    if days < 0:
        return [_make(
            user_id,
            f"Revisão atrasada: {placa}",
            f"O veículo {vehicle.modelo} ({placa}) tem revisão atrasada há {abs(days)} dia(s).",
            "MANUTENCAO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 7:
        return [_make(
            user_id,
            f"Revisão em {days} dia(s): {placa}",
            f"O veículo {vehicle.modelo} ({placa}) tem revisão agendada em {days} dia(s).",
            "MANUTENCAO",
            "ALTA",
            ref_tipo,
            ref_id,
        )]
    return []


def _check_maintenance(m: Maintenance, vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    if m.status in ("CONCLUIDA", "CANCELADA"):
        return []
    days = _days_until(m.data)
    if days is None:
        return []
    ref_tipo = "manutencao"
    ref_id = m.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa if vehicle else ""
    desc = (m.descricao or "Manutenção")[:60]
    if days < 0:
        return [_make(
            user_id,
            f"Manutenção atrasada: {placa}",
            f"Manutenção '{desc}' estava prevista há {abs(days)} dia(s) para {placa} e ainda está pendente.",
            "MANUTENCAO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 7:
        return [_make(
            user_id,
            f"Manutenção em {days} dia(s): {placa}",
            f"Manutenção '{desc}' agendada para {placa} em {days} dia(s).",
            "MANUTENCAO",
            "ALTA",
            ref_tipo,
            ref_id,
        )]
    return []


def _check_appointment(appt: Appointment, vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    if appt.status in ("CONCLUIDO", "CANCELADO"):
        return []
    days = _days_until(appt.data)
    if days is None:
        return []
    ref_tipo = "agendamento"
    ref_id = appt.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa if vehicle else ""
    if days < 0:
        return [_make(
            user_id,
            f"Agendamento atrasado: {appt.tipo}",
            f"Agendamento '{appt.tipo}' para {placa} estava previsto há {abs(days)} dia(s) e não foi concluído.",
            "AGENDAMENTO",
            "CRITICA",
            ref_tipo,
            ref_id,
        )]
    if days <= 2:
        return [_make(
            user_id,
            f"Agendamento em {days} dia(s): {appt.tipo}",
            f"Agendamento '{appt.tipo}' para {placa} em {days} dia(s) às {appt.hora}.",
            "AGENDAMENTO",
            "MEDIA",
            ref_tipo,
            ref_id,
        )]
    return []


def _check_route(route: Route, vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    if route.status in ("CONCLUIDA", "CANCELADA"):
        return []
    ref_tipo = "rota"
    ref_id = route.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa if vehicle else ""
    if route.data_fim:
        days = _days_until(route.data_fim)
        if days is not None and days < 0:
            return [_make(
                user_id,
                f"Entrega atrasada: {route.destino}",
                f"Rota de {route.origem} → {route.destino} ({placa}) está atrasada há {abs(days)} dia(s).",
                "ROTA",
                "CRITICA",
                ref_tipo,
                ref_id,
            )]
    return []


def _check_pendencia(p: VehiclePendencia, vehicle: Vehicle, user_id: str, existing: set) -> list[Notification]:
    if p.resolved_at is not None:
        return []
    ref_tipo = "pendencia"
    ref_id = p.id
    if _source_key(ref_tipo, ref_id) in existing:
        return []
    placa = vehicle.placa if vehicle else ""
    prioridade = "ALTA" if p.tone.upper() == "RED" else "MEDIA"
    return [_make(
        user_id,
        f"Pendência: {p.label}",
        f"Veículo {placa}: {p.detail or p.label}",
        "PENDENCIA",
        prioridade,
        ref_tipo,
        ref_id,
    )]


# ─── main entry point ──────────────────────────────────────────────────────────

def generate_notifications_for_user(db: Session, user_id: str) -> list[Notification]:
    """Scan all data and create missing preventive notifications for a user. Returns new notifications."""
    existing = _existing_keys(db, user_id)
    created: list[Notification] = []

    # Drivers — CNH
    drivers = db.scalars(select(Driver)).all()
    for driver in drivers:
        created.extend(_check_cnh(driver, user_id, existing))

    # Vehicles — CRLV, seguro, revisão
    vehicles = db.scalars(
        select(Vehicle).options(joinedload(Vehicle.pendencias), joinedload(Vehicle.manutencoes), joinedload(Vehicle.agendamentos), joinedload(Vehicle.rotas))
    ).unique().all()

    for vehicle in vehicles:
        created.extend(_check_crlv(vehicle, user_id, existing))
        created.extend(_check_seguro(vehicle, user_id, existing))
        created.extend(_check_revisao_km(vehicle, user_id, existing))
        created.extend(_check_revisao_data(vehicle, user_id, existing))

        for m in vehicle.manutencoes:
            created.extend(_check_maintenance(m, vehicle, user_id, existing))

        for appt in vehicle.agendamentos:
            created.extend(_check_appointment(appt, vehicle, user_id, existing))

        for route in vehicle.rotas:
            created.extend(_check_route(route, vehicle, user_id, existing))

        for pendencia in vehicle.pendencias:
            created.extend(_check_pendencia(pendencia, vehicle, user_id, existing))

    for notif in created:
        db.add(notif)

    db.commit()
    for notif in created:
        db.refresh(notif)

    return created


def get_notifications_summary(db: Session, user_id: str) -> dict:
    """Return counts for dashboard cards."""
    from sqlalchemy import func
    from app.models.operations import Notification

    total = db.scalar(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
    ) or 0

    criticos = db.scalar(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.prioridade == "CRITICA",
        )
    ) or 0

    altos = db.scalar(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.prioridade == "ALTA",
        )
    ) or 0

    return {
        "total": total,
        "criticos": criticos,
        "altos": altos,
        "naoLidos": total,
    }
