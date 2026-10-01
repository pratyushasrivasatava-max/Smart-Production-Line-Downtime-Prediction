.PHONY: help install broker seed-data train simulate ingest predict dashboard all test clean

help:
	@echo "Smart Production-Line Downtime Prediction Commands:"
	@echo "  make install     - Install Python dependencies"
	@echo "  make broker      - Start HiveMQ CE in Docker"
	@echo "  make seed-data   - Generate 30 days historical telemetry (< 2 min)"
	@echo "  make train       - Train XGBoost classifier, TTF regressor & Isolation Forest"
	@echo "  make simulate    - Run real-time factory line simulator publishing to MQTT"
	@echo "  make ingest      - Start MQTT ingestion subscriber saving to SQLite WAL"
	@echo "  make predict     - Start real-time ML inference service"
	@echo "  make dashboard   - Launch Streamlit dashboard"
	@echo "  make all         - Launch complete end-to-end pipeline"
	@echo "  make test        - Run unit test suite (pytest)"

install:
	python3 -m pip install -r requirements.txt

broker:
	docker compose up -d hivemq

seed-data:
	python3 src/simulator/cli.py --mode batch --duration-hours 720 --speedup 60

train:
	python3 src/ml/train.py --data data/historical_telemetry.db

simulate:
	python3 src/simulator/cli.py --mode live --speedup 1

ingest:
	python3 src/ingestion/subscriber.py

predict:
	python3 src/ml/predict.py

dashboard:
	streamlit run src/dashboard/app.py --server.port 8501

all: broker
	@echo "Starting full autonomous pipeline..."
	python3 src/simulator/cli.py --mode live &
	python3 src/ingestion/subscriber.py &
	python3 src/ml/predict.py &
	streamlit run src/dashboard/app.py

test:
	pytest tests/ -v
