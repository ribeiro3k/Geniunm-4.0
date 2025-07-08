import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCRIPT_CATEGORIES } from '../../lib/scripts.mock';
import { Category } from '../../types';
import { useTheme } from '../ui/useTheme';

interface CategoryDropdownProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  selectedCategory,
  setSelectedCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setIsOpen(false);
  };

  const currentCategoryLabel = selectedCategory === 'all' ? 'Todas as Categorias' : selectedCategory;

  return (
    <div className="relative w-full md:w-52 z-30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-medium transition-all duration-200
          ${theme === 'dark'
            ? 'bg-[var(--color-input-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-md'
            : 'bg-white text-[var(--color-text)] border border-[var(--color-border)] shadow-sm hover:shadow-md'
          }
          text-left
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <i className="fas fa-folder text-[var(--color-primary)]"></i>
          <span>{currentCategoryLabel}</span>
        </div>
        <i className={`fas fa-chevron-down text-[var(--color-text-light)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute left-0 right-0 mt-2 rounded-lg shadow-lg overflow-hidden
              ${theme === 'dark' ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-white border border-gray-200'}
            `}
          >
            <ul className="py-1">
              <li
                className="px-4 py-2 cursor-pointer hover:bg-[var(--color-border)] transition-colors text-[var(--color-text)]"
                onClick={() => handleSelectCategory('all')}
              >
                Todas as Categorias
              </li>
              {SCRIPT_CATEGORIES.map((cat) => (
                <li
                  key={cat}
                  className="px-4 py-2 cursor-pointer hover:bg-[var(--color-border)] transition-colors text-[var(--color-text)]"
                  onClick={() => handleSelectCategory(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdown;
