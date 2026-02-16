from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.news import (
    NewsArticleOut,
    NewsChatRequest,
    NewsChatResponse,
    NewsFeedResponse,
    NewsSourceOut,
    PreferencesIn,
    PreferencesOut,
)
from app.services import news_service

router = APIRouter(tags=['news'])


@router.get('/news/sources', response_model=List[NewsSourceOut])
def list_sources(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return news_service.list_enabled_sources(db)


@router.get('/news/preferences', response_model=PreferencesOut)
def get_preferences(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return news_service.get_preferences(db, user)


@router.post('/news/preferences', response_model=PreferencesOut)
def update_preferences(
    payload: PreferencesIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return news_service.update_preferences(db, user, payload)


@router.get('/news/feed', response_model=NewsFeedResponse)
def get_personalized_feed(
    topic: str | None = None,
    source: str | None = None,
    q: str | None = None,
    from_date: str | None = Query(default=None, alias='from'),
    to_date: str | None = Query(default=None, alias='to'),
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return news_service.get_feed(db, user, topic, source, q, from_date, to_date, page, page_size)


@router.get('/news/explore', response_model=NewsFeedResponse)
def get_explore_feed(
    topic: str | None = None,
    source: str | None = None,
    q: str | None = None,
    from_date: str | None = Query(default=None, alias='from'),
    to_date: str | None = Query(default=None, alias='to'),
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return news_service.get_explore(db, user, topic, source, q, from_date, to_date, page, page_size)


@router.get('/news/saved', response_model=NewsFeedResponse)
def get_saved_feed(
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return news_service.get_saved(db, user, page, page_size)


@router.get('/news/articles/{article_id}', response_model=NewsArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return news_service.get_article(db, user, article_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/news/articles/{article_id}/save', status_code=status.HTTP_201_CREATED)
def save_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return news_service.save_article(db, user, article_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete('/news/articles/{article_id}/save')
def unsave_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return news_service.unsave_article(db, user, article_id)


@router.post('/news/articles/{article_id}/hide', status_code=status.HTTP_201_CREATED)
def hide_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return news_service.hide_article(db, user, article_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/news/chat', response_model=NewsChatResponse)
def news_chat(payload: NewsChatRequest, user: User = Depends(get_current_user)):
    message = payload.message.strip() or 'No message provided'
    return NewsChatResponse(**news_service.chat_stub(message))
