import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`themed-button transition-all duration-150 active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
