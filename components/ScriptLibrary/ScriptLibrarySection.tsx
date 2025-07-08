import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Script, CurrentUserType, Tag } from '../../types';
import { MOCK_SCRIPTS } from '../../lib/scripts.mock';
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

const ScriptLibrarySection: React.FC<ScriptLibrarySectionProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const [scripts, setScripts] = useState<Script[]>(MOCK_SCRIPTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const searchLower = searchQuery.toLowerCase();
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
  }, [scripts, searchQuery, activeFilters, selectedCategory]);
  
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
    const allVisibleIds = visibleScripts.reduce((acc, s) => ({ ...acc, [s.id]: newState }), {});
    setExpandedCards(allVisibleIds);
  };

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, activeFilters, selectedCategory]);

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
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
          </div>
        <div className="h-4 bg-gradient-to-b from-[var(--color-bg)] to-transparent mt-4"></div>
      </div>

      {/* Barra de Ferramentas da Lista */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pb-4 border-b border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-light)]">
          Exibindo {visibleScripts.length} de {filteredScripts.length} scripts
        </p>
              <button
          onClick={handleToggleAll}
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-light)] hover:text-primary transition-colors"
              >
          <i className={`fas ${allExpanded ? 'fa-compress-arrows-alt' : 'fa-expand-arrows-alt'}`}></i>
          <span>{allExpanded ? 'Recolher Todos' : 'Expandir Todos'}</span>
              </button>
            </div>

      {/* Grid de Scripts */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pt-6 pb-32 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
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
              isExpanded={!!expandedCards[script.id]}
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
        </div>

      {/* Botão de Ação Flutuante (FAB) Inteligente */}
      <motion.button
        onClick={() => setIsAddModalOpen(!isAddModalOpen)}
        className={`fixed bottom-8 right-8 rounded-full w-16 h-16 flex items-center justify-center z-40 transition-all duration-300 ease-in-out transform focus:outline-none
          ${isAddModalOpen 
            ? 'bg-red-500 hover:bg-red-600 shadow-2xl scale-110' 
            : `bg-primary hover:bg-primary/90 shadow-lg ${theme === 'light' ? 'border-2 border-white/50' : ''} animate-subtle-bounce`
          }`
        }
        aria-label={isAddModalOpen ? "Fechar modal" : "Adicionar novo script"}
        title={isAddModalOpen ? "Fechar" : "Adicionar Script"}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isAddModalOpen ? "close" : "add"}
            initial={{ opacity: 0, rotate: -45, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="text-white text-3xl flex items-center justify-center"
          >
            {isAddModalOpen ? <i className="fas fa-times"></i> : <i className="fas fa-plus"></i>}
          </motion.div>
        </AnimatePresence>
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