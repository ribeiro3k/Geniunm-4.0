import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore: Não há declaração de tipos para 'sortablejs'
import Sortable from 'sortablejs';
import { useTheme } from '../ui/useTheme';

// Tipos
interface KanbanCard {
  id: string;
  title: string;
  script: string;
  type: string;
  tags: string[];
  favorite: boolean;
  usage: number;
}
interface KanbanColumn {
  title: string;
  cards: KanbanCard[];
}

// Adicionar prop opcional para o usuário logado
interface ScriptLibrarySectionProps {
  currentUser?: { nome: string } | null;
}

const STORAGE_KEY = 'proKanbanDataV4';

// Estado inicial (mock)
const initialKanban: Record<string, KanbanColumn> = {
  'col-1': {
    title: 'Abordagem',
    cards: [
      {
        id: 'c1',
        title: 'Cold Call - Abertura com Dor',
        script: 'Olá [Nome], aqui é [Seu Nome].\nO motivo da minha chamada é que notei que empresas como a sua costumam enfrentar [Dor Específica]. Faz sentido conversarmos por 2 minutos sobre como resolvemos isso?',
        type: 'call',
        tags: ['Urgente'],
        favorite: true,
        usage: 15,
      },
    ],
  },
  'col-2': {
    title: 'Contorno de Objeções',
    cards: [
      {
        id: 'c3',
        title: "Objeção: 'Está muito caro'",
        script: "Entendo a sua preocupação com o investimento, [Nome].\nSó para eu entender, o 'caro' é em comparação com algum concorrente ou em relação ao orçamento que você tinha em mente?\nIsso me ajuda a ver se consigo encontrar uma solução que se encaixe melhor para si.",
        type: 'objection',
        tags: ['Negociação'],
        favorite: true,
        usage: 50,
      },
    ],
  },
};

