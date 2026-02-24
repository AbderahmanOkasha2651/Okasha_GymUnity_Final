from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.base import Base
from app.db.session import SessionLocal, engine
import app.models.user
import app.models.news
import app.models.ai_coach
from app.models.news import NewsSource
from app.services.default_news_sources import DEFAULT_NEWS_SOURCES


def _add_column_if_missing(conn, table: str, column: str, sql_type: str, default: str = ''):
    """Safely add a column to an existing table (SQLite compatible)."""
    ddl = f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"
    if default:
        ddl += f" DEFAULT {default}"
    try:
        conn.execute(text(ddl))
        conn.commit()
    except OperationalError:
        conn.rollback()  # Column already exists — fine


def _migrate_columns():
    """Add new recommender columns to existing tables if they don't exist yet."""
    with engine.connect() as conn:
        # NewsArticle new columns
        _add_column_if_missing(conn, 'news_articles', 'language', "TEXT", "'en'")
        _add_column_if_missing(conn, 'news_articles', 'topics_json', "TEXT", "'[]'")
        _add_column_if_missing(conn, 'news_articles', 'keywords_json', "TEXT", "'[]'")
        _add_column_if_missing(conn, 'news_articles', 'quality_score', "REAL", "0.5")
        _add_column_if_missing(conn, 'news_articles', 'popularity_score', "REAL", "0.0")
        _add_column_if_missing(conn, 'news_articles', 'content_hash', "TEXT", "NULL")

        # NewsSource new columns
        _add_column_if_missing(conn, 'news_sources', 'priority', "INTEGER", "1")
        _add_column_if_missing(conn, 'news_sources', 'fetch_error_count', "INTEGER", "0")
        _add_column_if_missing(conn, 'news_sources', 'last_error', "TEXT", "NULL")


def seed_default_sources(db):
    """Seed the 5 Tier-1 default sources. Idempotent: uses rss_url as unique key."""
    for src in DEFAULT_NEWS_SOURCES:
        exists = db.query(NewsSource).filter(NewsSource.rss_url == src['rss_url']).first()
        if not exists:
            tags_csv = ','.join([t.strip().lower() for t in src.get('tags', []) if t.strip()])
            db.add(NewsSource(
                name=src['name'],
                rss_url=src['rss_url'],
                category=src.get('category'),
                tags=tags_csv,
                priority=src.get('priority', 1),
                enabled=src.get('enabled', True),
            ))
    db.commit()


def init_db():
    # Create all tables (including new recommender tables)
    Base.metadata.create_all(bind=engine)

    # Add new columns to existing tables (SQLite-safe)
    _migrate_columns()

    db = SessionLocal()
    try:
        # Seed Tier-1 default sources (idempotent, won't touch admin sources)
        seed_default_sources(db)
    finally:
        db.close()
