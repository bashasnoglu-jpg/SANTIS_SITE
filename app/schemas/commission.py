from pydantic import BaseModel
import uuid
from typing import Optional
from enum import Enum

class CommissionType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"

class CommissionRuleCreate(BaseModel):
    staff_id: uuid.UUID
    service_id: Optional[uuid.UUID] = None
    type: CommissionType
    value: float

class CommissionRuleOut(CommissionRuleCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID

    class Config:
        from_attributes = True
