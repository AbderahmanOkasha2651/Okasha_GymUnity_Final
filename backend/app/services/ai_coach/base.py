"""
CoachProvider abstract base class and CoachReply data class.

Any provider (LLM, RAG, Stub) must implement CoachProvider.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class CoachReply:
    """Value object returned by every provider."""
    reply: str
    follow_up_questions: List[str] = field(default_factory=list)
    model_name: str = 'unknown'
    provider_name: str = 'unknown'  # "groq" or "stub"
    used_rag: bool = False


class CoachProvider(ABC):
    """
    Abstract interface for the AI Coach backend.

    Today  → plain LLM call  (GroqProvider / StubProvider)
    Later  → RAG-augmented    (RAGProvider wrapping an LLM provider)
    """

    @abstractmethod
    async def generate_reply(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_profile: Optional[Dict[str, Any]],
        goal: Optional[str],
        locale: str,
    ) -> CoachReply:
        """Return a coach reply for the given user turn."""
        ...
