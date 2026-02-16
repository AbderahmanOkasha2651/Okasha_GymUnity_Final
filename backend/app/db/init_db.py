from app.db.base import Base
from app.db.session import SessionLocal, engine
import app.models.user
import app.models.news
import app.models.ai_coach
from app.services.news_seed import seed_mock_articles, seed_news_sources


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_news_sources(db)
        seed_mock_articles(db)
    finally:
        db.close()
