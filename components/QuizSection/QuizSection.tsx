
import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestionType, UserAnswer, AppUser, QuizAttemptRecord as AppQuizAttemptRecord } from '../../types';
import { QUIZ_QUESTIONS, TABLE_QUIZZES } from '../../constants';
import QuizQuestionDisplay from './QuizQuestionDisplay';
import QuizResults from './QuizResults';
import GlassButton from '../ui/GlassButton'; 
import GlassCard from '../ui/GlassCard'; 
import LoadingSpinner from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';

interface QuizSectionProps {
  currentUser: AppUser | null;
}

const QuizSection: React.FC<QuizSectionProps> = ({ currentUser }) => {
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  
  const [answerSubmittedForCurrent, setAnswerSubmittedForCurrent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);


  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },[]);

  const loadQuestions = useCallback(() => {
    setIsLoading(true);
    const shuffledQuestions = shuffleArray(QUIZ_QUESTIONS);
    setQuestions(shuffledQuestions.map(q => {
      let newQ = {...q};
      if (newQ.options) { 
        newQ.options = shuffleArray(newQ.options);
      }
      return newQ;
    }));
    setIsLoading(false);
  }, [shuffleArray]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswerSubmit = (answer: string | string[], isCorrect: boolean) => {
    const currentQuestion = questions[currentQuestionIndex];
    setUserAnswers(prev => {
      const existingAnswerIndex = prev.findIndex(ua => ua.questionId === currentQuestion.id);
      const newAnswerRecord: UserAnswer = { questionId: currentQuestion.id, answer, isCorrect };
      if (existingAnswerIndex > -1) {
        const updatedAnswers = [...prev];
        updatedAnswers[existingAnswerIndex] = newAnswerRecord;
        return updatedAnswers;
      }
      return [...prev, newAnswerRecord];
    });
    setAnswerSubmittedForCurrent(true); 
  };
  
  const handleNextAction = async () => {
    if (!answerSubmittedForCurrent) {
      console.warn("handleNextAction called before answer submitted. This should be handled by child.");
      return; 
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerSubmittedForCurrent(false); 
    } else {
      const finalScore = await calculateScoreAndSave();
      if (finalScore !== null) { // Check if saving was successful
          setScore(finalScore);
          setShowResults(true);
      } else {
        // Error already set by calculateScoreAndSave
      }
    }
  };

  const calculateScoreAndSave = async (): Promise<number | null> => {
    setSaveError(null);
    let currentScore = 0;
    userAnswers.forEach(ua => {
      if (ua.isCorrect) {
          currentScore++;
      }
    });

    if (currentUser && supabase) {
      const attemptToSave: Omit<AppQuizAttemptRecord, 'id' | 'criado_em'> = {
        usuario_id: currentUser.id,
        titulo: `Quiz de Conhecimento (${new Date().toLocaleDateString()})`, 
        perguntas: QUIZ_QUESTIONS, // Original questions for context
        resultado: {
          score: currentScore,
          totalQuestions: questions.length,
          answers: userAnswers,
        },
      };

      try {
        const { error } = await supabase.from(TABLE_QUIZZES).insert([attemptToSave]);
        if (error) {
          console.error("Failed to save quiz attempt to Supabase:", error);
          setSaveError(`Falha ao salvar o resultado do quiz: ${error.message}`);
          return null; // Indicate failure
        }
      } catch (e) {
        console.error("Exception saving quiz attempt:", e);
        setSaveError(`Exceção ao salvar o resultado: ${(e as Error).message}`);
        return null; // Indicate failure
      }
    }
    return currentScore;
  };

  const restartQuiz = () => {
    loadQuestions(); 
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResults(false);
    setScore(0);
    setAnswerSubmittedForCurrent(false);
    setSaveError(null);
  };

  if (isLoading || questions.length === 0) {
    return (
        <section id="quiz" className="py-12 mt-8">
            <GlassCard className="max-w-4xl mx-auto text-center p-8">
                <LoadingSpinner text="Carregando quiz..." />
            </GlassCard>
        </section>
    );
  }


  if (showResults) {
    return (
      <section id="quiz" className="py-12 mt-8">
        <GlassCard className="max-w-4xl mx-auto p-6 md:p-8">
          <QuizResults userAnswers={userAnswers} questions={QUIZ_QUESTIONS} score={score} onRestart={restartQuiz} />
           {saveError && (
              <p className="text-center text-sm text-[var(--error)] mt-4 p-2 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] rounded-md">
                {saveError}
              </p>
            )}
        </GlassCard>
      </section>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswerForCurrentQuestion = userAnswers.find(ua => ua.questionId === currentQuestion.id);

  return (
    <section id="quiz" className="py-12 mt-8">
      <GlassCard className="max-w-4xl mx-auto p-6 md:p-8">
        <h2 className="section-title">Quiz de Conhecimento</h2>
         {saveError && (
            <p className="text-center text-sm text-[var(--error)] mb-4 p-2 bg-[rgba(var(--error-rgb),0.1)] border border-[rgba(var(--error-rgb),0.2)] rounded-md">
              {saveError}
            </p>
          )}
        <div className="text-center mb-6 text-[var(--color-text-light)]">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
        </div>
        <div id="quiz-container" className="min-h-[300px]">
          <QuizQuestionDisplay
            question={currentQuestion}
            displayQuestionNumber={currentQuestionIndex + 1} 
            onAnswer={handleAnswerSubmit} 
            showFeedback={answerSubmittedForCurrent} 
            userAttempted={answerSubmittedForCurrent} 
            userAnswer={userAnswerForCurrentQuestion?.answer}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            onSubmitAnswer={handleNextAction} 
          />
        </div>
         {answerSubmittedForCurrent && (
            <div className="text-center mt-8 pt-6 border-t border-[var(--color-border)]">
            <GlassButton 
                onClick={handleNextAction}
                className="px-6 py-3 w-full md:w-auto"
                disabled={isLoading} // Disable if still processing previous save, though unlikely here
            >
                {isLoading ? <LoadingSpinner size="sm"/> : (currentQuestionIndex === questions.length - 1 ? 'Ver Resultados' : 'Próxima Pergunta')}
            </GlassButton>
            </div>
        )}
      </GlassCard>
    </section>
  );
};

export default QuizSection;
