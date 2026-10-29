from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.api.router import api_router
from app.seed.seed_data import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo bảng dữ liệu và seed tự động nếu chưa có
    Base.metadata.create_all(bind=engine)
    try:
        seed_data()
    except Exception as e:
        print(f"Seed note: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="TechGear Store - Nền tảng thương mại điện tử chuyên phụ kiện công nghệ gaming cao cấp",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "project": "TechGear Store API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

