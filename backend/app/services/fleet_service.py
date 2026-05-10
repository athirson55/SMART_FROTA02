from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.fleet import Driver, Vehicle, VehiclePendencia


def normalize_text(value: str | None) -> str:
    return (value or "").strip()


def serialize_driver(driver: Driver) -> dict:
    return {
        "id": driver.id,
        "nome": driver.nome,
        "email": driver.email,
        "telefone": driver.telefone,
        "cnh": driver.cnh,
        "cnhCategoria": driver.cnh_categoria,
        "cnhVencimento": driver.cnh_vencimento,
        "status": driver.status,
        "cargo": driver.cargo,
        "avatarCor": driver.avatar_cor,
        "createdAt": driver.created_at,
        "updatedAt": driver.updated_at,
    }


def serialize_vehicle(vehicle: Vehicle, include_driver: bool = True, include_pendencias: bool = False) -> dict:
    payload = {
        "id": vehicle.id,
        "modelo": vehicle.modelo,
        "marca": vehicle.marca,
        "placa": vehicle.placa,
        "ano": vehicle.ano,
        "status": vehicle.status,
        "combustivel": vehicle.combustivel,
        "chassi": vehicle.chassi,
        "km": vehicle.km,
        "capacidade": vehicle.capacidade,
        "tipoVeiculo": vehicle.tipo_veiculo,
        "motoristaId": vehicle.motorista_id,
        "vencimentoCRLV": vehicle.vencimento_crlv,
        "vencimentoSeguro": vehicle.vencimento_seguro,
        "proximaRevisaoKm": vehicle.proxima_revisao_km,
        "proximaRevisaoData": vehicle.proxima_revisao_data,
        "createdAt": vehicle.created_at,
        "updatedAt": vehicle.updated_at,
    }
    if include_driver:
        payload["motorista"] = serialize_driver(vehicle.motorista) if vehicle.motorista else None
        payload["driver"] = vehicle.motorista.nome if vehicle.motorista else None
    if include_pendencias:
        payload["pendencias"] = [serialize_pendencia(p) for p in vehicle.pendencias if p.resolved_at is None]
    return payload


def serialize_pendencia(pendencia: VehiclePendencia) -> dict:
    return {
        "id": pendencia.id,
        "slug": pendencia.slug,
        "label": pendencia.label,
        "detail": pendencia.detail,
        "tone": pendencia.tone,
        "sourceType": pendencia.source_type,
        "sourceId": pendencia.source_id,
        "resolvedAt": pendencia.resolved_at,
        "createdAt": pendencia.created_at,
        "updatedAt": pendencia.updated_at,
    }


def _paginate_query(query, page: int, limit: int):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    offset = (page - 1) * limit
    return query.offset(offset).limit(limit), {"page": page, "limit": limit}


def list_drivers(db: Session, search: str | None = None, status_value: str | None = None, page: int = 1, limit: int = 25):
    query = select(Driver)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            (Driver.nome.ilike(term))
            | (Driver.email.ilike(term))
            | (Driver.cnh.ilike(term))
            | (Driver.cargo.ilike(term))
        )
    if status_value and status_value.lower() != "todos":
        query = query.where(Driver.status == status_value)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    paginated_query, meta = _paginate_query(query.order_by(Driver.created_at.desc()), page, limit)
    drivers = db.scalars(paginated_query).all()
    return drivers, total, meta


def get_driver(db: Session, driver_id: str) -> Driver:
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Motorista não encontrado")
    return driver


