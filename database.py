from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Text
from datetime import datetime
import os

# Ultra Mega CMS Database
DATABASE_URL = "sqlite+aiosqlite:///./santis.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

# --- MODELS ---

class Service(Base):
    __tablename__ = "services"
    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    title_tr = Column(String)
    desc_tr = Column(Text, default="")
    category = Column(String, index=True)
    price = Column(Integer, default=0)
    duration = Column(Integer, default=60)
    image = Column(String, default="placeholder.jpg")
    badge = Column(String, nullable=True)
    tags = Column(JSON, default=list)
    cultural_world = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class SiteConfig(Base):
    __tablename__ = "config"
    key = Column(String, primary_key=True) # e.g., 'main_settings'
    value = Column(JSON) # Stores the huge JSON blob

class Page(Base):
    __tablename__ = "pages"
    slug = Column(String, primary_key=True) # e.g. 'home', 'about'
    title = Column(String)
    blocks = Column(JSON, default=list) # [{type: 'hero', data: {...}}, ...]
    seo = Column(JSON, default={}) # Meta tags

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="editor") # admin, editor, ai_writer

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String)
    details = Column(String)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# --- INIT ---
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- DEPENDENCY ---
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
