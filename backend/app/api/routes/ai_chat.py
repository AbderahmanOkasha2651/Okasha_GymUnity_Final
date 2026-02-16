from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai_chat import (
    ChatRequest,
    ChatResponse,
    PlanDay,
    PlanExercise,
    SuggestedPlan,
)

router = APIRouter(tags=['ai'])


@router.get('/ai/health')
def ai_health_check():
    return {
        'status': 'ok',
        'service': 'GymUnity AI',
    }


def build_exercises(focus: str, equipment: str) -> list[PlanExercise]:
    focus_lower = focus.lower()
    is_bodyweight = 'body' in equipment or 'home' in equipment

    if 'cardio' in focus_lower or 'conditioning' in focus_lower or 'hiit' in focus_lower:
        return [
            PlanExercise(
                name='Interval cardio' if not is_bodyweight else 'Jump rope intervals',
                sets='4-6 rounds',
                reps='30-60 sec work',
                rest='60 sec',
                notes='Keep intensity high but controlled.',
            ),
            PlanExercise(
                name='Core circuit',
                sets='3',
                reps='10-15 each',
                rest='45 sec',
                notes='Plank, dead bug, hollow hold.',
            ),
        ]

    if 'push' in focus_lower:
        return [
            PlanExercise(
                name='Bench press' if not is_bodyweight else 'Push-ups',
                sets='4',
                reps='8-12',
                rest='90 sec',
                notes='Control the negative; full range.',
            ),
            PlanExercise(
                name='Overhead press' if not is_bodyweight else 'Pike push-ups',
                sets='3',
                reps='8-10',
                rest='90 sec',
                notes='Brace core; avoid lower-back arch.',
            ),
            PlanExercise(
                name='Incline dumbbell press' if not is_bodyweight else 'Close-grip push-ups',
                sets='3',
                reps='10-12',
                rest='75 sec',
                notes='Keep elbows at 45 degrees.',
            ),
        ]

    if 'pull' in focus_lower:
        return [
            PlanExercise(
                name='Barbell row' if not is_bodyweight else 'Inverted rows',
                sets='4',
                reps='8-12',
                rest='90 sec',
                notes='Pause at the top.',
            ),
            PlanExercise(
                name='Lat pulldown' if not is_bodyweight else 'Band rows',
                sets='3',
                reps='10-12',
                rest='75 sec',
                notes='Keep chest lifted.',
            ),
            PlanExercise(
                name='Face pulls' if not is_bodyweight else 'Y-T-W raises',
                sets='3',
                reps='12-15',
                rest='60 sec',
                notes='Focus on upper-back control.',
            ),
        ]

    if 'lower' in focus_lower or 'legs' in focus_lower:
        return [
            PlanExercise(
                name='Back squat' if not is_bodyweight else 'Tempo squats',
                sets='4',
                reps='6-10',
                rest='120 sec',
                notes='Maintain depth with control.',
            ),
            PlanExercise(
                name='Romanian deadlift' if not is_bodyweight else 'Single-leg RDL',
                sets='3',
                reps='8-12',
                rest='90 sec',
                notes='Hinge from hips, flat back.',
            ),
            PlanExercise(
                name='Walking lunge' if not is_bodyweight else 'Reverse lunge',
                sets='3',
                reps='10 each',
                rest='75 sec',
                notes='Keep knee tracking over toes.',
            ),
        ]

    return [
        PlanExercise(
            name='Full-body circuit' if is_bodyweight else 'Full-body machine circuit',
            sets='3',
            reps='10-12',
            rest='60 sec',
            notes='Move with quality, steady pace.',
        ),
        PlanExercise(
            name='Farmer carry' if not is_bodyweight else 'Bear crawl',
            sets='3',
            reps='30-45 sec',
            rest='60 sec',
            notes='Keep core braced.',
        ),
    ]


def build_plan(goal: str, level: str, days_per_week: int, equipment: str) -> SuggestedPlan:
    focus_map = {
        'fat loss': [
            'Full Body + Cardio',
            'Lower Body + Intervals',
            'Upper Body + Conditioning',
            'Full Body + HIIT',
            'Cardio + Core',
            'Full Body Circuit',
            'Active Recovery + Mobility',
        ],
        'muscle gain': [
            'Push (Chest/Shoulders/Triceps)',
            'Pull (Back/Biceps)',
            'Legs (Quads/Hams/Glutes)',
            'Upper Hypertrophy',
            'Lower Hypertrophy',
            'Arms + Core',
            'Full Body Pump',
        ],
        'strength': [
            'Lower Strength',
            'Upper Strength',
            'Full Body Strength',
            'Accessory + Core',
            'Lower Strength',
            'Upper Strength',
            'Conditioning',
        ],
    }

    normalized_goal = goal.lower().strip()
    focus_list = focus_map.get(normalized_goal, focus_map['muscle gain'])
    days = max(1, min(days_per_week, 7))
    plan_days: list[PlanDay] = []

    for index in range(days):
        focus = focus_list[index % len(focus_list)]
        plan_days.append(
            PlanDay(
                day=f'Day {index + 1}',
                focus=focus,
                exercises=build_exercises(focus, equipment),
            )
        )

    overview = (
        f'{days}-day {normalized_goal or "fitness"} plan for a {level} trainee using {equipment}.'
    )

    return SuggestedPlan(week_overview=overview, days=plan_days)


@router.post('/ai/chat', response_model=ChatResponse)
def ai_chat(payload: ChatRequest, user: User = Depends(get_current_user)):
    goal = payload.context.goal.strip()
    level = payload.context.level.strip() or 'beginner'
    days = payload.context.days_per_week
    equipment = payload.context.equipment.strip()
    injuries = payload.context.injuries or ''

    normalized_goal = goal.lower()
    if 'fat' in normalized_goal:
        emphasis = 'fat loss'
    elif 'muscle' in normalized_goal or 'hypertrophy' in normalized_goal:
        emphasis = 'muscle gain'
    elif 'strength' in normalized_goal:
        emphasis = 'strength'
    else:
        emphasis = normalized_goal or 'general fitness'

    injury_note = f' I noted: {injuries}.' if injuries else ''
    reply = (
        f"Got it! You're aiming for {emphasis} with {equipment} equipment at a {level} level. "
        f'I can tailor sessions to {days} days per week.{injury_note} '
        'Tell me if you want a weekly plan, a single workout, or exercise swaps.'
    )

    needs_plan = len(payload.history) == 0 or 'plan' in payload.message.lower()
    suggested_plan = build_plan(emphasis, level, days, equipment) if needs_plan else None

    return ChatResponse(reply=reply, suggested_plan=suggested_plan)
