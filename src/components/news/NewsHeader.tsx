import React from 'react';
import { NavLink } from 'react-router-dom';

interface NewsHeaderProps {
  title: string;
  subtitle?: string;
}

const linkBase =
  'rounded-full px-4 py-2 text-xs font-medium transition border border-transparent';

const linkActive = 'bg-mindrift-green text-gray-900';
const linkInactive = 'text-white/70 hover:text-white hover:border-white/20';

export const NewsHeader: React.FC<NewsHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavLink
            to="/news"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
          >
            My feed
          </NavLink>
          <NavLink
            to="/news/explore"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
          >
            Explore
          </NavLink>
          <NavLink
            to="/news/preferences"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
          >
            Preferences
          </NavLink>
          <NavLink
            to="/news/chat"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
          >
            Ask
          </NavLink>
        </div>
      </div>
    </div>
  );
};
