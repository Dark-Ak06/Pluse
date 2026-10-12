# RegionControl - Быстрый запуск для Windows PowerShell
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RegionControl - Инфраструктура и Дороги Области        " -ForegroundColor Yellow
Write-Host "   Запуск рабочего окружения (FastAPI + React)            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Генерация фото-ассетов
Write-Host "`n[1/3] Проверка демо-ассетов и фото..." -ForegroundColor Green
python backend/app/seed/generate_photos.py

# 2. Инициализация и сид базы данных при необходимости
Write-Host "`n[2/3] Наполнение базы данных Сарыарка (127 объектов, 20 дорог, 300 дефектов)..." -ForegroundColor Green
python -c "import sys; sys.path.insert(0, 'backend'); from app.seed.generator import init_db, SessionLocal, seed_database; init_db(); db = SessionLocal(); seed_database(db); db.close()"

# 3. Запуск Backend и Frontend
Write-Host "`n[3/3] Запуск сервисов..." -ForegroundColor Green
Write-Host "-> Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor Cyan
Write-Host "-> Frontend Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nДля остановки нажмите Ctrl+C в открывшихся окнах." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn app.main:app --app-dir backend --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm.cmd --prefix frontend run dev"
