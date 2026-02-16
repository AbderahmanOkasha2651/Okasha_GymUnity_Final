import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiUser, BASE_URL } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Settings, Plus, Send, Menu, X,
  Dumbbell, Target, Activity, Heart, AlertTriangle, Flame,
  Ruler, Weight, Calendar, Zap, MessageSquare, Search,
  FolderOpen, PanelLeftClose
} from 'lucide-react';
import './AICoach.css';

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
  timestamp?: number;
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
    'mt-1.5 w-full rounded-lg border border-[#4a453e] bg-[#3a352f] px-3 py-2.5 text-sm text-[#e8e0d8] placeholder-[#8a8278] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-[#4a453e] bg-[#2f2b26] p-6 shadow-2xl mx-4"
      >
        <h3 className="text-lg font-semibold text-[#e8e0d8]">معلوماتك الشخصية</h3>
        <p className="mt-1 text-xs text-[#8a8278]">
          هنستخدم البيانات دي علشان نخصصلك خطة مناسبة
        </p>

        <div className="mt-5 space-y-4" dir="rtl">
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">العمر</span>
            <input type="number" min={10} max={100} className={inputCls}
              value={draft.age ?? ''} onChange={(e) => set('age', Number(e.target.value))}
              placeholder="مثلاً: 25" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">الطول (سم)</span>
            <input type="number" min={100} max={250} className={inputCls}
              value={draft.height_cm ?? ''} onChange={(e) => set('height_cm', Number(e.target.value))}
              placeholder="مثلاً: 175" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">الوزن (كجم)</span>
            <input type="number" min={30} max={300} className={inputCls}
              value={draft.weight_kg ?? ''} onChange={(e) => set('weight_kg', Number(e.target.value))}
              placeholder="مثلاً: 80" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">مستوى النشاط</span>
            <select className={inputCls} value={draft.activity_level ?? ''}
              onChange={(e) => set('activity_level', e.target.value)}>
              <option value="">اختر...</option>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">أيام التمرين / أسبوع</span>
            <input type="number" min={1} max={7} className={inputCls}
              value={draft.training_days ?? ''} onChange={(e) => set('training_days', Number(e.target.value))}
              placeholder="مثلاً: 4" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#8a8278]">إصابات (اختياري)</span>
            <textarea rows={2} className={inputCls}
              value={draft.injuries ?? ''} onChange={(e) => set('injuries', e.target.value)}
              placeholder="مثال: إصابة في الركبة اليمنى" />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            className="focus-ring flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
            onClick={() => onSave(draft)}>
            حفظ
          </button>
          <button
            className="focus-ring flex-1 rounded-xl border border-[#4a453e] py-2.5 text-sm text-[#8a8278] hover:bg-[#3a352f] transition cursor-pointer"
            onClick={onClose}>
            إلغاء
          </button>
        </div>
      </motion.div>
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
  const displayName = currentUser?.name?.trim() || 'يا بطل';

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
  const [mobileDrawer, setMobileDrawer] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState<'chat' | 'profile'>('chat');
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const userScrolledUp = React.useRef(false);

  // Persist
  React.useEffect(() => saveMessages(uid, messages), [messages, uid]);
  React.useEffect(() => {
    if (conversationId) localStorage.setItem(convKey(uid), conversationId);
  }, [conversationId, uid]);

  // Smart auto-scroll
  React.useEffect(() => {
    if (scrollRef.current && !userScrolledUp.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 120;
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Close drawer on desktop
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => { if (mq.matches) setMobileDrawer(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ---------- send message ---------- */
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInput('');

    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    userScrolledUp.current = false;

    try {
      const body: Record<string, unknown> = { message: trimmed, goal, locale: 'ar' };
      if (conversationId) body.conversation_id = conversationId;
      if (profileComplete(profile)) body.user_profile = profile;

      const response = await fetch(`${BASE_URL}/api/ai/coach/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setError('انتهت جلستك. سجّل دخول مرة أخرى.');
        navigate('/login');
        return;
      }
      if (response.status >= 500) throw new Error('خطأ في السيرفر. جرب تاني بعد شوية.');
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Failed to reach AI Coach.');
      }

      const data = (await response.json()) as CoachChatResponse;
      setConversationId(data.conversation_id);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        follow_up_questions: data.follow_up_questions,
        meta: data.meta,
        timestamp: Date.now(),
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

  const latestMeta = messages.length > 0
    ? [...messages].reverse().find(m => m.meta)?.meta ?? null
    : null;

  const currentGoalLabel = GOALS.find(g => g.value === goal)?.labelAr || 'لياقة عامة';

  /* ---------- Sidebar JSX ---------- */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#e8e0d8]">GymUnity</span>
        </div>
        <button
          onClick={() => { setSidebarOpen(false); setMobileDrawer(false); }}
          className="focus-ring rounded-lg p-1.5 text-[#8a8278] hover:text-[#e8e0d8] hover:bg-white/5 transition cursor-pointer"
          aria-label="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pb-2">
        <button
          onClick={handleReset}
          className="sidebar-nav-item focus-ring"
        >
          <Plus size={18} />
          <span>محادثة جديدة</span>
        </button>
      </div>

      {/* Nav items */}
      <div className="px-3 space-y-0.5">
        <button
          onClick={() => setSidebarTab('chat')}
          className={`sidebar-nav-item focus-ring ${sidebarTab === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>المحادثات</span>
        </button>
        <button
          onClick={() => setSidebarTab('profile')}
          className={`sidebar-nav-item focus-ring ${sidebarTab === 'profile' ? 'active' : ''}`}
        >
          <User size={18} />
          <span>الملف الشخصي</span>
        </button>
        <button
          onClick={() => setShowProfileModal(true)}
          className="sidebar-nav-item focus-ring"
        >
          <Settings size={18} />
          <span>الإعدادات</span>
        </button>
      </div>

      {/* Separator */}
      <div className="mx-4 my-3 border-t border-[#3a352f]" />

      {/* Scrollable section */}
      <div className="flex-1 overflow-y-auto coach-scroll px-3">
        {sidebarTab === 'profile' ? (
          /* Profile details */
          <div className="space-y-3 px-1" dir="rtl">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6a6560] mb-3">
              بياناتك
            </div>
            {profileComplete(profile) ? (
              <div className="space-y-3">
                {([
                  [<Calendar size={14} />, 'العمر', profile.age],
                  [<Ruler size={14} />, 'الطول', `${profile.height_cm} سم`],
                  [<Weight size={14} />, 'الوزن', `${profile.weight_kg} كجم`],
                  [<Activity size={14} />, 'النشاط', profile.activity_level],
                  [<Zap size={14} />, 'أيام التمرين', profile.training_days],
                ] as [React.ReactNode, string, string | number | undefined][]).map(([icon, label, val]) => (
                  <div key={label} className="flex items-center gap-3 text-[13px]">
                    <span className="text-[#6a6560]">{icon}</span>
                    <span className="text-[#8a8278]">{label}</span>
                    <span className="text-[#e8e0d8] mr-auto">{val}</span>
                  </div>
                ))}
                {profile.injuries && (
                  <div className="flex items-center gap-3 text-[13px]">
                    <span className="text-[#6a6560]"><AlertTriangle size={14} /></span>
                    <span className="text-[#8a8278]">إصابات</span>
                    <span className="text-[#e8e0d8] mr-auto">{profile.injuries}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#3a352f] py-2 text-[12px] text-[#8a8278] hover:bg-white/5 hover:text-[#e8e0d8] transition cursor-pointer"
                >
                  <Settings size={13} />
                  تعديل البيانات
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowProfileModal(true)}
                className="focus-ring flex w-full items-center gap-3 rounded-xl border border-dashed border-emerald-600/30 bg-emerald-600/5 px-3 py-3.5 text-xs text-emerald-400/70 hover:bg-emerald-600/10 hover:text-emerald-400 transition cursor-pointer"
              >
                <User size={16} />
                <span>أضف بياناتك للحصول على خطة مخصصة</span>
              </button>
            )}

            {/* Goal */}
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6a6560] mb-2">
                الهدف
              </div>
              <select
                className="focus-ring w-full rounded-lg border border-[#3a352f] bg-[#2a2622] px-3 py-2 text-[13px] text-[#e8e0d8] outline-none cursor-pointer"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                aria-label="اختر هدفك"
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.labelAr}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Recents */
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6a6560] px-1 mb-2">
              المحادثات الأخيرة
            </div>
            {messages.length > 0 ? (
              <div className="space-y-0.5">
                <div className="sidebar-nav-item text-[13px]" style={{ cursor: 'default' }}>
                  <MessageSquare size={15} className="text-[#6a6560]" />
                  <span className="truncate" dir="rtl">
                    {messages[0]?.content?.substring(0, 40)}...
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-[#6a6560] px-1" dir="rtl">لا توجد محادثات بعد</p>
            )}
          </div>
        )}
      </div>

      {/* User section at bottom */}
      <div className="border-t border-[#3a352f] px-3 py-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/20 text-[13px] font-semibold text-emerald-400">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#e8e0d8] truncate">{displayName}</p>
            {latestMeta && (
              <p className="text-[10px] text-[#6a6560] flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${latestMeta.provider === 'groq' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                {latestMeta.provider === 'groq' ? 'Groq' : 'Stub'} • {latestMeta.model}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------- Input Box Component ---------- */
  const inputBox = (
    <div className="w-full max-w-[680px] mx-auto px-4">
      <div className="rounded-2xl border border-[#3a352f] bg-[#1a1816] overflow-hidden shadow-lg">
        {/* Text area */}
        <div className="px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] text-[#e8e0d8] placeholder-[#7a756e] outline-none leading-relaxed coach-scroll overflow-y-hidden"
            placeholder="اكتب رسالتك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ maxHeight: '200px' }}
            aria-label="رسالة للمدرب الذكي"
            dir="rtl"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            <button
              className="focus-ring rounded-lg p-2 text-[#7a756e] hover:text-[#e8e0d8] hover:bg-white/5 transition cursor-pointer"
              aria-label="إضافة مرفق"
              onClick={() => setSidebarTab('profile')}
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Model badge */}
            <span className="hidden sm:inline text-[11px] text-[#6a6560] px-2 py-1 rounded-md bg-white/[0.03]">
              {currentGoalLabel}
            </span>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8e0d8] text-[#2a2622] hover:bg-white disabled:opacity-20 transition cursor-pointer"
              aria-label="إرسال"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-2.5 text-center text-[11px] text-[#5a5550]">
        GymUnity AI Coach — هذه نصائح عامة وليست نصيحة طبية
      </p>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 flex bg-[#2f2b26] text-[#e8e0d8]">

      {/* ============== DESKTOP SIDEBAR ============== */}
      <div
        className={`hidden md:flex flex-shrink-0 flex-col bg-[#2a2622] transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[220px]' : 'w-0 overflow-hidden'
          }`}
      >
        {sidebarContent}
      </div>

      {/* ============== MOBILE DRAWER ============== */}
      <AnimatePresence>
        {mobileDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileDrawer(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-[#2a2622] shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============== MAIN AREA ============== */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar — minimal */}
        <div className="flex items-center px-4 py-3">
          {!sidebarOpen && (
            <button
              onClick={() => {
                if (window.innerWidth >= 768) setSidebarOpen(true);
                else setMobileDrawer(true);
              }}
              className="focus-ring rounded-lg p-2 text-[#7a756e] hover:text-[#e8e0d8] hover:bg-white/5 transition cursor-pointer mr-2"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          {/* Mobile hamburger when sidebar is "open" but hidden on mobile */}
          <button
            onClick={() => setMobileDrawer(true)}
            className="md:hidden focus-ring rounded-lg p-2 text-[#7a756e] hover:text-[#e8e0d8] hover:bg-white/5 transition cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
        </div>

        {/* Content area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto coach-scroll"
        >
          {messages.length === 0 && !isLoading ? (
            /* ============== EMPTY STATE (Claude style) ============== */
            <div className="flex flex-col items-center justify-center h-full px-4">
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl md:text-4xl font-semibold text-[#e8e0d8] flex items-center justify-center gap-3 mb-3">
                  <span className="text-emerald-400 text-4xl">✦</span>
                  <span>أهلاً, {displayName}</span>
                </h1>
                <p className="text-[15px] text-[#7a756e]">كيف أقدر أساعدك النهاردة؟</p>
              </motion.div>

              {/* Input box (centered like Claude) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="w-full max-w-[680px]"
              >
                {inputBox}
              </motion.div>

              {/* Quick suggestions below input (like Claude's "Connect tools") */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                {[
                  'عايز أخس 10 كيلو',
                  'خطة تمرين 5 أيام',
                  'نظام غذائي للمبتدئين',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="focus-ring rounded-full border border-[#3a352f] bg-transparent px-4 py-2 text-[13px] text-[#8a8278] hover:bg-white/5 hover:text-[#e8e0d8] hover:border-[#4a453e] transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* ============== MESSAGES ============== */
            <div className="mx-auto max-w-[680px] px-4 py-6 space-y-6">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-3"
                  >
                    {/* Avatar */}
                    <div className="mt-1 flex-shrink-0">
                      {isUser ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600/20 text-[11px] font-semibold text-emerald-400">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
                          <Dumbbell size={14} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#e8e0d8]">
                          {isUser ? displayName : 'GymUnity Coach'}
                        </span>
                      </div>
                      <div dir="rtl" className={isUser ? 'text-[15px] leading-[1.8] text-[#e8e0d8]/90 whitespace-pre-wrap' : 'ai-prose whitespace-pre-wrap'}>
                        {msg.content}
                      </div>

                      {/* Follow-up chips */}
                      {!isUser && msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2" dir="rtl">
                          {msg.follow_up_questions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              className="focus-ring rounded-full border border-[#3a352f] px-3.5 py-1.5 text-[12px] text-[#8a8278] hover:bg-white/5 hover:text-[#e8e0d8] hover:border-[#4a453e] transition cursor-pointer disabled:opacity-30"
                              onClick={() => sendMessage(q)}
                              disabled={isLoading}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Loading */}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="mt-1 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600">
                    <Dumbbell size={14} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-[#e8e0d8]">GymUnity Coach</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#8a8278] animate-bounce-dot" />
                        <span className="inline-block h-2 w-2 rounded-full bg-[#7a756e] animate-bounce-dot" style={{ animationDelay: '0.15s' }} />
                        <span className="inline-block h-2 w-2 rounded-full bg-[#6a6560] animate-bounce-dot" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <span className="text-[12px] text-[#6a6560]">بيفكر...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-auto max-w-[680px] w-full px-4 pb-2"
            >
              <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300/90">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="cursor-pointer p-1 hover:text-red-200 transition">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area at bottom (only when there are messages) */}
        {messages.length > 0 && (
          <div className="pb-4 pt-2 safe-bottom">
            {inputBox}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            profile={profile}
            onSave={handleSaveProfile}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
