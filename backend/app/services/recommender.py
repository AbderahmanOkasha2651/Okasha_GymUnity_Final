"""Hybrid recommendation engine.

Combines 4 candidate pools (vector, topic, trending, newest),
applies filtering, scoring, diversity reranking, and explainability.
"""

from __future__ import annotations

import json
import logging
import math
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.news import (
    FeedImpression,
    NewsArticle,
    NewsSource,
    UserEvent,
    UserHiddenArticle,
    UserNewsPreference,
    UserSavedArticle,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Weight configuration (easy to tune)
# ---------------------------------------------------------------------------
W_SIMILARITY = 0.30
W_RECENCY = 0.25
W_PREFERENCE = 0.20
W_POPULARITY = 0.15
W_QUALITY = 0.10
P_SEEN = 0.50
P_SOURCE_FATIGUE = 0.20

# Implicit event signal weights
EVENT_WEIGHTS = {
    'impression': -0.1,
    'click': 0.3,
    'save': 1.0,
    'unsave': -0.5,
    'hide': -2.0,
    'dwell': 0.5,  # base for dwell > 30s
}

FRESHNESS_WINDOW_DAYS = 14
MAX_PER_SOURCE = 2
MAX_PER_TOPIC = 3


# ---------------------------------------------------------------------------
# User profile
# ---------------------------------------------------------------------------

@dataclass
class UserProfile:
    user_id: int
    topics: list[str] = field(default_factory=list)
    level: str = 'beginner'
    equipment: str = 'gym'
    blocked_keywords: list[str] = field(default_factory=list)
    topic_affinities: dict[str, float] = field(default_factory=dict)
    source_affinities: dict[int, float] = field(default_factory=dict)
    recent_article_ids: set[int] = field(default_factory=set)
    hidden_article_ids: set[int] = field(default_factory=set)
    recent_impression_ids: set[int] = field(default_factory=set)


def build_user_profile(db: Session, user_id: int) -> UserProfile:
    """Build user profile from explicit preferences and implicit events."""
    profile = UserProfile(user_id=user_id)

    # --- Explicit preferences ---
    prefs = db.query(UserNewsPreference).filter(
        UserNewsPreference.user_id == user_id
    ).first()
    if prefs:
        profile.topics = [t.strip() for t in (prefs.topics or '').split(',') if t.strip()]
        profile.level = prefs.level or 'beginner'
        profile.equipment = prefs.equipment or 'gym'
        profile.blocked_keywords = [k.strip().lower() for k in (prefs.blocked_keywords or '').split(',') if k.strip()]

    # --- Hidden articles ---
    hidden = db.query(UserHiddenArticle.article_id).filter(
        UserHiddenArticle.user_id == user_id
    ).all()
    profile.hidden_article_ids = {h[0] for h in hidden}

    # --- Recent impressions (last 24h) ---
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    impressions = db.query(FeedImpression.article_id).filter(
        FeedImpression.user_id == user_id,
        FeedImpression.created_at >= cutoff_24h,
    ).all()
    profile.recent_impression_ids = {i[0] for i in impressions}

    # --- Implicit signals from events (last 30 days) ---
    cutoff_30d = datetime.utcnow() - timedelta(days=30)
    events = db.query(UserEvent).filter(
        UserEvent.user_id == user_id,
        UserEvent.created_at >= cutoff_30d,
    ).all()

    topic_scores: dict[str, float] = {}
    source_scores: dict[int, float] = {}
    interacted_ids: set[int] = set()

    for event in events:
        weight = EVENT_WEIGHTS.get(event.event_type, 0)
        if event.event_type == 'dwell' and event.dwell_seconds:
            if event.dwell_seconds >= 60:
                weight = 1.0
            elif event.dwell_seconds >= 30:
                weight = 0.5
            else:
                weight = 0.1

        interacted_ids.add(event.article_id)

        # Look up article topics
        article = db.get(NewsArticle, event.article_id)
        if article:
            topics = []
            try:
                topics = json.loads(article.topics_json) if article.topics_json else []
            except Exception:
                pass
            for topic in topics:
                topic_scores[topic] = topic_scores.get(topic, 0) + weight
            source_scores[article.source_id] = source_scores.get(article.source_id, 0) + weight

    # Normalize affinities to [0, 1]
    if topic_scores:
        max_score = max(abs(v) for v in topic_scores.values()) or 1
        profile.topic_affinities = {k: max(0, min(1, (v / max_score + 1) / 2)) for k, v in topic_scores.items()}
    if source_scores:
        max_score = max(abs(v) for v in source_scores.values()) or 1
        profile.source_affinities = {k: max(0, min(1, (v / max_score + 1) / 2)) for k, v in source_scores.items()}

    profile.recent_article_ids = interacted_ids

    return profile


# ---------------------------------------------------------------------------
# Candidate generation
# ---------------------------------------------------------------------------

@dataclass
class Candidate:
    article: NewsArticle
    pool: str  # 'vector' | 'topic' | 'trending' | 'newest'
    similarity: float = 0.0


def _get_topic_candidates(db: Session, profile: UserProfile, limit: int = 30) -> list[Candidate]:
    """Get articles matching user's top topics from the last 14 days."""
    cutoff = datetime.utcnow() - timedelta(days=FRESHNESS_WINDOW_DAYS)
    top_topics = profile.topics[:3] if profile.topics else []
    if not top_topics and profile.topic_affinities:
        top_topics = sorted(profile.topic_affinities, key=profile.topic_affinities.get, reverse=True)[:3]

    if not top_topics:
        return []

    query = db.query(NewsArticle).join(NewsSource).filter(
        NewsSource.enabled.is_(True),
        NewsArticle.published_at >= cutoff,
    )

    # Filter by topics using LIKE on topics_json
    from sqlalchemy import or_
    topic_filters = [NewsArticle.topics_json.contains(f'"{t}"') for t in top_topics]
    query = query.filter(or_(*topic_filters))

    articles = query.order_by(NewsArticle.published_at.desc()).limit(limit).all()
    return [Candidate(article=a, pool='topic') for a in articles]


def _get_trending_candidates(db: Session, limit: int = 20) -> list[Candidate]:
    """Get articles with highest popularity score from last 3 days."""
    cutoff = datetime.utcnow() - timedelta(days=3)
    articles = (
        db.query(NewsArticle).join(NewsSource)
        .filter(NewsSource.enabled.is_(True), NewsArticle.published_at >= cutoff)
        .order_by(NewsArticle.popularity_score.desc())
        .limit(limit)
        .all()
    )
    return [Candidate(article=a, pool='trending') for a in articles]


def _get_newest_candidates(db: Session, limit: int = 20) -> list[Candidate]:
    """Get most recent articles regardless of topic."""
    articles = (
        db.query(NewsArticle).join(NewsSource)
        .filter(NewsSource.enabled.is_(True))
        .order_by(NewsArticle.published_at.desc())
        .limit(limit)
        .all()
    )
    return [Candidate(article=a, pool='newest') for a in articles]


def _get_vector_candidates(db: Session, profile: UserProfile, limit: int = 50) -> list[Candidate]:
    """Get candidates via vector similarity search."""
    try:
        from app.services.vector_store import get_vector_store
        from app.services.embedder import embed_user_query

        store = get_vector_store()
        if store.count() == 0:
            return []

        # Build query from user topics
        query_text = ' '.join(profile.topics) if profile.topics else 'fitness training workout'
        if profile.topic_affinities:
            top_affinity_topics = sorted(
                profile.topic_affinities, key=profile.topic_affinities.get, reverse=True
            )[:5]
            query_text = ' '.join(top_affinity_topics) + ' ' + query_text

        query_vector = embed_user_query(query_text)
        if query_vector is None:
            return []

        results = store.search(query_vector=query_vector, top_k=limit)

        candidates = []
        for hit in results:
            article_id = int(hit['id'])
            article = db.get(NewsArticle, article_id)
            if article:
                candidates.append(Candidate(
                    article=article,
                    pool='vector',
                    similarity=hit.get('score', 0.0),
                ))
        return candidates

    except Exception as exc:
        logger.warning('Vector search failed (%s), using SQL-only pools', exc)
        return []


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def _filter_candidates(candidates: list[Candidate], profile: UserProfile) -> list[Candidate]:
    """Remove articles that should not be shown."""
    cutoff = datetime.utcnow() - timedelta(days=FRESHNESS_WINDOW_DAYS)
    filtered = []

    for c in candidates:
        a = c.article
        # Skip hidden
        if a.id in profile.hidden_article_ids:
            continue
        # Skip recently shown
        if a.id in profile.recent_impression_ids:
            continue
        # Skip disabled sources
        if a.source and not a.source.enabled:
            continue
        # Skip stale articles
        if a.published_at and a.published_at < cutoff:
            continue
        # Skip blocked keywords
        if profile.blocked_keywords:
            text = f'{a.title} {a.summary}'.lower()
            if any(kw in text for kw in profile.blocked_keywords):
                continue
        # Skip non-English (if preference is English)
        if hasattr(a, 'language') and a.language and a.language != 'en':
            continue

        filtered.append(c)

    return filtered


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _score_candidate(c: Candidate, profile: UserProfile, source_counts: Counter) -> float:
    """Compute ranking score for a candidate article."""
    a = c.article

    # Similarity (from vector search or 0)
    similarity = c.similarity

    # Recency decay
    if a.published_at:
        days_old = max(0, (datetime.utcnow() - a.published_at).total_seconds() / 86400)
        recency = math.exp(-0.1 * days_old)
    else:
        recency = 0.3  # Unknown date penalty

    # Preference match
    pref_match = 0.0
    try:
        article_topics = json.loads(a.topics_json) if a.topics_json else []
    except Exception:
        article_topics = []

    for topic in article_topics:
        if topic in profile.topics:
            pref_match = 1.0
            break
        if topic in profile.topic_affinities:
            pref_match = max(pref_match, profile.topic_affinities[topic])

    # Popularity (normalized)
    popularity = min(1.0, max(0, a.popularity_score) / 100) if a.popularity_score else 0

    # Quality
    quality = a.quality_score if a.quality_score else 0.5

    # Penalties
    seen_penalty = P_SEEN if a.id in profile.recent_article_ids else 0
    fatigue_penalty = P_SOURCE_FATIGUE if source_counts.get(a.source_id, 0) >= 3 else 0

    score = (
        W_SIMILARITY * similarity
        + W_RECENCY * recency
        + W_PREFERENCE * pref_match
        + W_POPULARITY * popularity
        + W_QUALITY * quality
        - seen_penalty
        - fatigue_penalty
    )

    return round(score, 4)


# ---------------------------------------------------------------------------
# Diversity rerank
# ---------------------------------------------------------------------------

def _diversify(ranked: list[Candidate], page_size: int) -> list[Candidate]:
    """Greedy diversification: limit repetition of same source/topic."""
    result = []
    source_count: Counter = Counter()
    topic_count: Counter = Counter()

    for c in ranked:
        if source_count[c.article.source_id] >= MAX_PER_SOURCE:
            continue
        try:
            topics = json.loads(c.article.topics_json) if c.article.topics_json else ['general']
        except Exception:
            topics = ['general']
        primary_topic = topics[0] if topics else 'general'
        if topic_count[primary_topic] >= MAX_PER_TOPIC:
            continue

        result.append(c)
        source_count[c.article.source_id] += 1
        topic_count[primary_topic] += 1

        if len(result) >= page_size:
            break

    return result


# ---------------------------------------------------------------------------
# Explainability
# ---------------------------------------------------------------------------

def _explain(c: Candidate, score: float, profile: UserProfile) -> dict:
    """Generate why_this explanation for an article."""
    reasons = []

    try:
        topics = json.loads(c.article.topics_json) if c.article.topics_json else []
    except Exception:
        topics = []

    for topic in topics:
        if topic in profile.topics:
            reasons.append(f'matched_topic:{topic}')
            break
        if topic in profile.topic_affinities and profile.topic_affinities[topic] > 0.5:
            reasons.append(f'affinity_topic:{topic}')
            break

    if c.similarity > 0.5:
        reasons.append('high_similarity')
    if c.article.published_at and (datetime.utcnow() - c.article.published_at).days < 2:
        reasons.append('freshness_boost')
    if c.article.quality_score and c.article.quality_score >= 0.8:
        reasons.append('high_quality')
    if c.article.popularity_score and c.article.popularity_score > 10:
        reasons.append('trending')
    if c.pool == 'newest':
        reasons.append('newest')

    if not reasons:
        reasons.append('diverse_pick')

    return {
        'reasons': reasons,
        'score': round(score, 3),
        'pool': c.pool,
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def get_recommended_feed(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 12,
    explain: bool = False,
) -> dict:
    """Run the full hybrid recommendation pipeline.

    Returns ``{items: [...], page, page_size, total}``.
    """
    profile = build_user_profile(db, user_id)

    # 1. Candidate generation (4 pools)
    all_candidates: dict[int, Candidate] = {}

    for c in _get_vector_candidates(db, profile, limit=50):
        if c.article.id not in all_candidates:
            all_candidates[c.article.id] = c

    for c in _get_topic_candidates(db, profile, limit=30):
        if c.article.id not in all_candidates:
            all_candidates[c.article.id] = c

    for c in _get_trending_candidates(db, limit=20):
        if c.article.id not in all_candidates:
            all_candidates[c.article.id] = c

    for c in _get_newest_candidates(db, limit=20):
        if c.article.id not in all_candidates:
            all_candidates[c.article.id] = c

    candidates = list(all_candidates.values())

    # 2. Filter
    candidates = _filter_candidates(candidates, profile)

    # 3. Score
    source_counts: Counter = Counter()
    scored: list[tuple[Candidate, float]] = []
    for c in candidates:
        score = _score_candidate(c, profile, source_counts)
        scored.append((c, score))
        source_counts[c.article.source_id] += 1

    # 4. Sort by score
    scored.sort(key=lambda x: x[1], reverse=True)
    ranked = [c for c, _ in scored]
    scores = {c.article.id: s for c, s in scored}

    # 5. Diversity rerank (over-fetch then paginate)
    diversified = _diversify(ranked, page_size=page_size * 3)  # Get enough for multiple pages
    total = len(diversified)

    # 6. Paginate
    start = (page - 1) * page_size
    end = start + page_size
    page_items = diversified[start:end]

    # 7. Log impressions
    for pos, c in enumerate(page_items):
        db.add(FeedImpression(
            user_id=user_id,
            article_id=c.article.id,
            position=start + pos,
            feed_type='feed',
        ))
    db.commit()

    # 8. Build response
    from app.services.news_service import _serialize_article
    from app.models.news import UserSavedArticle as SavedModel

    saved_ids = set()
    if page_items:
        saved_rows = db.query(SavedModel.article_id).filter(
            SavedModel.user_id == user_id,
            SavedModel.article_id.in_([c.article.id for c in page_items]),
        ).all()
        saved_ids = {r[0] for r in saved_rows}

    items = []
    for c in page_items:
        article_out = _serialize_article(c.article, saved=c.article.id in saved_ids)
        article_dict = article_out.model_dump() if hasattr(article_out, 'model_dump') else dict(article_out)
        if explain:
            article_dict['why_this'] = _explain(c, scores.get(c.article.id, 0), profile)
        items.append(article_dict)

    return {
        'items': items,
        'page': page,
        'page_size': page_size,
        'total': total,
    }
