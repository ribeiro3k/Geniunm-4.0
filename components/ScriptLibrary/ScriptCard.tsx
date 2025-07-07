import React from 'react';

interface ScriptCardProps {
  script: {
    id: string;
    title: string;
    summary: string;
    content: string;
    category: string;
    type: string;
    favorite: boolean;
    usage: number;
  };
  onClick: () => void;
  onFavorite: () => void;
  onCopy: () => void;
}

const typeIcons: Record<string, string> = {
  whatsapp: '💬',
  objection: '🛑',
  closing: '✅',
};

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onClick, onFavorite, onCopy }) => {
  return (
    <div className="bg-[#232733] rounded-2xl shadow-lg p-5 w-80 flex flex-col gap-3 border border-[#2d3240] hover:border-blue-500 transition cursor-pointer relative group" onClick={onClick}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{typeIcons[script.type] || '📄'}</span>
        <span className="font-bold text-white text-lg flex-1 truncate">{script.title}</span>
        <button
          className="ml-2 text-yellow-400 hover:text-yellow-300 text-xl"
          onClick={e => { e.stopPropagation(); onFavorite(); }}
          title={script.favorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          {script.favorite ? '⭐' : '☆'}
        </button>
        <button
          className="ml-2 text-blue-400 hover:text-blue-300 text-lg"
          onClick={e => { e.stopPropagation(); onCopy(); }}
          title="Copiar script"
        >
          <i className="fas fa-copy"></i>
        </button>
      </div>
      <div className="text-gray-300 text-sm line-clamp-2">{script.summary}</div>
      <div className="flex items-center gap-2 mt-2">
        {script.usage > 40 && <span className="text-red-500 text-lg">🔥</span>}
        <span className="text-xs text-gray-400">{script.usage} usos</span>
      </div>
    </div>
  );
};

export default ScriptCard; 