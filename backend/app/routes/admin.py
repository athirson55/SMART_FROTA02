from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import require_admin
from app.core.responses import success_response
from app.database.session import get_db
from app.services.reconciliation_service import run_full_reconciliation

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/reconciliar")
def reconcile(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Reconcile historical inconsistencies between routes, vehicles, drivers and alerts."""
    stats = run_full_reconciliation(db)
    return success_response("Reconciliação concluída com sucesso", stats)
