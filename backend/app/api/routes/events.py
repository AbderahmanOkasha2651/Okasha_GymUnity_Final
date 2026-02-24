"""User event tracking endpoint.

POST /news/events — receives batched user interaction events
(impressions, clicks, saves, hides, dwell time) for the feedback loop.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.news import NewsArticle, UserEvent
from app.models.user import User
from app.schemas.events import EventBatch, EventBatchResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=['events'])

# Dedup window: same (user, article, event_type, session) within 5 minutes
DEDUP_WINDOW = timedelta(minutes=5)

# Popularity score adjustments per event type
POPULARITY_WEIGHTS = {
    'click': 1.0,
    'save': 3.0,
    'hide': -5.0,
    'unsave': -1.0,
}


@router.post('/news/events', response_model=EventBatchResponse)
def submit_events(
    payload: EventBatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    accepted = 0
    duplicates = 0
    cutoff = datetime.utcnow() - DEDUP_WINDOW

    for event in payload.events:
        # Dedup check
        existing = db.query(UserEvent).filter(
            UserEvent.user_id == user.id,
            UserEvent.article_id == event.article_id,
            UserEvent.event_type == event.event_type,
            UserEvent.created_at >= cutoff,
        )
        if event.session_id:
            existing = existing.filter(UserEvent.session_id == event.session_id)

        if existing.first():
            duplicates += 1
            continue

        db.add(UserEvent(
            user_id=user.id,
            article_id=event.article_id,
            event_type=event.event_type,
            dwell_seconds=event.dwell_seconds,
            session_id=event.session_id,
        ))

        # Update popularity score on the article
        weight = POPULARITY_WEIGHTS.get(event.event_type, 0)
        if weight != 0:
            article = db.get(NewsArticle, event.article_id)
            if article:
                article.popularity_score = max(0, (article.popularity_score or 0) + weight)

        accepted += 1

    db.commit()
    logger.info('User %d submitted %d events (%d accepted, %d deduped)',
                user.id, len(payload.events), accepted, duplicates)

    return EventBatchResponse(accepted=accepted, duplicates_skipped=duplicates)
