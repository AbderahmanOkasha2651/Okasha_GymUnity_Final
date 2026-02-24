"""Pydantic schemas for user event tracking."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class EventItem(BaseModel):
    article_id: int
    event_type: Literal['impression', 'click', 'save', 'unsave', 'hide', 'unhide', 'dwell']
    dwell_seconds: float | None = None
    session_id: str | None = None


class EventBatch(BaseModel):
    events: list[EventItem] = Field(..., max_length=100)


class EventBatchResponse(BaseModel):
    accepted: int
    duplicates_skipped: int
