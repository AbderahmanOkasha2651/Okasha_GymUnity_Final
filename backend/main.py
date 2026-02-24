"""Ensure .env is loaded before anything else."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Try backend/.env first (running from backend/), then try repo-root/backend/.env
_env_file = Path(__file__).resolve().parent / ".env"
if not _env_file.exists():
    _env_file = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(dotenv_path=str(_env_file), override=True)

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.ai_chat import router as ai_chat_router
from app.api.routes.ai_coach_v2 import router as ai_coach_v2_router
from app.api.routes.news import router as news_router
from app.api.routes.admin_news import router as admin_news_router
from app.api.routes.events import router as events_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)


@app.on_event('startup')
def on_startup():
    init_db()
    # ---- AI Coach startup diagnostics ----
    logger.info("=" * 50)
    logger.info("AI Coach Startup Diagnostics")
    logger.info("  .env path searched: %s", _env_file)
    logger.info("  GROQ_API_KEY present: %s", bool(settings.GROQ_API_KEY))
    logger.info("  GROQ_API_KEY length:  %d", len(settings.GROQ_API_KEY))
    logger.info("  GROQ_MODEL: %s", settings.GROQ_MODEL)
    logger.info("  CWD: %s", os.getcwd())
    logger.info("  PID: %d", os.getpid())
    from app.services.ai_coach.factory import get_coach_provider
    provider = get_coach_provider()
    logger.info("  Selected provider: %s", provider.__class__.__name__)
    logger.info("=" * 50)

    # ---- News pipeline scheduler ----
    if settings.NEWS_PIPELINE_ENABLED:
        from app.services.news_scheduler import start_news_scheduler
        start_news_scheduler(app, interval_minutes=settings.NEWS_PIPELINE_INTERVAL_MINUTES)
        logger.info("News scheduler started (every %d min)", settings.NEWS_PIPELINE_INTERVAL_MINUTES)
    else:
        logger.info("News scheduler DISABLED (NEWS_PIPELINE_ENABLED=false)")


@app.on_event('shutdown')
def on_shutdown():
    from app.services.news_scheduler import stop_news_scheduler
    stop_news_scheduler(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health_router)
app.include_router(auth_router, prefix='/auth')
app.include_router(users_router, prefix='/users')
app.include_router(ai_chat_router)
app.include_router(ai_coach_v2_router)
app.include_router(news_router)
app.include_router(admin_news_router)
app.include_router(events_router)
