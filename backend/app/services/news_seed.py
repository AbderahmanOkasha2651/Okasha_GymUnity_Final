import hashlib
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.news import NewsArticle, NewsSource
from app.services.news_sources import DEFAULT_NEWS_SOURCES


def seed_news_sources(db: Session) -> int:
    existing = db.query(NewsSource).count()
    if existing > 0:
        return 0

    for source in DEFAULT_NEWS_SOURCES:
        tags = ','.join([tag.strip().lower() for tag in source.get('tags', []) if tag.strip()])
        db.add(
            NewsSource(
                name=source['name'],
                rss_url=source['rss_url'],
                category=source.get('category'),
                tags=tags,
                enabled=source.get('enabled', True),
            )
        )
    db.commit()
    return len(DEFAULT_NEWS_SOURCES)


def seed_mock_articles(db: Session) -> int:
    existing = db.query(NewsArticle).count()
    if existing > 0:
        return 0

    sources = db.query(NewsSource).order_by(NewsSource.id).all()
    if not sources:
        return 0

    by_name = {source.name.lower(): source for source in sources}
    fallback_source = sources[0]

    def pick_source(name: str) -> NewsSource:
        return by_name.get(name.lower(), fallback_source)

    now = datetime.utcnow()
    mock_articles = [
        {
            'title': 'Beginner strength roadmap: 3 days that actually stick',
            'summary': 'A simple strength schedule built around compounds and steady progress.',
            'tags': 'strength,training,beginner',
            'link': 'https://example.com/news/strength-roadmap',
            'source': 'Breaking Muscle',
            'offset_days': 1,
        },
        {
            'title': 'Nutrition anchors for muscle gain without the stress',
            'summary': 'Protein timing and easy calorie boosts that fit busy routines.',
            'tags': 'nutrition,bodybuilding,muscle gain',
            'link': 'https://example.com/news/nutrition-anchors',
            'source': 'Mindbodygreen',
            'offset_days': 2,
        },
        {
            'title': 'Conditioning finisher ideas for fat loss phases',
            'summary': 'Short, focused finishers that lift heart rate without wrecking recovery.',
            'tags': 'cardio,weight loss,fat loss,training',
            'link': 'https://example.com/news/conditioning-finishers',
            'source': 'ACE Insights',
            'offset_days': 3,
        },
        {
            'title': 'Recovery checklists: sleep, hydration, and stress control',
            'summary': 'Daily habits that reduce soreness and keep your training consistent.',
            'tags': 'recovery,mental fitness,injury prevention',
            'link': 'https://example.com/news/recovery-checklist',
            'source': 'Mindbodygreen',
            'offset_days': 4,
        },
        {
            'title': 'Home workout upgrades with minimal equipment',
            'summary': 'Use bands, chairs, and tempo to keep progression moving at home.',
            'tags': 'home,bodyweight,training',
            'link': 'https://example.com/news/home-upgrades',
            'source': 'ACE Insights',
            'offset_days': 5,
        },
        {
            'title': 'Upper-body hypertrophy: volume that works',
            'summary': 'Effective weekly volume targets for shoulders, chest, and back.',
            'tags': 'bodybuilding,muscle gain,training',
            'link': 'https://example.com/news/hypertrophy-volume',
            'source': 'Breaking Muscle',
            'offset_days': 6,
        },
        {
            'title': 'Injury prevention: shoulder-friendly push workouts',
            'summary': 'Swap in joint-friendly angles while still hitting intensity.',
            'tags': 'injury prevention,recovery,training',
            'link': 'https://example.com/news/shoulder-friendly',
            'source': 'ACE Insights',
            'offset_days': 7,
        },
        {
            'title': 'Cardio zones explained: build endurance without burnout',
            'summary': 'Why Zone 2 training supports long-term fitness and recovery.',
            'tags': 'cardio,endurance,training',
            'link': 'https://example.com/news/cardio-zones',
            'source': 'Breaking Muscle',
            'offset_days': 8,
        },
    ]

    for entry in mock_articles:
        source = pick_source(entry['source'])
        published_at = now - timedelta(days=entry['offset_days'])
        unique_hash = hashlib.sha256(entry['link'].encode('utf-8')).hexdigest()
        db.add(
            NewsArticle(
                source_id=source.id,
                title=entry['title'],
                link=entry['link'],
                guid=entry['link'],
                unique_hash=unique_hash,
                published_at=published_at,
                author=None,
                summary=entry['summary'],
                content=None,
                image_url=None,
                tags=entry['tags'],
            )
        )

    db.commit()
    return len(mock_articles)
