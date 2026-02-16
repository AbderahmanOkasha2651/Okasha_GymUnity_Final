import React from 'react';
import { Button } from '../../../components/ui/Button';
import { NewsSource, NewsSourcePayload } from '../../lib/newsApi';

interface SourcesTableProps {
  sources: NewsSource[];
  onCreate: (payload: NewsSourcePayload) => Promise<void>;
  onUpdate: (id: number, payload: Partial<NewsSourcePayload>) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

const emptyForm: NewsSourcePayload = {
  name: '',
  rss_url: '',
  category: '',
  tags: [],
  enabled: true,
};

export const SourcesTable: React.FC<SourcesTableProps> = ({
  sources,
  onCreate,
  onUpdate,
  onToggle,
  onDelete,
  isLoading,
}) => {
  const [form, setForm] = React.useState<NewsSourcePayload>(emptyForm);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState<NewsSourcePayload>(emptyForm);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.rss_url.trim()) {
      return;
    }
    await onCreate(form);
    setForm(emptyForm);
  };

  const startEdit = (source: NewsSource) => {
    setEditingId(source.id);
    setEditForm({
      name: source.name,
      rss_url: source.rss_url,
      category: source.category ?? '',
      tags: source.tags,
      enabled: source.enabled,
    });
  };

  const handleEditSave = async () => {
    if (editingId === null) {
      return;
    }
    await onUpdate(editingId, editForm);
    setEditingId(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h2 className="text-lg font-semibold text-white">News Sources</h2>
      <p className="mt-1 text-xs text-white/60">Manage RSS sources and availability.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
          placeholder="Source name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
          placeholder="RSS URL"
          value={form.rss_url}
          onChange={(event) => setForm({ ...form, rss_url: event.target.value })}
        />
        <input
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
          placeholder="Category"
          value={form.category ?? ''}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        />
        <input
          className="rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
          placeholder="Tags (comma separated)"
          value={form.tags.join(', ')}
          onChange={(event) =>
            setForm({
              ...form,
              tags: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          className="px-5 py-2 text-xs !bg-mindrift-green !hover:bg-mindrift-greenHover"
          onClick={handleCreate}
          disabled={isLoading}
        >
          Add source
        </Button>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/30 bg-white/10 text-mindrift-green focus:ring-mindrift-green/60"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/80"
          >
            {editingId === source.id ? (
              <div className="grid gap-3 md:grid-cols-5">
                <input
                  className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
                  value={editForm.rss_url}
                  onChange={(event) => setEditForm({ ...editForm, rss_url: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
                  value={editForm.category ?? ''}
                  onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
                  value={editForm.tags.join(', ')}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      tags: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={handleEditSave}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{source.name}</p>
                  <p className="text-xs text-white/50">{source.rss_url}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {source.category ?? 'uncategorized'} • {source.tags.join(', ') || 'no tags'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" onClick={() => startEdit(source)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => onToggle(source.id)}>
                    {source.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" onClick={() => onDelete(source.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {sources.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/60">
            No sources yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
};
