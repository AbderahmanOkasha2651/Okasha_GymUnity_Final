"""
StubProvider — deterministic fallback when no GROQ_API_KEY is set.

Returns helpful template responses so the feature works without any API key.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.services.ai_coach.base import CoachProvider, CoachReply


_PROFILE_FIELDS = ['age', 'height_cm', 'weight_kg', 'activity_level', 'training_days']


def _missing_fields(profile: Optional[Dict[str, Any]]) -> List[str]:
    if not profile:
        return list(_PROFILE_FIELDS)
    return [f for f in _PROFILE_FIELDS if not profile.get(f)]


def _clarifying_response_ar(missing: List[str]) -> CoachReply:
    labels = {
        'age': 'عمرك',
        'height_cm': 'طولك (بالسنتيمتر)',
        'weight_kg': 'وزنك (بالكيلوجرام)',
        'activity_level': 'مستوى نشاطك (مبتدئ/متوسط/متقدم)',
        'training_days': 'كم يوم تقدر تتمرن في الأسبوع',
    }
    questions = [f"- {labels.get(f, f)}؟" for f in missing]
    reply = (
        "أهلاً بيك في GymUnity Coach! 💪\n\n"
        "علشان أقدر أساعدك بخطة مناسبة، محتاج أعرف شوية معلومات:\n\n"
        + "\n".join(questions)
        + "\n\n⚠️ ده مش نصيحة طبية. استشير دكتور متخصص قبل ما تبدأ أي برنامج رياضي جديد."
    )
    return CoachReply(
        reply=reply,
        follow_up_questions=[labels.get(f, f) for f in missing[:5]],
        model_name='stub',
        provider_name='stub',
        used_rag=False,
    )


def _clarifying_response_en(missing: List[str]) -> CoachReply:
    labels = {
        'age': 'your age',
        'height_cm': 'your height (in cm)',
        'weight_kg': 'your weight (in kg)',
        'activity_level': 'your activity level (beginner/intermediate/advanced)',
        'training_days': 'how many days per week you can train',
    }
    questions = [f"- {labels.get(f, f)}?" for f in missing]
    reply = (
        "Welcome to GymUnity Coach! 💪\n\n"
        "To create a personalized plan, I need some information:\n\n"
        + "\n".join(questions)
        + "\n\n⚠️ This is not medical advice. Consult a qualified doctor before starting any new exercise program."
    )
    return CoachReply(
        reply=reply,
        follow_up_questions=[labels.get(f, f) for f in missing[:5]],
        model_name='stub',
        provider_name='stub',
        used_rag=False,
    )


_PLAN_AR = """\
تمام! بناءً على بياناتك، دي خطة مبدئية ليك:

## 🎯 الهدف: {goal}

### 📅 خطة الأسبوع:
- **يوم 1**: تمارين صدر + ترايسبس
- **يوم 2**: تمارين ضهر + بايسبس
- **يوم 3**: راحة نشطة (مشي 30 دقيقة)
- **يوم 4**: تمارين أرجل
- **يوم 5**: أكتاف + بطن
- **يوم 6**: كارديو + تمارين مركبة
- **يوم 7**: راحة كاملة

### 🥗 إرشادات غذائية بسيطة:
- اشرب 2-3 لتر مياه يومياً
- كل بروتين في كل وجبة (فراخ، بيض، لبنة، فول)
- قلل السكريات والأكل المصنع
- وجبات صغيرة ومتكررة أفضل من وجبتين كبار

### ✅ عادات يومية:
- نوم 7-8 ساعات
- امشي 10,000 خطوة
- سجل تمارينك ووزنك أسبوعياً

💡 أسئلة مقترحة:
- إيه أفضل تمارين للصدر في البيت؟
- إزاي أحسب السعرات الحرارية؟
- إيه البديل لو عندي إصابة في الركبة؟

⚠️ ده مش نصيحة طبية. استشير دكتور متخصص قبل ما تبدأ أي برنامج رياضي جديد."""

_PLAN_EN = """\
Great! Based on your information, here's a starter plan:

## 🎯 Goal: {goal}

