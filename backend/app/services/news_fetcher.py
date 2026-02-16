from datetime import datetime

from sqlalchemy.orm import Session

from app.models.news import NewsSource


def fetch_news(db: Session) -> dict:
    sources = db.query(NewsSource).filter(NewsSource.enabled.is_(True)).all()
    for source in sources:
        source.last_fetched_at = datetime.utcnow()
    db.commit()

    return {
        'fetched_at': datetime.utcnow(),
        'sources_checked': len(sources),
        'sources_success': len(sources),
        'sources_failed': 0,
        'articles_new': 0,
        'articles_total': 0,
    }
