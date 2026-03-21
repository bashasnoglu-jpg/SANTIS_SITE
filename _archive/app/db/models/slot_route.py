import uuid
from sqlalchemy import Column, String, Boolean
from app.db.base import Base

class SlotRoute(Base):
    __tablename__ = "slot_routes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, index=True) # Çoklu şube izolasyonu
    slot_key = Column(String, index=True)  # Hizmet/Ürün yuvası
    page_route = Column(String)            # Hedef URL
    is_global = Column(Boolean, default=False) # Stratejik Override
