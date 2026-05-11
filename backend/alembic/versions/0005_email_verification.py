"""add email verification

Revision ID: 0005_email_verification
Revises: 0004_password_reset_tokens
Create Date: 2026-05-10
"""

import sqlalchemy as sa
from alembic import op

revision = "0005_email_verification"
down_revision = "0004_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false"
    )
    op.execute(
        "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE"
    )
    # Existing users are marked as verified — they registered before this feature
    op.execute(
        "UPDATE usuarios SET email_verified = TRUE, email_verified_at = NOW() WHERE email_verified = FALSE"
    )
    # Also activate any previously active users that lost is_active default
    op.execute("UPDATE usuarios SET is_active = TRUE WHERE is_active = FALSE AND email_verified = TRUE")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
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
        "CREATE INDEX IF NOT EXISTS ix_evt_token_hash ON email_verification_tokens (token_hash)"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_evt_user_id ON email_verification_tokens (user_id)")


def downgrade():
    op.drop_index("ix_evt_user_id", table_name="email_verification_tokens")
    op.drop_index("ix_evt_token_hash", table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_column("usuarios", "email_verified_at")
    op.drop_column("usuarios", "email_verified")
