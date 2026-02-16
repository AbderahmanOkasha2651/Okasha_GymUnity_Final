import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Register } from '../../components/Register';
import { ApiUser } from '../lib/api';

interface RegisterPageProps {
  onRegister?: (user: ApiUser) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = (user: ApiUser) => {
    onRegister?.(user);
  };

  return <Register onBack={handleBack} onSubmit={handleSubmit} />;
};
