
import React from 'react';
import { SCRIPT_CATEGORIES } from '../../lib/scripts.mock';
import CategoryDropdown from './CategoryDropdown'; // Import CategoryDropdown
import { useTheme } from '../ui/useTheme'; // Import useTheme

interface ScriptFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const filterButtons = [
  { key: 'isFavorite', label: 'Favoritos', icon: 'fa-star' },
  { key: 'Urgente', label: 'Urgente', icon: 'fa-exclamation-circle' },
  { key: 'Negociação', label: 'Negociação', icon: 'fa-handshake' },
];

const ScriptFilters: React.FC<ScriptFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilters,
  setActiveFilters,
  selectedCategory,
  setSelectedCategory,
}) => {
  const toggleFilter = (filterKey: string) => {
    setActiveFilters(
      activeFilters.includes(filterKey)
        ? activeFilters.filter((f) => f !== filterKey)
        : [...activeFilters, filterKey]
    );
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-grow w-full">
          <i className="fas fa-search absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-text-light)]"></i>
          <input
            type="text"
            placeholder="Pesquisar por título ou tag..."
            className="themed-input w-full !pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Select */}
        <CategoryDropdown
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>
      
      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-sm font-medium text-[var(--color-text-light)] mr-2">Filtros rápidos:</span>
        {filterButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-2 border
              ${
                activeFilters.includes(key)
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                  : 'bg-[var(--color-input-bg)] text-[var(--color-text-light)] border-[var(--color-border)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
              }`}
          >
            <i className={`fas ${icon}`}></i>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScriptFilters;
