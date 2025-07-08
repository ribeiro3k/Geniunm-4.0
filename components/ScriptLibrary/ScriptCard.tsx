import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Script, ScriptType } from '../../types';

interface ScriptCardProps {
  script: Script;
  onToggleFavorite: (scriptId: string) => void;
  onEdit: (script: Script) => void;
  onDelete: (scriptId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const typeIcons: Record<ScriptType, string> = {
  phone: 'fa-phone-alt',
  email: 'fa-envelope',
  person: 'fa-user-friends',
};

const isLightColor = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.5;
};

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onToggleFavorite, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  const { id, title, content, type, tags, isFavorite } = script;
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col h-full hover:border-primary shadow-md hover:shadow-lg gap-4 cursor-pointer select-none transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-32 opacity-90'}`}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      onClick={onToggleExpand}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggleExpand(); }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3 className="font-bold text-lg text-[var(--color-text)] pr-4 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex-shrink-0">
          <i className={`fas ${typeIcons[type]} text-[var(--color-text-light)] text-base`}></i>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-grow transition-[opacity] duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}
        style={{ opacity: isExpanded ? 1 : 0.85 }}>
        <p className="text-sm text-[var(--color-text-light)] leading-relaxed mb-2">
          {content}
        </p>
        {!isExpanded && tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.text}
                className="px-2 py-0.5 text-xs font-medium rounded-full border"
                style={{
                  backgroundColor: tag.color,
                  color: isLightColor(tag.color) ? '#000000' : '#FFFFFF',
                  borderColor: tag.color,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                }}
              >
                {tag.text}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-[var(--color-bg)] text-[var(--color-text-light)] border-dashed border-[var(--color-border)]">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer (expandido) */}
      {isExpanded && (
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag.text}
                  className="px-2 py-0.5 text-xs font-medium rounded-full border"
                  style={{
                    backgroundColor: tag.color,
                    color: isLightColor(tag.color) ? '#000000' : '#FFFFFF',
                    borderColor: tag.color,
                  }}
                >
                  {tag.text}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 text-[var(--color-text-light)] bg-transparent hover:bg-[var(--color-input-bg)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Copiar Script"
                title="Copiar Script"
              >
                <i className={`fas ${copySuccess ? 'fa-check text-green-500' : 'fa-copy'}`}></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(script); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-light)] hover:bg-[var(--color-input-bg)] transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Editar Conteúdo"
                title="Editar Conteúdo"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-light)] hover:bg-[var(--color-input-bg)] transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Excluir Script"
                title="Excluir Script"
              >
                <i className="fas fa-trash"></i>
              </button>
              <button
                onClick={handleFavoriteClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ${isFavorite ? 'text-yellow-400' : 'text-[var(--color-text-light)]'} bg-transparent hover:bg-[var(--color-input-bg)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                aria-label="Favoritar"
                title="Favoritar"
              >
                <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ScriptCard;
