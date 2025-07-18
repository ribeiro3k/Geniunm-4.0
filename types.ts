import { User as SupabaseUser } from '@supabase/supabase-js';

// AppUser: Represents the authenticated user within the application context
export interface AppUser {
  id: string; // For local admin: 'admin_fixed_user'; For Supabase users: UUID
  nome: string; 
  tipo: 'admin' | 'consultor';
  // password field is removed from AppUser state to avoid storing it client-side after login.
  // It's only used during the login process and for creation/update.
  // avatarUrl?: string; // REMOVIDO
  email?: string; // From Supabase 'usuarios' table
  criado_em?: string; // From Supabase 'usuarios' table
}
export type CurrentUserType = AppUser | null;

// SimpleUserCredentials for creating new consultant users in Supabase

export interface SimpleUserCredentials {
  id: string;
  nome: string;
}
export interface Tag {
  text: string;
  color: string; // ex: 'blue', 'green', 'red'
}

export type ScriptType = 'phone' | 'email' | 'person';
export type Category = 'Abordagem' | 'Qualificação' | 'Contorno de Objeções' | 'Fechamento' | 'Follow-up';

export interface Script {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: Tag[];
  type: ScriptType;
  isFavorite?: boolean;
}


export interface FlashcardContent {
  id: string; // e.g., flashcard_theme_Técnica_de_Escassez
  front: string;
  back: string;
  theme: string;
  topicTags?: string[];
  skillTags?: string[];
}

export interface QuizQuestionOption {
  id: string; // Unique ID for each option, useful for multi-select state
  text: string;
  correct?: boolean;
}

export interface QuizQuestionType {
  id: number;
  text: string;
  options?: QuizQuestionOption[];
  type: 'multiple-choice' | 'ordering' | 'true-false' | 'fill-in-the-blank';
  allowMultipleAnswers?: boolean; 
  orderedItems?: { id: string; text: string; correctPosition: number }[];
  feedback: string; 
  correctOrderFeedback?: string[]; 
  placeholder?: string; 
  topicTags?: string[]; 
  skillTags?: string[]; 
}

export interface UserAnswer {
  questionId: number;
  answer: string | string[]; 
  isCorrect: boolean;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  senderDisplayName?: string;
  status?: 'pending_send' | 'sent' | 'delivered' | 'read' | 'error';
  avatarUrl?: string; // Esta avatarUrl é para o avatar do cliente/IA na simulação, não do usuário logado. MANTER.
  isAudioMessage?: boolean; 
}

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
}


export type SimulatorBehavioralProfile = 
  | 'Questionador Detalhista' 
  | 'Ocupado/Impaciente' 
  | 'Desconfiado/Silencioso' 
  | 'Confuso/Indeciso' 
  | 'Comparador'
  | 'Padrão'
  | 'Flávio - O Chefão';

export interface Scenario {
  id: string; 
  title: string; 
  context: string; 
  initialMessage: string; 
  behavioralProfile?: SimulatorBehavioralProfile;
  avatarUrl?: string; // Esta avatarUrl é para o avatar do cliente/IA na simulação. MANTER.
  isBoss?: boolean;   
  topicTags?: string[]; 
  skillTags?: string[]; 
}

export enum NavigationSection {
  Home = 'home',
  Flashcards = 'flashcards',
  Quiz = 'quiz',
  Simulador = 'simulador',
  AdminPanel = 'admin-panel', 
  UserManagement = 'user-management',
  Reports = 'reports', 
  PersonaCustomization = 'persona-customization', 
  Scripts = 'scripts',
}

export interface NavItem {
  href: string;
  label: string;
  section: NavigationSection;
  isLoading?: boolean; 
  adminOnly?: boolean; 
  icon?: string; 
}

export interface AudioTranscriptionResponse {
    text?: string;
    error?: string;
}

export interface Objection {
  id: string;
  text: string;
  context?: string; 
}

// User type for UserManagementPanel (creating new users) - Now for Supabase
export interface NewUserCredentials {
  nome: string;
  email?: string; // Email is optional for Supabase user creation
  senhaPlainText: string; 
  tipo: 'consultor'; // Admins are fixed, so only consultants created here
}


// Admin Panel Data Types
export interface UserActivityData {
  id: string; // username or local ID
  displayName: string;
  lastLogin?: string; // ISO Date string
  simulationsCompleted: number; // In selected period
  quizAttempts: number; // In selected period
  averageQuizScore: number | null; // In selected period
  simulationSuccessRate: number | null; // In selected period
  totalActivities: number; // In selected period
}

// QuizAttemptRecord to be saved to Supabase
export interface QuizAttemptRecord {
  id?: string; // Supabase will generate UUID
  usuario_id: string; // Will be Supabase user UUID
  titulo: string; 
  criado_em?: string; 
  perguntas: QuizQuestionType[]; 
  resultado: {
    score: number;
    totalQuestions: number;
    answers: UserAnswer[];
  };
}

export interface ParsedErrorOrSuccessItem {
  title: string;
  description: string;
}

