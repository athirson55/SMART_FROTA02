"""
SDD-013 — API and Security Tests

Coverage:
- Registration (role enforcement)
- Login / token issue
- Refresh token rotation (old token invalid after refresh)
- RBAC: USER blocked from admin endpoints (403)
- RBAC: ADMIN allowed on admin endpoints
- IDOR: user cannot access another user's notifications (403)
- Notification ownership: cannot create for another user
- Route validation: negative distance → 422
- Route validation: numeric-only address → 422
- Settings: USER blocked from PATCH /configuracoes (403)
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("ENVIRONMENT", "development")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.database.session import get_db
from app.models.base import Base


# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def client(db):
    from app.main import app
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app, raise_server_exceptions=True)
    app.dependency_overrides.clear()


def _create_user(db, email: str, role: str = "USER", nome: str = "Test User"):
    """Create an active user directly, bypassing email verification."""
    from app.services.auth_service import register_user
    user, _ = register_user(
        db,
        nome=nome,
        email=email,
        senha="Test@1234!",
        role=role,
        skip_verification=True,
    )
    return user


def _get_token(client, email: str, senha: str = "Test@1234!") -> str:
    res = client.post("/auth/login", json={"email": email, "senha": senha})
    assert res.status_code == 200, res.text
    return res.json()["data"]["token"]


def _get_refresh_token(client, email: str, senha: str = "Test@1234!") -> str:
    res = client.post("/auth/login", json={"email": email, "senha": senha})
    assert res.status_code == 200
    return res.json()["data"]["refreshToken"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────────────────────────────────────
# 1. Registration — new user must receive USER role
# ──────────────────────────────────────────────────────────────────────────────

def test_registration_creates_user_role(client, db):
    res = client.post(
        "/auth/registrar",
        json={"nome": "Novo", "email": "novo@test.com", "senha": "Novo@1234!"},
    )
    assert res.status_code == 200
    from app.services.auth_service import get_user_by_email
    user = get_user_by_email(db, "novo@test.com")
    assert user is not None
    assert user.role == "USER", f"Expected USER, got {user.role}"


# ──────────────────────────────────────────────────────────────────────────────
# 2. Login — valid credentials return tokens
# ──────────────────────────────────────────────────────────────────────────────

def test_login_returns_tokens(client, db):
    _create_user(db, "login@test.com")
    res = client.post("/auth/login", json={"email": "login@test.com", "senha": "Test@1234!"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert "token" in data
    assert "refreshToken" in data


# ──────────────────────────────────────────────────────────────────────────────
# 3. Refresh token rotation — old refresh token becomes invalid
# ──────────────────────────────────────────────────────────────────────────────

def test_refresh_token_rotation(client, db):
    _create_user(db, "refresh@test.com")
    old_refresh = _get_refresh_token(client, "refresh@test.com")

    # Use old refresh → get new tokens
    res = client.post("/auth/refresh", json={"refreshToken": old_refresh})
    assert res.status_code == 200
    new_refresh = res.json()["data"]["refreshToken"]
    assert new_refresh != old_refresh, "New refresh token must differ from old one"

    # Old token must be rejected now
    res2 = client.post("/auth/refresh", json={"refreshToken": old_refresh})
    assert res2.status_code == 401, f"Old refresh token should be revoked, got {res2.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 4. RBAC — USER cannot call admin-only endpoints
# ──────────────────────────────────────────────────────────────────────────────

def test_user_cannot_generate_auto_alerts(client, db):
    _create_user(db, "user_rbac@test.com", role="USER")
    token = _get_token(client, "user_rbac@test.com")
    res = client.post("/alertas/gerar-automaticos", headers=_auth(token))
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


def test_user_cannot_reconcile(client, db):
    _create_user(db, "user_rec@test.com", role="USER")
    token = _get_token(client, "user_rec@test.com")
    res = client.post("/admin/reconciliar", headers=_auth(token))
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


def test_user_cannot_update_settings(client, db):
    _create_user(db, "user_cfg@test.com", role="USER")
    token = _get_token(client, "user_cfg@test.com")
    res = client.patch("/configuracoes", json={"companyName": "Hack"}, headers=_auth(token))
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 5. RBAC — ADMIN can call admin-only endpoints
# ──────────────────────────────────────────────────────────────────────────────

def test_admin_can_generate_auto_alerts(client, db):
    _create_user(db, "admin_alert@test.com", role="ADMIN")
    token = _get_token(client, "admin_alert@test.com")
    res = client.post("/alertas/gerar-automaticos", headers=_auth(token))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"


def test_admin_can_reconcile(client, db):
    _create_user(db, "admin_rec@test.com", role="ADMIN")
    token = _get_token(client, "admin_rec@test.com")
    res = client.post("/admin/reconciliar", headers=_auth(token))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"


# ──────────────────────────────────────────────────────────────────────────────
# 6. IDOR — user cannot access another user's notification
# ──────────────────────────────────────────────────────────────────────────────

def test_idor_notification_blocked(client, db):
    user_a = _create_user(db, "usera@test.com")
    _create_user(db, "userb@test.com")
    token_a = _get_token(client, "usera@test.com")
    token_b = _get_token(client, "userb@test.com")

    # User A creates a notification for themselves
    res = client.post(
        "/notificacoes",
        json={"titulo": "Private A", "mensagem": "Only A", "userId": user_a.id},
        headers=_auth(token_a),
    )
    assert res.status_code == 201, res.text
    notif_id = res.json()["data"]["id"]

    # User B tries to read User A's notification → 403
    res2 = client.get(f"/notificacoes/{notif_id}", headers=_auth(token_b))
    assert res2.status_code == 403, f"Expected 403, got {res2.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 7. Notification ownership — cannot create for another user
# ──────────────────────────────────────────────────────────────────────────────

def test_cannot_create_notification_for_other_user(client, db):
    user_a = _create_user(db, "own_a@test.com")
    user_b = _create_user(db, "own_b@test.com")
    token_b = _get_token(client, "own_b@test.com")

    res = client.post(
        "/notificacoes",
        json={"titulo": "Spoof", "mensagem": "For A from B", "userId": user_a.id},
        headers=_auth(token_b),
    )
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 8. Route validation via API — negative distance → 422
# ──────────────────────────────────────────────────────────────────────────────

def test_api_negative_distance_rejected(client, db):
    from app.models.fleet import Vehicle
    v = Vehicle(modelo="Test", placa="TST9001", status="ATIVO")
    db.add(v)
    db.commit()

    _create_user(db, "routeval@test.com")
    token = _get_token(client, "routeval@test.com")

    res = client.post(
        "/rotas",
        json={
            "veiculoId": v.id,
            "origem": "Rua das Flores, 100",
            "destino": "Av. Central, 500",
            "distanciaKm": -10.0,
        },
        headers=_auth(token),
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 9. Route validation via API — numeric address → 422
# ──────────────────────────────────────────────────────────────────────────────

def test_api_numeric_address_rejected(client, db):
    from app.models.fleet import Vehicle
    v = Vehicle(modelo="Test", placa="TST9002", status="ATIVO")
    db.add(v)
    db.commit()

    _create_user(db, "routeval2@test.com")
    token = _get_token(client, "routeval2@test.com")

    res = client.post(
        "/rotas",
        json={
            "veiculoId": v.id,
            "origem": "12345",
            "destino": "Av. Central, 500",
        },
        headers=_auth(token),
    )
    assert res.status_code == 422, f"Expected 422, got {res.status_code}"


# ──────────────────────────────────────────────────────────────────────────────
# 10. Settings — GET is accessible to any authenticated user
# ──────────────────────────────────────────────────────────────────────────────

def test_settings_get_accessible_to_any_user(client, db):
    _create_user(db, "cfg_read@test.com")
    token = _get_token(client, "cfg_read@test.com")
    res = client.get("/configuracoes", headers=_auth(token))
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
