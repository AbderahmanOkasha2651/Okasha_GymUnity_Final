import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '../../components/Login';
import { ApiUser } from '../lib/api';

interface LoginPageProps {
  onLogin?: (user: ApiUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = (user: ApiUser) => {
    onLogin?.(user);
  };

  return <Login onBack={handleBack} onSubmit={handleSubmit} />;
};
