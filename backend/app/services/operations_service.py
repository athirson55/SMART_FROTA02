from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Driver, Vehicle, VehiclePendencia
from app.models.operations import Alert, Appointment, Maintenance, Notification, Route
from app.models.user import User
from app.services.fleet_service import serialize_vehicle


def serialize_route(item: Route) -> dict:
    return {
        "id": item.id,
        "veiculoId": item.vehicle_id,
        "motoristaId": item.motorista_id,
        "veiculo": serialize_vehicle(item.vehicle, include_driver=True) if item.vehicle else None,
        "motorista": {"id": item.motorista.id, "nome": item.motorista.nome} if item.motorista else None,
        "origem": item.origem,
        "destino": item.destino,
        "status": item.status,
        "dataInicio": item.data_inicio,
        "dataFim": item.data_fim,
        "distanciaKm": float(item.distancia_km) if item.distancia_km is not None else None,
        "observacoes": item.observacoes,
        "createdAt": item.created_at,
        "updatedAt": item.updated_at,
    }


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
        "criadoPor": item.criado_por,
        "resolvidoPor": item.resolvido_por,
        "emailEnviado": item.email_enviado,
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
        "prioridade": item.prioridade,
        "isRead": item.is_read,
        "lidaEm": item.lida_em,
        "referenciaTipo": item.referencia_tipo,
        "referenciaId": item.referencia_id,
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
    if int(data.get("km") or 0) < 0:
        raise HTTPException(status_code=422, detail="Quilometragem não pode ser negativa")
    if float(data.get("custo") or 0) < 0:
        raise HTTPException(status_code=422, detail="Custo não pode ser negativo")
    vehicle = _find_vehicle(db, data["veiculoId"])
    m_status = (data.get("status") or "PENDENTE").upper()
    item = Maintenance(
        vehicle_id=vehicle.id,
        tipo=data.get("tipo") or "PREVENTIVA",
        descricao=data["descricao"].strip(),
        data=data["data"],
        km=int(data.get("km") or 0),
        custo=float(data.get("custo") or 0),
        status=m_status,
        prioridade=data.get("prioridade") or "MEDIA",
        mecanico=(data.get("mecanico") or None),
        oficina=(data.get("oficina") or None),
        observacoes=(data.get("observacoes") or None),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    # SPEC 05: vehicle in active maintenance → mark as MANUTENCAO
    if m_status == "EM_ANDAMENTO" and vehicle.status not in ("EM_ROTA", "MANUTENCAO"):
        vehicle.status = "MANUTENCAO"
        db.add(vehicle)
        db.commit()
    return item


def update_maintenance(db: Session, item: Maintenance, data: dict) -> Maintenance:
    old_status = (item.status or "PENDENTE").upper()
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
    # SPEC 05: sync vehicle status based on maintenance transitions
    new_status = (item.status or old_status).upper()
    vehicle = db.get(Vehicle, item.vehicle_id)
    if vehicle:
        if new_status == "EM_ANDAMENTO" and old_status != "EM_ANDAMENTO":
            # Maintenance started → mark vehicle as in-maintenance
            if vehicle.status not in ("EM_ROTA", "MANUTENCAO"):
                vehicle.status = "MANUTENCAO"
                db.add(vehicle)
        elif new_status == "CONCLUIDA" and old_status == "EM_ANDAMENTO":
            # Maintenance done → restore vehicle if no other active maintenances
            other_active = db.scalar(
                select(func.count()).select_from(Maintenance).where(
                    Maintenance.vehicle_id == item.vehicle_id,
                    Maintenance.status == "EM_ANDAMENTO",
                    Maintenance.id != item.id,
                )
            ) or 0
            if other_active == 0 and vehicle.status == "MANUTENCAO":
                vehicle.status = "ATIVO"
                db.add(vehicle)
    # When a maintenance is completed, resolve linked pendências, alerts, and auto-alerts
    new_status = (data.get("status") or old_status or "").upper()
    if new_status == "CONCLUIDA" and old_status != "CONCLUIDA":
        now_ts = datetime.now(timezone.utc)
        # Resolve fingerprinted auto-alert for this maintenance
        fp_alert = db.scalar(
            select(Alert).where(
                Alert.observacao == f"auto::manutencao::{item.id}",
                Alert.status != "RESOLVIDO",
            )
        )
        if fp_alert:
            fp_alert.status = "RESOLVIDO"
            fp_alert.resolvido_em = now_ts
            db.add(fp_alert)
    if new_status == "CONCLUIDA" and old_status != "CONCLUIDA":
        now = datetime.now(timezone.utc)
        # Resolve pendências linked by source_id
        pendencias_by_src = db.scalars(
            select(VehiclePendencia).where(
                VehiclePendencia.vehicle_id == item.vehicle_id,
                VehiclePendencia.source_type == "manutencao",
                VehiclePendencia.source_id == item.id,
                VehiclePendencia.resolved_at.is_(None),
            )
        ).all()
        for p in pendencias_by_src:
            p.resolved_at = now
            db.add(p)
            # Also resolve alerts generated from this pendência
            alerts_linked = db.scalars(
                select(Alert).where(
                    Alert.vehicle_id == item.vehicle_id,
                    Alert.titulo == p.label,
                    Alert.status != "RESOLVIDO",
                )
            ).all()
            for a in alerts_linked:
                a.status = "RESOLVIDO"
                a.resolvido_em = now
                db.add(a)
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
    if int(data.get("km") or 0) < 0:
        raise HTTPException(status_code=422, detail="Quilometragem não pode ser negativa")
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
    old_status = item.status
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
    # When appointment is completed, resolve its fingerprinted auto-alert
    new_status = (item.status or "").upper()
    if new_status in ("CONCLUIDA", "CONCLUIDO") and (old_status or "").upper() not in ("CONCLUIDA", "CONCLUIDO"):
        now_ts = datetime.now(timezone.utc)
        fp_alert = db.scalar(
            select(Alert).where(
                Alert.observacao == f"auto::agendamento::{item.id}",
                Alert.status != "RESOLVIDO",
            )
        )
        if fp_alert:
            fp_alert.status = "RESOLVIDO"
            fp_alert.resolvido_em = now_ts
            db.add(fp_alert)
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
        criado_por=(data.get("criadoPor") or None),
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


def resolve_alert(db: Session, item: Alert, observacao: str | None = None, user_id: str | None = None) -> Alert:
    item.status = "RESOLVIDO"
    item.resolvido_em = datetime.now(timezone.utc)
    if observacao is not None:
        item.observacao = observacao
    if user_id is not None:
        item.resolvido_por = user_id
    # Resolve any linked unresolved pendências with the same vehicle + label
    if item.vehicle_id:
        pendencias = db.scalars(
            select(VehiclePendencia).where(
                VehiclePendencia.vehicle_id == item.vehicle_id,
                VehiclePendencia.label == item.titulo,
                VehiclePendencia.resolved_at.is_(None),
            )
        ).all()
        now = datetime.now(timezone.utc)
        for p in pendencias:
            p.resolved_at = now
            db.add(p)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def unresolve_alert(db: Session, item: Alert) -> Alert:
    item.status = "PENDENTE"
    item.resolvido_em = None
    # Re-open linked pendências that were resolved together with this alert
    if item.vehicle_id:
        pendencias = db.scalars(
            select(VehiclePendencia).where(
                VehiclePendencia.vehicle_id == item.vehicle_id,
                VehiclePendencia.label == item.titulo,
                VehiclePendencia.resolved_at.isnot(None),
            )
        ).all()
        for p in pendencias:
            p.resolved_at = None
            db.add(p)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_alert(db: Session, item: Alert) -> None:
    db.delete(item)
    db.commit()


def _reconcile_auto_alerts(db: Session, vehicles: list, drivers: list, now) -> None:
    """Resolve existing auto-alerts whose underlying condition no longer applies."""
    def _tz(dt):
        if dt is None:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    def _resolve(fp: str):
        for a in db.scalars(
            select(Alert).where(Alert.observacao == fp, Alert.status != "RESOLVIDO")
        ).all():
            a.status = "RESOLVIDO"
            a.resolvido_em = now
            db.add(a)

    # Vehicles: CRLV, seguro, revisão km/data
    for v in vehicles:
        exp = _tz(v.vencimento_crlv)
        if exp and (exp - now).days > 30:
            _resolve(f"auto::crlv::{v.id}")

        exp = _tz(v.vencimento_seguro)
        if exp and (exp - now).days > 30:
            _resolve(f"auto::seguro::{v.id}")

        if v.proxima_revisao_km is not None and (v.proxima_revisao_km - v.km) > 2000:
            _resolve(f"auto::revisao_km::{v.id}")

        exp = _tz(v.proxima_revisao_data)
        if exp and (exp - now).days > 7:
            _resolve(f"auto::revisao_data::{v.id}")

    # Drivers: CNH
    for drv in drivers:
        exp = _tz(drv.cnh_vencimento)
        if exp and (exp - now).days > 30:
            _resolve(f"auto::cnh::{drv.id}")

    # Maintenances: resolve if now CONCLUIDA
    overdue_fps = db.scalars(
        select(Alert.observacao).where(
            Alert.observacao.like("auto::manutencao::%"),
            Alert.status != "RESOLVIDO",
        )
    ).all()
    for fp in overdue_fps:
        maint_id = fp.split("::")[-1]
        maint = db.get(Maintenance, maint_id)
        if maint and maint.status == "CONCLUIDA":
            _resolve(fp)

    # Appointments: resolve if now CONCLUIDA
    appt_fps = db.scalars(
        select(Alert.observacao).where(
            Alert.observacao.like("auto::agendamento::%"),
            Alert.status != "RESOLVIDO",
        )
    ).all()
    for fp in appt_fps:
        appt_id = fp.split("::")[-1]
        appt = db.get(Appointment, appt_id)
        if appt and appt.status in ("CONCLUIDA", "CONCLUIDO"):
            _resolve(fp)

    # Routes: resolve if no longer EM_ANDAMENTO
    route_fps = db.scalars(
        select(Alert.observacao).where(
            Alert.observacao.like("auto::rota::%"),
            Alert.status != "RESOLVIDO",
        )
    ).all()
    for fp in route_fps:
        route_id = fp.split("::")[-1]
        route = db.get(Route, route_id)
        if route and route.status in ("CONCLUIDA", "CANCELADA"):
            _resolve(fp)

    # Pendencias: resolve if the pendencia is now resolved
    pend_fps = db.scalars(
        select(Alert.observacao).where(
            Alert.observacao.like("auto::pendencia::%"),
            Alert.status != "RESOLVIDO",
        )
    ).all()
    for fp in pend_fps:
        pend_id = fp.split("::")[-1]
        pend = db.get(VehiclePendencia, pend_id)
        if pend and pend.resolved_at is not None:
            _resolve(fp)

    db.commit()


def generate_auto_alerts(db: Session) -> list[Alert]:
    from app.core.config import get_settings
    from app.core.email import send_alert_email

    now = datetime.now(timezone.utc)
    created: list[Alert] = []

    def _tz(dt):
        if dt is None:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    # Build fingerprint set from existing unresolved auto alerts
    existing_auto = db.scalars(
        select(Alert).where(Alert.status != "RESOLVIDO", Alert.observacao.like("auto::%"))
    ).all()
    fps: set[str] = {a.observacao for a in existing_auto if a.observacao}

    def _new(fp: str) -> bool:
        return fp not in fps

    def _add(fp: str, **kw) -> Alert:
        a = Alert(observacao=fp, status="PENDENTE", **kw)
        db.add(a)
        fps.add(fp)
        created.append(a)
        return a

    # ── Vehicles (base query with driver) ────────────────────────────────
    vehicles = db.scalars(
        select(Vehicle).options(joinedload(Vehicle.motorista))
    ).unique().all()
    driver_to_vehicle: dict[str, Vehicle] = {}
    for v in vehicles:
        if v.motorista_id and v.motorista_id not in driver_to_vehicle:
            driver_to_vehicle[v.motorista_id] = v

    # ── CNH dos motoristas ───────────────────────────────────────────────
    drivers = db.scalars(select(Driver)).all()
    for drv in drivers:
        exp = _tz(drv.cnh_vencimento)
        if not exp:
            continue
        days = (exp - now).days
        fp = f"auto::cnh::{drv.id}"
        linked = driver_to_vehicle.get(drv.id)
        v_id = linked.id if linked else None
        km = linked.km if linked else 0
        if days < 0 and _new(fp):
            _add(fp, vehicle_id=v_id, tipo="documento", km=km, responsavel=drv.nome,
                titulo=f"CNH vencida — {drv.nome}",
                mensagem=f"A CNH do motorista {drv.nome} venceu há {abs(days)} dia(s). Regularize imediatamente.",
                prioridade="CRITICO", acao="Regularizar CNH junto ao DETRAN")
        elif 0 <= days <= 15 and _new(fp):
            _add(fp, vehicle_id=v_id, tipo="documento", km=km, responsavel=drv.nome,
                titulo=f"CNH vence em {days} dia(s) — {drv.nome}",
                mensagem=f"A CNH do motorista {drv.nome} vence em {days} dia(s). Providencie a renovação.",
                prioridade="CRITICO", acao="Iniciar processo de renovação da CNH")
        elif 15 < days <= 30 and _new(fp):
            _add(fp, vehicle_id=v_id, tipo="documento", km=km, responsavel=drv.nome,
                titulo=f"CNH vence em {days} dia(s) — {drv.nome}",
                mensagem=f"A CNH do motorista {drv.nome} vence em {days} dia(s). Planeje a renovação.",
                prioridade="MEDIO", acao="Agendar renovação da CNH")

    # ── CRLV, Seguro, Revisão km/data por veículo ────────────────────────
    for v in vehicles:
        lbl = f"{v.modelo} ({v.placa})"
        resp = v.motorista.nome if v.motorista else None

        # CRLV
        exp = _tz(v.vencimento_crlv)
        if exp:
            days = (exp - now).days
            fp = f"auto::crlv::{v.id}"
            if days < 0 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="documento", km=v.km, responsavel=resp,
                    titulo=f"CRLV vencido — {lbl}",
                    mensagem=f"O CRLV do veículo {lbl} venceu há {abs(days)} dia(s). Regularize imediatamente.",
                    prioridade="CRITICO", acao="Licenciar o veículo junto ao DETRAN")
            elif 0 <= days <= 15 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="documento", km=v.km, responsavel=resp,
                    titulo=f"CRLV vence em {days} dia(s) — {lbl}",
                    mensagem=f"O CRLV do veículo {lbl} vence em {days} dia(s). Providencie o licenciamento.",
                    prioridade="CRITICO", acao="Providenciar licenciamento do veículo")
            elif 15 < days <= 30 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="vencimento", km=v.km, responsavel=resp,
                    titulo=f"CRLV vence em {days} dia(s) — {lbl}",
                    mensagem=f"O CRLV do veículo {lbl} vence em {days} dia(s). Planeje o licenciamento.",
                    prioridade="MEDIO", acao="Agendar licenciamento do veículo")

        # Seguro
        exp = _tz(v.vencimento_seguro)
        if exp:
            days = (exp - now).days
            fp = f"auto::seguro::{v.id}"
            if days < 0 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="seguro", km=v.km, responsavel=resp,
                    titulo=f"Seguro vencido — {lbl}",
                    mensagem=f"O seguro do veículo {lbl} venceu há {abs(days)} dia(s). Renove imediatamente.",
                    prioridade="CRITICO", acao="Contratar novo seguro para o veículo")
            elif 0 <= days <= 15 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="seguro", km=v.km, responsavel=resp,
                    titulo=f"Seguro vence em {days} dia(s) — {lbl}",
                    mensagem=f"O seguro do veículo {lbl} vence em {days} dia(s). Renove urgentemente.",
                    prioridade="CRITICO", acao="Renovar o seguro do veículo")
            elif 15 < days <= 30 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="seguro", km=v.km, responsavel=resp,
                    titulo=f"Seguro vence em {days} dia(s) — {lbl}",
                    mensagem=f"O seguro do veículo {lbl} vence em {days} dia(s). Planeje a renovação.",
                    prioridade="MEDIO", acao="Solicitar proposta de renovação do seguro")

        # Revisão por km
        if v.proxima_revisao_km is not None:
            diff = v.proxima_revisao_km - v.km
            fp = f"auto::revisao_km::{v.id}"
            if diff <= 0 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="revisao", km=v.km, responsavel=resp,
                    titulo=f"Revisão km vencida — {lbl}",
                    mensagem=f"O veículo {lbl} ultrapassou o km de revisão ({v.km:,} km / previsto {v.proxima_revisao_km:,} km).",
                    prioridade="CRITICO", acao="Agendar revisão imediatamente")
            elif 0 < diff <= 2000 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="revisao", km=v.km, responsavel=resp,
                    titulo=f"Revisão km próxima — {lbl}",
                    mensagem=f"O veículo {lbl} está a {diff:,} km da revisão programada ({v.proxima_revisao_km:,} km).",
                    prioridade="MEDIO", acao="Agendar revisão preventiva")

        # Revisão por data
        exp = _tz(v.proxima_revisao_data)
        if exp:
            days = (exp - now).days
            fp = f"auto::revisao_data::{v.id}"
            if days < 0 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="revisao", km=v.km, responsavel=resp,
                    titulo=f"Revisão vencida — {lbl}",
                    mensagem=f"A revisão do veículo {lbl} estava prevista para {exp.strftime('%d/%m/%Y')} e não foi realizada.",
                    prioridade="CRITICO", acao="Agendar revisão imediatamente")
            elif 0 <= days <= 7 and _new(fp):
                _add(fp, vehicle_id=v.id, tipo="revisao", km=v.km, responsavel=resp,
                    titulo=f"Revisão em {days} dia(s) — {lbl}",
                    mensagem=f"A revisão do veículo {lbl} está prevista para {exp.strftime('%d/%m/%Y')}.",
                    prioridade="MEDIO", acao="Confirmar agendamento da revisão")

    # ── Manutenções vencidas ─────────────────────────────────────────────
    overdue_m = db.scalars(
        select(Maintenance).options(
            joinedload(Maintenance.vehicle).joinedload(Vehicle.motorista)
        ).where(
            Maintenance.status.in_(["PENDENTE", "AGENDADA"]),
            Maintenance.data < now,
        )
    ).unique().all()
    for m in overdue_m:
        fp = f"auto::manutencao::{m.id}"
        if not _new(fp):
            continue
        v = m.vehicle
        lbl = f"{v.modelo} ({v.placa})" if v else "Veículo"
        m_data = _tz(m.data)
        overdue_days = (now - m_data).days if m_data else 0
        _add(fp, vehicle_id=m.vehicle_id, tipo="manutencao", km=m.km,
            titulo=f"Manutenção atrasada — {lbl}",
            mensagem=f"Manutenção {m.tipo} do veículo {lbl} está atrasada há {overdue_days} dia(s): {m.descricao[:80]}",
            prioridade="CRITICO" if overdue_days > 7 else "MEDIO",
            acao="Realizar manutenção ou reagendar",
            responsavel=m.mecanico or (v.motorista.nome if v and v.motorista else None))

    # ── Agendamentos vencidos ────────────────────────────────────────────
    overdue_a = db.scalars(
        select(Appointment).options(
            joinedload(Appointment.vehicle).joinedload(Vehicle.motorista)
        ).where(
            Appointment.status.in_(["AGENDADO", "CONFIRMADO"]),
            Appointment.data < now,
        )
    ).unique().all()
    for appt in overdue_a:
        fp = f"auto::agendamento::{appt.id}"
        if not _new(fp):
            continue
        v = appt.vehicle
        lbl = f"{v.modelo} ({v.placa})" if v else "Veículo"
        a_data = _tz(appt.data)
        overdue_days = (now - a_data).days if a_data else 0
        _add(fp, vehicle_id=appt.vehicle_id, tipo="manutencao", km=appt.km,
            titulo=f"Agendamento não realizado — {lbl}",
            mensagem=f"Agendamento de {appt.tipo} do veículo {lbl} não foi concluído. Venceu há {overdue_days} dia(s).",
            prioridade="CRITICO" if overdue_days > 1 else "MEDIO",
            acao="Reagendar ou marcar como concluído",
            responsavel=appt.responsavel or (v.motorista.nome if v and v.motorista else None))

    # ── Rotas em andamento além do prazo ─────────────────────────────────
    overdue_r = db.scalars(
        select(Route).options(
            joinedload(Route.vehicle).joinedload(Vehicle.motorista),
            joinedload(Route.motorista),
        ).where(
            Route.status == "EM_ANDAMENTO",
            Route.data_fim.isnot(None),
            Route.data_fim < now,
        )
    ).unique().all()
    for route in overdue_r:
        fp = f"auto::rota::{route.id}"
        if not _new(fp):
            continue
        v = route.vehicle
        lbl = f"{v.modelo} ({v.placa})" if v else "Veículo"
        motorista_nome = (route.motorista.nome if route.motorista else
                         (v.motorista.nome if v and v.motorista else None))
        _add(fp, vehicle_id=route.vehicle_id, tipo="documento",
            km=v.km if v else 0, responsavel=motorista_nome,
            titulo=f"Rota atrasada — {lbl}",
            mensagem=f"A rota de {route.origem} → {route.destino} está além do prazo previsto.",
            prioridade="CRITICO", acao="Verificar status da entrega e contatar motorista")

    # ── Pendências de veículos ───────────────────────────────────────────
    for v in vehicles:
        pendencias = db.scalars(
            select(VehiclePendencia).where(
                VehiclePendencia.vehicle_id == v.id,
                VehiclePendencia.resolved_at.is_(None),
            )
        ).all()
        for p in pendencias:
            fp = f"auto::pendencia::{p.id}"
            if not _new(fp):
                continue
            tipo = "manutencao" if any(k in p.slug.lower() for k in ("manut", "oleo", "troca")) else "documento"
            _add(fp, vehicle_id=v.id, tipo=tipo, km=v.km,
                titulo=p.label,
                mensagem=p.detail or p.label,
                prioridade="CRITICO" if p.tone.upper() == "RED" else "MEDIO",
                acao="Verificar e resolver pendência",
                responsavel=v.motorista.nome if v.motorista else None)

    db.commit()
    for a in created:
        db.refresh(a)

    # ── Reconciliar: resolver alertas cujas condições já não se aplicam ──
    _reconcile_auto_alerts(db, vehicles, drivers, now)

    # ── Enviar e-mail para alertas críticos novos ────────────────────────
    criticos = [a for a in created if a.prioridade == "CRITICO"]
    if criticos:
        try:
            settings = get_settings()
            admins = db.scalars(select(User).where(User.is_active.is_(True))).all()
            alerts_data = [
                {"titulo": a.titulo, "mensagem": a.mensagem, "prioridade": a.prioridade}
                for a in criticos
            ]
            for admin in admins:
                send_alert_email(admin.email, alerts_data, settings)
            for a in criticos:
                a.email_enviado = True
                db.add(a)
            db.commit()
        except Exception:
            pass

    return created


