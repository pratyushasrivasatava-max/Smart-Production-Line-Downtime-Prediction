import os
import ssl
import paho.mqtt.client as mqtt
from typing import Optional, Callable

class MQTTClientManager:
    def __init__(
        self,
        client_id: str = "downtime_service",
        broker_mode: Optional[str] = None,
        on_message_cb: Optional[Callable] = None
    ):
        self.broker_mode = broker_mode or os.getenv("BROKER_MODE", "local")
        self.client_id = client_id
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
            clean_session=False
        )

        if on_message_cb:
            self.client.on_message = on_message_cb

        # Last Will and Testament (LWT) for offline detection
        self.client.will_set(
            topic=f"factory/line1/status/{client_id}",
            payload='{"status": "OFFLINE", "lwt": true}',
            qos=1,
            retain=True
        )

        # TLS configuration if in cloud mode
        if self.broker_mode == "cloud" or os.getenv("MQTT_TLS", "false").lower() == "true":
            self.client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2)
            user = os.getenv("MQTT_USERNAME")
            pwd = os.getenv("MQTT_PASSWORD")
            if user and pwd:
                self.client.username_pw_set(user, pwd)

    def connect(self):
        host = os.getenv("MQTT_HOST", "localhost")
        port = int(os.getenv("MQTT_PORT", 1883 if self.broker_mode == "local" else 8883))
        self.client.connect(host, port, keepalive=60)
        self.client.loop_start()

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
