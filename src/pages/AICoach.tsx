import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiUser, BASE_URL } from '../lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  training_days?: number;
  injuries?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  follow_up_questions?: string[];
  meta?: { provider: string; model: string; used_rag: boolean };
}

interface CoachChatResponse {
  conversation_id: string;
  reply: string;
  follow_up_questions?: string[];
  meta: { provider: string; model: string; used_rag: boolean };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const readStoredUser = (): ApiUser | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
};

/* User-scoped localStorage keys */
const profileKey = (uid: string) => `ai_coach:${uid}:profile`;
const convKey = (uid: string) => `ai_coach:${uid}:conversation_id`;
const msgsKey = (uid: string) => `ai_coach:${uid}:messages`;

const loadProfile = (uid: string): UserProfile => {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    return raw ? (JSON.parse(raw) as UserProfile) : {};
  } catch {
    return {};
  }
};
const saveProfile = (uid: string, p: UserProfile) =>
  localStorage.setItem(profileKey(uid), JSON.stringify(p));

const loadMessages = (uid: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(msgsKey(uid));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
};
const saveMessages = (uid: string, msgs: ChatMessage[]) =>
  localStorage.setItem(msgsKey(uid), JSON.stringify(msgs));

const GOALS = [
  { value: 'lose_weight', labelAr: 'خسارة وزن', labelEn: 'Lose Weight' },
  { value: 'gain_muscle', labelAr: 'بناء عضل', labelEn: 'Gain Muscle' },
  { value: 'fitness', labelAr: 'لياقة عامة', labelEn: 'General Fitness' },
  { value: 'strength', labelAr: 'قوة', labelEn: 'Strength' },
  { value: 'endurance', labelAr: 'تحمل', labelEn: 'Endurance' },
];

const profileComplete = (p: UserProfile): boolean =>
  !!(p.age && p.height_cm && p.weight_kg && p.activity_level && p.training_days);

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG to avoid dependencies)                           */
/* ------------------------------------------------------------------ */

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Profile Modal                                                      */
/* ------------------------------------------------------------------ */

