import React from 'react';
import { ArticleCard } from '../components/news/ArticleCard';
import { FiltersBar, FiltersState } from '../components/news/FiltersBar';
import { NewsHeader } from '../components/news/NewsHeader';
import {
  NewsArticle,
  NewsSource,
  getExploreNews,
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

export const NewsExplorePage: React.FC = () => {
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
      const data = await getExploreNews({
        ...activeFilters,
        page: targetPage,
        page_size: pageSize,
      });
      setArticles(data.items);
      setPage(data.page);
      setTotal(data.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load explore feed.';
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
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <NewsHeader
            title="Explore GymUnity News"
            subtitle="Browse all sources and discover trending fitness updates."
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
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Loading explore feed...
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              No articles match your filters.
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

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
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
