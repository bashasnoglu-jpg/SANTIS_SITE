from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any

class TelemetryPayload(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    event_type: str = Field(..., max_length=100)
    session_id: Optional[str] = Field(None, max_length=100)
    client_time: Optional[str] = Field(None, max_length=50)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
