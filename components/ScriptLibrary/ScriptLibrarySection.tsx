import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Script, CurrentUserType, Tag } from '../../types';
import { MOCK_SCRIPTS } from '../../lib/scripts.mock';
import ScriptCard from './ScriptCard';
import ScriptFilters from './ScriptFilters';
import ScriptDetailModal from './ScriptDetailModal';
import AddScriptModal from './AddScriptModal'; // Import AddScriptModal
import GlassButton from '../ui/GlassButton';
import { useTheme } from '../ui/useTheme';

interface ScriptLibrarySectionProps {
  currentUser: CurrentUserType;
}

const ITEMS_PER_PAGE = 12; // Número de scripts para carregar por vez

const ScriptLibrarySection: React.FC<ScriptLibrarySectionProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const [scripts, setScripts] = useState<Script[]>(MOCK_SCRIPTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for add modal
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [editScriptId, setEditScriptId] = useState<string | null>(null);
  const [deleteScriptId, setDeleteScriptId] = useState<string | null>(null);

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        script.title.toLowerCase().includes(searchLower) ||
        script.tags.some(tag => tag.text.toLowerCase().includes(searchLower));

      const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;

      const matchesFilters = activeFilters.every(filter => {
        if (filter === 'isFavorite') return script.isFavorite;
        return script.tags.some(tag => tag.text === filter);
      });

      return matchesSearch && matchesFilters && matchesCategory;
    });
  }, [scripts, searchQuery, activeFilters, selectedCategory]);
  
  const visibleScripts = useMemo(() => {
    return filteredScripts.slice(0, visibleCount);
  }, [filteredScripts, visibleCount]);

  const handleToggleFavorite = (scriptId: string) => {
    setScripts(prevScripts =>
      prevScripts.map(s =>
        s.id === scriptId ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
  };

  const handleEditScript = (updatedScript: Script) => {
    setScripts(prevScripts =>
      prevScripts.map(s => (s.id === updatedScript.id ? updatedScript : s))
    );
    setSelectedScript(updatedScript); // Update the selected script in the modal
  };

  const handleDeleteScript = (scriptId: string) => {
    setScripts(prevScripts => prevScripts.filter(s => s.id !== scriptId));
    setSelectedScript(null); // Close the modal after deletion
  };
  
  const handleAddScript = (newScript: Script) => {
    setScripts(prevScripts => [...prevScripts, newScript]);
  };

  const loadMore = () => {
    setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };

  // Resetar a contagem visível quando os filtros mudam
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, activeFilters, selectedCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedScript(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extrai todas as tags únicas dos scripts para autocomplete
  const allTags: Tag[] = useMemo(() => {
    const tagMap = new Map<string, Tag>();
    scripts.forEach(script => {
      script.tags.forEach(tag => {
        if (!tagMap.has(tag.text.toLowerCase())) {
          tagMap.set(tag.text.toLowerCase(), tag);
        }
      });
    });
    return Array.from(tagMap.values());
  }, [scripts]);

  const handleEditCard = (script: Script) => {
    setSelectedScript(script);
    setEditScriptId(script.id);
  };

  const handleDeleteCard = (scriptId: string) => {
    setDeleteScriptId(scriptId);
  };

  const handleConfirmDelete = () => {
    if (deleteScriptId) {
      setScripts(prevScripts => prevScripts.filter(s => s.id !== deleteScriptId));
      setDeleteScriptId(null);
      setSelectedScript(null);
    }
  };

  return (
    <section id="scripts" className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--color-bg)] pt-1 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 shadow-sm shadow-[var(--color-border)]">
        <div className="flex-shrink-0 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
                <h1 className="section-title !border-0 !m-0">Biblioteca de Scripts</h1>
                <GlassButton onClick={() => setIsAddModalOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                  Adicionar Script
                </GlassButton>
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
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar py-6 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {visibleScripts.map((script) => (
            <ScriptCard 
              key={script.id} 
              script={script} 
              onSelect={setSelectedScript}
              onToggleFavorite={handleToggleFavorite}
              onEdit={handleEditCard}
              onDelete={handleDeleteCard}
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

      <ScriptDetailModal
        script={selectedScript}
        onClose={() => { setSelectedScript(null); setEditScriptId(null); }}
        onToggleFavorite={handleToggleFavorite}
        onEditScript={handleEditScript}
        onDeleteScript={handleDeleteScript}
        currentUser={currentUser}
        existingTags={allTags}
        forceEdit={!!editScriptId}
      />

      {deleteScriptId && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme === 'dark' ? 'bg-black/70' : 'bg-black/30'}`}>
          <div className={`rounded-2xl shadow-2xl p-8 max-w-sm w-full border transition-colors duration-300 flex flex-col items-center ${theme === 'dark' ? 'bg-[var(--color-card-bg)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`} role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
            <div className="flex flex-col items-center mb-4">
              <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-3 ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
              </div>
              <h2 id="confirm-delete-title" className="text-lg font-bold mb-2 text-center">Confirmar exclusão</h2>
              <p className="mb-4 text-center text-[var(--color-text-light)]">Tem certeza que deseja excluir este script? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full mt-2">
              <button onClick={() => setDeleteScriptId(null)} className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}>Cancelar</button>
              <button onClick={handleConfirmDelete} className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${theme === 'dark' ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <AddScriptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddScript={handleAddScript}
      />
    </section>
  );
};

export default ScriptLibrarySection; 
