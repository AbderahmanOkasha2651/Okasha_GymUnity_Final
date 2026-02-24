"""Article enrichment: topic classification, keyword extraction, quality scoring.

All methods are deterministic and CPU-only — no ML models required.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime


# ---------------------------------------------------------------------------
# Topic classification (rule-based)
# ---------------------------------------------------------------------------

TOPIC_RULES: dict[str, list[str]] = {
    'strength': [
        'strength', 'powerlifting', 'deadlift', 'squat', 'bench press',
        'barbell', 'dumbbell', 'kettlebell', 'press', 'pull-up',
    ],
    'nutrition': [
        'nutrition', 'diet', 'protein', 'calories', 'meal', 'macro',
        'supplement', 'creatine', 'vitamin', 'eating',
    ],
    'cardio': [
        'cardio', 'running', 'hiit', 'endurance', 'aerobic', 'cycling',
        'sprint', 'zone 2', 'interval', 'rowing',
    ],
    'recovery': [
        'recovery', 'sleep', 'rest', 'stretching', 'foam roll',
        'mobility', 'warm-up', 'cool-down', 'massage',
    ],
    'bodybuilding': [
        'bodybuilding', 'hypertrophy', 'muscle', 'bulk', 'cut',
        'body composition', 'physique', 'pump', 'volume',
    ],
    'weight_loss': [
        'weight loss', 'fat loss', 'lean', 'deficit', 'calorie',
        'shred', 'cutting', 'metabolism', 'thermogenic',
    ],
    'mental': [
        'mental', 'mindset', 'motivation', 'stress', 'anxiety',
        'discipline', 'habit', 'focus', 'meditation',
    ],
    'injury': [
        'injury', 'rehab', 'pain', 'prevention', 'physical therapy',
        'tendon', 'joint', 'shoulder', 'knee', 'back pain',
    ],
}


def classify_topics(title: str, summary: str) -> list[str]:
    """Return list of matching topic labels based on keyword rules."""
    text = f'{title} {summary}'.lower()
    matched = [
        topic
        for topic, keywords in TOPIC_RULES.items()
        if any(kw in text for kw in keywords)
    ]
    return matched or ['general']


# ---------------------------------------------------------------------------
# Keyword extraction (simple word frequency)
# ---------------------------------------------------------------------------

_STOP_WORDS = frozenset({
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we',
    'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    'our', 'their', 'what', 'which', 'who', 'whom', 'how', 'when',
    'where', 'why', 'not', 'no', 'so', 'if', 'as', 'up', 'out',
    'about', 'into', 'over', 'after', 'before', 'between', 'under',
    'again', 'then', 'once', 'here', 'there', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than',
    'too', 'very', 'just', 'also', 'now', 'new', 'one', 'two',
})

_WORD_RE = re.compile(r'[a-z]{3,}')


def extract_keywords(title: str, summary: str, top_n: int = 10) -> list[str]:
    """Return top-N keywords by frequency from title + summary."""
    text = f'{title} {title} {summary}'.lower()  # title weighted 2x
    words = _WORD_RE.findall(text)
    words = [w for w in words if w not in _STOP_WORDS]
    counts = Counter(words)
    return [word for word, _ in counts.most_common(top_n)]


# ---------------------------------------------------------------------------
# Quality score heuristic (0.0 – 1.0)
# ---------------------------------------------------------------------------

def compute_quality_score(
    title: str,
    summary: str,
    content: str | None,
    image_url: str | None,
    published_at: datetime | None,
) -> float:
    """Heuristic quality score based on content completeness and freshness."""
    score = 0.0

    if len(title) > 20:
        score += 0.2
    if len(summary) > 100:
        score += 0.2
    if image_url:
        score += 0.2
    if content and len(content) > 500:
        score += 0.2
    if published_at:
        days_old = (datetime.utcnow() - published_at).days
        if days_old < 3:
            score += 0.2
        elif days_old < 7:
            score += 0.1

    return round(min(score, 1.0), 2)


# ---------------------------------------------------------------------------
# Convenience: enrich a dict in-place
# ---------------------------------------------------------------------------

def enrich_article(article_data: dict) -> dict:
    """Add topics_json, keywords_json, quality_score to an article dict."""
    title = article_data.get('title', '') or ''
    summary = article_data.get('summary', '') or ''
    content = article_data.get('content', None)
    image_url = article_data.get('image_url', None)
    published_at = article_data.get('published_at', None)

    article_data['topics_json'] = json.dumps(classify_topics(title, summary))
    article_data['keywords_json'] = json.dumps(extract_keywords(title, summary))
    article_data['quality_score'] = compute_quality_score(
        title, summary, content, image_url, published_at,
    )

    return article_data
