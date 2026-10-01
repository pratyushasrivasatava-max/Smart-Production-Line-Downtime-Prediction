import pytest
from datetime import datetime
from src.simulator.generator import FactoryLineSimulator

def test_baseline_generation():
    sim = FactoryLineSimulator(seed=123)
    readings = sim.generate_tick(datetime.utcnow(), {})
    assert len(readings) == 5
    machines = [r["machine_id"] for r in readings]
    assert "cnc_01" in machines

def test_bearing_wear_degradation():
    sim = FactoryLineSimulator(seed=123)
    fault_state = {"cnc_01": {"active": True, "type": "bearing_wear", "progress": 0.8}}
    readings = sim.generate_tick(datetime.utcnow(), fault_state)
    cnc = next(r for r in readings if r["machine_id"] == "cnc_01")
    # Base vibration is 2.8; with 80% degradation it should be > 5.0
    assert cnc["vibration"] > 5.0
    assert cnc["failure_in_next_30min"] == 1
