"""add password_reset_tokens table

Revision ID: 0004_password_reset_tokens
Revises: 0003_user_avatar_text
Create Date: 2026-05-10
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_password_reset_tokens"
down_revision = "0003_user_avatar_text"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_prt_token_hash ON password_reset_tokens (token_hash)"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_prt_user_id ON password_reset_tokens (user_id)")


def downgrade():
    op.drop_index("ix_prt_user_id", table_name="password_reset_tokens")
    op.drop_index("ix_prt_token_hash", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
