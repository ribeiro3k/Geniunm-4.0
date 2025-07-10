import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Script, CurrentUserType, Tag } from '../../types';
import { MOCK_SCRIPTS } from '../../lib/scripts.mock';
import { useDebounce } from '../../lib/utils'; // Importando o hook
import ScriptCard from './ScriptCard';
import ScriptFilters from './ScriptFilters';
import ScriptDetailModal from './ScriptDetailModal';
import AddScriptModal from './AddScriptModal';
import GlassButton from '../ui/GlassButton';
import { useTheme } from '../ui/useTheme';

interface ScriptLibrarySectionProps {
  currentUser: CurrentUserType;
}

const ITEMS_PER_PAGE = 12;

// Componente para o estado de "nenhum resultado"
const EmptyState = ({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) => (
  <div className="text-center py-16 px-6 bg-[var(--color-bg-secondary)] rounded-lg border border-dashed border-[var(--color-border)]">
    <i className="fas fa-search-minus text-5xl text-[var(--color-text-light)] mb-4"></i>
    <h3 className="text-xl font-semibold text-[var(--color-text-main)] mb-2">Nenhum Script Encontrado</h3>
    <p className="text-[var(--color-text-light)] mb-6">
      {hasFilters
        ? "Tente ajustar seus filtros de busca ou categoria para encontrar o que procura."
        : "Parece que ainda não há scripts nesta biblioteca. Que tal adicionar o primeiro?"}
    </p>
    {hasFilters && (
      <GlassButton onClick={onClearFilters}>
        <i className="fas fa-times mr-2"></i>
        Limpar Filtros
      </GlassButton>
    )}
  </div>
);

// Componente para o esqueleto de carregamento do cartão
const ScriptCardSkeleton = () => (
  <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg border border-[var(--color-border)] animate-pulse">
    <div className="h-6 bg-gray-500/30 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-500/30 rounded w-full mb-1"></div>
    <div className="h-4 bg-gray-500/30 rounded w-5/6 mb-4"></div>
    <div className="flex gap-2">
      <div className="h-5 bg-gray-500/30 rounded-full w-16"></div>
      <div className="h-5 bg-gray-500/30 rounded-full w-20"></div>
    </div>
  </div>
);


const ScriptLibrarySection: React.FC<ScriptLibrarySectionProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para o valor imediato do input de busca
  const [searchTerm, setSearchTerm] = useState('');
  // Valor "debounced" que será usado para a filtragem
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Simula o carregamento de dados da API
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setScripts(MOCK_SCRIPTS);
      setIsLoading(false);
    }, 1500); // Simula um delay de 1.5s da rede
  }, []);

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      // Usa o termo de busca "debounced"
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        script.title.toLowerCase().includes(searchLower) ||
        (script.tags && script.tags.some(tag => tag.text.toLowerCase().includes(searchLower)));

      const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;

      const matchesFilters = activeFilters.every(filter => {
        if (filter === 'isFavorite') return script.isFavorite;
        return script.tags && script.tags.some(tag => tag.text === filter);
      });

      return matchesSearch && matchesFilters && matchesCategory;
    });
  }, [scripts, debouncedSearchTerm, activeFilters, selectedCategory]); // Depende do valor debounced
  
  const visibleScripts = useMemo(() => {
    return filteredScripts.slice(0, visibleCount);
  }, [filteredScripts, visibleCount]);

  const handleToggleFavorite = (scriptId: string) => {
    let updatedScript: Script | undefined;
    const newScripts = scripts.map(s => {
      if (s.id === scriptId) {
        updatedScript = { ...s, isFavorite: !s.isFavorite };
        return updatedScript;
      }
      return s;
    });
    setScripts(newScripts);

    if (selectedScript && selectedScript.id === scriptId && updatedScript) {
      setSelectedScript(updatedScript);
    }
  };

  const handleEditScript = (updatedScript: Script) => {
    setScripts(prevScripts =>
      prevScripts.map(s => (s.id === updatedScript.id ? updatedScript : s))
    );
    setSelectedScript(updatedScript);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este script? Esta ação é irreversível.')) {
      setScripts(prevScripts => prevScripts.filter(s => s.id !== scriptId));
      setSelectedScript(null);
    }
  };
  
  const handleAddScript = (newScript: Script) => {
    setScripts(prevScripts => [newScript, ...prevScripts]);
  };

  const loadMore = () => {
    setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };

  const handleToggleExpand = (scriptId: string) => {
    setExpandedCards(prev => ({ ...prev, [scriptId]: !prev[scriptId] }));
  };

  const handleToggleAll = () => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    setExpandedCards({});
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilters([]);
    setSelectedCategory('all');
  };

  // Reseta a paginação quando os filtros mudam
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [debouncedSearchTerm, activeFilters, selectedCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedScript(null);
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const allTags: Tag[] = useMemo(() => {
    const tagMap = new Map<string, Tag>();
    scripts.forEach(script => {
      if(script.tags) {
        script.tags.forEach(tag => {
          if (!tagMap.has(tag.text.toLowerCase())) {
            tagMap.set(tag.text.toLowerCase(), tag);
          }
        });
      }
    });
    return Array.from(tagMap.values());
  }, [scripts]);

  const hasActiveFilters = debouncedSearchTerm !== '' || activeFilters.length > 0 || selectedCategory !== 'all';

  return (
    <section id="scripts" className="h-full flex flex-col relative">
      {/* Cabeçalho Fixo com Título e Filtros */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-sm pt-4">
        <div className="px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-y-2 gap-x-4 mb-4">
              <div>
                <h1 className="section-title !border-0 !m-0">Biblioteca de Scripts</h1>
                <p className="text-base text-[var(--color-text-light)] mt-1">Copie e cole os melhores scripts para turbinar as suas vendas.</p>
              </div>
          </div>
          <ScriptFilters
            searchQuery={searchTerm} // Passa o valor imediato para o input
            setSearchQuery={setSearchTerm} // Atualiza o valor imediato
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          </div>
        <div className="h-4 bg-gradient-to-b from-[var(--color-bg)] to-transparent mt-4"></div>
      </div>

      {/* Barra de Ferramentas da Lista */}
      {!isLoading && (
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pb-4 border-b border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-light)]">
            Exibindo {visibleScripts.length} de {filteredScripts.length} scripts
          </p>
          {filteredScripts.length > 0 && (
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-light)] hover:text-primary transition-colors"
            >
              <i className={`fas ${allExpanded ? 'fa-compress-arrows-alt' : 'fa-expand-arrows-alt'}`}></i>
              <span>{allExpanded ? 'Recolher Todos' : 'Expandir Todos'}</span>
            </button>
          )}
        </div>
      )}

      {/* Grid de Scripts */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pt-6 pb-32 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        {isLoading ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ScriptCardSkeleton key={i} />)}
          </motion.div>
        ) : filteredScripts.length > 0 ? (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {visibleScripts.map((script) => (
                <ScriptCard 
                  key={script.id} 
                  script={script} 
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={setSelectedScript}
                  onDelete={handleDeleteScript}
                  isExpanded={allExpanded ? true : (expandedCards[script.id] || false)}
                  onToggleExpand={() => handleToggleExpand(script.id)}
                />
              ))}
            </motion.div>
            
            {visibleCount < filteredScripts.length && (
              <div className="text-center mt-8">
                <GlassButton onClick={loadMore} className="!py-3 !px-8">
                  Carregar Mais
                </GlassButton>
              </div>
            )}
          </>
        ) : (
          <EmptyState onClearFilters={handleClearFilters} hasFilters={hasActiveFilters} />
        )}
      </div>

      {/* Botão de Ação Flutuante (FAB) */}
      <motion.button
        onClick={() => setIsAddModalOpen(true)}
        className={`fixed bottom-8 right-8 bg-primary hover:bg-primary/90 rounded-full w-16 h-16 flex items-center justify-center z-40 shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-110 focus:outline-none
          ${theme === 'light' ? 'border-2 border-white/50' : ''} animate-subtle-bounce`
        }
        aria-label="Adicionar novo script"
        title="Adicionar Script"
      >
        <i className="fas fa-plus text-white text-3xl"></i>
      </motion.button>

      <ScriptDetailModal
        script={selectedScript}
        onClose={() => setSelectedScript(null)}
        onToggleFavorite={handleToggleFavorite}
        onEditScript={handleEditScript}
        onDeleteScript={handleDeleteScript}
        currentUser={currentUser}
        existingTags={allTags}
      />

      <AddScriptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddScript={handleAddScript}
      />
    </section>
  );
};

export default ScriptLibrarySection;