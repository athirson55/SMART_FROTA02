from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.database.init_db import seed_database
from app.database.session import SessionLocal, create_tables
from app.middlewares.rate_limit import SimpleRateLimitMiddleware
from app.routes import alerts, appointments, auth, drivers, health, maintenances, notifications, reports, settings as settings_routes, users, vehicles

app_settings = get_settings()

app = FastAPI(
    title=app_settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
    paths={"/auth/login", "/auth/registrar", "/auth/refresh", "/auth/recuperar-senha"},
    limit=int(app_settings.rate_limit_auth.split("/")[0]),
    window_seconds=60,
)


@app.on_event("startup")
def on_startup() -> None:
    if app_settings.auto_create_tables:
        create_tables()
    if app_settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()


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
