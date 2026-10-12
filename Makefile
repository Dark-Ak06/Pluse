.PHONY: dev seed test install build docker-up docker-down

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

seed:
	python backend/app/seed/generate_photos.py
	python -c "import sys; sys.path.insert(0, 'backend'); from app.seed.generator import init_db, SessionLocal, seed_database; init_db(); db = SessionLocal(); seed_database(db); db.close()"

test:
	python -m pytest -c backend/pytest.ini backend/tests

dev:
	@echo "Запуск RegionControl..."
	python backend/app/seed/generate_photos.py
	python -c "import sys; sys.path.insert(0, 'backend'); from app.seed.generator import init_db, SessionLocal, seed_database; init_db(); db = SessionLocal(); seed_database(db); db.close()"
	uvicorn app.main:app --app-dir backend --reload --port 8000 &
	cd frontend && npm run dev

docker-up:
	docker compose up --build

docker-down:
	docker compose down
