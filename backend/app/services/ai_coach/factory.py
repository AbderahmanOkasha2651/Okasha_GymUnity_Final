"""
Provider factory — auto-selects the appropriate CoachProvider.

- If GROQ_API_KEY is set → GroqProvider (LLM-powered)
- Otherwise            → StubProvider (deterministic fallback)
"""
from __future__ import annotations

import logging

from app.core.config import settings
from app.services.ai_coach.base import CoachProvider

logger = logging.getLogger(__name__)


def get_coach_provider() -> CoachProvider:
    """Return the appropriate coach provider based on environment config."""
    key = settings.GROQ_API_KEY

    if key:
        from app.services.ai_coach.groq_provider import GroqProvider
        logger.info(
            "✅ GROQ_API_KEY found — Using GroqProvider with model: %s",
            settings.GROQ_MODEL,
        )
        return GroqProvider()
    else:
        from app.services.ai_coach.stub_provider import StubProvider
        logger.warning(
            "⚠️ GROQ_API_KEY is empty or missing — Using StubProvider (deterministic fallback)"
        )
        return StubProvider()
