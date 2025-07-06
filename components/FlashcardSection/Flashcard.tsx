import React, { useRef, useEffect } from 'react';
import GlassCard from '../ui/GlassCard'; // Renders as .themed-surface
import { motion } from 'framer-motion';

interface FlashcardProps {
  frontContent: string | React.ReactNode;
  backContent: string | React.ReactNode;
  isFlipped: boolean;
  onFlip: () => void;
  onCopyFront: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCopyBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
  stackIndex?: number; // 0 = topo, 1 = segundo, etc.
  stackSize?: number;
}

const Flashcard: React.FC<FlashcardProps> = ({ 
  frontContent, 
  backContent, 
  isFlipped, 
  onFlip,
  onCopyFront,
  onCopyBack,
  stackIndex = 0,
  stackSize = 1
}) => {
  const backContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFlipped && backContentRef.current) {
      setTimeout(() => {
        if (backContentRef.current) {
            backContentRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [isFlipped, backContent]);

  const renderContent = (content: string | React.ReactNode, side: 'front' | 'back') => {
    if (typeof content !== 'string') {
      const textAlignClass = side === 'front' ? 'text-center' : 'text-left';
      return <div className={textAlignClass}>{content}</div>;
    }
    
    let htmlContent = content;
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    htmlContent = htmlContent.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    htmlContent = htmlContent.replace(/\n/g, '<br />');
    
    const textAlignClass = side === 'front' ? 'text-center' : 'text-left';

    // Ensure .prose styles are applied and max-width allows content to fill card.
    return <div className={`prose prose-sm max-w-none ${textAlignClass} w-full text-[var(--text-primary)]`} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  // Animação de pilha e flip
  // stackIndex: 0 = topo, 1 = segundo, etc.
  const stackTransforms = [
    { scale: 1, rotate: 0, opacity: 1, zIndex: 3 },
    { scale: 0.95, rotate: -4, opacity: 0.7, zIndex: 2 },
    { scale: 0.9, rotate: 4, opacity: 0.5, zIndex: 1 },
  ];
  const t = stackTransforms[stackIndex] || stackTransforms[stackTransforms.length - 1];

  return (
    <motion.div
      id="flashcard-main"
      className={`flashcard-main ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "Mostrar frente do card" : "Mostrar verso do card"}
      style={{ position: 'absolute', left: 0, right: 0, margin: 'auto', zIndex: t.zIndex }}
      initial={false}
      animate={{ scale: t.scale, rotate: t.rotate, opacity: t.opacity }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <motion.div
        className="flashcard-inner"
        style={{ perspective: 1200 }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0.2, 0.2, 1] }}
      >
        {/* Frente */}
        <GlassCard className="flashcard-front !p-5 flex flex-col items-center justify-center" aria-hidden={isFlipped} style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }}>
          {renderContent(frontContent, "front")}
          <button 
            className="copy-button"
            onClick={onCopyFront}
            title="Copiar Frente"
            aria-label="Copiar conteúdo da frente do card"
          >
            <i className="fas fa-copy"></i>
          </button>
        </GlassCard>
        {/* Verso */}
        <GlassCard className="flashcard-back !p-5" aria-hidden={!isFlipped} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', width: '100%', height: '100%' }}>
          <div 
            ref={backContentRef} 
            className="h-full w-full overflow-y-auto custom-scrollbar pr-2"
          >
            {renderContent(backContent, "back")}
          </div>
          <button 
            className="copy-button"
            onClick={onCopyBack}
            title="Copiar Verso"
            aria-label="Copiar conteúdo do verso do card"
          >
            <i className="fas fa-copy"></i>
          </button>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default Flashcard;
