#!/bin/bash
set -e

echo "=========================================================="
echo "   RegionControl - Инфраструктура и Дороги Области        "
echo "   Запуск рабочего окружения (FastAPI + React)            "
echo "=========================================================="

# 1. Генерация фото
python3 backend/app/seed/generate_photos.py

# 2. Наполнение БД
python3 -c "import sys; sys.path.insert(0, 'backend'); from app.seed.generator import init_db, SessionLocal, seed_database; init_db(); db = SessionLocal(); seed_database(db); db.close()"

# 3. Запуск сервисов
trap 'kill 0' EXIT

python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000 &
cd frontend && npm run dev &

wait
