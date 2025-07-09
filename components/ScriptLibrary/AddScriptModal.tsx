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
        id: `script-${Date.now()}`,
        title,
        content,
        category: category as Category,
        type: type as ScriptType,
        tags: [],
        isFavorite: false,
      };
      onAddScript(newScript);
      onClose();
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text)]">Adicionar Novo Script</h2>
                <p className="text-sm text-[var(--color-text-light)] mt-1">Crie um novo script para sua biblioteca</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-input-bg)] text-[var(--color-text-light)] hover:text-[var(--color-text)] transition-colors"
                aria-label="Fechar modal"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                {/* Title Field */}
                <div>
                  <label htmlFor="script-title" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="script-title"
                    type="text"
                    className="themed-input w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Abordagem Inicial para Lead Frio"
                    required
                  />
                </div>

                {/* Content Field */}
                <div>
                  <label htmlFor="script-content" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Conteúdo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="script-content"
                    className="themed-textarea w-full min-h-[120px] resize-y"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite o conteúdo do seu script aqui..."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-[var(--color-text-light)] mt-1">
                    Use [Nome] para personalização automática
                  </p>
                </div>

                {/* Category and Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Field */}
                  <div>
                    <label htmlFor="script-category" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <CategoryDropdown
                      selectedCategory={category || ''}
                      setSelectedCategory={cat => setCategory(cat as Category)}
                    />
                  </div>

                  {/* Type Field */}
                  <div>
                    <label htmlFor="script-type" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                      Tipo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="script-type"
                        className="themed-select w-full"
                        value={type}
                        onChange={(e) => setType(e.target.value as ScriptType)}
                        required
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="phone">📞 Telefone</option>
                        <option value="email">📧 Email</option>
                        <option value="person">👥 Presencial</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[var(--color-text)] mb-2">
                    <i className="fas fa-lightbulb text-[var(--color-primary)] mr-2"></i>
                    Dicas para um bom script:
                  </h4>
                  <ul className="text-xs text-[var(--color-text-light)] space-y-1">
                    <li>• Use linguagem natural e conversacional</li>
                    <li>• Inclua pausas e pontos de personalização</li>
                    <li>• Mantenha o foco no benefício para o cliente</li>
                    <li>• Teste e ajuste baseado nos resultados</li>
                  </ul>
                </div>
              </div>
            </form>

            {/* Footer */}
            <footer className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg font-medium text-[var(--color-text-light)] hover:text-[var(--color-text)] hover:bg-[var(--color-input-bg)] transition-colors"
              >
                Cancelar
              </button>
              <GlassButton 
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-primary)]/30"
              >
                <i className="fas fa-plus mr-2"></i>
                Adicionar Script
              </GlassButton>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddScriptModal;