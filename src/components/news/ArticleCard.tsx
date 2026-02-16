import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { NewsArticle } from '../../lib/newsApi';

interface ArticleCardProps {
  article: NewsArticle;
  onSaveToggle?: (article: NewsArticle) => void;
  onHide?: (article: NewsArticle) => void;
  showActions?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'No date';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }
  return date.toLocaleDateString();
};

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSaveToggle,
  onHide,
  showActions = true,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{article.title}</h3>
          <p className="mt-1 text-xs text-white/60">
            {article.source.name} • {formatDate(article.published_at)}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/60">
          {article.source.category ?? 'Fitness'}
        </span>
      </div>

      <p className="mt-3 text-sm text-white/70">{article.summary || 'No summary available.'}</p>

      {article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={`${article.id}-${tag}`}
              className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {showActions && (
      <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => onSaveToggle?.(article)}>
            {article.saved ? 'Unsave' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => onHide?.(article)}>
            Hide
          </Button>
          <Link
            to={`/news/article/${article.id}`}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:text-white"
          >
            View details
          </Link>
          <a
            href={article.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:text-white"
          >
            Open original
          </a>
        </div>
      )}
    </div>
  );
};
