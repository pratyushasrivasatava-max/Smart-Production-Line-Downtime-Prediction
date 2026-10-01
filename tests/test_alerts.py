import pytest
from src.ingestion.validator import TelemetryPayload

def test_payload_validation():
    valid = {
        "ts": "2026-01-01T10:00:00Z",
        "machine_id": "cnc_01",
        "temperature": 72.4,
        "vibration": 3.1,
        "motor_current": 14.2,
        "pressure": 6.1,
        "rpm": 1480,
        "power_kw": 11.3,
        "cycle_time": 4.2,
        "output_count": 120,
        "reject_count": 2,
        "status": "RUNNING"
    }
    model = TelemetryPayload(**valid)
    assert model.machine_id == "cnc_01"
    assert model.temperature == 72.4

def test_invalid_temperature_payload():
    invalid = {
        "ts": "2026-01-01T10:00:00Z",
        "machine_id": "cnc_01",
        "temperature": 999.0, # Beyond physical range
        "vibration": 3.1,
        "motor_current": 14.2,
        "pressure": 6.1,
        "rpm": 1480,
        "power_kw": 11.3,
        "cycle_time": 4.2,
        "output_count": 120,
        "reject_count": 2,
        "status": "RUNNING"
    }
    with pytest.raises(Exception):
        TelemetryPayload(**invalid)
