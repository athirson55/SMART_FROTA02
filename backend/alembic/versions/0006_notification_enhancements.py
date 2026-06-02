"""notification enhancements: prioridade, lida_em, referencia_tipo, referencia_id

Revision ID: 0006_notification_enhancements
Revises: 0005_email_verification
Create Date: 2026-06-01
"""

import sqlalchemy as sa
from alembic import op

revision = "0006_notification_enhancements"
down_revision = "0005_email_verification"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA'"
    )
    op.execute(
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS lida_em TIMESTAMP WITH TIME ZONE"
    )
    op.execute(
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(40)"
    )
    op.execute(
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS referencia_id VARCHAR(36)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_notificacoes_is_read ON notificacoes (is_read)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_notificacoes_prioridade ON notificacoes (prioridade)"
    )


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_notificacoes_prioridade")
    op.execute("DROP INDEX IF EXISTS ix_notificacoes_is_read")
    op.drop_column("notificacoes", "referencia_id")
    op.drop_column("notificacoes", "referencia_tipo")
    op.drop_column("notificacoes", "lida_em")
    op.drop_column("notificacoes", "prioridade")
