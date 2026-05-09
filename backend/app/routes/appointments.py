from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.schemas.operations import AppointmentCreate, AppointmentUpdate
from app.services.operations_service import (
    appointments_stats,
    create_appointment,
    delete_appointment,
    get_appointment,
    list_appointments,
    serialize_appointment,
    update_appointment,
)

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])


@router.get("")
def read_appointments(search: str | None = None, status: str | None = None, page: int = Query(default=1, ge=1), limit: int = Query(default=25, ge=1, le=100), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items, total, meta = list_appointments(db, search=search, status_value=status, page=page, limit=limit)
    return success_response("Agendamentos listados com sucesso", [serialize_appointment(item) for item in items], meta={**meta, "total": total})


@router.get("/stats")
def read_appointment_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Estatísticas carregadas com sucesso", appointments_stats(db))


@router.get("/{appointment_id}")
def read_appointment(appointment_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_appointment(db, appointment_id)
    return success_response("Agendamento encontrado", serialize_appointment(item))


@router.post("")
def create_appointment_route(payload: AppointmentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = create_appointment(db, payload.model_dump())
    return success_response("Agendamento criado com sucesso", serialize_appointment(item), status_code=201)


@router.put("/{appointment_id}")
@router.patch("/{appointment_id}")
def update_appointment_route(appointment_id: str, payload: AppointmentUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_appointment(db, appointment_id)
    item = update_appointment(db, item, payload.model_dump(exclude_unset=True))
    return success_response("Agendamento atualizado com sucesso", serialize_appointment(item))


@router.delete("/{appointment_id}")
def delete_appointment_route(appointment_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    item = get_appointment(db, appointment_id)
    delete_appointment(db, item)
    return success_response("Agendamento removido com sucesso", {"deleted": True})
