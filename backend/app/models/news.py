from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
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
