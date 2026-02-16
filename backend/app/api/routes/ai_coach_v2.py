"""
AI Coach v2 router — /api/ai/coach/chat

Provides LLM-powered fitness coaching with server-side conversation
persistence and provider abstraction.
"""
from __future__ import annotations

import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.ai_coach import AIConversation, AIMessage
from app.models.user import User
from app.schemas.ai_coach import CoachChatRequest, CoachChatResponse, CoachMeta
from app.services.ai_coach.factory import get_coach_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api/ai/coach', tags=['ai-coach'])

# Instantiate provider once at module level
_provider = get_coach_provider()


@router.get('/debug')
def coach_debug(user: User = Depends(get_current_user)):
    """Debug endpoint — shows which provider is active, model, PID, CWD."""
    return {
        'groq_key_loaded': bool(settings.GROQ_API_KEY),
        'provider': _provider.__class__.__name__,
        'model': settings.GROQ_MODEL,
        'pid': os.getpid(),
        'cwd': os.getcwd(),
    }


@router.post('/chat', response_model=CoachChatResponse)
async def coach_chat(
    payload: CoachChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI Coach and get a reply.

    - Creates a new conversation if conversation_id is not provided.
    - Persists user + assistant messages in SQLite.
    - Auto-selects LLM provider (Groq) or deterministic stub.
    """
    # --- Resolve or create conversation ---
    conversation = None
    if payload.conversation_id:
        conversation = (
            db.query(AIConversation)
            .filter(
                AIConversation.id == payload.conversation_id,
                AIConversation.user_id == user.id,
            )
            .first()
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Conversation not found',
            )

    if conversation is None:
        conversation = AIConversation(
            id=str(uuid.uuid4()),
            user_id=user.id,
            goal=payload.goal,
            locale=payload.locale,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # --- Load conversation history from DB ---
    db_messages = (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conversation.id)
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    history = [
        {'role': msg.role, 'content': msg.content}
        for msg in db_messages
    ]

    # --- Build user profile dict for the provider ---
    profile_dict = None
    if payload.user_profile:
        profile_dict = payload.user_profile.model_dump(exclude_none=True)

    # --- Call the provider ---
    logger.info(
        "coach_chat — user=%s provider=%s conv=%s msg_len=%d",
        user.id,
        _provider.__class__.__name__,
        conversation.id[:8],
        len(payload.message),
    )
    try:
        result = await _provider.generate_reply(
            message=payload.message,
            history=history,
            user_profile=profile_dict,
            goal=payload.goal or conversation.goal,
            locale=payload.locale,
        )
    except Exception as exc:
        logger.exception("AI provider error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f'AI provider error: {str(exc)}',
        )

    # --- Persist messages ---
    user_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role='user',
        content=payload.message,
    )
    assistant_msg = AIMessage(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role='assistant',
        content=result.reply,
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    logger.info(
        "coach_chat OK — provider=%s model=%s reply_len=%d",
        result.provider_name,
        result.model_name,
        len(result.reply),
    )

    return CoachChatResponse(
        conversation_id=conversation.id,
        reply=result.reply,
        follow_up_questions=result.follow_up_questions or None,
        meta=CoachMeta(
            provider=result.provider_name,
            model=result.model_name,
            used_rag=result.used_rag,
        ),
    )
