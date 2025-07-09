import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { FlashcardContent } from '../../types';
import { generateFlashcardFromGemini } from '../../services/geminiService';
import { FLASHCARD_THEMES, API_KEY_ERROR_MESSAGE, FLASHCARD_LOADING_MESSAGES } from '../../constants';
import Flashcard from './Flashcard';
import HistoryItem from './HistoryItem';
import LoadingSpinner from '../ui/LoadingSpinner';
import GlassButton from '../ui/GlassButton';
import GlassCard from '../ui/GlassCard';
import AnimatedLoadingText from '../ui/AnimatedLoadingText';
import ProgressBar from '../ui/ProgressBar';
import { useTheme } from '../ui/useTheme.tsx';
import { fetchFlashcardsByTheme, upsertUserFlashcardProgress, fetchUserFlashcardProgress, setFlashcardFavorite, fetchFavoriteFlashcards } from '../../lib/supabaseClient';
import { SupabaseFlashcard, UserFlashcardProgress } from '../../types';

// Ícones temáticos para cada flashcard
const FLASHCARD_ICONS: Record<string, string> = {
  'Técnica de Escassez': 'fa-hourglass-half',
  'Gatilho da Urgência': 'fa-bolt',
  'Comunicação Assertiva no WhatsApp': 'fa-comments',
  'Contornando Objeção de Preço': 'fa-dollar-sign',
  'Fechamento por Alternativas': 'fa-handshake',
  'Benefício: Flexibilidade EAD': 'fa-laptop',
  'Técnica de Ancoragem': 'fa-anchor',
  'Prova Social': 'fa-users',
  'Storytelling em Vendas': 'fa-book-open',
  'Rapport Digital': 'fa-heart',
  'Objeções Comuns': 'fa-shield-alt',
  'Follow-up Estratégico': 'fa-paper-plane'
};

