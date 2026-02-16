from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class ChatContext(BaseModel):
    goal: str
    level: str
    days_per_week: int = Field(..., ge=1, le=7)
    equipment: str
    injuries: Optional[str] = None


class ChatMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str
    createdAt: str


class ChatRequest(BaseModel):
    message: str
    context: ChatContext
    history: List[ChatMessage] = Field(default_factory=list)


class PlanExercise(BaseModel):
    name: str
    sets: str
    reps: str
    rest: str
    notes: str


class PlanDay(BaseModel):
    day: str
    focus: str
    exercises: List[PlanExercise]


class SuggestedPlan(BaseModel):
    week_overview: str
    days: List[PlanDay]


class ChatResponse(BaseModel):
    reply: str
    suggested_plan: Optional[SuggestedPlan] = None
