"""Real RSS ingestion pipeline.

Stages: Fetch → Parse → Normalize → Dedup → Enrich → Persist
Replaces the previous stub that only updated timestamps.
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
from datetime import datetime
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

import feedparser
import httpx
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.news import NewsArticle, NewsSource, RawFeedItem
from app.services.enrichment import enrich_article

logger = logging.getLogger(__name__)

# Tracking params to strip for canonical URLs
_TRACKING_PARAMS = frozenset({
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source',
})

_TAG_RE = re.compile(r'<[^>]+>')

MAX_CONSECUTIVE_ERRORS = 5
FETCH_TIMEOUT = httpx.Timeout(connect=15.0, read=30.0, write=10.0, pool=10.0)
MAX_RETRIES = 3


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _canonical_url(url: str) -> str:
    """Remove tracking query params and normalize URL."""
    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=False)
        cleaned = {k: v for k, v in params.items() if k.lower() not in _TRACKING_PARAMS}
        new_query = urlencode(cleaned, doseq=True)
        return urlunparse(parsed._replace(query=new_query, fragment=''))
    except Exception:
        return url


def _url_hash(url: str) -> str:
    """SHA-256 of canonical URL."""
    return hashlib.sha256(_canonical_url(url).encode('utf-8')).hexdigest()


def _content_hash(title: str, summary: str, content: str | None) -> str:
    """SHA-256 of combined text for change detection."""
    text = f'{title}\n{summary}\n{content or ""}'
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def _strip_html(text: str | None) -> str:
    """Remove HTML tags from text."""
    if not text:
        return ''
    cleaned = _TAG_RE.sub(' ', text)
    return re.sub(r'\s+', ' ', cleaned).strip()


def _parse_date(entry) -> datetime | None:
    """Parse date from feedparser entry."""
    for field in ('published_parsed', 'updated_parsed'):
        parsed = getattr(entry, field, None)
        if parsed:
            try:
                return datetime(*parsed[:6])
            except Exception:
                continue
    # Try raw string fallback
    for field in ('published', 'updated'):
        raw = getattr(entry, field, None)
        if raw:
            try:
                from email.utils import parsedate_to_datetime
                return parsedate_to_datetime(raw)
            except Exception:
                continue
    return None


def _extract_image(entry) -> str | None:
    """Try to extract image URL from RSS entry."""
    # media:content or media:thumbnail
    media = getattr(entry, 'media_content', None)
    if media and len(media) > 0:
        url = media[0].get('url', None)
        if url:
            return url
    media_thumb = getattr(entry, 'media_thumbnail', None)
    if media_thumb and len(media_thumb) > 0:
        url = media_thumb[0].get('url', None)
        if url:
            return url
    # enclosures
    enclosures = getattr(entry, 'enclosures', [])
    for enc in enclosures:
        if enc.get('type', '').startswith('image/'):
            return enc.get('href') or enc.get('url')
    return None


# ---------------------------------------------------------------------------
# HTTP fetch with retries
# ---------------------------------------------------------------------------

def _fetch_rss_content(url: str) -> str | None:
    """Fetch RSS XML content with retries and exponential backoff."""
    for attempt in range(MAX_RETRIES):
        try:
            with httpx.Client(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
                resp = client.get(url, headers={'User-Agent': 'GymUnity-NewsBot/1.0'})
                resp.raise_for_status()
                return resp.text
        except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.ConnectError) as exc:
            wait = 2 ** attempt
            logger.warning('Fetch attempt %d/%d failed for %s: %s — retrying in %ds',
                           attempt + 1, MAX_RETRIES, url, exc, wait)
            if attempt < MAX_RETRIES - 1:
                time.sleep(wait)
        except Exception as exc:
            logger.error('Unexpected error fetching %s: %s', url, exc)
            return None
    return None


# ---------------------------------------------------------------------------
# Process a single source
# ---------------------------------------------------------------------------

def _process_source(db: Session, source: NewsSource) -> dict:
    """Fetch and process a single RSS source. Returns stats dict."""
    stats = {'articles_found': 0, 'articles_new': 0, 'articles_skipped': 0, 'error': None}

    xml_content = _fetch_rss_content(source.rss_url)
    if xml_content is None:
        source.fetch_error_count += 1
        source.last_error = f'Failed to fetch after {MAX_RETRIES} retries'
        if source.fetch_error_count >= MAX_CONSECUTIVE_ERRORS:
            source.enabled = False
            logger.warning('Source "%s" auto-disabled after %d consecutive errors',
                           source.name, MAX_CONSECUTIVE_ERRORS)
        stats['error'] = source.last_error
        return stats

    feed = feedparser.parse(xml_content)
    if feed.bozo and not feed.entries:
        source.fetch_error_count += 1
        source.last_error = f'Malformed RSS: {feed.bozo_exception}'
        stats['error'] = source.last_error
        logger.warning('Malformed RSS from "%s": %s', source.name, feed.bozo_exception)
        return stats

    # Success — reset error count
    source.fetch_error_count = 0
    source.last_error = None
    source.last_fetched_at = datetime.utcnow()

    stats['articles_found'] = len(feed.entries)

    for entry in feed.entries:
        link = getattr(entry, 'link', None)
        if not link:
            stats['articles_skipped'] += 1
            continue

        canonical = _canonical_url(link)
        url_h = _url_hash(link)
        guid = getattr(entry, 'id', None) or link
        title = _strip_html(getattr(entry, 'title', '')) or 'Untitled'
        summary = _strip_html(getattr(entry, 'summary', ''))[:2000]
        content_val = ''
        if hasattr(entry, 'content') and entry.content:
            content_val = _strip_html(entry.content[0].get('value', ''))[:50000]
        author = getattr(entry, 'author', None)
        image = _extract_image(entry)
        published = _parse_date(entry)

        # --- Dedup: check raw_feed_items ---
        existing_raw = db.query(RawFeedItem).filter(
            RawFeedItem.source_id == source.id,
            RawFeedItem.url_hash == url_h,
        ).first()
        if existing_raw:
            stats['articles_skipped'] += 1
            continue

        # Insert raw feed item
        raw_item = RawFeedItem(
            source_id=source.id,
            guid=guid,
            url=canonical,
            url_hash=url_h,
            title_raw=title,
            summary_raw=summary,
            content_raw=content_val or None,
            author_raw=author,
            image_url_raw=image,
            published_raw=str(published) if published else None,
            status='pending',
        )
        try:
            db.add(raw_item)
            db.flush()
        except IntegrityError:
            db.rollback()
            stats['articles_skipped'] += 1
            continue

        # --- Persist to news_articles ---
        c_hash = _content_hash(title, summary, content_val)
        unique_h = hashlib.sha256(canonical.encode('utf-8')).hexdigest()

        existing_article = db.query(NewsArticle).filter(
            NewsArticle.source_id == source.id,
            NewsArticle.unique_hash == unique_h,
        ).first()

        if existing_article:
            # Update if content changed
            if existing_article.content_hash != c_hash:
                existing_article.title = title
                existing_article.summary = summary
                existing_article.content = content_val or None
                existing_article.content_hash = c_hash
                existing_article.image_url = image
                # Re-enrich
                enriched = enrich_article({
                    'title': title, 'summary': summary,
                    'content': content_val or None, 'image_url': image,
                    'published_at': published,
                })
                existing_article.topics_json = enriched['topics_json']
                existing_article.keywords_json = enriched['keywords_json']
                existing_article.quality_score = enriched['quality_score']
            raw_item.status = 'processed'
            stats['articles_skipped'] += 1
            continue

        # Enrich new article
        article_data = {
            'title': title, 'summary': summary,
            'content': content_val or None, 'image_url': image,
            'published_at': published,
        }
        enriched = enrich_article(article_data)

        new_article = NewsArticle(
            source_id=source.id,
            title=title,
            link=canonical,
            guid=guid,
            unique_hash=unique_h,
            published_at=published,
            author=author,
            summary=summary,
            content=content_val or None,
            image_url=image,
            tags=','.join(source.tags.split(',')[:3]) if source.tags else '',
            language='en',
            topics_json=enriched['topics_json'],
            keywords_json=enriched['keywords_json'],
            quality_score=enriched['quality_score'],
            popularity_score=0.0,
            content_hash=c_hash,
        )

        try:
            db.add(new_article)
            db.flush()
            raw_item.status = 'processed'
            stats['articles_new'] += 1
        except IntegrityError:
            db.rollback()
            raw_item.status = 'duplicate'
            stats['articles_skipped'] += 1

    return stats


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def fetch_news(db: Session) -> dict:
    """Run the full RSS ingestion pipeline for all enabled sources."""
    sources = db.query(NewsSource).filter(NewsSource.enabled.is_(True)).all()
    logger.info('Starting RSS ingestion for %d enabled sources', len(sources))

    total_stats = {
        'fetched_at': datetime.utcnow(),
        'sources_checked': len(sources),
        'sources_success': 0,
        'sources_failed': 0,
        'articles_new': 0,
        'articles_total': 0,
    }

    for source in sources:
        start = time.time()
        stats = _process_source(db, source)
        elapsed = round(time.time() - start, 2)

        if stats['error']:
            total_stats['sources_failed'] += 1
            logger.warning('Source "%s" failed in %.2fs: %s', source.name, elapsed, stats['error'])
        else:
            total_stats['sources_success'] += 1
            logger.info(
                'Source "%s" done in %.2fs: found=%d new=%d skipped=%d',
                source.name, elapsed,
                stats['articles_found'], stats['articles_new'], stats['articles_skipped'],
            )

        total_stats['articles_new'] += stats['articles_new']
        total_stats['articles_total'] += stats['articles_found']

        # Small delay between sources to be polite
        time.sleep(1)

    db.commit()
    logger.info(
        'RSS ingestion complete: %d/%d sources ok, %d new articles',
        total_stats['sources_success'], total_stats['sources_checked'],
        total_stats['articles_new'],
    )
    return total_stats