// Modal de celebração com tema
const CelebrationModal = ({ onClose, onRestart, theme, nextDeck, onNextDeck }: { 
  onClose: () => void, 
  onRestart: () => void, 
  theme: 'light' | 'dark', 
  nextDeck: string, 
  onNextDeck: () => void 
}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full`}>
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold mb-2 text-[var(--color-text)]">Parabéns!</h3>
      <p className="mb-6 text-[var(--color-text-light)]">Você concluiu todos os cards deste deck!</p>
      <div className="flex flex-col gap-3">
        <GlassButton onClick={onRestart} className="w-full">
          <i className="fas fa-redo mr-2"></i>Reiniciar Deck
        </GlassButton>
        <GlassButton onClick={onNextDeck} className="w-full">
          <i className="fas fa-arrow-right mr-2"></i>Próximo Deck
        </GlassButton>
        <button 
          onClick={onClose} 
          className="w-full py-2 px-4 text-[var(--color-text-light)] hover:text-[var(--color-text)] transition-colors"
        >
          Escolher Outro Deck
        </button>
      </div>
    </div>
  </div>
);

const FlashcardSection: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<FlashcardContent | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState<FlashcardContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);
  const [copiedSide, setCopiedSide] = useState<'front' | 'back' | null>(null);
  const tempDivRef = useRef<HTMLDivElement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const { theme } = useTheme();
  const [deckCards, setDeckCards] = useState<SupabaseFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<UserFlashcardProgress[]>([]);
  const [userId, setUserId] = useState<string>('');

  const handleGenerateCard = useCallback(async (theme?: string) => {
    if (!apiKeyAvailable && error) {
      if (error === API_KEY_ERROR_MESSAGE) return;
    }

    setIsLoading(true);
    setError(null);

    if (isFlipped) {
      setIsFlipped(false);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const selectedTheme = theme || FLASHCARD_THEMES[Math.floor(Math.random() * FLASHCARD_THEMES.length)];
    const safeThemeIdPart = selectedTheme.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const newCard = await generateFlashcardFromGemini(selectedTheme);
      if (newCard) {
        if (newCard.id.startsWith('flashcard_error_')) {
          setError(newCard.back);
          if (newCard.back === API_KEY_ERROR_MESSAGE) {
            setApiKeyAvailable(false);
          }
        }
        setCurrentCard(newCard);
        if (!history.some(hCard => hCard.id === newCard.id) && !newCard.id.startsWith('flashcard_error_')) {
          setHistory(prev => [newCard, ...prev.slice(0, 9)]);
        }
      } else {
        setError("Não foi possível gerar o card. Tente novamente.");
        setCurrentCard({
          id: `flashcard_error_generate_${safeThemeIdPart}`,
          front: "Erro",
          back: "Não foi possível gerar o card.",
          theme: selectedTheme
        });
      }
    } catch (e) {
      const err = e as Error;
      console.error('Error in handleGenerateCard:', err);
      setError(err.message || "Erro ao gerar card.");
      if (err.message === API_KEY_ERROR_MESSAGE) {
        setApiKeyAvailable(false);
      }
      setCurrentCard({
        id: `flashcard_error_api_${safeThemeIdPart}`,
        front: err.message === API_KEY_ERROR_MESSAGE ? "Erro de Configuração" : "Erro API",
        back: err.message,
        theme: selectedTheme
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiKeyAvailable, history, isFlipped]);

  useEffect(() => {
    tempDivRef.current = document.createElement('div');
    handleGenerateCard();
    return () => {};
  }, []);

  const selectHistoryItem = async (item: FlashcardContent) => {
    if (isFlipped) {
      setIsFlipped(false);
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    setCurrentCard(item);
    setError(null);
    if (item.id.startsWith('flashcard_error_config_apikey') || item.back === API_KEY_ERROR_MESSAGE) {
      setApiKeyAvailable(false);
      setError(item.back);
    } else {
      setApiKeyAvailable(true);
    }
  };

  const copyToClipboard = (text: string, side: 'front' | 'back') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedSide(side);
        setTimeout(() => setCopiedSide(null), 1500);
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Falha ao copiar texto.');
      });
  };

  const handleCopy = (event: React.MouseEvent<HTMLButtonElement>, content: string | React.ReactNode, side: 'front' | 'back') => {
    event.stopPropagation();
    if (typeof content === 'string') {
      copyToClipboard(content, side);
    } else if (tempDivRef.current && React.isValidElement(content)) {
      const tempRoot = ReactDOM.createRoot(tempDivRef.current);
      tempRoot.render(<div>{content}</div>);
      copyToClipboard(tempDivRef.current.textContent || "Conteúdo complexo, não foi possível copiar.", side);
      tempRoot.unmount();
    } else {
      copyToClipboard(String(content) || "Não foi possível copiar este conteúdo.", side);
    }
  };

  useEffect(() => {
    if (selectedDeck) {
      setIsLoading(true);
      fetchFlashcardsByTheme(selectedDeck)
        .then(cards => {
          setDeckCards(cards);
          setCurrentIndex(0);
          setIsFlipped(false);
          setIsLoading(false);
        })
        .catch(err => {
          setError('Erro ao buscar flashcards do banco.');
          setIsLoading(false);
        });
    } else {
      setDeckCards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [selectedDeck]);

  useEffect(() => {
    if (selectedDeck && userId) {
      fetchUserFlashcardProgress(userId)
        .then(progress => setUserProgress(progress))
        .catch(() => setUserProgress([]));
    }
  }, [selectedDeck, userId]);

  const handleNextCard = async () => {
    if (deckCards.length > 0 && userId) {
      const currentCardId = deckCards[currentIndex].id;
      try {
        await upsertUserFlashcardProgress(userId, currentCardId);
        setUserProgress(prev => {
          if (prev.some(p => p.flashcard_id === currentCardId)) return prev;
          return [...prev, { id: '', user_id: userId, flashcard_id: currentCardId, is_favorite: false, completed: true }];
        });
      } catch {}
    }
    if (currentIndex < deckCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowCelebration(true);
    }
  };

  const allSeen = deckCards.length > 0 && deckCards.every(card => userProgress.some(p => p.flashcard_id === card.id));

  const handleRestartDeck = () => {
    setShowCelebration(false);
    setIsFlipped(false);
    setHistory([]);
    handleGenerateCard(selectedDeck!);
  };

  const getDeckProgress = (themeName: string) => {
    if (!deckCards.length) return 0;
    const completedCount = deckCards.filter(card => 
      userProgress.some(p => p.flashcard_id === card.id)
    ).length;
    return completedCount / deckCards.length;
  };

  // Se nenhum deck foi selecionado, mostrar seleção de decks com layout bento
  if (!selectedDeck) {
    return (
      <section id="flashcards" className="min-h-screen bg-[var(--color-bg)] transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
              Flashcards Interativos
            </h1>
            <p className="text-lg text-[var(--color-text-light)] max-w-2xl mx-auto">
              Escolha um deck de aprendizado para começar sua jornada de conhecimento.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FLASHCARD_THEMES.slice(0, 6).map((themeName, index) => {
                const progress = getDeckProgress(themeName);
                const icon = FLASHCARD_ICONS[themeName] || 'fa-graduation-cap';
                
                return (
                  <div
                    key={themeName}
                    className={`
                      group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-input-bg)]
                      border border-[var(--color-border)] hover:border-[var(--color-primary)] 
                      transition-all duration-300 cursor-pointer
                      hover:shadow-lg hover:shadow-[var(--color-primary)]/20
                      hover:-translate-y-1
                      ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
                      ${index === 2 ? 'lg:row-span-2' : ''}
                    `}
                    onClick={() => setSelectedDeck(themeName)}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-4 right-4 text-6xl">
                        <i className={`fas ${icon}`}></i>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-6 h-full flex flex-col justify-between min-h-[200px]">
                      {/* Icon and Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white shadow-lg">
                          <i className={`fas ${icon} text-lg`}></i>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                            {themeName}
                          </h3>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[var(--color-text-light)]">Progresso</span>
                          <span className="text-sm font-medium text-[var(--color-text)]">
                            {Math.round(progress * 100)}%
                          </span>
                        </div>
                        <ProgressBar 
                          value={progress} 
                          height={8} 
                          color="var(--color-primary)"
                          className="w-full"
                        />
                        
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            {progress === 1 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <i className="fas fa-check-circle mr-1"></i>
                                Completo
                              </span>
                            ) : progress > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <i className="fas fa-play-circle mr-1"></i>
                                Em Progresso
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <i className="fas fa-circle mr-1"></i>
                                Novo
                              </span>
                            )}
                          </div>
                          
                          {/* Arrow Icon */}
                          <div className="text-[var(--color-text-light)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all">
                            <i className="fas fa-arrow-right"></i>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                );
              })}
            </div>

            {/* Additional Decks Preview */}
            {FLASHCARD_THEMES.length > 6 && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--color-input-bg)] border border-[var(--color-border)] text-[var(--color-text-light)]">
                  <i className="fas fa-plus mr-2"></i>
                  Mais {FLASHCARD_THEMES.length - 6} decks disponíveis
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // TELA DE ESTUDO - MODO FOCO
  const deckList = [...FLASHCARD_THEMES];
  const currentDeckIndex = deckList.findIndex(d => d === selectedDeck);
  const nextDeck = deckList[(currentDeckIndex + 1) % deckList.length];

  return (
    <section id="flashcards" className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] transition-colors duration-300">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4">
        {/* Botão voltar para seleção de deck */}
        <div className="w-full flex justify-start mb-4">
          <button 
            onClick={() => setSelectedDeck(null)} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-input-bg)] transition-colors"
          >
            <i className="fas fa-arrow-left"></i> 
            Voltar para seleção
          </button>
        </div>

        {/* Header do Deck */}
        <div className="w-full flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white">
              <i className={`fas ${FLASHCARD_ICONS[selectedDeck] || 'fa-graduation-cap'}`}></i>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
              {selectedDeck}
            </h2>
          </div>
          
          <div className="w-full max-w-lg">
            <ProgressBar 
              value={deckCards.length ? (currentIndex + 1) / deckCards.length : 0} 
              height={12} 
              color="var(--color-primary)"
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-[var(--color-text-light)]">
              <span>Card {deckCards.length ? currentIndex + 1 : 0} de {deckCards.length}</span>
              <span>{Math.round(((currentIndex + 1) / deckCards.length) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Card Display */}
        <div className="relative w-full flex flex-col items-center justify-center">
          {isLoading && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[280px] flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="text-lg text-[var(--color-text)] mt-4">Carregando...</span>
            </div>
          )}

          {!isLoading && deckCards.length > 0 && (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[280px] flex flex-col items-center justify-center shadow-lg">
                {/* Botão copiar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(!isFlipped ? deckCards[currentIndex].front : deckCards[currentIndex].back, isFlipped ? 'back' : 'front');
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-input-bg)] hover:bg-[var(--color-border)] text-[var(--color-text-light)] hover:text-[var(--color-primary)] transition-colors"
                  title="Copiar conteúdo"
                >
                  <i className={`fas ${copiedSide ? 'fa-check' : 'fa-copy'}`}></i>
                </button>

                {/* Conteúdo do Card */}
                <div className="flex-1 flex items-center justify-center text-center">
                  <p className="text-xl md:text-2xl font-medium text-[var(--color-text)] leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                    {!isFlipped ? deckCards[currentIndex].front : deckCards[currentIndex].back}
                  </p>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-center gap-4 mt-8 w-full">
                <button
                  onClick={() => {
                    if (currentIndex > 0) {
                      setCurrentIndex(currentIndex - 1);
                      setIsFlipped(false);
                    }
                  }}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-input-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fas fa-arrow-left"></i> 
                  Anterior
                </button>

                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-8 py-3 rounded-full font-bold text-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:shadow-lg hover:shadow-[var(--color-primary)]/30 transition-all transform hover:scale-105"
                >
                  {isFlipped ? 'VER FRENTE' : 'VIRAR CARTA'}
                </button>

                <button
                  onClick={handleNextCard}
                  disabled={currentIndex === deckCards.length - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo 
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {!isLoading && deckCards.length === 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[280px] flex flex-col items-center justify-center">
              <i className="fas fa-exclamation-triangle text-4xl text-[var(--color-text-light)] mb-4"></i>
              <span className="text-xl text-[var(--color-text)]">Nenhum flashcard encontrado para este deck.</span>
            </div>
          )}
        </div>

        {/* Selo de deck completo */}
        {allSeen && (
          <div className="flex items-center gap-2 mt-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium shadow-sm">
              <i className="fas fa-trophy mr-2"></i>
              Deck Completo
            </span>
          </div>
        )}

        {/* Dica */}
        <div className="w-full flex justify-center mt-6">
          <p className="text-xs text-[var(--color-text-light)] text-center max-w-md">
            Leia a frente do card, depois vire para ver a resposta ou explicação detalhada.
          </p>
        </div>
      </div>

      {/* Modal de Celebração */}
      {showCelebration && (
        <CelebrationModal
          onClose={() => setSelectedDeck(null)}
          onRestart={() => {
            setCurrentIndex(0);
            setShowCelebration(false);
            setIsFlipped(false);
          }}
          theme={theme}
          nextDeck={nextDeck}
          onNextDeck={() => {
            setSelectedDeck(nextDeck);
            setShowCelebration(false);
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
        />
      )}
    </section>
  );
};

export default FlashcardSection;