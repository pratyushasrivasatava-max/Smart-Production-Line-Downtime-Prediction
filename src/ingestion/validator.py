from pydantic import BaseModel, Field
from typing import Optional

class TelemetryPayload(BaseModel):
    ts: str
    machine_id: str
    temperature: float = Field(..., ge=-20.0, le=200.0)
    vibration: float = Field(..., ge=0.0, le=50.0)
    motor_current: float = Field(..., ge=0.0, le=200.0)
    pressure: float = Field(..., ge=0.0, le=30.0)
    rpm: int = Field(..., ge=0, le=50000)
    power_kw: float = Field(..., ge=0.0, le=200.0)
    cycle_time: float = Field(..., ge=0.5, le=300.0)
    output_count: int = Field(..., ge=0)
    reject_count: int = Field(..., ge=0)
    status: str
