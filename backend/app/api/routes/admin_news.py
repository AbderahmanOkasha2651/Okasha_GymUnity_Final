from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_role
from app.schemas.news import (
    FetchNowResponse,
    NewsSourceCreate,
    NewsSourceOut,
    NewsSourceUpdate,
    NewsStatusOut,
)
from app.services import news_service

router = APIRouter(prefix='/admin/news', tags=['admin-news'])


@router.get('/sources', response_model=List[NewsSourceOut], dependencies=[Depends(require_role(['admin']))])
def list_sources(db: Session = Depends(get_db)):
    return news_service.list_all_sources(db)


@router.post(
    '/sources',
    response_model=NewsSourceOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(['admin']))],
)
def create_source(payload: NewsSourceCreate, db: Session = Depends(get_db)):
    try:
        return news_service.admin_create_source(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put(
    '/sources/{source_id}',
    response_model=NewsSourceOut,
    dependencies=[Depends(require_role(['admin']))],
)
def update_source(source_id: int, payload: NewsSourceUpdate, db: Session = Depends(get_db)):
    try:
        return news_service.admin_update_source(db, source_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch('/sources/{source_id}/toggle', response_model=NewsSourceOut, dependencies=[Depends(require_role(['admin']))])
def toggle_source(source_id: int, db: Session = Depends(get_db)):
    try:
        return news_service.admin_toggle_source(db, source_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete('/sources/{source_id}', status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(['admin']))])
def delete_source(source_id: int, db: Session = Depends(get_db)):
    try:
        news_service.admin_delete_source(db, source_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post('/fetch-now', response_model=FetchNowResponse, dependencies=[Depends(require_role(['admin']))])
def fetch_now(db: Session = Depends(get_db)):
    return news_service.admin_fetch_now(db)


@router.get('/status', response_model=NewsStatusOut, dependencies=[Depends(require_role(['admin']))])
def news_status(db: Session = Depends(get_db)):
    return news_service.admin_status(db)
