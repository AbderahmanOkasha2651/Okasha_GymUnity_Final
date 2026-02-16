from datetime import datetime
from typing import List

from sqlalchemy import case, or_
from sqlalchemy.orm import Session

from app.models.news import (
    NewsArticle,
    NewsSource,
    UserHiddenArticle,
    UserNewsPreference,
    UserSavedArticle,
)
from app.models.user import User
from app.schemas.news import (
    FetchNowResponse,
    NewsArticleOut,
    NewsFeedResponse,
    NewsSourceCreate,
    NewsSourceOut,
    NewsSourceUpdate,
    NewsStatusOut,
    PreferencesIn,
    PreferencesOut,
)


# TODO: Replace stub data with pipeline + vector store integration.
NEWS_STATUS = {
    'last_run': None,
    'sources_checked': 0,
    'sources_success': 0,
    'sources_failed': 0,
    'items_ingested': 0,
    'last_error': None,
}


def _split_csv(value: str | None) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def _list_to_csv(items: List[str]) -> str:
    normalized = []
    for item in items:
        cleaned = item.strip().lower()
        if cleaned and cleaned not in normalized:
            normalized.append(cleaned)
    return ','.join(normalized)


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _get_or_create_preferences(db: Session, user: User) -> UserNewsPreference:
    pref = db.get(UserNewsPreference, user.id)
    if pref:
        return pref

    pref = UserNewsPreference(
        user_id=user.id,
        topics='',
        level='beginner',
        equipment='gym',
        blocked_keywords='',
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


def _serialize_source(source: NewsSource) -> NewsSourceOut:
    return NewsSourceOut(
        id=source.id,
        name=source.name,
        rss_url=source.rss_url,
        category=source.category,
        tags=_split_csv(source.tags),
        enabled=source.enabled,
        created_at=source.created_at,
        last_fetched_at=source.last_fetched_at,
    )


def _serialize_article(article: NewsArticle, saved: bool) -> NewsArticleOut:
    return NewsArticleOut(
        id=article.id,
        title=article.title,
        link=article.link,
        guid=article.guid,
        published_at=article.published_at,
        author=article.author,
        summary=article.summary,
        content=article.content,
        image_url=article.image_url,
        tags=_split_csv(article.tags),
        source=_serialize_source(article.source),
        saved=saved,
    )


def list_enabled_sources(db: Session) -> List[NewsSourceOut]:
    sources = db.query(NewsSource).filter(NewsSource.enabled.is_(True)).order_by(NewsSource.name).all()
    return [_serialize_source(source) for source in sources]


def list_all_sources(db: Session) -> List[NewsSourceOut]:
    sources = db.query(NewsSource).order_by(NewsSource.name).all()
    return [_serialize_source(source) for source in sources]


def get_preferences(db: Session, user: User) -> PreferencesOut:
    pref = _get_or_create_preferences(db, user)
    return PreferencesOut(
        topics=_split_csv(pref.topics),
        level=pref.level,
        equipment=pref.equipment,
        blocked_keywords=_split_csv(pref.blocked_keywords),
    )


def update_preferences(db: Session, user: User, payload: PreferencesIn) -> PreferencesOut:
    pref = _get_or_create_preferences(db, user)
    pref.topics = _list_to_csv(payload.topics)
    pref.level = payload.level
    pref.equipment = payload.equipment
    pref.blocked_keywords = _list_to_csv(payload.blocked_keywords)
    pref.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(pref)
    return PreferencesOut(
        topics=_split_csv(pref.topics),
        level=pref.level,
        equipment=pref.equipment,
        blocked_keywords=_split_csv(pref.blocked_keywords),
    )


def _apply_article_filters(
    query,
    topic_filters: List[str],
    source_filter: str | None,
    search_query: str | None,
    from_date: datetime | None,
    to_date: datetime | None,
):
    if source_filter:
        try:
            source_id = int(source_filter)
            query = query.filter(NewsArticle.source_id == source_id)
        except ValueError:
            query = query.filter(NewsSource.name.ilike(f'%{source_filter}%'))

    if search_query:
        query = query.filter(
            or_(
                NewsArticle.title.ilike(f'%{search_query}%'),
                NewsArticle.summary.ilike(f'%{search_query}%'),
            )
        )

    if from_date:
        query = query.filter(NewsArticle.published_at >= from_date)

    if to_date:
        query = query.filter(NewsArticle.published_at <= to_date)

    if topic_filters:
        topic_conditions = [NewsArticle.tags.ilike(f'%{topic}%') for topic in topic_filters]
        query = query.filter(or_(*topic_conditions))

    return query


def _apply_blocked_keywords(query, blocked_keywords: List[str]):
    for keyword in blocked_keywords:
        query = query.filter(
            ~or_(
                NewsArticle.title.ilike(f'%{keyword}%'),
                NewsArticle.summary.ilike(f'%{keyword}%'),
            )
        )
    return query


def _paginate(query, page: int, page_size: int):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return total, items


def get_feed(
    db: Session,
    user: User,
    topic: str | None,
    source: str | None,
    q: str | None,
    from_date: str | None,
    to_date: str | None,
    page: int,
    page_size: int,
) -> NewsFeedResponse:
    pref = _get_or_create_preferences(db, user)
    pref_topics = _split_csv(pref.topics)
    topic_filters = _split_csv(topic) if topic else pref_topics
    blocked_keywords = _split_csv(pref.blocked_keywords)

    query = db.query(NewsArticle).join(NewsSource).filter(NewsSource.enabled.is_(True))
    query = _apply_article_filters(query, topic_filters, source, q, _parse_date(from_date), _parse_date(to_date))
    query = _apply_blocked_keywords(query, blocked_keywords)

    hidden_subquery = (
        db.query(UserHiddenArticle.article_id)
        .filter(UserHiddenArticle.user_id == user.id)
        .subquery()
    )
    query = query.filter(~NewsArticle.id.in_(hidden_subquery))

    if topic_filters:
        score = None
        for item in topic_filters:
            condition = case((NewsArticle.tags.ilike(f'%{item}%'), 1), else_=0)
            score = condition if score is None else score + condition
        query = query.order_by(score.desc(), NewsArticle.published_at.desc())
    else:
        query = query.order_by(NewsArticle.published_at.desc())

    page = max(1, page)
    page_size = min(max(1, page_size), 50)
    total, items = _paginate(query, page, page_size)

    article_ids = [article.id for article in items]
    saved_ids = set(
        row[0]
        for row in db.query(UserSavedArticle.article_id)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id.in_(article_ids))
        .all()
    )

    return NewsFeedResponse(
        items=[_serialize_article(article, article.id in saved_ids) for article in items],
        page=page,
        page_size=page_size,
        total=total,
    )


