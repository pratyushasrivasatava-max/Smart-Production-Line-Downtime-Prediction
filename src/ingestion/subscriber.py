import json
import time
from typing import List, Dict, Any
from src.mqtt.client import MQTTClientManager
from src.ingestion.validator import TelemetryPayload
from src.db.database import DatabaseManager

class IngestionService:
    def __init__(self):
        self.db = DatabaseManager()
        self.batch: List[Dict[str, Any]] = []
        self.last_flush = time.time()
        self.stats = {"received": 0, "valid": 0, "dropped": 0}

    def on_message(self, client, userdata, message):
        self.stats["received"] += 1
        try:
            payload_dict = json.loads(message.payload.decode("utf-8"))
            validated = TelemetryPayload(**payload_dict)
            self.batch.append(validated.model_dump())
            self.stats["valid"] += 1

            if len(self.batch) >= 100 or (time.time() - self.last_flush >= 1.0):
                self.flush()

        except Exception as e:
            self.stats["dropped"] += 1
            print(f"[MALFORMED_TELEMETRY] {e}")

    def flush(self):
        if self.batch:
            self.db.batch_insert_telemetry(self.batch)
            self.batch = []
        self.last_flush = time.time()

def main():
    service = IngestionService()
    mqtt_mgr = MQTTClientManager(client_id="ingestion_service", on_message_cb=service.on_message)
    mqtt_mgr.connect()
    mqtt_mgr.client.subscribe("factory/line1/+/telemetry", qos=1)
    print("Ingestion Gateway subscribed to factory/line1/+/telemetry...")
    try:
        while True:
            time.sleep(1)
            service.flush()
    except KeyboardInterrupt:
        service.flush()
        mqtt_mgr.disconnect()

if __name__ == "__main__":
    main()
