"""add_soft_delete_columns

Revision ID: a8d368e1e1b2
Revises: a852d586a8fc
Create Date: 2026-02-20 08:28:37.719894

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a8d368e1e1b2'
down_revision = 'a852d586a8fc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.add_column('users', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('deleted_by', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_users_is_deleted'), 'users', ['is_deleted'], unique=False)

    # Bookings
    op.add_column('bookings', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('bookings', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('deleted_by', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_bookings_is_deleted'), 'bookings', ['is_deleted'], unique=False)

    # Services
    op.add_column('services', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('services', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('services', sa.Column('deleted_by', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_services_is_deleted'), 'services', ['is_deleted'], unique=False)

    # Tenants
    op.add_column('tenants', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('tenants', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenants', sa.Column('deleted_by', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_tenants_is_deleted'), 'tenants', ['is_deleted'], unique=False)


def downgrade() -> None:
    # Tenants
    op.drop_index(op.f('ix_tenants_is_deleted'), table_name='tenants')
    op.drop_column('tenants', 'deleted_by')
    op.drop_column('tenants', 'deleted_at')
    op.drop_column('tenants', 'is_deleted')

    # Services
    op.drop_index(op.f('ix_services_is_deleted'), table_name='services')
    op.drop_column('services', 'deleted_by')
    op.drop_column('services', 'deleted_at')
    op.drop_column('services', 'is_deleted')

    # Bookings
    op.drop_index(op.f('ix_bookings_is_deleted'), table_name='bookings')
    op.drop_column('bookings', 'deleted_by')
    op.drop_column('bookings', 'deleted_at')
    op.drop_column('bookings', 'is_deleted')

    # Users
    op.drop_index(op.f('ix_users_is_deleted'), table_name='users')
    op.drop_column('users', 'deleted_by')
    op.drop_column('users', 'deleted_at')
    op.drop_column('users', 'is_deleted')
