import React from 'react';
import { useParams } from 'react-router-dom';
import { ArticleCard } from '../components/news/ArticleCard';
import { NewsHeader } from '../components/news/NewsHeader';
import { NewsArticle, getArticle, hideArticle, saveArticle, unsaveArticle } from '../lib/newsApi';

export const NewsArticlePage: React.FC = () => {
  const { id } = useParams();
  const articleId = Number(id);
  const [article, setArticle] = React.useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      if (!articleId || Number.isNaN(articleId)) {
        setError('Invalid article.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await getArticle(articleId);
        setArticle(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load article.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [articleId]);

  const handleSaveToggle = async () => {
    if (!article) {
      return;
    }
    try {
      if (article.saved) {
        await unsaveArticle(article.id);
      } else {
        await saveArticle(article.id);
      }
      setArticle({ ...article, saved: !article.saved });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update save.';
      setError(message);
    }
  };

  const handleHide = async () => {
    if (!article) {
      return;
    }
    try {
      await hideArticle(article.id);
      setArticle(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to hide article.';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <NewsHeader
            title="Article details"
            subtitle="Dive deeper into the story and save it for later."
          />

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Loading article...
            </div>
          )}

          {!isLoading && !article && !error && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Article not found.
            </div>
          )}

          {article && (
            <div className="space-y-4">
              <ArticleCard
                article={article}
                onSaveToggle={handleSaveToggle}
                onHide={handleHide}
              />
              {article.content && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                  {article.content}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
