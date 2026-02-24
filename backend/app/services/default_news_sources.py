"""Tier-1 professional fitness RSS sources.

Seeded during ``init_db()`` if not already present.
Uses ``rss_url`` as the stable unique key so the process is idempotent.
Admin-created sources are never touched.
"""

DEFAULT_NEWS_SOURCES = [
    {
        "name": "Muscle & Fitness",
        "rss_url": "https://www.muscleandfitness.com/feed/",
        "category": "fitness",
        "tags": ["strength", "workout", "bodybuilding"],
        "priority": 1,
        "enabled": True,
    },
    {
        "name": "Breaking Muscle",
        "rss_url": "https://breakingmuscle.com/feed/",
        "category": "fitness",
        "tags": ["strength", "training", "science"],
        "priority": 1,
        "enabled": True,
    },
    {
        "name": "T-Nation",
        "rss_url": "https://www.t-nation.com/feed/",
        "category": "fitness",
        "tags": ["bodybuilding", "strength", "performance"],
        "priority": 1,
        "enabled": True,
    },
    {
        "name": "Bodybuilding.com Articles",
        "rss_url": "https://www.bodybuilding.com/rss/articles",
        "category": "fitness",
        "tags": ["bodybuilding", "nutrition", "training"],
        "priority": 1,
        "enabled": True,
    },
    {
        "name": "Men's Health Fitness",
        "rss_url": "https://www.menshealth.com/rss/all.xml/",
        "category": "fitness",
        "tags": ["fitness", "health", "training"],
        "priority": 1,
        "enabled": True,
    },
]
