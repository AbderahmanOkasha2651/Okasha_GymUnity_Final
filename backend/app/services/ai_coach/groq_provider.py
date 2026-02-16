"""
GroqProvider — calls Groq API for AI Coach replies.

Uses the `groq` Python SDK with async support.
Builds a system prompt with safety disclaimers, structured output instructions,
and placeholder RAG context.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from groq import AsyncGroq

from app.core.config import settings
from app.services.ai_coach.base import CoachProvider, CoachReply
from app.services.ai_coach.rag import retrieve_context

logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────────
# System prompt — the EXACT specification from the user
# ───────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are GymUnity AI Coach. You must be helpful, structured, and realistic.
Rules:
1) If the user asks for a fitness plan but critical info is missing, ask ONLY clarifying questions (3–6) and DO NOT output a full plan yet.
   Critical info: age, height, weight, goal, training days per week, injuries, diet preferences.
2) If enough info exists, provide a 7-day starter plan with:
   - Training split (days + exercises)
   - Nutrition guidance (simple and safe, no medical claims)
   - Daily habits (sleep, steps, water)
   - Tracking checklist for next week
3) Output in Arabic by default (clear Egyptian-friendly Arabic), but if the user writes in English, respond in English.
4) Keep it concise, bullet points, actionable.
5) Add a short disclaimer: "هذه نصائح عامة وليست نصيحة طبية."
6) Never recommend drugs, unsafe starvation, or diagnose medical conditions. If user asks medical issues, advise a professional.

At the end of every reply, add 3-5 suggested follow-up questions starting with "💡 أسئلة مقترحة:" each on a new line starting with "- ".

{context_section}

{profile_section}

{goal_section}
"""


def _build_system_prompt(
    locale: str,
    user_profile: Optional[Dict[str, Any]],
    goal: Optional[str],
) -> str:
    """Build the system prompt with optional RAG context and profile."""
    profile_dict = user_profile or {}

    # RAG context (currently returns [])
    context_snippets = retrieve_context(query=goal or '', user_profile=profile_dict)
    if context_snippets:
        context_section = "## Reference Information:\n"
        for i, snippet in enumerate(context_snippets, 1):
            context_section += f"{i}. {snippet}\n"
    else:
        context_section = ""

    # Profile summary
    profile_section = ""
    if profile_dict:
        labels = {
            'age': 'العمر / Age',
            'height_cm': 'الطول / Height (cm)',
            'weight_kg': 'الوزن / Weight (kg)',
            'activity_level': 'مستوى النشاط / Activity level',
            'training_days': 'أيام التمرين / Training days',
            'injuries': 'إصابات / Injuries',
        }
        lines = []
        for key, label in labels.items():
            val = profile_dict.get(key)
            if val is not None and val != '':
                lines.append(f"- {label}: {val}")
        if lines:
            profile_section = "## User Profile:\n" + "\n".join(lines)

    # Goal
    goal_section = f"## Goal: {goal}" if goal else ""

    return SYSTEM_PROMPT.format(
        context_section=context_section,
        profile_section=profile_section,
        goal_section=goal_section,
    ).strip()


def _extract_follow_ups(text: str) -> List[str]:
    """Extract follow-up questions from the LLM reply text."""
    follow_ups: List[str] = []
    in_section = False
    for line in text.split('\n'):
        stripped = line.strip()
        if '💡' in stripped:
            in_section = True
            continue
        if in_section and stripped.startswith('- '):
            question = stripped[2:].strip()
            if question:
                follow_ups.append(question)
        elif in_section and stripped and not stripped.startswith('-'):
            break
    return follow_ups


class GroqProvider(CoachProvider):
    """Coach provider backed by Groq LLM API."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self._model = settings.GROQ_MODEL
        logger.info(
            "GroqProvider initialized — model=%s, key_length=%d",
            self._model,
            len(settings.GROQ_API_KEY),
        )

    async def generate_reply(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_profile: Optional[Dict[str, Any]],
        goal: Optional[str],
        locale: str,
    ) -> CoachReply:
        system_prompt = _build_system_prompt(locale, user_profile, goal)

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last 10 turns to stay in context window)
        for msg in history[-10:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

        # Add current user message
        messages.append({"role": "user", "content": message})

        logger.info(
            "GroqProvider.generate_reply — model=%s, history_len=%d, message_preview=%.60s",
            self._model,
            len(history),
            message,
        )

        completion = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=0.4,
            max_tokens=2048,
            top_p=0.9,
        )

        reply_text = completion.choices[0].message.content or ""
        follow_ups = _extract_follow_ups(reply_text)

        logger.info(
            "GroqProvider reply received — length=%d, follow_ups=%d",
            len(reply_text),
            len(follow_ups),
        )

        return CoachReply(
            reply=reply_text,
            follow_up_questions=follow_ups,
            model_name=self._model,
            provider_name='groq',
            used_rag=len(retrieve_context(goal or '', user_profile)) > 0,
        )
