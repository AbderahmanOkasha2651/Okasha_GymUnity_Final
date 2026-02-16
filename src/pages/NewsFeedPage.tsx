import React from 'react';
import { ArticleCard } from '../components/news/ArticleCard';
import { FiltersBar, FiltersState } from '../components/news/FiltersBar';
import { NewsHeader } from '../components/news/NewsHeader';
import {
  NewsArticle,
  NewsSource,
  getNewsFeed,
  getNewsSources,
  hideArticle,
  saveArticle,
  unsaveArticle,
} from '../lib/newsApi';

const DEFAULT_FILTERS: FiltersState = {
  topic: '',
  source: '',
  q: '',
  from: '',
  to: '',
};

export const NewsFeedPage: React.FC = () => {
  const [filters, setFilters] = React.useState<FiltersState>(DEFAULT_FILTERS);
  const [sources, setSources] = React.useState<NewsSource[]>([]);
  const [articles, setArticles] = React.useState<NewsArticle[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pageSize = 6;

  const loadSources = async () => {
    try {
      const data = await getNewsSources();
      setSources(data);
    } catch {
      setSources([]);
    }
  };

  const loadFeed = async (targetPage = 1, overrideFilters?: FiltersState) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = overrideFilters ?? filters;
      const data = await getNewsFeed({
        ...activeFilters,
        page: targetPage,
        page_size: pageSize,
      });
      setArticles(data.items);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load your news feed.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadSources();
    loadFeed(1, filters);
  }, []);

  const handleSaveToggle = async (article: NewsArticle) => {
    try {
      if (article.saved) {
        await unsaveArticle(article.id);
      } else {
        await saveArticle(article.id);
      }
      setArticles((prev) =>
        prev.map((item) =>
          item.id === article.id ? { ...item, saved: !item.saved } : item
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update save.';
      setError(message);
    }
  };

  const handleHide = async (article: NewsArticle) => {
    try {
      await hideArticle(article.id);
      setArticles((prev) => prev.filter((item) => item.id !== article.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to hide article.';
      setError(message);
    }
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    loadFeed(1, DEFAULT_FILTERS);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background video for the news experience; hides when prefers-reduced-motion is enabled */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .news-bg-video { display: none; }
        }
      `}</style>
      <video
        className="news-bg-video absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        src="/Realistic_Home_Workout_Video_Generation.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/85" aria-hidden="true" />

      <div className="relative px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <NewsHeader
            title="GymUnity News"
            subtitle="Your personalized fitness feed based on saved preferences."
          />

          <FiltersBar
            value={filters}
            sources={sources}
            onChange={setFilters}
            onApply={() => loadFeed(1)}
            onReset={handleReset}
            isLoading={isLoading}
          />

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-sm text-white/70 backdrop-blur-sm">
              Loading your feed...
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-sm text-white/70 backdrop-blur-sm">
              No articles match your preferences.
            </div>
          )}

          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onSaveToggle={handleSaveToggle}
                onHide={handleHide}
              />
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-white/70 backdrop-blur-sm">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white disabled:opacity-50"
                onClick={() => loadFeed(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:text-white disabled:opacity-50"
                onClick={() => loadFeed(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
