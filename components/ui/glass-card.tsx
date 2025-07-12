import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'light';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className,
  variant = 'default'
}) => {
  const variants = {
    default: "bg-white/10 backdrop-blur-md border border-white/20",
    dark: "bg-slate-800/80 backdrop-blur-lg border border-slate-700/50",
    light: "bg-white/90 backdrop-blur-sm border border-gray-200/50"
  };

  return (
    <div className={cn(
      "rounded-2xl shadow-xl",
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
};