"""Article embedding service.

Embeds article text using sentence-transformers and stores vectors
in the configured vector store backend.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.news import ArticleEmbedding, NewsArticle

logger = logging.getLogger(__name__)

# Lazy-loaded model singleton
_model = None


def _get_model():
    """Load the sentence-transformers model (lazy, singleton)."""
    global _model
    if _model is not None:
        return _model

    try:
        from sentence_transformers import SentenceTransformer
        from app.core.config import settings
        model_name = settings.EMBEDDING_MODEL_NAME
        logger.info('Loading embedding model: %s', model_name)
        _model = SentenceTransformer(model_name)
        logger.info('Embedding model loaded (dim=%d)', _model.get_sentence_embedding_dimension())
        return _model
    except ImportError:
        logger.warning('sentence-transformers not installed — embeddings disabled')
        return None
    except Exception as exc:
        logger.error('Failed to load embedding model: %s', exc)
        return None


def _build_embed_text(article: NewsArticle) -> str:
    """Combine article fields into text for embedding."""
    parts = [article.title or '', article.summary or '']
    if article.content:
        parts.append(article.content[:2000])
    return '. '.join(p for p in parts if p)


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def embed_pending_articles(db: Session, batch_size: int = 100) -> int:
    """Embed articles that are new or have changed content.

    Returns number of articles embedded.
    """
    model = _get_model()
    if model is None:
        logger.info('Embedding model not available — skipping')
        return 0

    from app.services.vector_store import get_vector_store
    from app.core.config import settings

    vector_store = get_vector_store()

    # Find articles that need embedding:
    # 1. No embedding record exists, OR
    # 2. content_hash has changed
    articles = (
        db.query(NewsArticle)
        .outerjoin(ArticleEmbedding, ArticleEmbedding.article_id == NewsArticle.id)
        .filter(
            (ArticleEmbedding.id.is_(None)) |
            (NewsArticle.content_hash != ArticleEmbedding.content_hash)
        )
        .limit(batch_size)
        .all()
    )

    if not articles:
        return 0

    logger.info('Embedding %d articles', len(articles))

    # Build texts and embed
    texts = [_build_embed_text(a) for a in articles]
    embeddings = model.encode(texts, show_progress_bar=False).tolist()

    # Prepare for vector store
    ids = [str(a.id) for a in articles]
    metadata_list = []
    for a in articles:
        import json
        topics = []
        try:
            topics = json.loads(a.topics_json) if a.topics_json else []
        except Exception:
            pass
        metadata_list.append({
            'article_id': a.id,
            'source_id': a.source_id,
            'topics': ','.join(topics) if topics else 'general',
            'published_at': str(a.published_at) if a.published_at else '',
            'language': a.language or 'en',
        })

    # Upsert to vector store
    vector_store.upsert(ids=ids, embeddings=embeddings, metadata=metadata_list)

    # Update/create embedding records
    model_name = settings.EMBEDDING_MODEL_NAME
    dim = model.get_sentence_embedding_dimension()

    for article in articles:
        embed_text = _build_embed_text(article)
        c_hash = _content_hash(embed_text)

        existing = db.query(ArticleEmbedding).filter(
            ArticleEmbedding.article_id == article.id
        ).first()

        if existing:
            existing.content_hash = c_hash
            existing.model_name = model_name
            existing.dimensions = dim
            existing.updated_at = datetime.utcnow()
        else:
            db.add(ArticleEmbedding(
                article_id=article.id,
                content_hash=c_hash,
                model_name=model_name,
                dimensions=dim,
                vector_id=str(article.id),
            ))

    db.commit()
    logger.info('Embedded %d articles successfully', len(articles))
    return len(articles)


def embed_user_query(text: str) -> list[float] | None:
    """Embed a text query for vector search. Returns None if model unavailable."""
    model = _get_model()
    if model is None:
        return None
    return model.encode(text, show_progress_bar=False).tolist()
