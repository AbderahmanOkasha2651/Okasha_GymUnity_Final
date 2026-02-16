"""
Placeholder RAG retrieval function.

Currently returns an empty list.  When you add a vector DB later,
implement the real retrieval here — no other file needs to change.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def retrieve_context(
    query: str,
    user_profile: Optional[Dict[str, Any]] = None,
) -> List[str]:
    """
    Retrieve relevant context snippets for the coach prompt.

    Returns
    -------
    list[str]
        Context chunks to inject into the system prompt.
        Currently returns [] (no RAG).
    """
    # TODO: integrate vector DB search here
    return []
