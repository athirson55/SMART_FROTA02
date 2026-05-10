"""vehicle capacidade e tipo_veiculo

Revision ID: 0002_vehicle_specs
Revises: 0001_initial_schema
Create Date: 2026-05-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_vehicle_specs"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("veiculos", sa.Column("capacidade", sa.String(40), nullable=True))
    op.add_column("veiculos", sa.Column("tipo_veiculo", sa.String(60), nullable=True))


def downgrade():
    op.drop_column("veiculos", "tipo_veiculo")
    op.drop_column("veiculos", "capacidade")
