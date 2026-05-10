from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Vehicle, VehiclePendencia
from app.models.operations import Alert, Appointment, Maintenance, Notification
from app.services.fleet_service import serialize_vehicle


def serialize_maintenance(item: Maintenance) -> dict:
    return {
        "id": item.id,
        "veiculoId": item.vehicle_id,
        "vehicleId": item.vehicle_id,
        "veiculo": serialize_vehicle(item.vehicle, include_driver=True) if item.vehicle else None,
        "tipo": item.tipo,
        "descricao": item.descricao,
        "data": item.data,
        "km": item.km,
        "custo": float(item.custo or 0),
        "status": item.status,
        "prioridade": item.prioridade,
        "mecanico": item.mecanico,
        "oficina": item.oficina,
        "observacoes": item.observacoes,
        "createdAt": item.created_at,
        "updatedAt": item.updated_at,
    }


def serialize_appointment(item: Appointment) -> dict:
    return {
        "id": item.id,
        "veiculoId": item.vehicle_id,
        "vehicleId": item.vehicle_id,
        "veiculo": serialize_vehicle(item.vehicle, include_driver=True) if item.vehicle else None,
        "tipo": item.tipo,
        "data": item.data,
        "hora": item.hora,
        "km": item.km,
        "local": item.local,
        "responsavel": item.responsavel,
        "status": item.status,
        "observacoes": item.observacoes,
        "createdAt": item.created_at,
        "updatedAt": item.updated_at,
    }


def serialize_alert(item: Alert) -> dict:
    return {
        "id": item.id,
        "veiculoId": item.vehicle_id,
        "vehicleId": item.vehicle_id,
        "veiculo": serialize_vehicle(item.vehicle, include_driver=True) if item.vehicle else None,
        "tipo": item.tipo,
        "titulo": item.titulo,
        "mensagem": item.mensagem,
        "prioridade": item.prioridade,
        "status": item.status,
        "km": item.km,
        "acao": item.acao,
        "responsavel": item.responsavel,
        "observacao": item.observacao,
        "resolvidoEm": item.resolvido_em,
        "createdAt": item.created_at,
        "updatedAt": item.updated_at,
    }


def serialize_notification(item: Notification) -> dict:
    return {
        "id": item.id,
        "userId": item.user_id,
        "alertId": item.alert_id,
        "titulo": item.titulo,
        "mensagem": item.mensagem,
        "tipo": item.tipo,
        "isRead": item.is_read,
        "payloadJson": item.payload_json,
        "createdAt": item.created_at,
        "updatedAt": item.updated_at,
    }


def _paginate(query, page: int, limit: int):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    total = 0
    count_query = select(func.count()).select_from(query.subquery())
    return query.offset((page - 1) * limit).limit(limit), {"page": page, "limit": limit, "total": total, "count_query": count_query}


def _find_vehicle(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.scalar(select(Vehicle).options(joinedload(Vehicle.motorista)).where(Vehicle.id == vehicle_id))
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado")
    return vehicle


def list_maintenances(db: Session, search: str | None = None, status_value: str | None = None, page: int = 1, limit: int = 25):
    query = select(Maintenance).options(joinedload(Maintenance.vehicle).joinedload(Vehicle.motorista))
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Maintenance.descricao.ilike(term)) | (Maintenance.oficina.ilike(term)) | (Maintenance.mecanico.ilike(term)))
    if status_value and status_value.lower() != "todos":
        query = query.where(Maintenance.status == status_value)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    query = query.order_by(Maintenance.data.desc())
    items = db.scalars(query.offset((page - 1) * limit).limit(limit)).unique().all()
    return items, total, {"page": page, "limit": limit}


