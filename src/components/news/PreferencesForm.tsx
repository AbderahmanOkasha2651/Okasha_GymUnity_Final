import React from 'react';
import { Button } from '../../../components/ui/Button';
import { EQUIPMENT_OPTIONS, EXPERIENCE_LEVELS, NEWS_TOPICS } from '../../lib/newsConstants';
import { NewsPreferences } from '../../lib/newsApi';

interface PreferencesFormProps {
  value: NewsPreferences;
  onChange: (next: NewsPreferences) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  value,
  onChange,
  onSave,
  isSaving,
}) => {
  const toggleTopic = (topic: string) => {
    const exists = value.topics.includes(topic);
    const nextTopics = exists
      ? value.topics.filter((item) => item !== topic)
      : [...value.topics, topic];
    onChange({ ...value, topics: nextTopics });
  };

  const blockedKeywordsText = value.blocked_keywords.join(', ');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h2 className="text-xl font-semibold text-white">Your Preferences</h2>
      <p className="mt-1 text-sm text-white/60">
        Customize the feed by topics, difficulty, and equipment.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Topics</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {NEWS_TOPICS.map((topic) => (
              <label key={topic} className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-white/10 text-mindrift-green focus:ring-mindrift-green/60"
                  checked={value.topics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs text-white/60">
            Experience level
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
              value={value.level}
              onChange={(event) => onChange({ ...value, level: event.target.value })}
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-white/60">
            Equipment
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
              value={value.equipment}
              onChange={(event) => onChange({ ...value, equipment: event.target.value })}
            >
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <option key={equipment} value={equipment}>
                  {equipment}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-xs text-white/60">
          Blocked keywords (comma separated)
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-sm text-white"
            value={blockedKeywordsText}
            onChange={(event) =>
              onChange({
                ...value,
                blocked_keywords: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <Button
          className="px-6 py-2.5 text-sm !bg-mindrift-green !hover:bg-mindrift-greenHover"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save preferences'}
        </Button>
      </div>
    </div>
  );
};
