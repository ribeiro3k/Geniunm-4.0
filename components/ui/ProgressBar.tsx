import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // de 0 a 1
  height?: number;
  color?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, height = 8, color = 'var(--accent-primary)', className }) => {
  return (
    <div
      className={`w-full bg-[rgba(0,0,0,0.07)] rounded-full overflow-hidden ${className || ''}`}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        style={{ height: '100%', background: color }}
        className="rounded-full"
      />
    </div>
  );
};

export default ProgressBar; 