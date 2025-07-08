import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Script, CurrentUserType, Tag } from '../../types';
import GlassButton from '../ui/GlassButton';
import { useTheme } from '../ui/useTheme'; // Import useTheme
import { Category } from '../../types'; // Import Category type
import CategoryDropdown from './CategoryDropdown';

interface ScriptDetailModalProps {
  script: Script | null;
  onClose: () => void;
  onToggleFavorite: (scriptId: string) => void;
  onEditScript: (updatedScript: Script) => void;
  onDeleteScript: (scriptId: string) => void;
  currentUser: CurrentUserType;
  existingTags?: Tag[];
  forceEdit?: boolean;
}

const ScriptDetailModal: React.FC<ScriptDetailModalProps> = ({ script, onClose, onToggleFavorite, currentUser, onEditScript, onDeleteScript, existingTags = [], forceEdit }) => {
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedScript, setEditedScript] = React.useState<Script | null>(null);
  const { theme } = useTheme(); // Use the theme hook
  const [formErrors, setFormErrors] = React.useState<{title?: string, content?: string, category?: string}>({});
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEditedScript(script);
    setIsEditing(!!forceEdit);
  }, [script, forceEdit]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScript(script); // Revert changes
  };

  const handleSaveEdit = () => {
    if (editedScript) {
      const errors: {title?: string, content?: string, category?: string} = {};
      if (!editedScript.title.trim()) errors.title = 'Título obrigatório';
      if (!editedScript.content.trim()) errors.content = 'Conteúdo obrigatório';
      if (!editedScript.category) errors.category = 'Categoria obrigatória';
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return;
      onEditScript(editedScript);
      setIsEditing(false);
      setToast('Script salvo com sucesso!');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleDeleteClick = () => {
    if (script && window.confirm('Tem certeza que deseja excluir este script?')) {
      onDeleteScript(script.id);
      setToast('Script excluído com sucesso!');
      setTimeout(() => setToast(null), 2500);
      onClose();
    }
  };

  const replacePlaceholders = useCallback((text: string): string => {
    if (!currentUser) return text;
    return text
      .replace(/\[Nome\]/g, 'Nome do Cliente')
      .replace(/\[Seu Nome\]/g, currentUser.nome || 'Consultor');
  }, [currentUser]);

  const processedContent = useMemo(() => {
    if (!script) return '';
    return replacePlaceholders(script.content);
  }, [script, replacePlaceholders]);

  const handleCopy = () => {
    navigator.clipboard.writeText(processedContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {script && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-[#1E1E2E]' : 'bg-[#FFFFFF]'} transition-colors`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`edit-card ${theme === 'dark' ? 'bg-[var(--color-card-bg)]' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--color-border)] flex flex-col max-h-[90vh] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] p-0`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby="modal-title"
            style={{ width: '90vw', maxWidth: '480px' }}
          >
            {/* Header */}
            <header className="flex justify-between items-start mb-6 p-6 pb-0">
              <div>
                <h2 id="modal-title" className="text-xl font-bold text-white">{editedScript?.title || 'Novo Script'}</h2>
                <p className="text-sm text-slate-400">Editando Script</p>
              </div>
              <button className="p-2 rounded-full hover:bg-slate-700" title="Favoritar" onClick={() => onToggleFavorite(script!.id)}>
                <svg className={`w-6 h-6 ${script?.isFavorite ? 'text-yellow-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </button>
            </header>
            {/* Formulário */}
            <div className="space-y-6 p-6 pt-0">
              <div>
                <label className="text-xs font-medium text-slate-400 dark:text-slate-400 text-slate-600">TÍTULO *</label>
                <input id="title-input" type="text" value={editedScript?.title || ''} onChange={e => setEditedScript(prev => prev ? { ...prev, title: e.target.value } : null)} className={`w-full mt-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} p-1 border-b-2 border-slate-300 focus:outline-none focus:border-accent-blue transition-colors`} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 dark:text-slate-400 text-slate-600">CONTEÚDO *</label>
                <textarea id="content-textarea" rows={5} value={editedScript?.content || ''} onChange={e => setEditedScript(prev => prev ? { ...prev, content: e.target.value } : null)} className={`w-full mt-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} p-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-blue custom-scrollbar`}></textarea>
              </div>
              {/* Dropdown customizado de categoria */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 dark:text-slate-400 text-slate-600">CATEGORIA *</label>
                <CategoryDropdown
                  selectedCategory={editedScript?.category || ''}
                  setSelectedCategory={cat => setEditedScript(prev => prev ? { ...prev, category: cat as Category } : null)}
                  className={`w-full mt-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} p-3 rounded-md border border-slate-300 dark:border-slate-600 flex justify-between items-center text-left custom-scrollbar text-base focus:outline-none focus:ring-2 focus:ring-accent-blue transition-colors`}
                  style={{ minWidth: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>
            {/* Footer */}
            <footer className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 pt-0">
              <button onClick={handleCopy} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copiar
              </button>
              <button onClick={handleSaveEdit} className="bg-accent-blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Salvar
              </button>
            </footer>
            {/* Toast de feedback */}
            {toast && (
              <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg feedback-toast animate-fade-in-out">{toast}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScriptDetailModal;