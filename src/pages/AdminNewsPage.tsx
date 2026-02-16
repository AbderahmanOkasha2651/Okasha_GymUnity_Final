import React from 'react';
import { NewsHeader } from '../components/news/NewsHeader';
import { PipelineStatusPanel } from '../components/news/PipelineStatusPanel';
import { SourcesTable } from '../components/news/SourcesTable';
import {
  NewsSource,
  NewsSourcePayload,
  NewsStatus,
  adminCreateSource,
  adminDeleteSource,
  adminFetchNow,
  adminGetSources,
  adminGetStatus,
  adminToggleSource,
  adminUpdateSource,
} from '../lib/newsApi';

export const AdminNewsPage: React.FC = () => {
  const [sources, setSources] = React.useState<NewsSource[]>([]);
  const [status, setStatus] = React.useState<NewsStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSources = React.useCallback(async () => {
    try {
      const data = await adminGetSources();
      setSources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load sources.';
      setError(message);
    }
  }, []);

  const loadStatus = React.useCallback(async () => {
    try {
      const data = await adminGetStatus();
      setStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load status.';
      setError(message);
    }
  }, []);

  React.useEffect(() => {
    loadSources();
    loadStatus();
  }, [loadSources, loadStatus]);

  const refreshAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await adminFetchNow();
      await Promise.all([loadStatus(), loadSources()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to trigger fetch.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (payload: NewsSourcePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminCreateSource(payload);
      await loadSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create source.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: number, payload: Partial<NewsSourcePayload>) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminUpdateSource(id, payload);
      await loadSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update source.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminToggleSource(id);
      await loadSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to toggle source.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await adminDeleteSource(id);
      await loadSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete source.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <NewsHeader
            title="News Admin"
            subtitle="Control sources, pipeline status, and fetch cycles."
          />

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <PipelineStatusPanel status={status} isLoading={isLoading} onFetchNow={refreshAll} />

          <SourcesTable
            sources={sources}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