export interface ParsedEvaluation {
    outcomeType: 'VENDA_NAO_REALIZADA' | 'VENDA_REALIZADA' | 'INDETERMINADO';
    headerMessage: string; 
    isBossScenarioSuccess?: boolean;
    quickSummary: string | null;
    mainErrors?: ParsedErrorOrSuccessItem[];
    positivePointFailure?: { description: string; tip?: string } | null;
    mainSuccessPoints?: ParsedErrorOrSuccessItem[];
    attentionPointSuccess?: { description: string; tip?: string } | null;
    generalNotes: {
        acolhimento: number | null;
        clareza: number | null;
        argumentacao: number | null;
        fechamento: number | null;
    };
    clientInfo: {
        nome: string | null;
        curso: string | null;
        vida: string | null;
        busca: string | null;
        medo: string | null;
        perfilComportamental: string | null;
    };
    conversationAnalysis: {
        conhecimentoCursos: string | null;
        escutaAtiva: string | null;
        contornoDuvidasOuObjecoes: string | null; 
        apresentacaoDiferenciais: string | null;
        fechamento: string | null;
    } | null;
    improvementStepsOrTips: string[] | null; 
    finalSummary: string | null; 
    finalDevelopmentNote?: string | null; 
}

// SimulationRecord to be saved to Supabase
export interface SimulationRecord {
  id?: string; // Supabase will generate UUID
  usuario_id: string; // Will be Supabase user UUID
  titulo: string; 
  categoria?: string; 
  conteudo: {
    messages: Message[];
    evaluation: ParsedEvaluation | null;
    scenarioDetails: { 
        id: string; 
        behavioralProfile?: SimulatorBehavioralProfile;
    }
  };
  nota?: number; 
  resumo_ia?: string; 
  criado_em?: string; 
}


// New type for Admin Dashboard Performance Snapshot (Overall Stats)
export interface OverallPerformanceStats {
  totalUsers: number; 
  activeUsersPeriod: number; 
  totalSimulationsPeriod: number;
  totalQuizAttemptsPeriod: number;
  averageQuizScorePeriod: number | null;
  simulationSuccessRatePeriod: number | null;
  totalActivitiesPeriod: number;
  quizScoreDistributionPeriod: Array<{ range: string; count: number; percentage: number }>;
  simulationOutcomeDistributionPeriod: Array<{ outcome: string; count: number; percentage: number }>;
}

// For Collaborator Dashboard
export interface PerformanceSnapshotData {
  averageQuizScore: number | null; 
  quizAttemptsCount: number; 
  simulationsCompletedCount: number; 
  averageStarRatings: { 
    acolhimento: number;
    clareza: number;
    argumentacao: number;
    fechamento: number;
  };
  recentPositiveFeedback: string[]; 
  recentCriticalFeedback: string[]; 
}


// Types for Reporting Section
export type ReportPeriod = 'allTime' | 'last7days' | 'last30days';
export type ReportContentType = 'quizzes' | 'simulations'; 

export interface ReportFilterConfig {
  collaboratorId: string; // 'all' or specific Supabase user UUID
  period: ReportPeriod;
  contentTypes: ReportContentType[]; 
}

export interface ReportKPIs {
  totalActivities?: boolean;
  quizAttempts?: boolean;
  quizAverageScore?: boolean;
  quizHighestScore?: boolean;
  quizLowestScore?: boolean;
  quizTopicAnalysis?: boolean; 
  simulationAttempts?: boolean;
  simulationSuccessRate?: boolean;
  simulationSkillSummary?: boolean; 
  simulationAverageStars?: { 
    enabled?: boolean; 
    acolhimento?: boolean;
    clareza?: boolean;
    argumentacao?: boolean;
    fechamento?: boolean;
  };
}

export interface ProcessedReportDataRow {
  userId: string; // Supabase user UUID
  userName: string;
  totalActivities: number;
  quizAttempts: number;
  quizAverageScore: number | null; 
  quizHighestScore: number | null; 
  quizLowestScore: number | null;  
  strongQuizTopics: string[]; 
  challengingQuizTopics: string[]; 
  simulationAttempts: number;
  simulationSuccessRate: number | null; 
  simulationAverageAcolhimento: number | null;
  simulationAverageClareza: number | null;
  simulationAverageArgumentacao: number | null;
  simulationAverageFechamento: number | null;
}

export interface GeneratedReport {
  config: ReportFilterConfig;
  kpis: ReportKPIs;
  data: ProcessedReportDataRow[];
  generatedAt: string; // ISO Date string
  summaryInsights?: string; // Simple text insights
}

export interface SupabaseFlashcard {
  id: string; // UUID
  theme: string;
  front: string;
  back: string;
  ordem?: number; // ordem no deck
  created_at?: string;
}

export interface UserFlashcardProgress {
  id: string; // UUID
  user_id: string;
  flashcard_id: string;
  is_favorite: boolean;
  last_viewed_at?: string;
  times_viewed?: number;
  completed?: boolean;
}
