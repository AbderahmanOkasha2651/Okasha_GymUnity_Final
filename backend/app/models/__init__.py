from app.models.user import User
from app.models.news import (
    NewsArticle,
    NewsSource,
    UserHiddenArticle,
    UserNewsPreference,
    UserSavedArticle,
)

__all__ = [
    'User',
    'NewsArticle',
    'NewsSource',
    'UserHiddenArticle',
    'UserNewsPreference',
    'UserSavedArticle',
]
