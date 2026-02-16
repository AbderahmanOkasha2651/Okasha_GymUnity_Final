import React from 'react';
import { Button } from '../../../components/ui/Button';
import { NewsSource } from '../../lib/newsApi';
import { NEWS_TOPICS } from '../../lib/newsConstants';

export interface FiltersState {
  topic: string;
  source: string;
  q: string;
  from: string;
  to: string;
}

interface FiltersBarProps {
  value: FiltersState;
  sources: NewsSource[];
  onChange: (next: FiltersState) => void;
  onApply: () => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  value,
  sources,
  onChange,
  onApply,
  onReset,
  isLoading,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="grid gap-3 md:grid-cols-5">
        <label className="text-xs text-white/60">
          Topic
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            value={value.topic}
            onChange={(event) => onChange({ ...value, topic: event.target.value })}
          >
            <option value="">All topics</option>
            {NEWS_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-white/60">
          Source
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            value={value.source}
            onChange={(event) => onChange({ ...value, source: event.target.value })}
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source.id} value={String(source.id)}>
                {source.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-white/60">
          Search
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            placeholder="Search title or summary"
            value={value.q}
            onChange={(event) => onChange({ ...value, q: event.target.value })}
          />
        </label>

        <label className="text-xs text-white/60">
          From
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            value={value.from}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
        </label>

        <label className="text-xs text-white/60">
          To
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            value={value.to}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="px-5 py-2 text-xs !bg-mindrift-green !hover:bg-mindrift-greenHover"
          onClick={onApply}
          disabled={isLoading}
        >
          Apply filters
        </Button>
        {onReset && (
          <Button variant="ghost" onClick={onReset} disabled={isLoading}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
