import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { ApiUser, login, me } from '../src/lib/api';

interface LoginProps {
  onBack: () => void;
  onSubmit: (user: ApiUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onSubmit }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const token = await login({ email, password });
      localStorage.setItem('access_token', token.access_token);
      const user = await me();
      localStorage.setItem('user', JSON.stringify(user));
      onSubmit(user);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
    }
  };

  const themeVars: React.CSSProperties = {
    '--primary': '#10B981',
    '--primary-hover': '#059669',
    '--text': '#0F172A',
    '--muted': '#64748B',
    '--border': '#E2E8F0',
    '--bg': '#FFFFFF',
    '--surface': '#FFFFFF',
    '--warm-accent': '#F1B542',
    '--page': '#da9c43',
  } as React.CSSProperties;

  return (
    <div className="h-screen w-full bg-[var(--page)] text-[var(--text)]" style={themeVars}>
      <div className="flex h-full flex-col overflow-hidden md:flex-row">
        {/* Image column (left) */}
        <div className="relative hidden h-full w-[45%] min-w-[340px] md:block">
          <img
            src="/Login%20Image.jpg"
            alt="GymUnity welcome illustration"
            className="h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(241,181,66,0.35),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(0,0,0,0.05)] via-transparent to-[rgba(0,0,0,0.12)]" />
        </div>

        {/* Form column (right) */}
        <div className="flex h-full flex-1 flex-col overflow-y-auto bg-[var(--surface)] px-6 py-8 md:px-14 md:py-12">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                aria-label="Go to home"
                className="flex items-center gap-2 transition hover:opacity-90"
                title="Back to home"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] font-bold">
                  G
                </div>
                <span className="text-lg font-semibold text-[var(--text)]">GymUnity</span>
              </Link>
            </div>

            <div className="space-y-2">
              <p className="text-3xl font-bold leading-tight text-[var(--text)]">Welcome to GymUnity</p>
              <p className="text-sm font-medium text-[var(--muted)]">Log in to access your projects</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">Email address</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 text-base text-[var(--text)] shadow-sm placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text)]">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3.5 text-base text-[var(--text)] shadow-sm placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-[var(--primary)] py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.25)] transition hover:bg-[var(--primary-hover)] active:scale-[0.99] disabled:opacity-60 disabled:shadow-none"
              >
                Sign in
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex items-center justify-between pt-1 text-sm text-[var(--muted)]">
                <button
                  type="button"
                  onClick={onBack}
                  className="font-medium text-[var(--primary)] transition hover:underline hover:text-[var(--primary-hover)]"
                >
                  Back to home
                </button>
                <Link
                  to="/register"
                  className="text-[var(--primary)] font-medium transition hover:underline hover:text-[var(--primary-hover)]"
                >
                  New here? Create an account
                </Link>
              </div>
            </form>

            <div className="text-xs text-[var(--muted)]">
              Any questions?{' '}
              <a
                className="font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline"
                href="mailto:support@gymunity.ai"
              >
                Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
