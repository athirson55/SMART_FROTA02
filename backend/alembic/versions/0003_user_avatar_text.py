"""widen avatar_foto to Text

Revision ID: 0003_user_avatar_text
Revises: 0002_vehicle_specs
Create Date: 2026-05-10
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_user_avatar_text"
down_revision = "0002_vehicle_specs"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "usuarios",
        "avatar_foto",
        existing_type=sa.String(500),
        type_=sa.Text(),
        existing_nullable=True,
        postgresql_using="avatar_foto::text",
    )


def downgrade():
    op.alter_column(
        "usuarios",
        "avatar_foto",
        existing_type=sa.Text(),
        type_=sa.String(500),
        existing_nullable=True,
        postgresql_using="avatar_foto::varchar(500)",
    )
