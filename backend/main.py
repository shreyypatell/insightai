"""
InsightAI FastAPI application.

This is the single entry point that wires together the database,
all API routers, CORS middleware, and startup/shutdown events.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.db import engine
from app.database import models

# Auto-create all tables on startup (idempotent - safe to run every boot)
models.Base.metadata.create_all(bind=engine)

from app.api import auth, datasets, cleaning, eda, models as ml_routes, reports

app = FastAPI(
    title="InsightAI API",
    description="Intelligent Data Analytics & Machine Learning Platform",
    version="1.0.0",
)

# ----- CORS -----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Routers -----
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(cleaning.router)
app.include_router(eda.router)
app.include_router(ml_routes.router)
app.include_router(reports.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.app_name}
