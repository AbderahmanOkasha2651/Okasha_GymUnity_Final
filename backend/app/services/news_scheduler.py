from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.db.session import SessionLocal
from app.services.news_fetcher import fetch_news


def start_news_scheduler(app, interval_minutes: int = 30) -> None:
    if getattr(app.state, 'news_scheduler', None):
        return

    scheduler = BackgroundScheduler()

    def job():
        db = SessionLocal()
        try:
            fetch_news(db)
        finally:
            db.close()

    scheduler.add_job(job, IntervalTrigger(minutes=interval_minutes), id='news_fetch', replace_existing=True)
    scheduler.start()
    app.state.news_scheduler = scheduler


def stop_news_scheduler(app) -> None:
    scheduler = getattr(app.state, 'news_scheduler', None)
    if scheduler:
        scheduler.shutdown(wait=False)
        app.state.news_scheduler = None
