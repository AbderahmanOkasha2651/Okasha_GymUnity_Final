import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-full focus:outline-none";
  
  const variants = {
    primary: "bg-mindrift-green text-gray-900 hover:bg-mindrift-greenHover shadow-[0_0_15px_rgba(184,243,137,0.3)]",
    ghost: "text-white hover:text-gray-200 bg-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};