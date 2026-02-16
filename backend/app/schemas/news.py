from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NewsSourceOut(BaseModel):
    id: int
    name: str
    rss_url: str
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    enabled: bool
    created_at: datetime
    last_fetched_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NewsSourceCreate(BaseModel):
    name: str
    rss_url: str
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    enabled: bool = True


class NewsSourceUpdate(BaseModel):
    name: Optional[str] = None
    rss_url: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    enabled: Optional[bool] = None


class NewsArticleOut(BaseModel):
    id: int
    title: str
    link: str
    guid: Optional[str] = None
    published_at: Optional[datetime] = None
    author: Optional[str] = None
    summary: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    source: NewsSourceOut
    saved: bool = False

    class Config:
        from_attributes = True


class NewsFeedResponse(BaseModel):
    items: List[NewsArticleOut]
    page: int
    page_size: int
    total: int


class PreferencesOut(BaseModel):
    topics: List[str] = Field(default_factory=list)
    level: str
    equipment: str
    blocked_keywords: List[str] = Field(default_factory=list)


class PreferencesIn(BaseModel):
    topics: List[str] = Field(default_factory=list)
    level: str = 'beginner'
    equipment: str = 'gym'
    blocked_keywords: List[str] = Field(default_factory=list)


class NewsStatusOut(BaseModel):
    last_run: Optional[datetime] = None
    sources_checked: int
    sources_success: int
    sources_failed: int
    items_ingested: int
    last_error: Optional[str] = None


class FetchNowResponse(BaseModel):
    fetched_at: datetime
    sources_checked: int
    sources_success: int
    sources_failed: int
    items_ingested: int
    last_error: Optional[str] = None


class NewsChatRequest(BaseModel):
    message: str


class NewsChatResponse(BaseModel):
    reply: str
    follow_up: str
