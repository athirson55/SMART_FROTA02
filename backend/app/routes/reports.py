from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.responses import success_response
from app.database.session import get_db
from app.services.reports_service import complete_report, costs_report, dashboard_report, export_excel, fleet_report

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])


@router.get("/completo")
def read_complete_report(
    dias: int = Query(default=30, ge=7, le=365),
    veiculo_id: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return success_response("Relatório completo gerado com sucesso", complete_report(db, dias=dias, veiculo_id=veiculo_id))


@router.get("/dashboard")
def read_dashboard_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de dashboard gerado com sucesso", dashboard_report(db))


@router.get("/frota")
def read_fleet_report(search: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de frota gerado com sucesso", fleet_report(db, search=search))


@router.get("/custos")
def read_costs_report(search: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response("Relatório de custos gerado com sucesso", costs_report(db, search=search))


@router.get("/exportar-excel")
def export_excel_report(
    dias: int = Query(default=30, ge=7, le=365),
    veiculo_id: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from datetime import datetime
    filename = f"smart-frota-relatorio-{datetime.utcnow().strftime('%Y-%m-%d')}.xlsx"
    content = export_excel(db, dias=dias, veiculo_id=veiculo_id)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
