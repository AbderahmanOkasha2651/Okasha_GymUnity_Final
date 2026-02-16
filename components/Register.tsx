import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { UserRole } from '../types';
import { ApiUser, login, me, register } from '../src/lib/api';

interface RegisterProps {
  onBack: () => void;
  onSubmit: (user: ApiUser) => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onSubmit }) => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('member');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const name = `${firstName} ${lastName}`.trim();
      const apiRole = role === 'member' ? 'user' : role;
      await register({ name, email, password, role: apiRole });
      const token = await login({ email, password });
      localStorage.setItem('access_token', token.access_token);
      const user = await me();
      localStorage.setItem('user', JSON.stringify(user));
      onSubmit(user);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setError(message);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2400&auto=format&fit=crop"
          alt="Gym training"
          className="object-cover w-full h-full opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80"></div>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center w-full min-h-screen px-4 pt-24 pb-12">
        <div className="w-full max-w-lg p-6 sm:p-8 bg-white/10 border border-white/20 rounded-3xl backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.45)]">
          <p className="mb-2 text-xs font-medium tracking-[0.35em] text-white/60 uppercase">
            GymUnity Platform
          </p>
          <h1 className="mb-2 text-3xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-white/70">
            Set up your profile to access programs, coaches, and community updates.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">First name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Last name</label>
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">Email address</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-white/80">Role</label>
                <select
                  className="w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-mindrift-green/60 focus:border-transparent"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                >
                  <option className="text-black" value="member">Member</option>
                  <option className="text-black" value="coach">Coach</option>
                  <option className="text-black" value="seller">Seller</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-3 text-base !bg-mindrift-green !hover:bg-mindrift-greenHover"
              >
                Create account
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-300">{error}</p>
            )}

            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-mindrift-green focus:ring-mindrift-green/60"
              />
              <label htmlFor="terms" className="text-xs text-white/60">
                I agree to the Terms and Privacy Policy.
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Back to home
              </button>
              <Link to="/login" className="text-xs text-white/50 hover:text-white/80 transition-colors">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
