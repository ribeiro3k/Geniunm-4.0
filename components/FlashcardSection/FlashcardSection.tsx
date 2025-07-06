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
import { useTheme } from '../ui/useTheme.ts';
import { fetchFlashcardsByTheme, upsertUserFlashcardProgress, fetchUserFlashcardProgress, setFlashcardFavorite, fetchFavoriteFlashcards } from '../../lib/supabaseClient';
import { SupabaseFlashcard, UserFlashcardProgress } from '../../types';

// Modal de celebração com tema
const CelebrationModal = ({ onClose, onRestart, theme, nextDeck, onNextDeck }: { onClose: () => void, onRestart: () => void, theme: 'light' | 'dark', nextDeck: string, onNextDeck: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className={`rounded-2xl p-8 shadow-2xl text-center max-w-xs border transition-colors duration-300 ${theme === 'dark' ? 'bg-[#232733] text-white border-[#2d3240]' : 'bg-white text-[var(--accent-primary)] border-gray-200'}`}>
      <h3 className="text-2xl font-bold mb-2">Parabéns!</h3>
      <p className="mb-4">Você concluiu todos os cards deste deck!</p>
      <div className="flex flex-col gap-2 mt-4">
        <button onClick={onRestart} className={`px-4 py-2 rounded-lg font-semibold transition ${theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>Reiniciar Deck</button>
        <button onClick={onClose} className={`px-4 py-2 rounded-lg font-semibold transition ${theme === 'dark' ? 'bg-[#181c23] text-white hover:bg-[#232733]' : 'bg-gray-200 text-[var(--accent-primary)] hover:bg-gray-300'}`}>Escolher Outro Deck</button>
        <button onClick={onNextDeck} className={`px-4 py-2 rounded-lg font-semibold transition ${theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>Avançar para o próximo deck</button>
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
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true); // Default to true, error handling will manage if key is actually missing via service.
  const [copiedSide, setCopiedSide] = useState<'front' | 'back' | null>(null);
  const tempDivRef = useRef<HTMLDivElement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const { theme } = useTheme();
  const [deckCards, setDeckCards] = useState<SupabaseFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<UserFlashcardProgress[]>([]);
  const [userId, setUserId] = useState<string>(''); // TODO: Integrar com autenticação real
  const [favoriteCards, setFavoriteCards] = useState<SupabaseFlashcard[]>([]);

  // Simular progresso por deck (futuro: integrar com backend/estado real)
  const getDeckProgress = (theme: string) => 0; // TODO: integrar progresso real

  const handleGenerateCard = useCallback(async (theme?: string) => {
    // The apiKeyAvailable check here is mostly for subsequent manual calls.
    // Initial call from useEffect proceeds assuming the service will handle key checks.
    if (!apiKeyAvailable && error) { // Only prevent if an error (like API key missing) has already occurred
        // Potentially allow retrying if error is transient, but API_KEY_ERROR_MESSAGE is not.
        if (error === API_KEY_ERROR_MESSAGE) return;
    }


    setIsLoading(true);
    setError(null); // Clear previous errors before a new attempt

    if (isFlipped) {
        setIsFlipped(false);
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    const selectedTheme = theme || FLASHCARD_THEMES[Math.floor(Math.random() * FLASHCARD_THEMES.length)];
    const safeThemeIdPart = selectedTheme.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    try {
      const newCard = await generateFlashcardFromGemini(selectedTheme);
      if (newCard) {
        // If the service itself returned an error card (e.g. format error, or even its own API error string)
        if (newCard.id.startsWith('flashcard_error_')) {
            setError(newCard.back); // Display the error from the card's back content
            if (newCard.back === API_KEY_ERROR_MESSAGE) {
                setApiKeyAvailable(false); // Explicitly mark as unavailable if service confirms missing key
            }
        }
        setCurrentCard(newCard);
        if (!history.some(hCard => hCard.id === newCard.id) && !newCard.id.startsWith('flashcard_error_')) {
           setHistory(prev => [newCard, ...prev.slice(0, 9)]);
        }
      } else {
        // This case should ideally be handled by generateFlashcardFromGemini returning an error card or throwing
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyAvailable, history, isFlipped]); // Removed 'error' from here to prevent loops if error occurs


  useEffect(() => {
    tempDivRef.current = document.createElement('div');
    // Directly attempt to generate card on mount.
    // The geminiService will throw an error if API_KEY is missing,
    // which will be caught by handleGenerateCard.
    handleGenerateCard();

    return () => {
        // Clean up temp div if necessary
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally keep handleGenerateCard out of deps for on-mount only behavior for *this specific effect*


  const selectHistoryItem = async (item: FlashcardContent) => {
    if (isFlipped) {
        setIsFlipped(false);
        await new Promise(resolve => setTimeout(resolve, 350));
    }
    setCurrentCard(item);
    setError(null); // Clear error when selecting a history item
    if (item.id.startsWith('flashcard_error_config_apikey') || item.back === API_KEY_ERROR_MESSAGE) {
        setApiKeyAvailable(false);
        setError(item.back);
    } else {
        setApiKeyAvailable(true); // Assume key is fine if selecting a non-error card
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

  // Buscar flashcards do Supabase ao selecionar um deck
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

  // Buscar progresso do usuário ao carregar o deck
  useEffect(() => {
    if (selectedDeck && userId) {
      fetchUserFlashcardProgress(userId)
        .then(progress => setUserProgress(progress))
        .catch(() => setUserProgress([]));
    }
  }, [selectedDeck, userId]);

  // Buscar favoritos ao carregar tela de seleção
  useEffect(() => {
    if (userId && !selectedDeck) {
      fetchFavoriteFlashcards(userId)
        .then(setFavoriteCards)
        .catch(() => setFavoriteCards([]));
    }
  }, [userId, selectedDeck]);

  // Salvar progresso ao avançar para o próximo card
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

  // Verificar se todos os cards do deck foram vistos
  const allSeen = deckCards.length > 0 && deckCards.every(card => userProgress.some(p => p.flashcard_id === card.id));

  // Reiniciar o deck atual
  const handleRestartDeck = () => {
    setShowCelebration(false);
    setIsFlipped(false);
    setHistory([]);
    handleGenerateCard(selectedDeck!);
  };

  // Função para favoritar/desfavoritar
  const handleToggleFavorite = async () => {
    if (!userId || deckCards.length === 0) return;
    const currentCardId = deckCards[currentIndex].id;
    const progress = userProgress.find(p => p.flashcard_id === currentCardId);
    const isFavorite = progress?.is_favorite ?? false;
    try {
      await setFlashcardFavorite(userId, currentCardId, !isFavorite);
      setUserProgress(prev => prev.map(p =>
        p.flashcard_id === currentCardId ? { ...p, is_favorite: !isFavorite } : p
      ));
    } catch {}
  };

  // Ao selecionar o deck Favoritos, mostrar apenas os favoritos:
  useEffect(() => {
    if (selectedDeck === 'Favoritos' && userId) {
      setIsLoading(true);
      fetchFavoriteFlashcards(userId)
        .then(cards => {
          setDeckCards(cards);
          setCurrentIndex(0);
          setIsFlipped(false);
          setIsLoading(false);
        })
        .catch(() => {
          setDeckCards([]);
          setCurrentIndex(0);
          setIsFlipped(false);
          setIsLoading(false);
        });
    }
  }, [selectedDeck, userId]);

  // Se nenhum deck foi selecionado, mostrar seleção de decks
  if (!selectedDeck) {
    return (
      <section id="flashcards" className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300 bg-transparent">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-2 text-center drop-shadow ${theme === 'dark' ? 'text-white' : 'text-[var(--accent-primary)]'}`}>Flashcards Interativos</h2>
          <p className={`mb-8 text-center text-lg max-w-2xl ${theme === 'dark' ? 'text-gray-300' : 'text-[var(--text-secondary)]'}`}>Escolha um deck de aprendizado para começar sua jornada.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full px-2 md:px-0">
            {FLASHCARD_THEMES.slice(0, 6).map((themeName) => (
              <button
                key={themeName}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border min-h-[180px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${theme === 'dark' ? 'bg-[#232733] border-[#232733] text-white' : 'bg-white border-[var(--border-color-light)] text-[var(--accent-primary)]'}`}
                onClick={() => setSelectedDeck(themeName)}
              >
                <div className="text-5xl mb-3">📚</div>
                <div className="font-bold text-lg mb-2 text-center">{themeName}</div>
                <ProgressBar value={getDeckProgress(themeName)} height={10} className="w-full mt-3" />
                <span className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-[var(--text-secondary)]'}`}>0% concluído</span>
              </button>
            ))}
            {favoriteCards.length > 0 && (
              <button
                className={`flex flex-col items-center justify-center p-8 rounded-2xl shadow-xl hover:shadow-2xl transition border min-h-[180px] focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white border-yellow-300 text-yellow-600`}
                onClick={() => setSelectedDeck('Favoritos')}
              >
                <div className="text-5xl mb-3">⭐</div>
                <div className="font-bold text-lg mb-2 text-center">Favoritos</div>
                <span className="text-xs mt-2">{favoriteCards.length} cards</span>
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // TELA DE ESTUDO - MODO FOCO ESCURO/CLARO
  const deckList = [...FLASHCARD_THEMES];
  if (favoriteCards.length > 0) deckList.push('Favoritos');
  const currentDeckIndex = deckList.findIndex(d => d === selectedDeck);
  const nextDeck = deckList[(currentDeckIndex + 1) % deckList.length];

  return (
    <section id="flashcards" className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300 bg-transparent">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
        {/* Botão voltar para seleção de deck */}
        <div className="w-full flex justify-start mb-2">
          <button onClick={() => setSelectedDeck(null)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow transition ${theme === 'dark' ? 'bg-[#232733] text-white hover:bg-[#232733]/80' : 'bg-white text-[var(--accent-primary)] hover:bg-gray-100'}`}>
            <i className="fas fa-arrow-left"></i> Voltar para seleção de deck
          </button>
        </div>
        <div className="w-full flex flex-col items-center mb-6 mt-4">
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 text-center drop-shadow ${theme === 'dark' ? 'text-white' : 'text-[var(--accent-primary)]'}`}>Trilha: {selectedDeck}</h2>
          <ProgressBar value={deckCards.length ? (currentIndex + 1) / deckCards.length : 0} height={10} color={theme === 'dark' ? '#3b82f6' : 'var(--accent-primary)'} className="w-full max-w-lg mb-2" />
          <span className={`${theme === 'dark' ? 'text-white/80' : 'text-[var(--accent-primary)]'} text-sm mb-2`}>Card {deckCards.length ? currentIndex + 1 : 0} de {deckCards.length}</span>
        </div>
        <div className="relative w-full flex flex-col items-center justify-center">
          <div className="w-full flex flex-col items-center justify-center">
            {isLoading && (
              <div className={`rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[220px] flex flex-col items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-[#232733] border-[#2d3240] shadow-2xl' : 'bg-white border-gray-200 shadow-xl'}`}>
                <span className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-[var(--accent-primary)]'}`}>Carregando...</span>
              </div>
            )}
            {!isLoading && deckCards.length > 0 && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className={`relative rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[220px] flex flex-col items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-[#232733] border-[#2d3240] shadow-2xl' : 'bg-white border-gray-200 shadow-xl'}`}>
                  {/* Botão favorito canto superior esquerdo */}
                  <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-3 left-3 p-2 rounded-full shadow text-lg ${theme === 'dark' ? 'bg-[#181c23] text-yellow-400 hover:bg-[#232733]' : 'bg-gray-100 text-yellow-500 hover:bg-gray-200'}`}
                    title={userProgress.find(p => p.flashcard_id === deckCards[currentIndex].id)?.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
                    style={{ zIndex: 2 }}
                  >
                    {userProgress.find(p => p.flashcard_id === deckCards[currentIndex].id)?.is_favorite ? '⭐' : '☆'}
                  </button>
                  {/* Botão copiar canto superior direito */}
                  <button
                    onClick={(e) => copyToClipboard(!isFlipped ? deckCards[currentIndex].front : deckCards[currentIndex].back, isFlipped ? 'back' : 'front')}
                    className={`absolute top-3 right-3 p-2 rounded-full shadow text-lg ${theme === 'dark' ? 'bg-[#181c23] text-white hover:bg-[#232733]' : 'bg-gray-100 text-[var(--accent-primary)] hover:bg-gray-200'}`}
                    title="Copiar conteúdo do card"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                  <div className="flex items-center mb-2 self-start gap-2">
                    <span className={`text-xl md:text-2xl font-semibold text-left min-h-[60px] flex items-center ${theme === 'dark' ? 'text-white' : 'text-[var(--accent-primary)]'}`}
                      style={{ whiteSpace: 'pre-line' }}>
                      {!isFlipped ? deckCards[currentIndex].front : deckCards[currentIndex].back}
                    </span>
                  </div>
                </div>
                {/* Botões abaixo do card */}
                <div className="flex gap-4 mt-8 w-full justify-center items-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg shadow transition ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-[#232733] text-white hover:bg-[#2d3240]' : 'bg-white text-[var(--accent-primary)] hover:bg-gray-100'}`}
                  >
                    <i className="fas fa-arrow-left"></i> Voltar
                  </button>
                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`px-8 py-3 rounded-full font-bold text-lg shadow transition ${theme === 'dark' ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    VIRAR CARTA
                  </button>
                  <button
                    onClick={handleNextCard}
                    disabled={currentIndex === deckCards.length - 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg shadow transition ${currentIndex === deckCards.length - 1 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-green-500 text-white hover:bg-green-600'}`}
                  >
                    Próximo <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}
            {!isLoading && deckCards.length === 0 && (
              <div className={`rounded-2xl p-8 md:p-12 w-full max-w-xl min-h-[220px] flex flex-col items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-[#232733] border-[#2d3240] shadow-2xl' : 'bg-white border-gray-200 shadow-xl'}`}>
                <span className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-[var(--accent-primary)]'}`}>Nenhum flashcard encontrado para este deck.</span>
              </div>
            )}
          </div>
        </div>
        {showCelebration && (
          <CelebrationModal
            onClose={() => setSelectedDeck(null)}
            onRestart={() => setCurrentIndex(0)}
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
        {/* Selo visual de deck completo */}
        {allSeen && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow">Deck completo <i className="fas fa-check-circle ml-1"></i></span>
          </div>
        )}
        <div className="w-full flex justify-center mt-4">
          <span className="text-xs text-gray-400 text-center max-w-xs">Leia a frente do card, depois vire para ver a resposta/dica.</span>
        </div>
      </div>
    </section>
  );
};

export default FlashcardSection;