def get_maintenance(db: Session, maintenance_id: str) -> Maintenance:
    item = db.scalar(select(Maintenance).options(joinedload(Maintenance.vehicle).joinedload(Vehicle.motorista)).where(Maintenance.id == maintenance_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada")
    return item


def create_maintenance(db: Session, data: dict) -> Maintenance:
    vehicle = _find_vehicle(db, data["veiculoId"])
    item = Maintenance(
        vehicle_id=vehicle.id,
        tipo=data.get("tipo") or "PREVENTIVA",
        descricao=data["descricao"].strip(),
        data=data["data"],
        km=int(data.get("km") or 0),
        custo=float(data.get("custo") or 0),
        status=data.get("status") or "PENDENTE",
        prioridade=data.get("prioridade") or "MEDIA",
        mecanico=(data.get("mecanico") or None),
        oficina=(data.get("oficina") or None),
        observacoes=(data.get("observacoes") or None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_maintenance(db: Session, item: Maintenance, data: dict) -> Maintenance:
    if data.get("veiculoId"):
        item.vehicle_id = _find_vehicle(db, data["veiculoId"]).id
    mapping = {
        "tipo": "tipo",
        "descricao": "descricao",
        "data": "data",
        "km": "km",
        "custo": "custo",
        "status": "status",
        "prioridade": "prioridade",
        "mecanico": "mecanico",
        "oficina": "oficina",
        "observacoes": "observacoes",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_maintenance(db: Session, item: Maintenance) -> None:
    db.delete(item)
    db.commit()


def maintenances_stats(db: Session) -> dict:
    total = db.scalar(select(func.count()).select_from(Maintenance)) or 0
    pendentes = db.scalar(select(func.count()).select_from(Maintenance).where(Maintenance.status.in_(["PENDENTE", "AGENDADA", "EM_ANDAMENTO"]))) or 0
    concluidas = db.scalar(select(func.count()).select_from(Maintenance).where(Maintenance.status == "CONCLUIDA")) or 0
    custo_total = db.scalar(select(func.coalesce(func.sum(Maintenance.custo), 0))) or 0
    return {"total": total, "pendentes": pendentes, "concluidas": concluidas, "custoTotal": float(custo_total)}


def list_appointments(db: Session, search: str | None = None, status_value: str | None = None, page: int = 1, limit: int = 25):
    query = select(Appointment).options(joinedload(Appointment.vehicle).joinedload(Vehicle.motorista))
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Appointment.tipo.ilike(term)) | (Appointment.local.ilike(term)) | (Appointment.responsavel.ilike(term)))
    if status_value and status_value.lower() != "todos":
        query = query.where(Appointment.status == status_value)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Appointment.data.desc()).offset((page - 1) * limit).limit(limit)).unique().all()
    return items, total, {"page": page, "limit": limit}


def get_appointment(db: Session, appointment_id: str) -> Appointment:
    item = db.scalar(select(Appointment).options(joinedload(Appointment.vehicle).joinedload(Vehicle.motorista)).where(Appointment.id == appointment_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    return item


def create_appointment(db: Session, data: dict) -> Appointment:
    vehicle = _find_vehicle(db, data["veiculoId"])
    item = Appointment(
        vehicle_id=vehicle.id,
        tipo=data["tipo"].strip(),
        data=data["data"],
        hora=data["hora"],
        km=int(data.get("km") or 0),
        local=(data.get("local") or None),
        responsavel=(data.get("responsavel") or None),
        status=data.get("status") or "AGENDADO",
        observacoes=(data.get("observacoes") or None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_appointment(db: Session, item: Appointment, data: dict) -> Appointment:
    if data.get("veiculoId"):
        item.vehicle_id = _find_vehicle(db, data["veiculoId"]).id
    mapping = {
        "tipo": "tipo",
        "data": "data",
        "hora": "hora",
        "km": "km",
        "local": "local",
        "responsavel": "responsavel",
        "status": "status",
        "observacoes": "observacoes",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_appointment(db: Session, item: Appointment) -> None:
    db.delete(item)
    db.commit()


def appointments_stats(db: Session) -> dict:
    total = db.scalar(select(func.count()).select_from(Appointment)) or 0
    agendados = db.scalar(select(func.count()).select_from(Appointment).where(Appointment.status == "AGENDADO")) or 0
    confirmados = db.scalar(select(func.count()).select_from(Appointment).where(Appointment.status == "CONFIRMADO")) or 0
    return {"total": total, "agendados": agendados, "confirmados": confirmados}


def list_alerts(db: Session, search: str | None = None, status_value: str | None = None, page: int = 1, limit: int = 25):
    query = select(Alert).options(joinedload(Alert.vehicle).joinedload(Vehicle.motorista))
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Alert.titulo.ilike(term)) | (Alert.mensagem.ilike(term)) | (Alert.acao.ilike(term)))
    if status_value and status_value.lower() != "todos":
        query = query.where(Alert.status == status_value.upper())
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Alert.created_at.desc()).offset((page - 1) * limit).limit(limit)).unique().all()
    return items, total, {"page": page, "limit": limit}


def get_alert(db: Session, alert_id: str) -> Alert:
    item = db.scalar(select(Alert).options(joinedload(Alert.vehicle).joinedload(Vehicle.motorista)).where(Alert.id == alert_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    return item


def create_alert(db: Session, data: dict) -> Alert:
    vehicle = None
    if data.get("veiculoId"):
        vehicle = _find_vehicle(db, data["veiculoId"])
    item = Alert(
        vehicle_id=vehicle.id if vehicle else None,
        tipo=data.get("tipo") or "OUTRO",
        titulo=data["titulo"].strip(),
        mensagem=data["mensagem"].strip(),
        prioridade=data.get("prioridade") or "MEDIO",
        status=data.get("status") or "PENDENTE",
        km=int(data.get("km") or 0),
        acao=(data.get("acao") or None),
        responsavel=(data.get("responsavel") or None),
        observacao=(data.get("observacao") or None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_alert(db: Session, item: Alert, data: dict) -> Alert:
    if data.get("veiculoId") is not None:
        item.vehicle_id = _find_vehicle(db, data["veiculoId"]).id if data.get("veiculoId") else None
    mapping = {
        "tipo": "tipo",
        "titulo": "titulo",
        "mensagem": "mensagem",
        "prioridade": "prioridade",
        "status": "status",
        "km": "km",
        "acao": "acao",
        "responsavel": "responsavel",
        "observacao": "observacao",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    if item.status == "RESOLVIDO" and item.resolvido_em is None:
        item.resolvido_em = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def resolve_alert(db: Session, item: Alert, observacao: str | None = None) -> Alert:
    item.status = "RESOLVIDO"
    item.resolvido_em = datetime.now(timezone.utc)
    if observacao is not None:
                item.observacao = observacao
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_alert(db: Session, item: Alert) -> None:
    db.delete(item)
    db.commit()


def generate_auto_alerts(db: Session) -> list[Alert]:
    created: list[Alert] = []
    vehicles = db.scalars(select(Vehicle).options(joinedload(Vehicle.motorista))).all()
    now = datetime.now(timezone.utc)
    for vehicle in vehicles:
        pendientes = db.scalars(select(VehiclePendencia).where(VehiclePendencia.vehicle_id == vehicle.id, VehiclePendencia.resolved_at.is_(None))).all()
        for pending in pendientes:
            exists = db.scalar(select(Alert).where(Alert.vehicle_id == vehicle.id, Alert.titulo == pending.label, Alert.status != "RESOLVIDO"))
            if exists:
                continue
            alert = Alert(
                vehicle_id=vehicle.id,
                tipo="manutencao" if "manut" in pending.slug.lower() or "oleo" in pending.slug.lower() or "troca" in pending.slug.lower() else "documento",
                titulo=pending.label,
                mensagem=pending.detail or pending.label,
                prioridade="CRITICO" if pending.tone.upper() == "RED" else "MEDIO",
                status="PENDENTE",
                km=vehicle.km,
                acao="Verificar pendência",
                responsavel=vehicle.motorista.nome if vehicle.motorista else None,
            )
            db.add(alert)
            created.append(alert)
    db.commit()
    for alert in created:
        db.refresh(alert)
    return created


def list_notifications(db: Session, search: str | None = None, page: int = 1, limit: int = 25):
    query = select(Notification)
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Notification.titulo.ilike(term)) | (Notification.mensagem.ilike(term)) | (Notification.tipo.ilike(term)))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Notification.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total, {"page": page, "limit": limit}


def get_notification(db: Session, notification_id: str) -> Notification:
    item = db.get(Notification, notification_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada")
    return item


def create_notification(db: Session, data: dict) -> Notification:
    item = Notification(
        user_id=data.get("userId"),
        alert_id=data.get("alertId"),
        titulo=data["titulo"].strip(),
        mensagem=data["mensagem"].strip(),
        tipo=data.get("tipo") or "INFO",
        is_read=bool(data.get("isRead", False)),
        payload_json=data.get("payloadJson"),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_notification(db: Session, item: Notification, data: dict) -> Notification:
    mapping = {
        "titulo": "titulo",
        "mensagem": "mensagem",
        "tipo": "tipo",
        "userId": "user_id",
        "alertId": "alert_id",
        "payloadJson": "payload_json",
        "isRead": "is_read",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_notification(db: Session, item: Notification) -> None:
    db.delete(item)
    db.commit()
