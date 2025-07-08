import React from 'react';
import { SCRIPT_CATEGORIES } from '../../lib/scripts.mock';
import { Category } from '../../types';

interface CategoryDropdownProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  selectedCategory,
  setSelectedCategory,
}) => {
  const handleSelectCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <i className="fas fa-folder text-primary"></i>
      </div>
      <select
        value={selectedCategory}
        onChange={handleSelectCategory}
        className="w-full appearance-none bg-[var(--color-input-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md px-10 py-2.5 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Selecionar Categoria"
      >
        {SCRIPT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat} className="bg-[var(--color-surface)] text-[var(--color-text)]">
            {cat}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <i className="fas fa-chevron-down text-[var(--color-text-light)]"></i>
      </div>
    </div>
  );
};

export default CategoryDropdown;
