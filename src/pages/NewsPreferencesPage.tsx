import React from 'react';
import { NewsHeader } from '../components/news/NewsHeader';
import { PreferencesForm } from '../components/news/PreferencesForm';
import { NewsPreferences, getPreferences, updatePreferences } from '../lib/newsApi';
import { EQUIPMENT_OPTIONS, EXPERIENCE_LEVELS, NEWS_TOPICS } from '../lib/newsConstants';

const emptyPreferences: NewsPreferences = {
  topics: [],
  level: EXPERIENCE_LEVELS[0],
  equipment: EQUIPMENT_OPTIONS[0],
  blocked_keywords: [],
};

export const NewsPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = React.useState<NewsPreferences>(emptyPreferences);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPreferences();
        setPreferences({
          topics: data.topics.length ? data.topics : NEWS_TOPICS.slice(0, 3),
          level: data.level,
          equipment: data.equipment,
          blocked_keywords: data.blocked_keywords,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load preferences.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updatePreferences(preferences);
      setPreferences(updated);
      setSuccess('Preferences saved.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save preferences.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <NewsHeader
            title="News Preferences"
            subtitle="Tune your feed to the training topics you care about."
          />

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              Loading preferences...
            </div>
          ) : (
            <PreferencesForm
              value={preferences}
              onChange={setPreferences}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
};