def create_driver(db: Session, data: dict) -> Driver:
    email = normalize_text(data["email"]).lower()
    cnh = normalize_text(data["cnh"])
    if db.scalar(select(Driver).where(Driver.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
    if db.scalar(select(Driver).where(Driver.cnh == cnh)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CNH já cadastrada")
    driver = Driver(
        nome=normalize_text(data["nome"]),
        email=email,
        telefone=normalize_text(data.get("telefone")) or None,
        cnh=cnh,
        cnh_categoria=normalize_text(data.get("cnhCategoria")) or "D",
        cnh_vencimento=data.get("cnhVencimento"),
        status=normalize_text(data.get("status")) or "DISPONIVEL",
        cargo=normalize_text(data.get("cargo")) or "Motorista",
        avatar_cor=normalize_text(data.get("avatarCor")) or None,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def update_driver(db: Session, driver: Driver, data: dict) -> Driver:
    if data.get("email"):
        email = normalize_text(data["email"]).lower()
        existing = db.scalar(select(Driver).where(Driver.email == email, Driver.id != driver.id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
        driver.email = email
    if data.get("cnh"):
        cnh = normalize_text(data["cnh"])
        existing = db.scalar(select(Driver).where(Driver.cnh == cnh, Driver.id != driver.id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CNH já cadastrada")
        driver.cnh = cnh
    mapping = {
        "nome": "nome",
        "telefone": "telefone",
        "cnhCategoria": "cnh_categoria",
        "cnhVencimento": "cnh_vencimento",
        "status": "status",
        "cargo": "cargo",
        "avatarCor": "avatar_cor",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(driver, field, normalize_text(data[key]) if isinstance(data[key], str) else data[key])
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def delete_driver(db: Session, driver: Driver) -> None:
    db.delete(driver)
    db.commit()


def list_vehicles(db: Session, search: str | None = None, status_value: str | None = None, page: int = 1, limit: int = 25):
    query = select(Vehicle).options(joinedload(Vehicle.motorista), joinedload(Vehicle.pendencias))
    if search:
        term = f"%{search.strip()}%"
        query = query.where(
            (Vehicle.modelo.ilike(term))
            | (Vehicle.marca.ilike(term))
            | (Vehicle.placa.ilike(term))
            | (Vehicle.chassi.ilike(term))
        )
    if status_value and status_value.lower() != "todos":
        query = query.where(Vehicle.status == status_value)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    paginated_query, meta = _paginate_query(query.order_by(Vehicle.created_at.desc()), page, limit)
    vehicles = db.scalars(paginated_query).unique().all()
    return vehicles, total, meta


def get_vehicle(db: Session, vehicle_id: str) -> Vehicle:
    vehicle = db.scalar(select(Vehicle).options(joinedload(Vehicle.motorista), joinedload(Vehicle.pendencias)).where(Vehicle.id == vehicle_id))
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado")
    return vehicle


def _validate_vehicle_uniques(db: Session, *, placa: str | None = None, chassi: str | None = None, vehicle_id: str | None = None):
    if placa:
        existing = db.scalar(select(Vehicle).where(Vehicle.placa == placa, Vehicle.id != vehicle_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Placa já cadastrada")
    if chassi:
        existing = db.scalar(select(Vehicle).where(Vehicle.chassi == chassi, Vehicle.id != vehicle_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Chassi já cadastrado")


def create_vehicle(db: Session, data: dict) -> Vehicle:
    placa = normalize_text(data["placa"]).upper().replace("-", "").replace(" ", "")
    chassi = normalize_text(data.get("chassi")) or None
    motorista_id = data.get("motoristaId") or None
    _validate_vehicle_uniques(db, placa=placa, chassi=chassi)
    vehicle = Vehicle(
        modelo=normalize_text(data["modelo"]),
        marca=normalize_text(data.get("marca")) or None,
        placa=placa,
        ano=data.get("ano"),
        status=normalize_text(data.get("status")) or "ATIVO",
        combustivel=normalize_text(data.get("combustivel")) or None,
        chassi=chassi,
        km=int(data.get("km") or 0),
        capacidade=normalize_text(data.get("capacidade")) or None,
        tipo_veiculo=normalize_text(data.get("tipoVeiculo")) or None,
        motorista_id=motorista_id,
        vencimento_crlv=data.get("vencimentoCRLV"),
        vencimento_seguro=data.get("vencimentoSeguro"),
        proxima_revisao_km=data.get("proximaRevisaoKm"),
        proxima_revisao_data=data.get("proximaRevisaoData"),
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle: Vehicle, data: dict) -> Vehicle:
    if data.get("placa"):
        placa = normalize_text(data["placa"]).upper().replace("-", "").replace(" ", "")
        _validate_vehicle_uniques(db, placa=placa, vehicle_id=vehicle.id)
        vehicle.placa = placa
    if data.get("chassi") is not None:
        chassi = normalize_text(data.get("chassi")) or None
        _validate_vehicle_uniques(db, chassi=chassi, vehicle_id=vehicle.id)
        vehicle.chassi = chassi
    mapping = {
        "modelo": "modelo",
        "marca": "marca",
        "ano": "ano",
        "status": "status",
        "combustivel": "combustivel",
        "km": "km",
        "capacidade": "capacidade",
        "tipoVeiculo": "tipo_veiculo",
        "motoristaId": "motorista_id",
        "vencimentoCRLV": "vencimento_crlv",
        "vencimentoSeguro": "vencimento_seguro",
        "proximaRevisaoKm": "proxima_revisao_km",
        "proximaRevisaoData": "proxima_revisao_data",
    }
    for key, field in mapping.items():
        if key in data and data[key] is not None:
            setattr(vehicle, field, data[key])
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle: Vehicle) -> None:
    db.delete(vehicle)
    db.commit()


def list_vehicle_pendencias(db: Session, vehicle_id: str):
    pendencias = db.scalars(select(VehiclePendencia).where(VehiclePendencia.vehicle_id == vehicle_id).order_by(VehiclePendencia.created_at.desc())).all()
    return pendencias


def add_vehicle_pendencia(db: Session, vehicle: Vehicle, data: dict) -> VehiclePendencia:
    pendencia = VehiclePendencia(
        vehicle_id=vehicle.id,
        slug=normalize_text(data["slug"]),
        label=normalize_text(data["label"]),
        detail=normalize_text(data.get("detail")) or None,
        tone=normalize_text(data.get("tone")) or "AMBER",
        source_type=normalize_text(data.get("sourceType")) or None,
        source_id=normalize_text(data.get("sourceId")) or None,
    )
    db.add(pendencia)
    db.commit()
    db.refresh(pendencia)
    return pendencia


def remove_vehicle_pendencia(db: Session, vehicle: Vehicle, pendencia_id: str) -> None:
    pendencia = db.scalar(select(VehiclePendencia).where(VehiclePendencia.vehicle_id == vehicle.id, VehiclePendencia.id == pendencia_id))
    if not pendencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pendência não encontrada")
    db.delete(pendencia)
    db.commit()
