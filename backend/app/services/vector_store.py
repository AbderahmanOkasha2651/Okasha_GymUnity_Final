"""Vector store abstraction layer.

Supports ChromaDB (dev) and Qdrant (prod).
Factory reads ``settings.VECTOR_DB_PROVIDER`` to pick the backend.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class VectorStore(ABC):
    """Abstract interface for vector search backends."""

    @abstractmethod
    def upsert(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        metadata: list[dict[str, Any]],
    ) -> None:
        ...

    @abstractmethod
    def search(
        self,
        query_vector: list[float],
        top_k: int = 50,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Return list of ``{id, score, metadata}`` dicts."""
        ...

    @abstractmethod
    def delete(self, ids: list[str]) -> None:
        ...

    @abstractmethod
    def count(self) -> int:
        ...


# ---------------------------------------------------------------------------
# ChromaDB backend (dev / local)
# ---------------------------------------------------------------------------

class ChromaVectorStore(VectorStore):
    """Persistent ChromaDB backend — zero infrastructure needed."""

    def __init__(self, persist_dir: str = './data/chroma', collection_name: str = 'gymunity-news'):
        try:
            import chromadb
        except ImportError:
            raise ImportError('chromadb is required: pip install chromadb')

        self._client = chromadb.PersistentClient(path=persist_dir)
        self._collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={'hnsw:space': 'cosine'},
        )
        logger.info('ChromaDB collection "%s" ready (%d vectors)', collection_name, self._collection.count())

    def upsert(self, ids: list[str], embeddings: list[list[float]], metadata: list[dict[str, Any]]) -> None:
        # Chroma requires metadatas values to be str/int/float/bool
        clean_meta = []
        for m in metadata:
            clean = {}
            for k, v in m.items():
                if isinstance(v, (str, int, float, bool)):
                    clean[k] = v
                else:
                    clean[k] = str(v)
            clean_meta.append(clean)
        self._collection.upsert(ids=ids, embeddings=embeddings, metadatas=clean_meta)

    def search(self, query_vector: list[float], top_k: int = 50, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        where = None
        if filters:
            where = {k: v for k, v in filters.items() if v is not None}
            if not where:
                where = None

        results = self._collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            where=where,
        )

        hits = []
        if results['ids'] and results['ids'][0]:
            for idx, doc_id in enumerate(results['ids'][0]):
                hit = {
                    'id': doc_id,
                    'score': 1.0 - (results['distances'][0][idx] if results.get('distances') else 0.0),
                    'metadata': results['metadatas'][0][idx] if results.get('metadatas') else {},
                }
                hits.append(hit)
        return hits

    def delete(self, ids: list[str]) -> None:
        if ids:
            self._collection.delete(ids=ids)

    def count(self) -> int:
        return self._collection.count()


# ---------------------------------------------------------------------------
# Qdrant backend (production)
# ---------------------------------------------------------------------------

class QdrantVectorStore(VectorStore):
    """Qdrant backend for production deployments."""

    def __init__(self, url: str = 'http://localhost:6333', collection_name: str = 'gymunity-news', vector_size: int = 384):
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import Distance, VectorParams
        except ImportError:
            raise ImportError('qdrant-client is required: pip install qdrant-client')

        self._client = QdrantClient(url=url)
        self._collection_name = collection_name

        collections = [c.name for c in self._client.get_collections().collections]
        if collection_name not in collections:
            self._client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )
        logger.info('Qdrant collection "%s" ready', collection_name)

    def upsert(self, ids: list[str], embeddings: list[list[float]], metadata: list[dict[str, Any]]) -> None:
        from qdrant_client.models import PointStruct
        points = [
            PointStruct(id=doc_id, vector=vec, payload=meta)
            for doc_id, vec, meta in zip(ids, embeddings, metadata)
        ]
        self._client.upsert(collection_name=self._collection_name, points=points)

    def search(self, query_vector: list[float], top_k: int = 50, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        results = self._client.search(
            collection_name=self._collection_name,
            query_vector=query_vector,
            limit=top_k,
        )
        return [
            {'id': str(hit.id), 'score': hit.score, 'metadata': hit.payload or {}}
            for hit in results
        ]

    def delete(self, ids: list[str]) -> None:
        from qdrant_client.models import PointIdsList
        if ids:
            self._client.delete(
                collection_name=self._collection_name,
                points_selector=PointIdsList(points=ids),
            )

    def count(self) -> int:
        info = self._client.get_collection(self._collection_name)
        return info.points_count or 0


# ---------------------------------------------------------------------------
# Null backend (no vector search — graceful degradation)
# ---------------------------------------------------------------------------

class NullVectorStore(VectorStore):
    """No-op store when vector search is disabled or unavailable."""

    def upsert(self, ids, embeddings, metadata):
        pass

    def search(self, query_vector, top_k=50, filters=None):
        return []

    def delete(self, ids):
        pass

    def count(self):
        return 0


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

_instance: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Get or create the vector store singleton."""
    global _instance
    if _instance is not None:
        return _instance

    from app.core.config import settings
    provider = getattr(settings, 'VECTOR_DB_PROVIDER', 'none')

    if provider == 'chroma':
        try:
            path = getattr(settings, 'VECTOR_DB_PATH', './data/chroma')
            name = getattr(settings, 'VECTOR_DB_NEWS_INDEX', 'gymunity-news')
            _instance = ChromaVectorStore(persist_dir=path, collection_name=name)
        except Exception as exc:
            logger.warning('ChromaDB init failed (%s), falling back to NullVectorStore', exc)
            _instance = NullVectorStore()
    elif provider == 'qdrant':
        try:
            url = settings.VECTOR_DB_URL
            name = settings.VECTOR_DB_NEWS_INDEX
            _instance = QdrantVectorStore(url=url, collection_name=name)
        except Exception as exc:
            logger.warning('Qdrant init failed (%s), falling back to NullVectorStore', exc)
            _instance = NullVectorStore()
    else:
        _instance = NullVectorStore()
        logger.info('Vector search disabled (VECTOR_DB_PROVIDER=%s)', provider)

    return _instance