const ProfileModal: React.FC<{
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}> = ({ profile, onSave, onClose }) => {
  const [draft, setDraft] = React.useState<UserProfile>({ ...profile });
  const set = (key: keyof UserProfile, val: string | number) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const inputCls =
    'mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1e1e] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">معلوماتك الشخصية</h3>
        <p className="mt-1 text-xs text-white/40">
          هنستخدم البيانات دي علشان نخصصلك خطة مناسبة
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-white/50">العمر</span>
            <input type="number" min={10} max={100} className={inputCls}
              value={draft.age ?? ''} onChange={(e) => set('age', Number(e.target.value))}
              placeholder="مثلاً: 25" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/50">الطول (سم)</span>
            <input type="number" min={100} max={250} className={inputCls}
              value={draft.height_cm ?? ''} onChange={(e) => set('height_cm', Number(e.target.value))}
              placeholder="مثلاً: 175" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/50">الوزن (كجم)</span>
            <input type="number" min={30} max={300} className={inputCls}
              value={draft.weight_kg ?? ''} onChange={(e) => set('weight_kg', Number(e.target.value))}
              placeholder="مثلاً: 80" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/50">مستوى النشاط</span>
            <select className={inputCls} value={draft.activity_level ?? ''}
              onChange={(e) => set('activity_level', e.target.value)}>
              <option value="">اختر...</option>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/50">أيام التمرين / أسبوع</span>
            <input type="number" min={1} max={7} className={inputCls}
              value={draft.training_days ?? ''} onChange={(e) => set('training_days', Number(e.target.value))}
              placeholder="مثلاً: 4" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-white/50">إصابات (اختياري)</span>
            <textarea rows={2} className={inputCls}
              value={draft.injuries ?? ''} onChange={(e) => set('injuries', e.target.value)}
              placeholder="مثال: إصابة في الركبة اليمنى" />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition"
            onClick={() => onSave(draft)}>
            حفظ
          </button>
          <button
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5 transition"
            onClick={onClose}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export const AICoach: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = React.useState<ApiUser | null>(() => readStoredUser());
  const uid = currentUser?.id != null ? String(currentUser.id) : 'anonymous';

  const [messages, setMessages] = React.useState<ChatMessage[]>(() => loadMessages(uid));
  const [conversationId, setConversationId] = React.useState<string | null>(
    () => localStorage.getItem(convKey(uid)),
  );
  const [profile, setProfile] = React.useState<UserProfile>(() => loadProfile(uid));
  const [goal, setGoal] = React.useState('fitness');
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Persist state changes (user-scoped)
  React.useEffect(() => saveMessages(uid, messages), [messages, uid]);
  React.useEffect(() => {
    if (conversationId) localStorage.setItem(convKey(uid), conversationId);
  }, [conversationId, uid]);

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  /* ---------- send message ---------- */
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        message: trimmed,
        goal,
        locale: 'ar',
      };
      if (conversationId) body.conversation_id = conversationId;
      if (profileComplete(profile)) body.user_profile = profile;

      const response = await fetch(`${BASE_URL}/api/ai/coach/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Failed to reach AI Coach.');
      }

      const data = (await response.json()) as CoachChatResponse;
      setConversationId(data.conversation_id);
      console.log('[AI Coach] meta:', data.meta);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        follow_up_questions: data.follow_up_questions,
        meta: data.meta,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AI Coach] error:', err);
      const msg = err instanceof Error ? err.message : 'خطأ في الشبكة. جرب تاني.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    localStorage.removeItem(convKey(uid));
    localStorage.removeItem(msgsKey(uid));
  };

  const handleSaveProfile = (p: UserProfile) => {
    setProfile(p);
    saveProfile(uid, p);
    setShowProfileModal(false);
  };

  const latestMeta = messages.length > 0 ? messages[messages.length - 1].meta : null;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 flex bg-[#0d0d0d] text-white">

      {/* ============== SIDEBAR ============== */}
      <div
        className={`flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-[#141414] transition-all duration-300 ${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
          }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm font-semibold text-white/80 truncate">GymUnity Coach</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-white/40 hover:text-white hover:bg-white/5 transition"
            title="إغلاق القائمة"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleReset}
            className="flex w-full items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 transition"
          >
            <PlusIcon />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Separator */}
        <div className="mx-3 border-t border-white/[0.06]" />

        {/* Profile section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-1">
            الملف الشخصي
          </div>

          {profileComplete(profile) ? (
            <div className="space-y-2 rounded-lg bg-white/[0.03] p-3">
              {[
                ['العمر', profile.age],
                ['الطول', `${profile.height_cm} سم`],
                ['الوزن', `${profile.weight_kg} كجم`],
                ['النشاط', profile.activity_level],
                ['أيام التمرين', profile.training_days],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between text-xs">
                  <span className="text-white/30">{label}</span>
                  <span className="text-white/70">{val}</span>
                </div>
              ))}
              {profile.injuries && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/30">إصابات</span>
                  <span className="text-white/70">{profile.injuries}</span>
                </div>
              )}
              <button
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/[0.08] py-1.5 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition"
                onClick={() => setShowProfileModal(true)}
              >
                <SettingsIcon />
                تعديل البيانات
              </button>
            </div>
          ) : (
            <button
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-xs text-emerald-400/80 hover:bg-emerald-500/10 transition"
              onClick={() => setShowProfileModal(true)}
            >
              <UserIcon />
              أضف بياناتك للحصول على خطة مخصصة
            </button>
          )}

          {/* Goal selector */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-1 mb-2">
              الهدف
            </div>
            <select
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70 outline-none focus:border-emerald-500/30 transition"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              {GOALS.map((g) => (
                <option key={g.value} value={g.value}>{g.labelAr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sidebar footer — provider badge */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          {latestMeta ? (
            <div className="space-y-0.5 text-[10px] text-white/25">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${latestMeta.provider === 'groq' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                <span>{latestMeta.provider === 'groq' ? 'Groq' : 'Stub'} • {latestMeta.model}</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-white/20">GymUnity AI Coach v2</div>
          )}
        </div>
      </div>

      {/* ============== MAIN AREA ============== */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition"
              title="فتح القائمة"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
          )}
          <h1 className="text-sm font-medium text-white/60">GymUnity AI Coach 🏋️</h1>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            /* ---- Empty state (ChatGPT-style centered) ---- */
            <div className="flex h-full flex-col items-center justify-center px-6">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/10">
                <span className="text-3xl">🏋️</span>
              </div>
              <h2 className="text-2xl font-semibold text-white/80 mb-2">جاهز لما تكون جاهز</h2>
              <p className="max-w-md text-center text-sm text-white/30 leading-relaxed">
                اسألني عن خطة تمارين، نظام غذائي، أو أي حاجة تخص اللياقة البدنية.
                <br />
                ابدأ بمشاركة أهدافك! 💪
              </p>

              {/* Quick-start chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                {[
                  'عايز أخس 10 كيلو',
                  'خطة تمرين 5 أيام',
                  'نظام غذائي لبناء العضل',
                  'تمارين للمبتدئين',
                ].map((q) => (
                  <button
                    key={q}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ---- Messages ---- */
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {/* Avatar for assistant */}
                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
                      🏋️
                    </div>
                  )}

                  <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                          ? 'bg-emerald-600/20 text-white/90 border border-emerald-500/10'
                          : 'bg-white/[0.04] text-white/80 border border-white/[0.06]'
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Follow-up question chips */}
                    {msg.role === 'assistant' &&
                      msg.follow_up_questions &&
                      msg.follow_up_questions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.follow_up_questions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-300 transition disabled:opacity-30"
                              onClick={() => sendMessage(q)}
                              disabled={isLoading}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Avatar for user */}
                  {msg.role === 'user' && (
                    <div className="mt-1 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/[0.08] text-xs font-semibold text-white/60">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
                    🏋️
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/60 animate-pulse" />
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/40 animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/20 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-3xl w-full px-4 pb-2">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-300/80">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* ---- Input area (ChatGPT style — centered bottom) ---- */}
        <div className="border-t border-white/[0.04] bg-[#0d0d0d] px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 focus-within:border-emerald-500/20 transition">
              <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/25 outline-none"
                placeholder="اكتب رسالتك هنا..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ maxHeight: '200px' }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-20 disabled:hover:bg-emerald-500 transition"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/20">
              GymUnity AI Coach — هذه نصائح عامة وليست نصيحة طبية • Enter للإرسال
            </p>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};
