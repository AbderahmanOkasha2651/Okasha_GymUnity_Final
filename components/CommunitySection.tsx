import React from 'react';
import { Users, BadgeCheck, Globe2, GraduationCap } from 'lucide-react';

const STATS = [
  {
    icon: Users,
    label: '10K GymUnity members',
    color: 'bg-[#B79CFF]',
  },
  {
    icon: BadgeCheck,
    label: '50+ training domains',
    color: 'bg-[#4CD98D]',
  },
  {
    icon: Globe2,
    label: '15 languages supported',
    color: 'bg-[#4DA6FF]',
  },
  {
    icon: GraduationCap,
    label: '70% certified coaches',
    color: 'bg-[#F4B23A]',
  },
];

export const CommunitySection: React.FC = () => {
  return (
    <section className="w-full bg-[#F6EFE7] text-[#1E1E1E]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.35em] text-[#6B5E53] uppercase">
            Community
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#1E1E1E]">
            Join a global fitness network
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4D443C]">
            Connect with athletes, coaches, and sellers who are building
            stronger routines and better results through GymUnity.
          </p>

          <div className="mt-10 space-y-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 text-lg font-semibold text-[#2A251F]"
                >
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${stat.color}`}
                  >
                    <Icon size={20} className="text-white" />
                  </span>
                  {stat.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.35em] text-[#6B5E53] uppercase">
              Your experience
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-[#1E1E1E]">
              Your training makes the difference
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#4D443C]">
              See how GymUnity experts share real-world insights and build plans
              that keep every member moving forward.
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.15)]">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop"
              alt="GymUnity community"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
