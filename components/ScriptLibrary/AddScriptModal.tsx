import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '../ui/GlassButton';
import { Script, Category, ScriptType } from '../../types';
import { useTheme } from '../ui/useTheme';
import CategoryDropdown from './CategoryDropdown';

interface AddScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScript: (newScript: Script) => void;
}

const AddScriptModal: React.FC<AddScriptModalProps> = ({ isOpen, onClose, onAddScript }) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [type, setType] = useState<ScriptType | ''>('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTitle('');
      setContent('');
      setCategory('');
      setType('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && content && category && type) {
      const newScript: Script = {
        id: `script-${Date.now()}`, // Simple unique ID for mock data
        title,
        content,
        category: category as Category,
        type: type as ScriptType,
        isFavorite: false,
      };
      onAddScript(newScript);
      onClose(); // Close modal after adding
    } else {
      alert('Por favor, preencha todos os campos obrigatórios.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-[var(--color-card-bg)] rounded-2xl shadow-2xl w-full max-w-2xl border border-[var(--color-border)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-[var(--color-border)] flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-display text-[var(--color-primary)]">Adicionar Novo Script</h2>
              </div>
              <button onClick={onClose} className="text-[var(--color-text-light)] hover:text-white transition-colors">
                <i className="fas fa-times fa-lg"></i>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 flex-grow overflow-y-auto custom-scrollbar space-y-4">
              <div>
                <label htmlFor="script-title" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Título <span className="text-red-500">*</span></label>
                <input
                  id="script-title"
                  type="text"
                  className="themed-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="script-content" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Conteúdo <span className="text-red-500">*</span></label>
                <textarea
                  id="script-content"
                  className="themed-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="script-category" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Categoria <span className="text-red-500">*</span></label>
                <CategoryDropdown
                  selectedCategory={category || ''}
                  setSelectedCategory={cat => setCategory(cat as Category)}
                />
              </div>
              <div>
                <label htmlFor="script-type" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Tipo <span className="text-red-500">*</span></label>
                <select
                  id="script-type"
                  className="themed-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as ScriptType)}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="phone">Telefone</option>
                  <option value="email">Email</option>
                  <option value="person">Presencial</option>
                </select>
              </div>
              
              <footer className="p-4 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex justify-end gap-3">
                <GlassButton type="button" variant="secondary" onClick={onClose} className="!py-2 !px-4 text-sm">
                  Cancelar
                </GlassButton>
                <GlassButton type="submit" className="!py-2 !px-4 text-sm">
                  Adicionar Script
                </GlassButton>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddScriptModal;