def list_notifications(db: Session, search: str | None = None, page: int = 1, limit: int = 25, user_id: str | None = None, is_read: bool | None = None, tipo: str | None = None, prioridade: str | None = None):
    query = select(Notification)
    if user_id:
        query = query.where(Notification.user_id == user_id)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    if tipo and tipo.lower() != "todos":
        query = query.where(Notification.tipo == tipo.upper())
    if prioridade and prioridade.lower() != "todas":
        query = query.where(Notification.prioridade == prioridade.upper())
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Notification.titulo.ilike(term)) | (Notification.mensagem.ilike(term)) | (Notification.tipo.ilike(term)))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Notification.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return items, total, {"page": page, "limit": limit}


def count_unread_notifications(db: Session, user_id: str) -> int:
    return db.scalar(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
    ) or 0


def mark_all_notifications_read(db: Session, user_id: str) -> int:
    now = datetime.now(timezone.utc)
    rows = db.scalars(
        select(Notification).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
    ).all()
    for n in rows:
        n.is_read = True
        n.lida_em = now
        db.add(n)
    db.commit()
    return len(rows)


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
        prioridade=data.get("prioridade") or "MEDIA",
        is_read=bool(data.get("isRead", False)),
        referencia_tipo=data.get("referenciaTipo"),
        referencia_id=data.get("referenciaId"),
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
        "prioridade": "prioridade",
        "userId": "user_id",
        "alertId": "alert_id",
        "referenciaTipo": "referencia_tipo",
        "referenciaId": "referencia_id",
        "payloadJson": "payload_json",
        "isRead": "is_read",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    if data.get("isRead") is True and item.lida_em is None:
        item.lida_em = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_notification(db: Session, item: Notification) -> None:
    db.delete(item)
    db.commit()


