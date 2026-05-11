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
    op.execute("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS capacidade VARCHAR(40)")
    op.execute("ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS tipo_veiculo VARCHAR(60)")


def downgrade():
    op.drop_column("veiculos", "tipo_veiculo")
    op.drop_column("veiculos", "capacidade")
