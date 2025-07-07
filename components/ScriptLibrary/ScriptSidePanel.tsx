import React from 'react';

interface ScriptSidePanelProps {
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
  onClose: () => void;
  onCopy: () => void;
}

const ScriptSidePanel: React.FC<ScriptSidePanelProps> = ({ script, onClose, onCopy }) => {
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onClose}></div>
      <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-[#232733] z-50 shadow-2xl flex flex-col p-8 border-l border-[#2d3240] animate-slideIn">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl" onClick={onClose} title="Fechar painel">
          <i className="fas fa-times"></i>
        </button>
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">{script.title}</h3>
        <div className="text-gray-400 text-sm mb-4">{script.category}</div>
        <div className="bg-[#181c23] rounded-lg p-4 text-white whitespace-pre-line mb-6 shadow-inner">
          {script.content}
        </div>
        <button
          className="mt-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition"
          onClick={onCopy}
        >
          <i className="fas fa-copy mr-2"></i> Copiar script
        </button>
      </aside>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.4,0.2,0.2,1); }
      `}</style>
    </>
  );
};

export default ScriptSidePanel; 