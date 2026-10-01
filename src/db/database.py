import sqlite3
import os
from typing import List, Dict, Any

class DatabaseManager:
    def __init__(self, db_path: str = "data/historical_telemetry.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        return conn

    def _init_db(self):
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, "r") as f:
            sql = f.read()
        conn = self.get_connection()
        conn.executescript(sql)
        conn.commit()
        conn.close()

    def batch_insert_telemetry(self, rows: List[Dict[str, Any]]):
        if not rows:
            return
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.executemany("""
            INSERT INTO telemetry (
                ts, machine_id, temperature, vibration, motor_current, pressure,
                rpm, power_kw, cycle_time, output_count, reject_count, status
            ) VALUES (
                :ts, :machine_id, :temperature, :vibration, :motor_current, :pressure,
                :rpm, :power_kw, :cycle_time, :output_count, :reject_count, :status
            )
        """, rows)
        conn.commit()
        conn.close()

    def prune_old_telemetry(self, days: int = 30):
        conn = self.get_connection()
        conn.execute("DELETE FROM telemetry WHERE datetime(ts) < datetime('now', ? || ' days')", (f"-{days}",))
        conn.commit()
        conn.close()