def get_explore(
    db: Session,
    user: User,
    topic: str | None,
    source: str | None,
    q: str | None,
    from_date: str | None,
    to_date: str | None,
    page: int,
    page_size: int,
) -> NewsFeedResponse:
    query = db.query(NewsArticle).join(NewsSource).filter(NewsSource.enabled.is_(True))
    topic_filters = _split_csv(topic)
    query = _apply_article_filters(query, topic_filters, source, q, _parse_date(from_date), _parse_date(to_date))

    hidden_subquery = (
        db.query(UserHiddenArticle.article_id)
        .filter(UserHiddenArticle.user_id == user.id)
        .subquery()
    )
    query = query.filter(~NewsArticle.id.in_(hidden_subquery))

    query = query.order_by(NewsArticle.published_at.desc())

    page = max(1, page)
    page_size = min(max(1, page_size), 50)
    total, items = _paginate(query, page, page_size)

    article_ids = [article.id for article in items]
    saved_ids = set(
        row[0]
        for row in db.query(UserSavedArticle.article_id)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id.in_(article_ids))
        .all()
    )

    return NewsFeedResponse(
        items=[_serialize_article(article, article.id in saved_ids) for article in items],
        page=page,
        page_size=page_size,
        total=total,
    )


def get_saved(db: Session, user: User, page: int, page_size: int) -> NewsFeedResponse:
    page = max(1, page)
    page_size = min(max(1, page_size), 50)

    saved_subquery = (
        db.query(UserSavedArticle.article_id)
        .filter(UserSavedArticle.user_id == user.id)
        .subquery()
    )
    query = (
        db.query(NewsArticle)
        .join(NewsSource)
        .filter(NewsArticle.id.in_(saved_subquery), NewsSource.enabled.is_(True))
        .order_by(NewsArticle.published_at.desc())
    )

    total, items = _paginate(query, page, page_size)
    return NewsFeedResponse(
        items=[_serialize_article(article, True) for article in items],
        page=page,
        page_size=page_size,
        total=total,
    )


def get_article(db: Session, user: User, article_id: int) -> NewsArticleOut:
    article = db.get(NewsArticle, article_id)
    if not article:
        raise ValueError('Article not found')

    saved = (
        db.query(UserSavedArticle)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id == article_id)
        .first()
        is not None
    )
    return _serialize_article(article, saved)


def save_article(db: Session, user: User, article_id: int) -> dict:
    article = db.get(NewsArticle, article_id)
    if not article:
        raise ValueError('Article not found')

    existing = (
        db.query(UserSavedArticle)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id == article_id)
        .first()
    )
    if existing:
        return {'status': 'already_saved'}

    db.add(UserSavedArticle(user_id=user.id, article_id=article_id))
    db.commit()
    return {'status': 'saved'}


