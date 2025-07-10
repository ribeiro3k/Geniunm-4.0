import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a Popover component');
  }
  return context;
};

const Popover: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click-away listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={popoverRef} className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setIsOpen } = usePopover();
  return (
    <button onClick={() => setIsOpen(o => !o)} className="w-full">
      {children}
    </button>
  );
};

const PopoverContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpen } = usePopover();
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute bottom-full mb-2 w-full min-w-[150px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-xl p-1 z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PopoverItem: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => {
    const { setIsOpen } = usePopover();
    const handleClick = () => {
        if(onClick) onClick();
        setIsOpen(false);
    }
  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center px-3 py-2 text-sm text-left text-[var(--color-text-main)] hover:bg-primary/10 rounded-md transition-colors"
    >
      {children}
    </button>
  );
};

export { Popover, PopoverTrigger, PopoverContent, PopoverItem };