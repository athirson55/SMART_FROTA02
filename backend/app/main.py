from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.database.init_db import seed_database
from app.database.session import SessionLocal, create_tables
from app.middlewares.rate_limit import SimpleRateLimitMiddleware
from app.routes import alerts, appointments, auth, drivers, health, maintenances, notifications, reports, settings as settings_routes, users, vehicles
import re
import os

app_settings = get_settings()
logger = logging.getLogger(__name__)

if app_settings.environment == "production" and app_settings.secret_key == "change-me":
    raise RuntimeError("SECRET_KEY deve ser configurada em produção. Defina a variável de ambiente SECRET_KEY.")

auth_limit = int(app_settings.rate_limit_auth.split("/")[0])
if app_settings.environment == "development":
    auth_limit = max(auth_limit, 1000)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log database host/port (mascarado) para facilitar debugging no Render
    try:
        db_url = app_settings.database_url or os.getenv("DATABASE_URL", "")
        m = re.search(r"@([^:/]+)(?::([0-9]+))?", db_url)
        host = m.group(1) if m else "(unknown)"
        port = m.group(2) if m and m.group(2) else "(default)"
        logger.info("DATABASE_URL host=%s port=%s", host, port)
    except Exception:
        logger.warning("Falha ao analisar DATABASE_URL para debug")
    if app_settings.auto_create_tables:
        try:
            create_tables()
        except Exception as exc:
            logger.warning("Nao foi possivel criar as tabelas no startup: %s", exc)
    if app_settings.seed_on_startup:
        try:
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
        except Exception as exc:
            logger.warning("Nao foi possivel semear o banco no startup: %s", exc)
    yield


app = FastAPI(
    title=app_settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SimpleRateLimitMiddleware,
    paths={
        "/auth/login",
        "/auth/registrar",
        "/auth/refresh",
        "/auth/recuperar-senha",
        "/auth/redefinir-senha",
        "/auth/verificar-email",
        "/auth/reenviar-verificacao",
    },
    limit=auth_limit,
    window_seconds=60,
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail), "data": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Erro de validação", "data": exc.errors()},
    )


@app.get("/")
def root():
    return {"success": True, "message": "Smart Frota API online", "data": {"docs": "/docs"}}


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(drivers.router)
app.include_router(vehicles.router)
app.include_router(maintenances.router)
app.include_router(appointments.router)
app.include_router(alerts.router)
app.include_router(notifications.router)
app.include_router(settings_routes.router)
app.include_router(reports.router)
