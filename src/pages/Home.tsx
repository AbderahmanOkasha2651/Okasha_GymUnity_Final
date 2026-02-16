import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  Globe,
  GraduationCap,
  Play,
  Camera,
  Frown,
  LineChart,
  Brain,
  Bot,
  BarChart3,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TeamSection } from '../../components/TeamSection';
import CardSwap, { Card } from '../components/reactbits/CardSwap';
import TextType from '../components/reactbits/TextType/TextType';

const COMMUNITY_STATS = [
  {
    label: '10K+ Athletes',
    icon: Users,
    color: 'bg-[#C9A9FF] text-[#2C1F4A]',
  },
  {
    label: '50 Training Programs',
    icon: Layers,
    color: 'bg-[#78E6B8] text-[#0F2C1F]',
  },
  {
    label: '15 Specialties',
    icon: Globe,
    color: 'bg-[#7CC4FF] text-[#0C2A45]',
  },
  {
    label: '70% Certified Coaches',
    icon: GraduationCap,
    color: 'bg-[#FFC36A] text-[#4A2B00]',
  },
];

const PROBLEM_CARDS = [
  {
    title: 'No Form Correction',
    description: 'You could be doing exercises incorrectly without even knowing it.',
    Icon: Camera,
    accent: 'bg-[#F4DCC9] text-[#C86C1F]',
    bg: 'bg-[#6bc59d]',
  },
  {
    title: 'Lack of Motivation',
    description: 'It’s easy to lose drive without guidance and support.',
    Icon: Frown,
    accent: 'bg-[#F6D8D8] text-[#C15A5A]',
    bg: 'bg-[#99c56b]',
  },
  {
    title: 'No Real Progress',
    description: 'Hard to track your results and see real improvement.',
    Icon: LineChart,
    accent: 'bg-[#F4E4CF] text-[#C07A1F]',
    bg: 'bg-[#ae5858]',
  },
  {
    title: 'Overwhelmed & Confused',
    description: 'Too much conflicting info makes it hard to know what works.',
    Icon: Brain,
    accent: 'bg-[#E9DCD3] text-[#8D5C3A]',
    bg: 'bg-[#d5c12d]',
  },
];

const SOLUTION_CARDS = [
  {
    title: 'AI Form Correction',
    description: 'Real-time feedback to keep your form safe and your gains steady.',
    Icon: Bot,
    accent: 'bg-[#E4D9FF] text-[#5A32C7]',
  },
  {
    title: 'Smart Progress Analytics',
    description: 'Track detailed stats with personalized growth insights.',
    Icon: BarChart3,
    accent: 'bg-[#D7F1DD] text-[#1D7A46]',
  },
  {
    title: 'Mind-Fit',
    description: 'Mindfulness and stress management for balanced performance.',
    Icon: Brain,
    accent: 'bg-[#F5E0DC] text-[#B05A4F]',
  },
  {
    title: 'Gamified Fitness',
    description: 'Challenges, rewards, and missions that keep you engaged.',
    Icon: Gamepad2,
    accent: 'bg-[#F7E5D3] text-[#A86A2C]',
  },
  {
    title: 'Community Teams',
    description: 'Join teams, find accountability partners, and level up together.',
    Icon: Users,
    accent: 'bg-[#EADCCE] text-[#7B5A33]',
  },
  {
    title: 'Personalized Coaching',
    description: 'Adaptive plans tuned to your goals with AI + expert insight.',
    Icon: Sparkles,
    accent: 'bg-[#E6ECFF] text-[#3A55D1]',
  },
];

const marqueeStyles = `
@keyframes homeMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.home-marquee__shell {
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}
.home-marquee__track {
  display: flex;
  gap: 3rem;
  width: max-content;
  animation: homeMarquee 80s linear infinite;
}
.problem-marquee__shell {
  overflow: hidden;
  position: relative;
}
.problem-marquee__track {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: problemMarquee var(--problem-speed, 28s) linear infinite;
}
@keyframes problemMarquee {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .problem-marquee__track {
    animation: none !important;
  }
  .problem-marquee__shell {
    overflow: visible;
  }
}
`;

