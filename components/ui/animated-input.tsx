import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'modern' | 'glass' | 'minimal';
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  icon,
  variant = 'modern',
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
  };

  const variants = {
    modern: {
      container: "relative mb-6",
      input: "w-full px-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none transition-colors duration-300 text-white placeholder-transparent peer",
      label: "absolute left-4 top-3 text-gray-400 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-400",
      icon: "absolute right-4 top-3 text-gray-400"
    },
    glass: {
      container: "relative mb-6",
      input: "w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:border-blue-400 outline-none transition-all duration-300 text-white placeholder-transparent peer",
      label: "absolute left-4 top-3 text-gray-300 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-300",
      icon: "absolute right-4 top-3 text-gray-300"
    },
    minimal: {
      container: "relative mb-6",
      input: "w-full px-0 py-3 bg-transparent border-b border-gray-600 focus:border-white outline-none transition-colors duration-300 text-white placeholder-transparent peer",
      label: "absolute left-0 top-3 text-gray-400 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-6 peer-focus:text-sm peer-focus:text-white",
      icon: "absolute right-0 top-3 text-gray-400"
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={currentVariant.container}>
      <input
        {...props}
        className={cn(currentVariant.input, className)}
        placeholder=" "
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <label className={cn(
        currentVariant.label,
        (isFocused || hasValue) && "-top-6 text-sm"
      )}>
        {label}
      </label>
      {icon && (
        <div className={currentVariant.icon}>
          {icon}
        </div>
      )}
    </div>
  );
};