# ── Rotas ────────────────────────────────────────────────────────────────────

def list_routes(db: Session, search: str | None = None, status_value: str | None = None, vehicle_id: str | None = None, page: int = 1, limit: int = 25):
    query = select(Route).options(joinedload(Route.vehicle).joinedload(Vehicle.motorista), joinedload(Route.motorista))
    if search:
        term = f"%{search.strip()}%"
        query = query.where((Route.origem.ilike(term)) | (Route.destino.ilike(term)))
    if status_value and status_value.lower() != "todos":
        query = query.where(Route.status == status_value.upper())
    if vehicle_id:
        query = query.where(Route.vehicle_id == vehicle_id)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.order_by(Route.created_at.desc()).offset((page - 1) * limit).limit(limit)).unique().all()
    return items, total, {"page": page, "limit": limit}


def get_route(db: Session, route_id: str) -> Route:
    item = db.scalar(select(Route).options(joinedload(Route.vehicle).joinedload(Vehicle.motorista), joinedload(Route.motorista)).where(Route.id == route_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rota não encontrada")
    return item


def _sync_vehicle_driver_status(db: Session, route: Route, old_status: str, new_status: str) -> None:
    """Keep vehicle and driver status in sync with route status transitions."""
    old = (old_status or "").upper()
    new = (new_status or "").upper()

    if new == "EM_ANDAMENTO" and old != "EM_ANDAMENTO":
        if route.vehicle_id:
            v = db.get(Vehicle, route.vehicle_id)
            if v:
                v.status = "EM_ROTA"
                db.add(v)
        drv_id = route.motorista_id
        if drv_id:
            d = db.get(Driver, drv_id)
            if d:
                d.status = "EM_ROTA"
                db.add(d)

    elif new in ("CONCLUIDA", "CANCELADA") and old == "EM_ANDAMENTO":
        if route.vehicle_id:
            other_active = db.scalar(
                select(func.count()).select_from(Route).where(
                    Route.vehicle_id == route.vehicle_id,
                    Route.status == "EM_ANDAMENTO",
                    Route.id != route.id,
                )
            ) or 0
            if other_active == 0:
                v = db.get(Vehicle, route.vehicle_id)
                if v and v.status == "EM_ROTA":
                    v.status = "ATIVO"
                    db.add(v)
        drv_id = route.motorista_id
        if drv_id:
            other_driver = db.scalar(
                select(func.count()).select_from(Route).where(
                    Route.motorista_id == drv_id,
                    Route.status == "EM_ANDAMENTO",
                    Route.id != route.id,
                )
            ) or 0
            if other_driver == 0:
                d = db.get(Driver, drv_id)
                if d and d.status == "EM_ROTA":
                    d.status = "DISPONIVEL"
                    db.add(d)


def create_route(db: Session, data: dict) -> Route:
    vehicle = _find_vehicle(db, data["veiculoId"])
    motorista_id = data.get("motoristaId") or vehicle.motorista_id or None
    route_status = (data.get("status") or "PENDENTE").upper()
    if route_status == "EM_ANDAMENTO" and not motorista_id:
        raise HTTPException(status_code=422, detail="Uma rota em andamento requer motorista designado")
    item = Route(
        vehicle_id=vehicle.id,
        motorista_id=motorista_id,
        origem=data["origem"].strip(),
        destino=data["destino"].strip(),
        status=route_status,
        data_inicio=data.get("dataInicio"),
        data_fim=data.get("dataFim"),
        distancia_km=data.get("distanciaKm"),
        observacoes=data.get("observacoes") or None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    _sync_vehicle_driver_status(db, item, "PENDENTE", route_status)
    db.commit()
    db.refresh(item)
    # SPEC 06: regenerate auto-alerts after route creation
    try:
        generate_auto_alerts(db)
    except Exception:
        pass
    return item


def update_route(db: Session, item: Route, data: dict) -> Route:
    old_status = item.status or "PENDENTE"
    if data.get("veiculoId"):
        item.vehicle_id = _find_vehicle(db, data["veiculoId"]).id
    mapping = {
        "motoristaId": "motorista_id",
        "origem": "origem",
        "destino": "destino",
        "status": "status",
        "dataInicio": "data_inicio",
        "dataFim": "data_fim",
        "distanciaKm": "distancia_km",
        "observacoes": "observacoes",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(item, field, data[key])
    new_status = (item.status or "PENDENTE").upper()
    if new_status == "EM_ANDAMENTO" and not item.motorista_id:
        raise HTTPException(status_code=422, detail="Uma rota em andamento requer motorista designado")
    if item.status == "EM_ANDAMENTO" and item.data_inicio is None:
        item.data_inicio = datetime.now(timezone.utc)
    if item.status in ("CONCLUIDA", "CANCELADA") and item.data_fim is None:
        item.data_fim = datetime.now(timezone.utc)
    db.add(item)
    db.commit()
    db.refresh(item)
    _sync_vehicle_driver_status(db, item, old_status, new_status)
    db.commit()
    db.refresh(item)
    # SPEC 06: regenerate auto-alerts after route update
    try:
        generate_auto_alerts(db)
    except Exception:
        pass
    return item


def delete_route(db: Session, item: Route) -> None:
    was_active = item.status == "EM_ANDAMENTO"
    db.delete(item)
    db.commit()
    # SPEC 06: if the deleted route was active, reconcile statuses
    if was_active:
        try:
            from app.services.reconciliation_service import reconcile_route_statuses
            reconcile_route_statuses(db)
            generate_auto_alerts(db)
        except Exception:
            pass
