import React from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError, ApiUser, me } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onAuthenticated?: (user: ApiUser) => void;
}

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('access_token');
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onAuthenticated,
}) => {
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAllowed, setIsAllowed] = React.useState(false);

  React.useEffect(() => {
    let isActive = true;

    const runCheck = async () => {
      const token = getToken();
      if (!token) {
        if (isActive) {
          setIsAllowed(false);
          setIsChecking(false);
        }
        return;
      }

      // Optimistic allow while we verify token to avoid logging users out on transient errors.
      if (isActive) {
        setIsAllowed(true);
      }

      try {
        const user = await me();
        if (!isActive) {
          return;
        }
        localStorage.setItem('user', JSON.stringify(user));
        onAuthenticated?.(user);
        setIsAllowed(true);
      } catch (error) {
        if (!isActive) {
          return;
        }
        const shouldLogout = error instanceof ApiError && error.status === 401;
        if (shouldLogout) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setIsAllowed(false);
        } else {
          // Keep the session; likely a network/server hiccup.
          console.error('Session check failed:', error);
          setIsAllowed(true);
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    runCheck();

    return () => {
      isActive = false;
    };
  }, [onAuthenticated]);

  if (isChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/70">
        Checking session...
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
