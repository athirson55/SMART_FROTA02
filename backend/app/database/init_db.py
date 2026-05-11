from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.fleet import Driver, Vehicle, VehiclePendencia
from app.models.operations import Alert, Appointment, Maintenance, Notification
from app.models.settings import SystemSetting
from app.models.user import User


def seed_database(db: Session) -> None:
    if not db.scalar(select(User).where(User.email == "admin@smartfrota.local")):
        admin = User(
            nome="Administrador",
            email="admin@smartfrota.local",
            senha_hash=hash_password("Admin@12345"),
            role="ADMIN",
            avatar_foto=None,
            is_active=True,
            email_verified=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(admin)
        db.flush()

    if not db.scalar(select(SystemSetting)):
        db.add(SystemSetting())

    if not db.scalar(select(Driver)):
        driver = Driver(
            nome="Laura Martins",
            email="laura.martins@smartfrota.com",
            telefone="+55 11 95770-1110",
            cnh="04355110998",
            cnh_categoria="D",
            cnh_vencimento=datetime(2027, 7, 24, tzinfo=timezone.utc),
            status="EM_ROTA",
            cargo="Motorista",
            avatar_cor="#16a34a",
        )
        db.add(driver)
        db.flush()

        vehicle = Vehicle(
            modelo="Volvo FH 460",
            marca="Volvo",
            placa="ABC1D23",
            ano=2024,
            status="ATIVO",
            combustivel="DIESEL",
            km=87420,
            motorista_id=driver.id,
        )
        db.add(vehicle)
        db.flush()

        db.add_all(
            [
                VehiclePendencia(vehicle_id=vehicle.id, slug="documento-vencendo", label="Documento vencendo", detail="CRLV vence em 12 dias", tone="AMBER"),
                VehiclePendencia(vehicle_id=vehicle.id, slug="troca-oleo-pendente", label="Troca de óleo pendente", detail="Próxima revisão em 5 dias", tone="RED"),
                Maintenance(vehicle_id=vehicle.id, tipo="PREVENTIVA", descricao="Revisão preventiva inicial", data=datetime.now(timezone.utc), km=87420, custo=3200, status="CONCLUIDA", prioridade="MEDIA", mecanico="Equipe técnica", oficina="Oficina Central"),
                Appointment(vehicle_id=vehicle.id, tipo="Troca de óleo", data=datetime.now(timezone.utc), hora="08:00", km=88000, local="Oficina Central", responsavel="Equipe técnica", status="AGENDADO", observacoes="Agendado no seed"),
                Alert(vehicle_id=vehicle.id, tipo="documento", titulo="CRLV vencendo", mensagem="CRLV vence em 12 dias", prioridade="MEDIO", status="PENDENTE", km=87420, acao="Renovar documento", responsavel="Laura Martins"),
                Notification(titulo="Bem-vindo ao Smart Frota", mensagem="Configuração inicial concluída.", tipo="INFO", is_read=False),
            ]
        )

    db.commit()
