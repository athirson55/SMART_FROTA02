from fastapi import APIRouter

from app.core.responses import success_response

router = APIRouter(tags=["Health"])


@router.get("/health")
def healthcheck():
    return success_response("API funcionando", {"status": "ok"})