const ScriptLibrarySection: React.FC<ScriptLibrarySectionProps> = ({ currentUser }) => {
  // Estado principal do Kanban
  const [kanban, setKanban] = useState<Record<string, KanbanColumn>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialKanban;
  });
  const [addingCardCol, setAddingCardCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const cardListRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sidePanelCard, setSidePanelCard] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'card' | 'column'; colId: string; cardId?: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCompactView, setIsCompactView] = useState(() => {
    const saved = localStorage.getItem('isCompactView');
    return saved === 'true';
  });
  const { theme } = useTheme();

  // Persistência
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kanban));
  }, [kanban]);

  // Drag & Drop entre colunas
  useEffect(() => {
    Object.entries(cardListRefs.current).forEach(([colId, el]) => {
      if (!el) return;
      if ((el as any)._sortable) return; // Evita inicializar duas vezes
      (el as any)._sortable = Sortable.create(el, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'sortable-ghost',
        draggable: '.kanban-card',
        filter: '.add-card-btn',
        onMove: function (evt: any) {
          return !evt.related.classList.contains('add-card-btn');
        },
        onEnd: (evt: any) => {
          try {
            if (evt.from === evt.to && evt.oldDraggableIndex === evt.newDraggableIndex) return;
            setKanban(prev => {
              const copy = { ...prev };
              const fromColId = evt.from.dataset.colId;
              const toColId = evt.to.dataset.colId;
              if (!fromColId || !toColId) {
                console.error('Coluna de origem ou destino não encontrada:', { fromColId, toColId });
                return prev;
              }
              const fromCol = { ...copy[fromColId] };
              const toCol = fromColId === toColId ? fromCol : { ...copy[toColId] };
              // Validação de índices
              if (
                evt.oldDraggableIndex < 0 ||
                evt.oldDraggableIndex >= fromCol.cards.length ||
                evt.newDraggableIndex < 0 ||
                evt.newDraggableIndex > toCol.cards.length
              ) {
                console.error('Índices inválidos no drag and drop:', {
                  oldDraggableIndex: evt.oldDraggableIndex,
                  newDraggableIndex: evt.newDraggableIndex,
                  fromCol,
                  toCol
                });
                return prev;
              }
              const [removed] = fromCol.cards.splice(evt.oldDraggableIndex, 1);
              if (!removed) {
                console.error('Nenhum card removido ao arrastar:', { evt, fromCol });
                return prev;
              }
              toCol.cards.splice(evt.newDraggableIndex, 0, removed);
              copy[fromColId] = fromCol;
              copy[toColId] = toCol;
              return copy;
            });
          } catch (error) {
            console.error('Erro no drag and drop:', error, evt);
          }
        },
      });
    });
    // Cleanup
    return () => {
      Object.values(cardListRefs.current).forEach(el => {
        if (el && (el as any)._sortable) {
          (el as any)._sortable.destroy();
          delete (el as any)._sortable;
        }
      });
    };
  }, [kanban]);

  // Função para coletar todas as tags únicas
  const allTags = Array.from(new Set(
    Object.values(kanban).flatMap(col => col.cards.flatMap(card => card.tags))
  ));

  // Função de filtro
  function cardMatches(card: any) {
    const searchTerm = search.toLowerCase();
    const searchMatch =
      searchTerm === '' ||
      card.title.toLowerCase().includes(searchTerm) ||
      card.tags.some((t: string) => t.toLowerCase().includes(searchTerm));
    const tagMatch =
      activeFilters.length === 0 ||
      activeFilters.every(f => card.tags.includes(f));
    const favMatch = !showOnlyFavorites || card.favorite;
    return searchMatch && tagMatch && favMatch;
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  function toggleViewMode() {
    setIsCompactView(v => {
      localStorage.setItem('isCompactView', (!v).toString());
      return !v;
    });
  }

  // Layout principal (apenas estrutura inicial)
  return (
    <section className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Cabeçalho e controles */}
      <div className="p-4 md:p-6 max-w-full mx-auto w-full flex-shrink-0">
        <header className="flex flex-col gap-4 md:gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Logo + Título */}
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="Logo Geniunm" className="h-8 w-8 md:h-10 md:w-10" style={{minWidth:32}} onError={e => (e.currentTarget.style.display = 'none')} />
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] truncate">Biblioteca de Scripts</h1>
            </div>
            {/* Botão de alternância de visualização */}
            <button
              title={isCompactView ? 'Mudar para visão expandida' : 'Mudar para visão compacta'}
              className="p-2 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] ml-auto md:ml-0"
              onClick={toggleViewMode}
              aria-label={isCompactView ? 'Mudar para visão expandida' : 'Mudar para visão compacta'}
            >
              {isCompactView ? '📄' : '📜'}
            </button>
          </div>
          {/* Barra de busca */}
          <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)] pointer-events-none">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="rounded-lg pl-10 pr-4 py-2 w-full bg-[var(--color-input-bg)] text-[var(--color-text)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Pesquisar por título ou tag..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Pesquisar scripts"
                autoFocus
              />
            </div>
            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-sm font-bold text-[var(--color-text-light)] mr-1">Filtros:</span>
              <button
                className={`text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-all flex items-center gap-1 ${showOnlyFavorites ? 'ring-2 ring-yellow-400 text-yellow-400' : ''}`}
                onClick={() => setShowOnlyFavorites(fav => !fav)}
                aria-pressed={showOnlyFavorites}
              >
                <span>{showOnlyFavorites ? '⭐' : '☆'}</span> Favoritos
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-all ${activeFilters.includes(tag) ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                  onClick={() => {
                    setActiveFilters(f =>
                      f.includes(tag) ? f.filter(t => t !== tag) : [...f, tag]
                    );
                  }}
                  aria-pressed={activeFilters.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>
      {/* Quadro Kanban */}
      <main id="kanban-board-container" className="kanban-board-container flex-grow flex gap-4 overflow-x-auto p-4">
        {/* Renderizar colunas dinamicamente */}
        {Object.entries(kanban).map(([colId, col]) => (
          <div key={colId} className="kanban-column rounded-lg w-80 flex-shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="flex justify-between items-center p-3">
              <h3 className="font-bold text-[var(--color-text)] cursor-pointer">{col.title}</h3>
              {/* Botão de apagar coluna */}
              <button
                className="text-[var(--color-text-light)] hover:text-[var(--error)] transition-colors p-1 rounded-full hover:bg-[var(--color-border)]"
                title="Apagar categoria"
                onClick={() => setConfirmModal({ type: 'column', colId })}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
            <div
              className="kanban-card-list space-y-2 p-2 min-h-[50px]"
              data-col-id={colId}
              ref={el => { cardListRefs.current[colId] = el; }}
            >
              {col.cards.filter(cardMatches).map((card) => (
                <div
                  key={card.id}
                  className="kanban-card p-3 rounded-lg shadow-md cursor-pointer group flex flex-col gap-2 bg-[var(--color-surface)] border border-[var(--color-border)]"
                  onClick={() => setSidePanelCard(card)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span>{card.type === 'call' ? '📞' : card.type === 'objection' ? '⚠️' : card.type === 'closing' ? '✅' : '📝'}</span>
                      <h4 className="font-semibold text-[var(--color-text)]">{card.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-lg">
                      {card.usage > 40 && <span title="Mais Usado">🔥</span>}
                      <button
                        className={`transition-transform duration-200 ${card.favorite ? 'scale-110 text-yellow-400' : 'text-[var(--color-text-light)] hover:text-yellow-400'}`}
                        title="Favoritar"
                        onClick={e => {
                          e.stopPropagation();
                          setKanban(prev => {
                            const copy = { ...prev };
                            const colCopy = { ...copy[colId] };
                            colCopy.cards = colCopy.cards.map(c => c.id === card.id ? { ...c, favorite: !c.favorite } : c);
                            copy[colId] = colCopy;
                            return copy;
                          });
                          showToast(card.favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
                        }}
                      >
                        {card.favorite ? '⭐' : '☆'}
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm text-[var(--color-text-light)] mt-2 card-summary ${isCompactView ? 'hidden' : ''}`}>{card.script.substring(0, 80)}{card.script.length > 80 ? '...' : ''}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {card.tags.map(tag => (
                      <span key={tag} className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-border)] text-[var(--color-text-light)]">{tag}</span>
                    ))}
                  </div>
                  <div className={`flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)] card-actions opacity-0 group-hover:opacity-100 transition-opacity ${isCompactView ? 'hidden' : ''}`}>
                    <button
                      className="text-sm text-[var(--color-text-light)] hover:text-[var(--color-primary)] flex items-center gap-1"
                      title="Copiar Script"
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(card.script);
                        showToast('Script copiado!');
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      Copiar
                    </button>
                    <button
                      className="text-sm text-[var(--color-text-light)] hover:text-[var(--error)]"
                      title="Apagar Script"
                      onClick={e => {
                        e.stopPropagation();
                        setConfirmModal({ type: 'card', colId, cardId: card.id });
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
              {/* Campo para adicionar novo cartão */}
              {addingCardCol === colId ? (
                <div className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)] flex gap-2 items-center mt-2">
                  <input
                    type="text"
                    className="bg-[var(--color-input-bg)] text-[var(--color-text)] w-full rounded p-2 focus:outline-none border border-[var(--color-border)]"
                    placeholder="Título do novo script..."
                    value={newCardTitle}
                    autoFocus
                    onChange={e => setNewCardTitle(e.target.value)}
                    onBlur={() => { setAddingCardCol(null); setNewCardTitle(''); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (newCardTitle.trim()) {
                          setKanban(prev => {
                            const copy = { ...prev };
                            const colCopy = { ...copy[colId] };
                            colCopy.cards = [
                              ...colCopy.cards,
                              {
                                id: 'c' + Date.now(),
                                title: newCardTitle.trim(),
                                script: 'Escreva o seu script aqui...',
                                type: 'call',
                                tags: [],
                                favorite: false,
                                usage: 0,
                              },
                            ];
                            copy[colId] = colCopy;
                            return copy;
                          });
                          setAddingCardCol(null);
                          setNewCardTitle('');
                        }
                      }
                    }}
                  />
                  <button
                    className="bg-[var(--color-primary)] text-white px-3 py-1 rounded text-sm"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      if (newCardTitle.trim()) {
                        setKanban(prev => {
                          const copy = { ...prev };
                          const colCopy = { ...copy[colId] };
                          colCopy.cards = [
                            ...colCopy.cards,
                            {
                              id: 'c' + Date.now(),
                              title: newCardTitle.trim(),
                              script: 'Escreva o seu script aqui...',
                              type: 'call',
                              tags: [],
                              favorite: false,
                              usage: 0,
                            },
                          ];
                          copy[colId] = colCopy;
                          return copy;
                        });
                        setAddingCardCol(null);
                        setNewCardTitle('');
                      }
                    }}
                  >Adicionar</button>
                </div>
              ) : (
                <button
                  className="add-card-btn w-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] border-2 border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-light)] hover:text-[var(--color-text)] transition-colors p-4 mt-2"
                  onClick={() => { setAddingCardCol(colId); setNewCardTitle(''); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Adicionar Script
                </button>
              )}
            </div>
          </div>
        ))}
        {/* Botão para adicionar nova coluna */}
        <div className="kanban-column w-80 flex-shrink-0">
          {addingColumn ? (
            <div className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)] flex gap-2 items-center h-full">
              <input
                type="text"
                className="bg-[var(--color-input-bg)] text-[var(--color-text)] w-full rounded p-2 focus:outline-none border border-[var(--color-border)]"
                placeholder="Nome da nova categoria..."
                value={newColumnTitle}
                autoFocus
                onChange={e => setNewColumnTitle(e.target.value)}
                onBlur={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newColumnTitle.trim()) {
                    const newColId = 'col-' + Date.now();
                    setKanban(prev => ({ ...prev, [newColId]: { title: newColumnTitle.trim(), cards: [] } }));
                    setAddingColumn(false);
                    setNewColumnTitle('');
                  }
                }}
              />
              <button
                className="bg-[var(--color-primary)] text-white px-3 py-1 rounded text-sm"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  if (newColumnTitle.trim()) {
                    const newColId = 'col-' + Date.now();
                    setKanban(prev => ({ ...prev, [newColId]: { title: newColumnTitle.trim(), cards: [] } }));
                    setAddingColumn(false);
                    setNewColumnTitle('');
                  }
                }}
              >Adicionar</button>
            </div>
          ) : (
            <button
              className="w-full h-full bg-[var(--color-surface)] hover:bg-[var(--color-border)] border-2 border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-light)] hover:text-[var(--color-text)] transition-colors p-4"
              onClick={() => { setAddingColumn(true); setNewColumnTitle(''); }}
            >
              + Nova Categoria
            </button>
          )}
        </div>
      </main>
      {/* Painel lateral de detalhes */}
      {sidePanelCard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className={`relative w-full max-w-lg mx-auto rounded-lg p-6 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] shadow-2xl transition-colors duration-300
            ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
          >
            <button
              className={`absolute top-4 right-4 p-2 rounded-full text-2xl z-10 transition-colors duration-300
                ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
              onClick={() => setSidePanelCard(null)}
              aria-label="Fechar"
            >
              &times;
            </button>
            <header className="mb-6 pb-4 border-b" style={{ borderColor: theme === 'dark' ? '#334155' : '#e5e7eb' }}>
              <h2 className="text-2xl font-bold text-center">{sidePanelCard.title}</h2>
            </header>
            <div className="flex-grow overflow-y-auto">
              <h3 className={`text-sm font-semibold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Script Completo</h3>
              <textarea
                className={`w-full min-h-[120px] p-4 rounded-md resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300
                  ${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-900'}`}
                value={sidePanelCard.script}
                onChange={e => setSidePanelCard((prev: any) => prev ? { ...prev, script: e.target.value } : prev)}
              />
              <div className="flex items-center gap-2 flex-wrap mt-4">
                {sidePanelCard.tags.map((tag: string) => (
                  <span key={tag} className={`text-xs font-semibold px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{tag}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-lg">{sidePanelCard.type === 'call' ? '📞' : sidePanelCard.type === 'objection' ? '⚠️' : sidePanelCard.type === 'closing' ? '✅' : '📝'}</span>
                <button
                  className={`transition-transform duration-200 ${sidePanelCard.favorite ? 'scale-110 text-yellow-400' : theme === 'dark' ? 'text-slate-500 hover:text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                  title="Favoritar"
                  onClick={() => {
                    setKanban(prev => {
                      const copy = { ...prev };
                      for (const colId in copy) {
                        const colCopy = { ...copy[colId] };
                        colCopy.cards = colCopy.cards.map(c => c.id === sidePanelCard.id ? { ...c, favorite: !c.favorite } : c);
                        copy[colId] = colCopy;
                      }
                      return copy;
                    });
                    setSidePanelCard((prev: any) => prev ? { ...prev, favorite: !prev.favorite } : prev);
                    showToast(sidePanelCard.favorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
                  }}
                >
                  {sidePanelCard.favorite ? '⭐' : '☆'}
                </button>
              </div>
            </div>
            <footer className="flex-shrink-0 pt-4 flex flex-col gap-2">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"
                onClick={() => {
                  navigator.clipboard.writeText(
                    (sidePanelCard.script || '').replace(/\[Seu Nome\]/gi, currentUser?.nome || 'Consultor')
                  );
                  showToast('Script copiado!');
                }}
              >
                Copiar Script
              </button>
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
                onClick={() => {
                  // Salvar edição do script no kanban
                  setKanban(prev => {
                    const copy = { ...prev };
                    for (const colId in copy) {
                      const colCopy = { ...copy[colId] };
                      colCopy.cards = colCopy.cards.map(c => c.id === sidePanelCard.id ? { ...c, script: sidePanelCard.script } : c);
                      copy[colId] = colCopy;
                    }
                    return copy;
                  });
                  showToast('Script atualizado!');
                }}
              >
                Salvar Alterações
              </button>
            </footer>
          </div>
        </div>
      )}
      {/* Modal de confirmação para apagar */}
      {confirmModal && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-slate-700 w-full max-w-md rounded-lg shadow-lg p-6 transform scale-95 text-center">
            <h2 className="text-xl font-bold text-white mb-4">Tem certeza?</h2>
            <p className="text-slate-300 mb-6">
              {confirmModal.type === 'card'
                ? `Tem certeza que quer apagar o script "${kanban[confirmModal.colId].cards.find(c => c.id === confirmModal.cardId)?.title ?? ''}"?`
                : `Apagar a categoria "${kanban[confirmModal.colId].title}" irá apagar também todos os seus scripts.`}
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg"
                onClick={() => setConfirmModal(null)}
              >Cancelar</button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                onClick={() => {
                  if (confirmModal.type === 'card' && confirmModal.cardId) {
                    setKanban(prev => {
                      const copy = { ...prev };
                      const colCopy = { ...copy[confirmModal.colId] };
                      colCopy.cards = colCopy.cards.filter(c => c.id !== confirmModal.cardId);
                      copy[confirmModal.colId] = colCopy;
                      return copy;
                    });
                  } else if (confirmModal.type === 'column') {
                    setKanban(prev => {
                      const copy = { ...prev };
                      delete copy[confirmModal.colId];
                      return copy;
                    });
                  }
                  setConfirmModal(null);
                  showToast(confirmModal.type === 'card' ? 'Script apagado!' : 'Categoria apagada!');
                }}
              >Apagar</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast de feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 feedback-toast">
          {toastMsg}
        </div>
      )}
    </section>
  );
};

export default ScriptLibrarySection; 