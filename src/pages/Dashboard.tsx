import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold">Welcome</h1>
        <p className="mt-3 text-sm text-white/70">
          You're signed in. This is a placeholder dashboard.
        </p>
        <Button
          className="mt-8 px-6 py-3 text-base !bg-mindrift-green !hover:bg-mindrift-greenHover"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
};
