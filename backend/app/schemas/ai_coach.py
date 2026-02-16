from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    age: Optional[int] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    training_days: Optional[int] = None
    injuries: Optional[str] = None


class CoachChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    goal: Optional[str] = None  # lose_weight / gain_muscle / fitness / ...
    locale: Literal['ar', 'en'] = 'ar'
    user_profile: Optional[UserProfile] = None


class CoachMeta(BaseModel):
    provider: str  # "groq" or "stub"
    model: str
    used_rag: bool = False


class CoachChatResponse(BaseModel):
    conversation_id: str
    reply: str
    follow_up_questions: Optional[List[str]] = None
    meta: CoachMeta
