import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute left-full ml-4 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        {text}
        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-800 transform rotate-45"></div>
      </div>
    </div>
  );
};

export default Tooltip;
