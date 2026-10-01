-- SQLite WAL Mode Schema for Smart Production-Line Downtime Prediction
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS machines (
    machine_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    line TEXT NOT NULL,
    position INTEGER NOT NULL,
    install_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    temperature REAL NOT NULL,
    vibration REAL NOT NULL,
    motor_current REAL NOT NULL,
    pressure REAL NOT NULL,
    rpm INTEGER NOT NULL,
    power_kw REAL NOT NULL,
    cycle_time REAL NOT NULL,
    output_count INTEGER NOT NULL,
    reject_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(machine_id) REFERENCES machines(machine_id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_machine_ts ON telemetry(machine_id, ts);

CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    temp_mean_1m REAL,
    temp_slope_15m REAL,
    vib_mean_1m REAL,
    vib_std_5m REAL,
    vib_slope_15m REAL,
    current_mean_1m REAL,
    current_slope_15m REAL,
    pressure_mean_1m REAL,
    pressure_slope_15m REAL,
    vib_to_rpm_ratio REAL,
    current_to_power_ratio REAL,
    failure_in_next_30min INTEGER,
    time_to_failure_min REAL
);

CREATE INDEX IF NOT EXISTS idx_features_machine_ts ON features(machine_id, ts);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    failure_prob REAL NOT NULL,
    predicted_ttf_min REAL NOT NULL,
    anomaly_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    model_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_machine_ts ON predictions(machine_id, ts);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    ts TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    failure_prob REAL NOT NULL,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT,
    acknowledged_at TEXT,
    resolved INTEGER DEFAULT 0,
    resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_machine_ts ON alerts(machine_id, ts);

CREATE TABLE IF NOT EXISTS downtime_events (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL,
    start_ts TEXT NOT NULL,
    end_ts TEXT,
    cause TEXT NOT NULL,
    duration_min REAL
);

CREATE TABLE IF NOT EXISTS model_registry (
    version TEXT PRIMARY KEY,
    trained_at TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    path TEXT NOT NULL
);
