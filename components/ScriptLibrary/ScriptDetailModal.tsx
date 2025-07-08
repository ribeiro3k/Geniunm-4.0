import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Script, CurrentUserType, Tag, Category } from '../../types';
import { useTheme } from '../ui/useTheme';
import CategoryDropdown from './CategoryDropdown';

// Props do componente
interface ScriptDetailModalProps {
  script: Script | null;
  onClose: () => void;
  onToggleFavorite: (scriptId: string) => void;
  onEditScript: (updatedScript: Script) => void;
  onDeleteScript: (scriptId: string) => void;
  currentUser: CurrentUserType;
  existingTags?: Tag[];
}

// Componente do Modal
const ScriptDetailModal: React.FC<ScriptDetailModalProps> = ({ script, onClose, onToggleFavorite, currentUser, onEditScript, onDeleteScript }) => {
  const { theme } = useTheme();
  const [editedScript, setEditedScript] = useState<Script | null>(script);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });

  useEffect(() => {
    setEditedScript(script);
  }, [script]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
    return () => clearTimeout(timer);
  };

  const handleSave = () => {
    if (editedScript) {
      if (!editedScript.title.trim() || !editedScript.content.trim() || !editedScript.category) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
      }
      onEditScript(editedScript);
      showToast('Script salvo com sucesso!');
      setTimeout(onClose, 1500);
    }
  };

  const handleDelete = () => {
    if (script && window.confirm('Tem certeza que deseja excluir este script? Esta ação é irreversível.')) {
      onDeleteScript(script.id);
      onClose();
    }
  };

  const handleCopy = () => {
    if (!editedScript?.content) return;
    navigator.clipboard.writeText(editedScript.content).then(() => {
      showToast('Conteúdo copiado para a área de transferência!');
    });
  };

  const StarIcon: React.FC<{ isFavorite: boolean }> = ({ isFavorite }) => (
    <svg className={`w-6 h-6 transition-colors ${isFavorite ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
  );

  return (
    <AnimatePresence>
      {script && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--color-border)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <header className="flex justify-between items-start p-6 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">{editedScript?.title || 'Novo Script'}</h2>
                <p className="text-sm text-[var(--color-text-light)]">Editando Script</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-[var(--color-hover)] transition-colors" title="Favoritar" onClick={() => onToggleFavorite(script.id)}>
                  <StarIcon isFavorite={editedScript?.isFavorite || false} />
                </button>
                <button className="p-2 rounded-full hover:bg-[var(--color-hover)] transition-colors" title="Fechar" onClick={onClose}>
                  <svg className="w-6 h-6 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </header>

            {/* Formulário */}
            <div className="p-6 pt-2 space-y-6 flex-grow overflow-y-auto custom-scrollbar">
              <div>
                <label htmlFor="title-input" className="text-xs font-medium text-[var(--color-text-light)]">TÍTULO *</label>
                <input id="title-input" type="text" value={editedScript?.title || ''} onChange={e => setEditedScript(prev => prev ? { ...prev, title: e.target.value } : null)} className="w-full mt-1 bg-transparent p-1 text-[var(--color-text)] border-b-2 border-[var(--color-border)] focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label htmlFor="content-textarea" className="text-xs font-medium text-[var(--color-text-light)]">CONTEÚDO *</label>
                <textarea id="content-textarea" rows={8} value={editedScript?.content || ''} onChange={e => setEditedScript(prev => prev ? { ...prev, content: e.target.value } : null)} className="w-full mt-1 bg-[var(--color-input-bg)] p-3 rounded-md border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-primary custom-scrollbar"></textarea>
              </div>
              <div className="z-10 relative">
                <label className="text-xs font-medium text-[var(--color-text-light)] mb-1 block">CATEGORIA *</label>
                <CategoryDropdown
                  selectedCategory={editedScript?.category || ''}
                  setSelectedCategory={cat => setEditedScript(prev => prev ? { ...prev, category: cat as Category } : null)}
                />
              </div>
            </div>

            {/* Rodapé */}
            <footer className="p-6 pt-4 mt-auto grid grid-cols-3 gap-4 border-t border-[var(--color-border)]">
              <button 
                onClick={handleDelete} 
                className={`font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors
                  ${theme === 'dark' 
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Excluir
              </button>
              <button 
                onClick={handleCopy} 
                className={`font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors col-span-1
                  ${theme === 'dark' 
                    ? 'bg-slate-700/40 hover:bg-slate-700/60 text-[var(--color-text)]' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copiar
              </button>
              <button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors col-span-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Salvar
              </button>
            </footer>
          </motion.div>

          {/* Toast de Feedback */}
          <AnimatePresence>
            {toast.visible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed bottom-5 right-5 backdrop-blur-sm border text-white py-2 px-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600/90 border-green-500' : 'bg-red-600/90 border-red-500'}`}
              >
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScriptDetailModal;
