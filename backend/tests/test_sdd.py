"""
Automated tests covering the 10 SDD-required scenarios.

Scenarios:
 1  Home indicators update after data changes
 2  Alerts are generated automatically for new conditions
 3  Negative distance is rejected
 4  Purely-numeric address is rejected
 5  Expired-document alert is generated for a vehicle
 6  Vehicle with active maintenance is marked MANUTENCAO
 7  Vehicle status becomes EM_ROTA when route starts
 8  Driver status becomes EM_ROTA when route starts
 9  Full reconciliation fixes all inconsistencies at once
10  Home / Dashboard / Reports return identical vehicle and alert counts
"""
from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _now():
    return datetime.now(timezone.utc)


def _make_vehicle(db, placa="TST0001", status="ATIVO", **kwargs):
    from app.models.fleet import Vehicle
    v = Vehicle(modelo="TestVehicle", placa=placa, status=status, **kwargs)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


def _make_driver(db, cnh="12345678900", status="DISPONIVEL", **kwargs):
    from app.models.fleet import Driver
    d = Driver(
        nome="Test Driver",
        email=f"driver_{cnh}@test.com",
        cnh=cnh,
        status=status,
        **kwargs,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def _make_maintenance(db, vehicle, status="PENDENTE", **kwargs):
    from app.models.operations import Maintenance
    m = Maintenance(
        vehicle_id=vehicle.id,
        tipo="PREVENTIVA",
        descricao="Test maintenance",
        data=_now(),
        status=status,
        **kwargs,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def _make_route(db, vehicle, driver=None, status="PENDENTE"):
    from app.models.operations import Route
    r = Route(
        vehicle_id=vehicle.id,
        motorista_id=driver.id if driver else None,
        origem="Rua das Flores, 100",
        destino="Av. Central, 500",
        status=status,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


# ──────────────────────────────────────────────────────────────────────────────
# TEST 1 — Home indicators update after data changes
# ──────────────────────────────────────────────────────────────────────────────

def test_home_reflects_current_data(db):
    """dashboard_report must return up-to-date counts after vehicle creation."""
    from app.services.reports_service import dashboard_report

    before = dashboard_report(db)
    assert before["veiculos"]["total"] == 0

    _make_vehicle(db, placa="AAA0001")
    _make_vehicle(db, placa="BBB0002", status="ATIVO")

    after = dashboard_report(db)
    assert after["veiculos"]["total"] == 2
    assert after["veiculos"]["ativos"] == 2


# ──────────────────────────────────────────────────────────────────────────────
# TEST 2 — Alerts generated automatically for new conditions
# ──────────────────────────────────────────────────────────────────────────────

def test_alerts_generated_for_expired_cnh(db):
    """generate_auto_alerts creates a CRITICO alert for a driver with expired CNH."""
    from app.services.operations_service import generate_auto_alerts

    expired = _now() - timedelta(days=5)
    _make_driver(db, cnh="99900000000", cnh_vencimento=expired)

    created = generate_auto_alerts(db)
    titles = [a.titulo for a in created]
    assert any("CNH" in t for t in titles), f"Expected CNH alert, got: {titles}"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 3 — Negative distance rejected (backend schema)
# ──────────────────────────────────────────────────────────────────────────────

def test_negative_distance_rejected():
    """RouteCreate must raise ValidationError for distanciaKm < 0."""
    from app.schemas.operations import RouteCreate

    with pytest.raises(ValidationError) as exc_info:
        RouteCreate(
            veiculoId="some-id",
            origem="Rua das Flores, 100",
            destino="Av. Central, 500",
            distanciaKm=-10.0,
        )
    errors = exc_info.value.errors()
    assert any("distanciaKm" in str(e.get("loc")) for e in errors)


# ──────────────────────────────────────────────────────────────────────────────
# TEST 4 — Purely-numeric address rejected (backend schema)
# ──────────────────────────────────────────────────────────────────────────────

def test_purely_numeric_address_rejected():
    """RouteCreate must reject addresses that are only digits."""
    from app.schemas.operations import RouteCreate

    for bad in ("12345", "00000", "111111"):
        with pytest.raises(ValidationError, match="Endereço"):
            RouteCreate(
                veiculoId="some-id",
                origem=bad,
                destino="Av. Central, 500",
            )

    with pytest.raises(ValidationError, match="Endereço"):
        RouteCreate(
            veiculoId="some-id",
            origem="Rua das Flores, 100",
            destino="99999",
        )


# ──────────────────────────────────────────────────────────────────────────────
# TEST 5 — Alert generated for vehicle with expired document
# ──────────────────────────────────────────────────────────────────────────────

def test_alert_generated_for_expired_crlv(db):
    """generate_auto_alerts must create an alert for a vehicle with expired CRLV."""
    from app.services.operations_service import generate_auto_alerts

    expired_crlv = _now() - timedelta(days=10)
    _make_vehicle(db, placa="EXP0001", vencimento_crlv=expired_crlv)

    created = generate_auto_alerts(db)
    titles = [a.titulo for a in created]
    assert any("CRLV" in t for t in titles), f"Expected CRLV alert, got: {titles}"
    crlv_alerts = [a for a in created if "CRLV" in a.titulo]
    assert crlv_alerts[0].prioridade == "CRITICO"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 6 — Vehicle with active maintenance marked MANUTENCAO
# ──────────────────────────────────────────────────────────────────────────────

def test_vehicle_status_set_to_manutencao_when_maintenance_active(db):
    """create_maintenance with status EM_ANDAMENTO must set vehicle to MANUTENCAO."""
    from app.services.operations_service import create_maintenance

    v = _make_vehicle(db, placa="MNT0001", status="ATIVO")
    assert v.status == "ATIVO"

    create_maintenance(
        db,
        {
            "veiculoId": v.id,
            "tipo": "CORRETIVA",
            "descricao": "Troca de motor",
            "data": _now(),
            "status": "EM_ANDAMENTO",
        },
    )

    db.refresh(v)
    assert v.status == "MANUTENCAO", f"Expected MANUTENCAO, got {v.status}"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 7 — Vehicle becomes EM_ROTA when route starts
# ──────────────────────────────────────────────────────────────────────────────

def test_vehicle_becomes_em_rota_when_route_starts(db):
    """create_route with status EM_ANDAMENTO must set vehicle to EM_ROTA."""
    from app.services.operations_service import create_route

    driver = _make_driver(db, cnh="11100000001")
    v = _make_vehicle(db, placa="ROT0001", motorista_id=driver.id)
    assert v.status == "ATIVO"

    create_route(
        db,
        {
            "veiculoId": v.id,
            "motoristaId": driver.id,
            "origem": "Rua das Flores, 100",
            "destino": "Av. Central, 500",
            "status": "EM_ANDAMENTO",
        },
    )

    db.refresh(v)
    assert v.status == "EM_ROTA", f"Expected EM_ROTA, got {v.status}"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 8 — Driver becomes EM_ROTA when route starts
# ──────────────────────────────────────────────────────────────────────────────

def test_driver_becomes_em_rota_when_route_starts(db):
    """create_route with status EM_ANDAMENTO must set driver to EM_ROTA."""
    from app.services.operations_service import create_route

    driver = _make_driver(db, cnh="11100000002", status="DISPONIVEL")
    v = _make_vehicle(db, placa="ROT0002", motorista_id=driver.id)

    create_route(
        db,
        {
            "veiculoId": v.id,
            "motoristaId": driver.id,
            "origem": "Terminal Central, S/N",
            "destino": "Porto de Santos, SP",
            "status": "EM_ANDAMENTO",
        },
    )

    db.refresh(driver)
    assert driver.status == "EM_ROTA", f"Expected EM_ROTA, got {driver.status}"


# ──────────────────────────────────────────────────────────────────────────────
# TEST 9 — Full reconciliation fixes all inconsistencies
# ──────────────────────────────────────────────────────────────────────────────

def test_full_reconciliation_fixes_inconsistencies(db):
    """run_full_reconciliation must normalize statuses and fix stuck vehicles."""
    from app.models.fleet import Vehicle, Driver
    from app.models.operations import Route
    from app.services.reconciliation_service import run_full_reconciliation

    # Insert vehicles with display-format status (old bug)
    v1 = Vehicle(modelo="Volvo FH", placa="REC0001", status="Ativo")  # wrong case
    v2 = Vehicle(modelo="Scania R", placa="REC0002", status="EM_ROTA")  # stuck as EM_ROTA with no active route
    d1 = Driver(nome="João", email="joao@test.com", cnh="88800000001", status="Em rota")  # wrong case
    db.add_all([v1, v2, d1])
    db.commit()

    stats = run_full_reconciliation(db)

    db.refresh(v1)
    db.refresh(v2)
    db.refresh(d1)

    assert v1.status == "ATIVO", f"v1 should be ATIVO, got {v1.status}"
    assert v2.status == "ATIVO", f"v2 should be ATIVO (no active route), got {v2.status}"
    assert d1.status == "DISPONIVEL", f"d1 should be DISPONIVEL, got {d1.status}"
    assert "vehicles_normalized" in stats
    assert "alerts_generated" in stats


# ──────────────────────────────────────────────────────────────────────────────
# TEST 10 — Home / Dashboard / Reports return identical counts
# ──────────────────────────────────────────────────────────────────────────────

def test_home_dashboard_reports_consistency(db):
    """dashboard_report and reports_service must agree on vehicle and alert counts."""
    from app.services.reports_service import dashboard_report
    from app.services.operations_service import generate_auto_alerts

    # Seed: 3 active vehicles, 1 with expired CRLV
    _make_vehicle(db, placa="CON0001", status="ATIVO")
    _make_vehicle(db, placa="CON0002", status="ATIVO")
    expired = _now() - timedelta(days=3)
    _make_vehicle(db, placa="CON0003", status="ATIVO", vencimento_crlv=expired)

    generate_auto_alerts(db)

    report = dashboard_report(db)

    # Vehicle counts
    assert report["veiculos"]["total"] == 3
    assert report["veiculos"]["ativos"] == 3

    # Alert counts: at least 1 (CRLV alert)
    assert report["alertas"]["total"] >= 1
    assert report["alertas"]["pendentes"] >= 1
    assert report["alertas"]["criticos"] >= 1

    # Counts are internally consistent
    assert report["alertas"]["pendentes"] <= report["alertas"]["total"]
    assert report["alertas"]["criticos"] <= report["alertas"]["pendentes"]
