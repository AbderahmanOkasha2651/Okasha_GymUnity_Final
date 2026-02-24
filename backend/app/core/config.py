from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    APP_NAME: str = 'GymUnity API'
    CORS_ORIGINS: list[str] = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://0.0.0.0:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    ENV: str = 'dev'
    DATABASE_URL: str = 'sqlite:///./gymunity.db'
    JWT_SECRET: str = 'change_me'
    JWT_ALG: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    NEWS_DATA_LAKE_PATH: str = './data/news'
    VECTOR_DB_URL: str = 'http://localhost:6333'
    VECTOR_DB_PROVIDER: str = 'none'  # 'none' | 'chroma' | 'qdrant'
    VECTOR_DB_PATH: str = './data/chroma'
    VECTOR_DB_NEWS_INDEX: str = 'gymunity-news'
    VECTOR_DB_USER_INDEX: str = 'gymunity-users'
    EMBEDDING_MODEL_NAME: str = 'sentence-transformers/all-MiniLM-L6-v2'
    NEWS_PIPELINE_ENABLED: bool = False
    NEWS_PIPELINE_INTERVAL_MINUTES: int = 30

    # AI Coach (Groq)
    GROQ_API_KEY: str = ''
    GROQ_MODEL: str = 'llama-3.3-70b-versatile'

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        return value

settings = Settings()
