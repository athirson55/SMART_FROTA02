from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.services.reports_service import costs_report, dashboard_report, fleet_report

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


@router.get("/dashboard")
def read_dashboard_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de dashboard gerado com sucesso", dashboard_report(db))


@router.get("/frota")
def read_fleet_report(search: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de frota gerado com sucesso", fleet_report(db, search=search))


@router.get("/custos")
def read_costs_report(search: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de custos gerado com sucesso", costs_report(db, search=search))