export const Home: React.FC = () => {
  return (
    <div className="bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src="/6037604_Sport_Fitness_3840x2160.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/75"></div>
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24 pt-32 text-center">
          <p className="text-xs font-medium tracking-[0.45em] text-white/60 uppercase">
            GymUnity Platform
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            <TextType
              text={[
                'Train smarter. Build together.',
                'Stay consistent. See results.',
                'AI-powered. Community-driven.',
              ]}
              as="span"
              typingSpeed={60}
              deletingSpeed={35}
              pauseDuration={2500}
              initialDelay={500}
              loop={true}
              showCursor={true}
              cursorCharacter="|"
              cursorClassName="text-white/40"
              startOnVisible={true}
            />
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/70">
            Access programs, track progress, and join the community. Log in or create an
            account to get started.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <Button className="px-6 py-3 text-base !bg-mindrift-green !hover:bg-mindrift-greenHover">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="px-6 py-3 text-base bg-white text-black font-semibold hover:bg-white/90">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F7EFE7] px-6 py-20 text-[#1B1B1B] sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6F5E54]">
                Community
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-[#1B1B1B] sm:text-4xl">
                Join a network of athletes building stronger routines together.
              </h2>
              <p className="mt-4 max-w-lg text-sm text-[#5F5149]">
                GymUnity connects athletes, coaches, and communities to keep training
                consistent, safe, and motivating.
              </p>
            </div>

            <div className="space-y-4">
              {COMMUNITY_STATS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}>
                      <Icon size={22} />
                    </div>
                    <p className="text-lg font-semibold text-[#1B1B1B]">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_1.4fr]">
            <div>
              <h3 className="text-3xl font-semibold text-[#1B1B1B] sm:text-4xl">
                Your experience makes the difference
              </h3>
              <p className="mt-4 max-w-md text-sm text-[#5F5149]">
                See how GymUnity members apply real-world knowledge and why we need
                thoughtful contributors across every discipline.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-[#E9E0D7] shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop"
                alt="Coach speaking in a studio"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Play size={16} />
                </span>
                Member story highlight
              </div>
            </div>
          </div>
        </div>
      </section>

      <TeamSection />

      <section className="bg-[#F5EFE8] px-6 py-16 text-[#1F1F1F] sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B07B63]">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Struggling to train effectively?
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch" style={{ height: '520px' }}>
          <div className="problem-marquee__shell max-w-3xl w-full h-full md:mr-auto md:ml-0">
            <div
              className="problem-marquee__track"
              style={{ ['--problem-speed' as string]: '30s' }}
            >
              {[...PROBLEM_CARDS, ...PROBLEM_CARDS].map((item, idx) => {
                const Icon = item.Icon;
                return (
                  <div
                    key={`${item.title}-${idx}`}
                    className={`flex items-start gap-4 rounded-[28px] border border-black/5 px-6 py-6 shadow-[0_12px_40px_rgba(15,18,22,0.08)] ${item.bg ?? 'bg-white/90'}`}
                  >
                    <span
                      className={`mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full ${item.accent}`}
                    >
                      <Icon size={22} />
                    </span>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-[#1F1F1F]">{item.title}</p>
                      <p className="text-sm leading-relaxed text-[#4A4038]">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative hidden h-full overflow-hidden rounded-[28px] border border-black/5 bg-white/70 shadow-[0_16px_48px_rgba(15,18,22,0.1)] lg:block">
            <img
              src="/side-view-retro-fitness-man-doing-squats-with-barbell.jpg"
              alt="Athlete performing squats"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#F5EFE8]/85 via-transparent to-transparent" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F5EFE8] px-6 pt-6 pb-20 text-[#1F1F1F] sm:px-10 lg:px-16">
        <div className="absolute -right-24 top-8 h-64 w-64 rounded-full bg-gradient-to-br from-[#C9E6D6]/50 via-[#E8DDF6]/50 to-transparent blur-3xl" aria-hidden="true" />
        <div className="absolute -left-28 bottom-0 h-56 w-56 rounded-full bg-gradient-to-tr from-[#F6E1CF]/60 via-[#E5F0FF]/60 to-transparent blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl text-center">
          <style>{marqueeStyles}</style>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B07B63]">
            Your solution
          </p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Transform your fitness journey
          </h2>
          <div className="home-marquee__shell mx-auto mt-3 max-w-4xl">
            <div className="home-marquee__track text-base sm:text-lg text-[#4A4038]">
              {Array.from({ length: 6 }).map((_, idx) => (
                <span key={idx} className="whitespace-nowrap">
                  GymUnity combines AI guidance, analytics, and community support to keep every rep on track.
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-16 flex max-w-6xl items-center justify-end" style={{ minHeight: '520px' }}>
          <CardSwap
            width={420}
            height={320}
            cardDistance={50}
            verticalDistance={55}
            delay={4000}
            pauseOnHover={true}
            skewAmount={4}
            easing="elastic"
          >
            {SOLUTION_CARDS.map((item) => {
              const Icon = item.Icon;
              return (
                <Card key={item.title}>
                  <div className="flex h-full flex-col justify-between p-7">
                    <div>
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${item.accent}`}
                      >
                        <Icon size={22} />
                      </span>
                      <h3 className="mt-4 text-2xl font-bold text-[#1F1F1F]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#4A4038]">
                        {item.description}
                      </p>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#B07B63]">
                      GymUnity Feature
                    </p>
                  </div>
                </Card>
              );
            })}
          </CardSwap>
        </div>
      </section>

      <footer className="bg-black px-6 py-14 text-white sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 border-t border-white/10 pt-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="text-xs font-semibold tracking-[0.35em] text-white/60 uppercase">
              GymUnity
            </div>
            <p className="max-w-sm text-sm text-white/70">
              Train smarter, stay accountable, and connect with a community of athletes and coaches.
            </p>
            <div className="text-xs text-white/50">
              © {new Date().getFullYear()} GymUnity. All rights reserved.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm text-white/80 sm:grid-cols-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Platform</p>
              <a className="block hover:text-white" href="/dashboard">Dashboard</a>
              <a className="block hover:text-white" href="/ai-coach">AI Coach</a>
              <a className="block hover:text-white" href="/news">News</a>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Account</p>
              <a className="block hover:text-white" href="/login">Login</a>
              <a className="block hover:text-white" href="/register">Register</a>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Support</p>
              <a className="block hover:text-white" href="/news/preferences">Preferences</a>
              <a className="block hover:text-white" href="/news/explore">Explore</a>
              <a className="block hover:text-white" href="mailto:support@gymunity.ai">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};
