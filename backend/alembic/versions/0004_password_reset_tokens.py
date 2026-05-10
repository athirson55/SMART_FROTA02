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
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_prt_token_hash", "password_reset_tokens", ["token_hash"])
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])


def downgrade():
    op.drop_index("ix_prt_user_id", table_name="password_reset_tokens")
    op.drop_index("ix_prt_token_hash", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
