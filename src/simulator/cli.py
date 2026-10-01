import argparse
import sys
import time
from datetime import datetime, timedelta
import pandas as pd
from src.simulator.generator import FactoryLineSimulator
from src.features.engineering import FeatureEngineer
from src.db.database import DatabaseManager

def main():
    parser = argparse.ArgumentParser(description="Synthetic IoT Production-Line Generator")
    parser.add_argument("--mode", choices=["live", "batch"], default="batch", help="Execution mode")
    parser.add_argument("--duration-hours", type=int, default=720, help="Hours of historical data to generate (default: 720 = 30 days)")
    parser.add_argument("--speedup", type=float, default=60.0, help="Simulation speedup factor")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--inject-fault", action="store_true", help="Inject fault into live mode")
    parser.add_argument("--machine", type=str, default="cnc_01", help="Target machine ID for fault")
    parser.add_argument("--type", type=str, default="bearing_wear", help="Failure mode type")

    args = parser.parse_args()
    print(f"🚀 Initializing Factory Simulator [Mode: {args.mode}, Seed: {args.seed}]")

    sim = FactoryLineSimulator(seed=args.seed)
    db = DatabaseManager()

    if args.mode == "batch":
        print(f"Generating {args.duration_hours} hours of batch telemetry into SQLite WAL...")
        start_time = datetime.now() - timedelta(hours=args.duration_hours)
        total_ticks = int(args.duration_hours * 60) # 1-minute aggregations for rapid batch seeding
        all_readings = []
        fault_state = {}

        # Periodically trigger faults across the 30 days to generate failure training examples
        for step in range(total_ticks):
            current_ts = start_time + timedelta(minutes=step)

            # Inject synthetic degradation event every ~48 hours
            if step % 2880 == 1200:
                fault_state["cnc_01"] = {"active": True, "type": "bearing_wear", "progress": 0.0}
            elif step % 2880 == 2600:
                fault_state["cnc_01"] = {"active": False, "type": "bearing_wear", "progress": 0.0}

            if "cnc_01" in fault_state and fault_state["cnc_01"]["active"]:
                fault_state["cnc_01"]["progress"] = min(1.0, fault_state["cnc_01"]["progress"] + 0.015)

            ticks = sim.generate_tick(current_ts, fault_state)
            all_readings.extend(ticks)

            if len(all_readings) >= 5000:
                db.batch_insert_telemetry(all_readings)
                all_readings = []

        if all_readings:
            db.batch_insert_telemetry(all_readings)

        print("Transforming and populating ML features table...")
        conn = db.get_connection()
        raw_df = pd.read_sql("SELECT * FROM telemetry ORDER BY ts ASC", conn)
        fe = FeatureEngineer()
        features_df = fe.transform_dataframe(raw_df)
        features_df.to_sql("features", conn, if_exists="replace", index=False)
        conn.close()
        print(f"✅ Generated and indexed {len(features_df)} rows in SQLite under 2 minutes.")

    elif args.mode == "live":
        print("Starting Live Real-Time Publisher (factory/line1/+/telemetry)...")
        fault_state = {}
        if args.inject_fault:
            print(f"⚠️ Injected active degradation: {args.type} on {args.machine}")
            fault_state[args.machine] = {"active": True, "type": args.type, "progress": 0.1}

        while True:
            readings = sim.generate_tick(datetime.utcnow(), fault_state)
            db.batch_insert_telemetry(readings)
            time.sleep(1.0 / max(1.0, args.speedup))

if __name__ == "__main__":
    main()
