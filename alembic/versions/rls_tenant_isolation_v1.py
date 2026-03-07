"""add_row_level_security_rls

Revision ID: rls_tenant_isolation_v1
Revises: 90447bb8a440
Create Date: 2026-03-01

SANTIS SOVEREIGN SHIELD — PostgreSQL Row Level Security
"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import text

revision: str = 'rls_tenant_isolation_v1'
down_revision: Union[str, Sequence[str], None] = '90447bb8a440'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TENANT_TABLES = [
    'services', 'bookings', 'customers', 'staff', 'rooms',
    'daily_revenue', 'staff_commissions', 'audit_logs', 'users',
]


def upgrade() -> None:
    conn = op.get_bind()

    for table in TENANT_TABLES:
        # Tabloyu kontrol et
        result = conn.execute(text(
            f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table}')"
        ))
        if not result.scalar():
            continue

        # tenant_id sutunu var mi?
        result = conn.execute(text(
            f"SELECT EXISTS (SELECT 1 FROM information_schema.columns "
            f"WHERE table_name = '{table}' AND column_name = 'tenant_id')"
        ))
        if not result.scalar():
            continue

        conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
        conn.execute(text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY"))
        conn.execute(text(f"DROP POLICY IF EXISTS tenant_isolation ON {table}"))
        conn.execute(text(f"""
            CREATE POLICY tenant_isolation ON {table}
            AS RESTRICTIVE FOR ALL
            USING (
                tenant_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.current_tenant_id', true) IS NULL
                OR current_setting('app.current_tenant_id', true) = ''
            )
            WITH CHECK (
                tenant_id::text = current_setting('app.current_tenant_id', true)
            )
        """))
        conn.execute(text(f"DROP POLICY IF EXISTS platform_admin_bypass ON {table}"))
        conn.execute(text(f"""
            CREATE POLICY platform_admin_bypass ON {table}
            AS PERMISSIVE FOR ALL TO PUBLIC
            USING (current_setting('app.is_platform_admin', true) = 'true')
        """))

    # Helper function
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION set_tenant_context(
            p_tenant_id text,
            p_is_admin boolean DEFAULT false
        ) RETURNS void AS $$
        BEGIN
            PERFORM set_config('app.current_tenant_id', p_tenant_id, true);
            PERFORM set_config('app.is_platform_admin', p_is_admin::text, true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
    """))

    print("✅ [RLS] Sovereign Shield: Tenant izolasyonu aktif.")


def downgrade() -> None:
    conn = op.get_bind()
    for table in TENANT_TABLES:
        conn.execute(text(f"DROP POLICY IF EXISTS tenant_isolation ON {table}"))
        conn.execute(text(f"DROP POLICY IF EXISTS platform_admin_bypass ON {table}"))
        conn.execute(text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY"))
    conn.execute(text("DROP FUNCTION IF EXISTS set_tenant_context(text, boolean)"))
