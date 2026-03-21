from sqlalchemy import Column, String, JSON, DateTime, func
from app.db.base import Base

class PreComputedMetric(Base):
    __tablename__ = "pre_computed_metrics"

    metric_key = Column(String, primary_key=True, index=True)
    data_json = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
