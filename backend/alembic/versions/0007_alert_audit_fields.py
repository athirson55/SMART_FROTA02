"""alert audit fields: criado_por, resolvido_por, email_enviado

Revision ID: 0007_alert_audit_fields
Revises: 0006_notification_enhancements
Create Date: 2026-06-02
"""

from alembic import op

revision = "0007_alert_audit_fields"
down_revision = "0006_notification_enhancements"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE alertas ADD COLUMN IF NOT EXISTS criado_por VARCHAR(36)"
    )
    op.execute(
        "ALTER TABLE alertas ADD COLUMN IF NOT EXISTS resolvido_por VARCHAR(36)"
    )
    op.execute(
        "ALTER TABLE alertas ADD COLUMN IF NOT EXISTS email_enviado BOOLEAN NOT NULL DEFAULT false"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_alertas_criado_por ON alertas (criado_por)"
    )


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_alertas_criado_por")
    op.drop_column("alertas", "email_enviado")
    op.drop_column("alertas", "resolvido_por")
    op.drop_column("alertas", "criado_por")
