# Smart Production-Line Downtime Prediction

A cyber-physical IoT & Machine Learning platform that simulates an industrial 5-station manufacturing line, streams real-time sensor telemetry over MQTT via HiveMQ, ingests records into SQLite WAL storage, computes rolling temporal features, forecasts equipment downtime before physical breakdown using XGBoost and Isolation Forests, issues multi-tier alerts, and renders a live mission-control dashboard.

```mermaid
flowchart TD
    subgraph Floor[Factory Floor Simulation]
        M1[Cutting Machine<br/>cut_01] --> M2[CNC Milling<br/>cnc_01]
        M2 --> M3[Welding Robot<br/>weld_01]
        M3 --> M4[Painting Booth<br/>paint_01]
        M4 --> M5[Packaging Unit<br/>pack_01]
    end

    Floor -->|paho-mqtt v2 QoS 1<br/>factory/line1/+/telemetry| HiveMQ[HiveMQ MQTT Broker<br/>Port 1883 / 8080]

    subgraph Backend[Ingestion & Inference Pipeline]
        HiveMQ --> Ingest[Ingestion Gateway & Validator]
        Ingest --> DB[(SQLite Database<br/>WAL Mode)]
        Ingest --> Features[Feature Engineering<br/>Rolling Slope, Mean, Std, Cross-Ratios]
        Features --> ML[AI/ML Predictive Models<br/>XGBoost + Isolation Forest + TTF Regressor]
        ML --> AlertEngine[Alert Rules Engine<br/>Auto-Escalation & Cooldown]
    end

    ML -->|factory/line1/predictions/+| HiveMQ
    AlertEngine -->|factory/line1/alerts| HiveMQ

    subgraph Dashboards[Operator Dashboards]
        HiveMQ --> WebDash[React / Vercel Mission Control]
        DB --> StreamlitDash[Streamlit + Plotly Console]
    end
```

---

## 1. Quick Start Guide

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
# or
make install
```

### Step 2: Start HiveMQ MQTT Broker
```bash
make broker
# or: docker compose up -d hivemq
# Access HiveMQ Control Center at http://localhost:8080
```

### Step 3: Seed 30-Day Historical Data (< 2 minutes)
```bash
make seed-data
```

### Step 4: Train AI / ML Models
```bash
make train
```

### Step 5: Start Live Ingestion, ML Inference & Dashboard
```bash
make all
```

---

## 2. Testing the Section 13 Benchmark Demonstration

To verify that the system flags machine failure before failure happens:
```bash
# Inject progressive bearing wear on CNC Milling:
python3 src/simulator/cli.py --inject-fault --machine cnc_01 --type bearing_wear

# Result:
# 1. Spindle vibration and thermal gradient begin climbing.
# 2. XGBoost failure probability climbs past 0.60, triggering a WARNING alert ~28 minutes before failure.
# 3. Time-to-failure countdown indicates remaining safe operation.
# 4. Operator receives mitigation recommendations before mechanical fault status.
```

---

## 3. Web Dashboard (Vercel Ready)
This project includes a React 19 + TypeScript + Tailwind v4 web dashboard deployable directly to Vercel or running locally via:
```bash
npm run dev
# Open http://localhost:3000
```
To deploy to Vercel:
```bash
npm run build
vercel deploy --prod
```
