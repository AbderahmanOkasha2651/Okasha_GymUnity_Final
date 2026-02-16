from typing import Iterable


def upsert_news(records: Iterable[dict]) -> None:
    """TODO: Upsert news embeddings into vector store."""
    raise NotImplementedError('Vector store is not wired yet.')


def query_news(query: str, limit: int = 10) -> list[dict]:
    """TODO: Query vector store for relevant news."""
    raise NotImplementedError('Vector store is not wired yet.')


def upsert_user_profile(user_id: int, profile: dict) -> None:
    """TODO: Upsert user profile embedding."""
    raise NotImplementedError('Vector store is not wired yet.')


def query_personalized(user_id: int, limit: int = 10) -> list[dict]:
    """TODO: Query personalized news feed from vector store."""
    raise NotImplementedError('Vector store is not wired yet.')
