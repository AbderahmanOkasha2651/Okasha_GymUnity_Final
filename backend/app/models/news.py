from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NewsSource(Base):
    __tablename__ = 'news_sources'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    rss_url: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    fetch_error_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    articles = relationship('NewsArticle', back_populates='source', cascade='all, delete-orphan')


class NewsArticle(Base):
    __tablename__ = 'news_articles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey('news_sources.id'), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    link: Mapped[str] = mapped_column(String, nullable=False)
    guid: Mapped[str | None] = mapped_column(String, nullable=True)
    unique_hash: Mapped[str] = mapped_column(String, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    summary: Mapped[str] = mapped_column(Text, default='', nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[str | None] = mapped_column(String, nullable=True)
    # --- Recommender columns ---
    language: Mapped[str] = mapped_column(String, default='en', nullable=False)
    topics_json: Mapped[str] = mapped_column(Text, default='[]', nullable=False)
    keywords_json: Mapped[str] = mapped_column(Text, default='[]', nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    popularity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    content_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    source = relationship('NewsSource', back_populates='articles')
    saved_by = relationship('UserSavedArticle', back_populates='article', cascade='all, delete-orphan')
    hidden_by = relationship('UserHiddenArticle', back_populates='article', cascade='all, delete-orphan')

    __table_args__ = (
        Index('ix_news_article_source_unique', 'source_id', 'unique_hash', unique=True),
        Index('ix_news_article_source_published', 'source_id', 'published_at'),
    )


class UserNewsPreference(Base):
    __tablename__ = 'user_news_preferences'

    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), primary_key=True)
    topics: Mapped[str] = mapped_column(String, default='', nullable=False)
    level: Mapped[str] = mapped_column(String, default='beginner', nullable=False)
    equipment: Mapped[str] = mapped_column(String, default='gym', nullable=False)
    blocked_keywords: Mapped[str] = mapped_column(String, default='', nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='news_preference')


class UserSavedArticle(Base):
    __tablename__ = 'user_saved_articles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='saved_articles')
    article = relationship('NewsArticle', back_populates='saved_by')

    __table_args__ = (
        Index('ix_user_saved_unique', 'user_id', 'article_id', unique=True),
    )


class UserHiddenArticle(Base):
    __tablename__ = 'user_hidden_articles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship('User', back_populates='hidden_articles')
    article = relationship('NewsArticle', back_populates='hidden_by')

    __table_args__ = (
        Index('ix_user_hidden_unique', 'user_id', 'article_id', unique=True),
    )


# ---------------------------------------------------------------------------
# NEW TABLES for recommender system
# ---------------------------------------------------------------------------

class RawFeedItem(Base):
    """Staging area for fetched RSS entries before processing."""
    __tablename__ = 'raw_feed_items'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey('news_sources.id'), nullable=False, index=True)
    guid: Mapped[str | None] = mapped_column(String, nullable=True)
    url: Mapped[str] = mapped_column(String, nullable=False)
    url_hash: Mapped[str] = mapped_column(String, nullable=False)
    title_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    author_raw: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url_raw: Mapped[str | None] = mapped_column(String, nullable=True)
    published_raw: Mapped[str | None] = mapped_column(String, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String, default='pending', nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index('ix_raw_source_url', 'source_id', 'url_hash', unique=True),
    )


class ArticleEmbedding(Base):
    """Tracks which articles have been embedded and where in the vector DB."""
    __tablename__ = 'article_embeddings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), nullable=False, unique=True, index=True)
    content_hash: Mapped[str] = mapped_column(String, nullable=False)
    model_name: Mapped[str] = mapped_column(String, nullable=False)
    dimensions: Mapped[int] = mapped_column(Integer, nullable=False)
    vector_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class UserEvent(Base):
    """User interaction events for the feedback loop."""
    __tablename__ = 'user_events'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    dwell_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_user_events_user_type', 'user_id', 'event_type'),
        Index('ix_user_events_article', 'article_id', 'event_type'),
    )


class FeedImpression(Base):
    """Tracks what was shown to a user in their feed."""
    __tablename__ = 'feed_impressions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    feed_type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index('ix_impressions_user_time', 'user_id', 'created_at'),
    )
