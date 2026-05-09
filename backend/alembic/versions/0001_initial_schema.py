"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-09
"""

from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    from app.models.base import Base
    import app.models.fleet  # noqa: F401
    import app.models.operations  # noqa: F401
    import app.models.report  # noqa: F401
    import app.models.settings  # noqa: F401
    import app.models.session_token  # noqa: F401
    import app.models.user  # noqa: F401

    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade():
    from app.models.base import Base
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
