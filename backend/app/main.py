from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.objects import router as objects_router
from app.api.roads import router as roads_router
from app.api.defects import router as defects_router
from app.api.contractors import router as contractors_router
from app.api.dashboard import router as dashboard_router
from app.api.assistant import router as assistant_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Единая система контроля инфраструктурных объектов и состояния дорог региона (Казахстан, G-TON)",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "region": settings.REGION_NAME,
        "demo_banner": settings.DEMO_BANNER_ACTIVE,
        "provider": settings.LLM_PROVIDER
    }

# Регистрация модулей API
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(objects_router, prefix=api_v1)
app.include_router(roads_router, prefix=api_v1)
app.include_router(defects_router, prefix=api_v1)
app.include_router(contractors_router, prefix=api_v1)
app.include_router(dashboard_router, prefix=api_v1)
app.include_router(assistant_router, prefix=api_v1)
