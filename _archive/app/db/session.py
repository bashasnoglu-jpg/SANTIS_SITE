from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if type(connection_record).__name__ != 'ConnectionRecord':
        return
        
    # Check the actual dialect name instead of the config string dynamically
    if hasattr(connection_record, 'dialect') and connection_record.dialect.name != 'sqlite':
        return
    elif "sqlite" not in str(settings.DATABASE_URL):
        return
        
    try:
        cursor = dbapi_connection.cursor()
        # Eşzamanlı okuma-yazma (Concurrency) için WAL mode
        cursor.execute("PRAGMA journal_mode=WAL;")
        # Performans/Güvenlik dengesi için
        cursor.execute("PRAGMA synchronous=NORMAL;")
        # IO darboğazını azaltmak için ~64MB Cache
        cursor.execute("PRAGMA cache_size=-64000;") 
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()
    except Exception:
        pass

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args={"timeout": 30.0} if "sqlite" in settings.DATABASE_URL else {}
)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    """Standart DB session — RLS context olmadan (platform admin işlemleri)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def get_db_for_admin():
    """
    Platform admin bypass DB session.
    users, auth gibi global tablolara erişen endpoint'ler için.
    SQLite modunda set_config() atlanır; PostgreSQL'de RLS bypass edilir.
    """
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(
                text("SELECT set_config('app.is_platform_admin', 'true', true), "
                     "set_config('app.current_tenant_id', '', true)")
            )
        except Exception:
            pass  # SQLite: set_config yok, sessizce geçilir
        
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def get_db_for_tenant(
    tenant_id: Optional[str],
    is_platform_admin: bool = False
):
    """
    Tenant-aware DB session — PostgreSQL RLS için app. parametrelerini set eder.

    Kullanım (FastAPI endpoint):
        async def my_endpoint(db = Depends(get_db)):
            await set_tenant_context(db, str(current_user.tenant_id))
            ...

    veya doğrudan:
        async for db in get_db_for_tenant(str(tenant_id)):
            result = await db.execute(...)
    """
    async with AsyncSessionLocal() as session:
        # 🛡️ SOVEREIGN SHIELD: RLS context'i PostgreSQL'e set et
        try:
            await session.execute(
                text("SELECT set_tenant_context(:tenant_id, :is_admin)"),
                {
                    "tenant_id": str(tenant_id) if tenant_id else "",
                    "is_admin": is_platform_admin,
                }
            )
        except Exception:
            pass  # SQLite: set_tenant_context not available
        
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def set_tenant_context(
    session: AsyncSession,
    tenant_id: Optional[str],
    is_platform_admin: bool = False
) -> None:
    """
    Mevcut bir session'da tenant context'i ayarla.

    FastAPI endpoint'lerinde Depends(get_db) kullandıktan sonra
    hemen ilk satırda çağrılmalı.

    Örnek:
        async def list_services(
            current_user: User = Depends(get_current_user),
            db: AsyncSession = Depends(get_db)
        ):
            await set_tenant_context(db, str(current_user.tenant_id),
                                     current_user.is_platform_admin)
            services = await db.execute(select(Service))
    """
    try:
        await session.execute(
            text("SELECT set_tenant_context(:tenant_id, :is_admin)"),
            {
                "tenant_id": str(tenant_id) if tenant_id else "",
                "is_admin": is_platform_admin,
            }
        )
    except Exception:
        pass  # SQLite: set_tenant_context not available
