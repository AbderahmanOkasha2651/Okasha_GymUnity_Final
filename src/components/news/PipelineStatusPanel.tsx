import React from 'react';
import { Button } from '../../../components/ui/Button';
import { NewsStatus } from '../../lib/newsApi';

interface PipelineStatusPanelProps {
  status: NewsStatus | null;
  isLoading?: boolean;
  onFetchNow: () => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not run yet';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString();
};

export const PipelineStatusPanel: React.FC<PipelineStatusPanelProps> = ({
  status,
  isLoading,
  onFetchNow,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Pipeline Status</h2>
          <p className="mt-1 text-xs text-white/60">Monitor the ingestion pipeline.</p>
        </div>
        <Button
          className="px-5 py-2 text-xs !bg-mindrift-green !hover:bg-mindrift-greenHover"
          onClick={onFetchNow}
          disabled={isLoading}
        >
          {isLoading ? 'Running...' : 'Fetch now'}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Last run</p>
          <p className="mt-1 text-sm text-white">{formatDateTime(status?.last_run)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Sources checked</p>
          <p className="mt-1 text-sm text-white">{status?.sources_checked ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Items ingested</p>
          <p className="mt-1 text-sm text-white">{status?.items_ingested ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Success</p>
          <p className="mt-1 text-sm text-white">{status?.sources_success ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Failed</p>
          <p className="mt-1 text-sm text-white">{status?.sources_failed ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
          <p className="uppercase text-white/50">Last error</p>
          <p className="mt-1 text-sm text-white/80">{status?.last_error ?? 'None'}</p>
        </div>
      </div>
    </div>
  );
};