def unsave_article(db: Session, user: User, article_id: int) -> dict:
    saved = (
        db.query(UserSavedArticle)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id == article_id)
        .first()
    )
    if not saved:
        return {'status': 'not_saved'}
    db.delete(saved)
    db.commit()
    return {'status': 'deleted'}


def hide_article(db: Session, user: User, article_id: int) -> dict:
    article = db.get(NewsArticle, article_id)
    if not article:
        raise ValueError('Article not found')

    existing = (
        db.query(UserHiddenArticle)
        .filter(UserHiddenArticle.user_id == user.id, UserHiddenArticle.article_id == article_id)
        .first()
    )
    if existing:
        return {'status': 'already_hidden'}

    db.add(UserHiddenArticle(user_id=user.id, article_id=article_id))
    saved = (
        db.query(UserSavedArticle)
        .filter(UserSavedArticle.user_id == user.id, UserSavedArticle.article_id == article_id)
        .first()
    )
    if saved:
        db.delete(saved)
    db.commit()
    return {'status': 'hidden'}


def chat_stub(message: str) -> dict:
    return {
        'reply': f"Pipeline not connected yet. I received: '{message}'.",
        'follow_up': 'Try again later or check Explore for the latest updates.',
    }


def admin_create_source(db: Session, payload: NewsSourceCreate) -> NewsSourceOut:
    existing = db.query(NewsSource).filter(NewsSource.rss_url == payload.rss_url).first()
    if existing:
        raise ValueError('RSS URL already exists')

    source = NewsSource(
        name=payload.name,
        rss_url=payload.rss_url,
        category=payload.category,
        tags=_list_to_csv(payload.tags),
        enabled=payload.enabled,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _serialize_source(source)


def admin_update_source(db: Session, source_id: int, payload: NewsSourceUpdate) -> NewsSourceOut:
    source = db.get(NewsSource, source_id)
    if not source:
        raise ValueError('Source not found')

    if payload.name is not None:
        source.name = payload.name
    if payload.rss_url is not None:
        source.rss_url = payload.rss_url
    if payload.category is not None:
        source.category = payload.category
    if payload.tags is not None:
        source.tags = _list_to_csv(payload.tags)
    if payload.enabled is not None:
        source.enabled = payload.enabled

    db.commit()
    db.refresh(source)
    return _serialize_source(source)


def admin_toggle_source(db: Session, source_id: int) -> NewsSourceOut:
    source = db.get(NewsSource, source_id)
    if not source:
        raise ValueError('Source not found')
    source.enabled = not source.enabled
    db.commit()
    db.refresh(source)
    return _serialize_source(source)


def admin_delete_source(db: Session, source_id: int) -> None:
    source = db.get(NewsSource, source_id)
    if not source:
        raise ValueError('Source not found')
    db.delete(source)
    db.commit()


def admin_fetch_now(db: Session) -> FetchNowResponse:
    sources_enabled = db.query(NewsSource).filter(NewsSource.enabled.is_(True)).count()
    now = datetime.utcnow()

    NEWS_STATUS.update(
        {
            'last_run': now,
            'sources_checked': sources_enabled,
            'sources_success': sources_enabled,
            'sources_failed': 0,
            'items_ingested': 0,
            'last_error': None,
        }
    )

    db.query(NewsSource).filter(NewsSource.enabled.is_(True)).update(
        {NewsSource.last_fetched_at: now}
    )
    db.commit()

    return FetchNowResponse(
        fetched_at=now,
        sources_checked=NEWS_STATUS['sources_checked'],
        sources_success=NEWS_STATUS['sources_success'],
        sources_failed=NEWS_STATUS['sources_failed'],
        items_ingested=NEWS_STATUS['items_ingested'],
        last_error=NEWS_STATUS['last_error'],
    )


def admin_status(db: Session) -> NewsStatusOut:
    sources_enabled = db.query(NewsSource).filter(NewsSource.enabled.is_(True)).count()
    if NEWS_STATUS['last_run'] is None:
        NEWS_STATUS['sources_checked'] = sources_enabled
        NEWS_STATUS['sources_success'] = sources_enabled
        NEWS_STATUS['sources_failed'] = 0
        NEWS_STATUS['items_ingested'] = 0

    return NewsStatusOut(
        last_run=NEWS_STATUS['last_run'],
        sources_checked=NEWS_STATUS['sources_checked'],
        sources_success=NEWS_STATUS['sources_success'],
        sources_failed=NEWS_STATUS['sources_failed'],
        items_ingested=NEWS_STATUS['items_ingested'],
        last_error=NEWS_STATUS['last_error'],
    )
