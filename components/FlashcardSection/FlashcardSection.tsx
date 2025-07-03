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

const FlashcardSection: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<FlashcardContent | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState<FlashcardContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true); // Default to true, error handling will manage if key is actually missing via service.
  const [copiedSide, setCopiedSide] = useState<'front' | 'back' | null>(null);
  const tempDivRef = useRef<HTMLDivElement | null>(null);


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


  return (
    <section id="flashcards" className="py-12 mt-8">
      <GlassCard className="max-w-4xl mx-auto p-6 md:p-8">
        <h2 className="section-title">Flashcards Interativos</h2>
        <p className="mb-8 text-center text-[var(--text-secondary)] text-sm">
          Clique no card para virar. Gere novos cards com IA sobre técnicas de vendas.
        </p>
        {error && !isLoading && <p className="text-[var(--error)] text-center mb-4 py-2 px-3 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.3)] rounded-md">{error}</p>}

        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 mb-8 relative min-h-[280px]">
          {copiedSide && currentCard && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 bg-[rgba(var(--success-rgb),0.9)] text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-10">
              "{copiedSide === 'front' ? currentCard.front.substring(0,20)+'...' : 'Verso'}": Copiado!
            </div>
          )}
          <GlassCard className="w-full md:w-60 h-auto md:h-[250px] flex flex-col p-4 themed-surface-secondary">
            <h4 className="text-lg font-semibold mb-3 text-[var(--accent-primary)]">Histórico</h4>
            <div className="flashcard-history flex-grow max-h-48 md:max-h-full overflow-y-auto custom-scrollbar pr-2">
              {history.length > 0 ? (
                history.map((item) => (
                  <HistoryItem key={item.id} item={item} onSelect={selectHistoryItem} />
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)] italic">Nenhum card gerado ainda.</p>
              )}
            </div>
          </GlassCard>

          <div className="w-[350px] h-[250px] flex items-center justify-center">
            {isLoading && !currentCard && <LoadingSpinner text="Gerando card inicial..." />}
            {!isLoading && !currentCard && !apiKeyAvailable && /* This condition might need adjustment if currentCard can be error card */
              <div className="flashcard-main">
                   <GlassCard className="flashcard-inner flex flex-col items-center justify-center p-4">
                      <p className="text-red-400 text-center font-semibold text-lg">Chave de API Faltando</p>
                      <p className="text-[var(--text-secondary)] text-center text-sm mt-2">{API_KEY_ERROR_MESSAGE}</p>
                   </GlassCard>
              </div>
            }
            {currentCard && !isLoading && (
              <Flashcard
                frontContent={currentCard.front}
                backContent={currentCard.back}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
                onCopyFront={(e) => handleCopy(e, currentCard.front, "front")}
                onCopyBack={(e) => handleCopy(e, currentCard.back, "back")}
              />
            )}
             {isLoading && currentCard && (
                <div className="absolute w-[350px] h-[250px] bg-[rgba(var(--background-main-rgb),0.7)] backdrop-blur-sm flex flex-col items-center justify-center rounded-[var(--border-radius-large)] z-10">
                    <AnimatedLoadingText messages={FLASHCARD_LOADING_MESSAGES} />
                </div>
            )}
          </div>

          <GlassButton
            onClick={() => handleGenerateCard()}
            disabled={isLoading || !apiKeyAvailable}
            className="next-card-button w-full mt-4 md:mt-0 md:w-[100px] h-[60px] flex flex-col items-center justify-center text-sm self-center md:self-auto gap-1"
            title="Gerar novo card aleatório"
            aria-label="Gerar novo flashcard"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : (<><i className="fas fa-wand-magic-sparkles text-lg"></i><span className="text-xs leading-tight">Novo Card</span></>)}
          </GlassButton>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--border-color-light)]">
            <h4 className="text-lg font-semibold mb-4 text-[var(--accent-primary)] text-center">Gerar Card por Tema:</h4>
            <div className="flex flex-wrap justify-center gap-3">
                {FLASHCARD_THEMES.slice(0, 5).map(theme => (
                    <GlassButton
                        key={theme}
                        onClick={() => handleGenerateCard(theme)}
                        disabled={isLoading || !apiKeyAvailable}
                        className="text-xs px-3 py-1.5 themed-button"
                    >
                        {theme}
                    </GlassButton>
                ))}
                 <GlassButton
                        onClick={() => handleGenerateCard()}
                        disabled={isLoading || !apiKeyAvailable}
                        className="text-xs px-3 py-1.5 bg-[rgba(var(--accent-primary-rgb),0.7)] hover:bg-[rgba(var(--accent-primary-rgb),0.85)] border-[rgba(var(--accent-primary-rgb),0.7)]"
                    >
                        Tema Aleatório <i className="fas fa-dice ml-1"></i>
                    </GlassButton>
            </div>
        </div>

      </GlassCard>
    </section>
  );
};

export default FlashcardSection;