### 📅 Weekly Plan:
- **Day 1**: Chest + Triceps
- **Day 2**: Back + Biceps
- **Day 3**: Active recovery (30 min walk)
- **Day 4**: Legs
- **Day 5**: Shoulders + Core
- **Day 6**: Cardio + Compound movements
- **Day 7**: Full rest

### 🥗 Simple Nutrition Guidelines:
- Drink 2-3 liters of water daily
- Include protein in every meal (chicken, eggs, yogurt, beans)
- Reduce sugar and processed foods
- Smaller, frequent meals are better than two large ones

### ✅ Daily Habits:
- Sleep 7-8 hours
- Walk 10,000 steps
- Track your workouts and weight weekly

💡 Suggested questions:
- What are the best chest exercises at home?
- How do I calculate my daily calories?
- What alternatives if I have a knee injury?

⚠️ This is not medical advice. Consult a qualified doctor before starting any new exercise program."""

_FOLLOW_UPS_AR = [
    "إيه أفضل تمارين للصدر في البيت؟",
    "إزاي أحسب السعرات الحرارية؟",
    "إيه البديل لو عندي إصابة في الركبة؟",
]

_FOLLOW_UPS_EN = [
    "What are the best chest exercises at home?",
    "How do I calculate my daily calories?",
    "What alternatives if I have a knee injury?",
]

_SAFETY_KEYWORDS = [
    'دواء', 'أدوية', 'مكمل', 'ستيرويد', 'هرمون', 'حقن',
    'drug', 'steroid', 'hormone', 'injection', 'supplement',
    'diagnosis', 'تشخيص', 'medical', 'طبي',
    'extreme diet', 'دايت قاسي'
]


class StubProvider(CoachProvider):
    """Deterministic fallback provider — no API key required."""

    async def generate_reply(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_profile: Optional[Dict[str, Any]],
        goal: Optional[str],
        locale: str,
    ) -> CoachReply:
        msg_lower = message.lower()

        # Safety check
        if any(kw in msg_lower for kw in _SAFETY_KEYWORDS):
            if locale == 'ar':
                return CoachReply(
                    reply=(
                        "⚠️ للأسف مش هقدر أساعدك في الموضوع ده.\n\n"
                        "الأدوية والمكملات والتشخيصات الطبية لازم تكون تحت إشراف دكتور متخصص. "
                        "أنصحك تستشير طبيب رياضي أو أخصائي تغذية.\n\n"
                        "⚠️ ده مش نصيحة طبية."
                    ),
                    follow_up_questions=["إيه أفضل تمارين طبيعية لهدفي؟", "إزاي أحسن نظامي الغذائي بشكل طبيعي؟"],
                    model_name='stub',
        provider_name='stub',
                    used_rag=False,
                )
            else:
                return CoachReply(
                    reply=(
                        "⚠️ I'm unable to help with that topic.\n\n"
                        "Medications, supplements, and medical diagnoses should be handled by a qualified doctor. "
                        "I recommend consulting a sports physician or nutritionist.\n\n"
                        "⚠️ This is not medical advice."
                    ),
                    follow_up_questions=["What are the best natural exercises for my goal?", "How can I improve my diet naturally?"],
                    model_name='stub',
        provider_name='stub',
                    used_rag=False,
                )

        # Check if profile is incomplete
        missing = _missing_fields(user_profile)
        if missing:
            if locale == 'ar':
                return _clarifying_response_ar(missing)
            else:
                return _clarifying_response_en(missing)

        # Profile is complete — return plan template
        effective_goal = goal or 'general fitness'
        if locale == 'ar':
            return CoachReply(
                reply=_PLAN_AR.format(goal=effective_goal),
                follow_up_questions=_FOLLOW_UPS_AR,
                model_name='stub',
        provider_name='stub',
                used_rag=False,
            )
        else:
            return CoachReply(
                reply=_PLAN_EN.format(goal=effective_goal),
                follow_up_questions=_FOLLOW_UPS_EN,
                model_name='stub',
        provider_name='stub',
                used_rag=False,
            )
