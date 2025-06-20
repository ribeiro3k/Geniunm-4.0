
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppUser, UserActivityData, QuizAttemptRecord as AppQuizAttemptRecord, SimulationRecord as AppSimulationRecord, NavigationSection, OverallPerformanceStats, ParsedEvaluation } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX, TABLE_QUIZZES, TABLE_SIMULACOES, TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from '../../constants';
import { formatDate } from '../../lib/utils'; 
import { supabase } from '../../lib/supabaseClient';


interface AdminDashboardProps {
  currentUser: AppUser | null;
}

const ProgressBar: React.FC<{ percentage: number; colorClass?: string; heightClass?: string }> = ({ percentage, colorClass = 'bg-[var(--color-primary)]', heightClass = 'h-2.5' }) => (
  <div className={`w-full bg-[var(--color-border)] rounded-full ${heightClass} overflow-hidden`}>
    <div
      className={`${colorClass} ${heightClass} rounded-full transition-all duration-500 ease-out`}
      style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      title={`${percentage.toFixed(1)}%`}
    />
  </div>
);

const periodOptions = [
    { value: 'allTime', label: 'Todo o Período' },
    { value: 'last7days', label: 'Últimos 7 Dias' },
    { value: 'last30days', label: 'Últimos 30 Dias' },
];

const isSuccessOutcome = (evalData: AppSimulationRecord['conteudo']['evaluation']): boolean => {
    if (!evalData) return false;
    return evalData.outcomeType === 'VENDA_REALIZADA';
};

const KpiModal: React.FC<{isOpen: boolean; onClose: () => void; title: string; summary: string;}> = ({ isOpen, onClose, title, summary }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="kpiModalTitle">
            <GlassCard className="max-w-md w-full p-6 themed-surface" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 id="kpiModalTitle" className="text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
                    <button onClick={onClose} className="text-[var(--color-text-light)] hover:text-[var(--color-text)] text-2xl leading-none p-1" aria-label="Fechar modal">&times;</button>
                </div>
                <p className="text-sm text-[var(--color-text-light)] whitespace-pre-line">{summary}</p>
                <div className="text-right mt-6">
                    <GlassButton onClick={onClose} className="!text-sm !py-2">Fechar</GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};

const kpiSummaries: Record<string, string> = {
    'Total de Usuários Registrados': "Este número representa todos os usuários (admins e consultores) cadastrados na tabela 'usuarios' do Supabase. É uma contagem cumulativa desde o início.",
    'Usuários Ativos no Período': "Indica o número de usuários únicos que realizaram pelo menos uma atividade (quiz ou simulação) dentro do período selecionado. Baseado nos registros das tabelas 'quizzes' e 'simulacoes'.",
    'Simulações no Período': "Total de simulações de conversa que foram concluídas e registradas na tabela 'simulacoes' por todos os usuários durante o período selecionado.",
    'Tentativas de Quiz no Período': "Número total de vezes que os quizzes foram iniciados e finalizados, com registros na tabela 'quizzes', no período selecionado.",
    'Média Quiz (Período)': "A média percentual de acertos em todas as tentativas de quiz realizadas no período, calculada a partir dos dados da tabela 'quizzes'. Se não houver quizzes, o valor será N/A.",
    'Sucesso Simulações (Período)': "Percentual de simulações (tabela 'simulacoes') que resultaram em um desfecho de 'sucesso' ou 'venda realizada', dentro do período selecionado. Se não houver simulações, o valor será N/A.",
    'Total Atividades (Período)': "Soma de todas as tentativas de quiz e simulações concluídas no período, oferecendo uma visão geral do engajamento e utilização da plataforma.",
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [userActivities, setUserActivities] = useState<UserActivityData[]>([]);
  const [overallStats, setOverallStats] = useState<OverallPerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('allTime');
  const [fetchError, setFetchError] = useState<string | null>(null);
    
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [kpiModalContent, setKpiModalContent] = useState({ title: '', summary: '' });


  const fetchData = useCallback(async () => {
    if (!supabase) {
        console.error("Supabase client not available for AdminDashboard.");
        setFetchError(`Não foi possível carregar dados do painel: ${SUPABASE_ERROR_MESSAGE}`);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setFetchError(null);

    let allQuizAttemptsQuery = supabase.from(TABLE_QUIZZES).select('id, usuario_id, titulo, criado_em, perguntas, resultado');
    let allSimRecordsQuery = supabase.from(TABLE_SIMULACOES).select('id, usuario_id, titulo, categoria, conteudo, nota, resumo_ia, criado_em');
    let allUsersQuery = supabase.from(TABLE_USUARIOS).select('id, nome, email, tipo'); // Removido avatarUrl


    const now = new Date();
    const periodStartDate = new Date(now);
    if (selectedPeriod === 'last7days') {
      periodStartDate.setDate(now.getDate() - 7);
      periodStartDate.setHours(0, 0, 0, 0);
      allQuizAttemptsQuery = allQuizAttemptsQuery.gte('criado_em', periodStartDate.toISOString());
      allSimRecordsQuery = allSimRecordsQuery.gte('criado_em', periodStartDate.toISOString());
    } else if (selectedPeriod === 'last30days') {
      periodStartDate.setDate(now.getDate() - 30);
      periodStartDate.setHours(0, 0, 0, 0);
      allQuizAttemptsQuery = allQuizAttemptsQuery.gte('criado_em', periodStartDate.toISOString());
      allSimRecordsQuery = allSimRecordsQuery.gte('criado_em', periodStartDate.toISOString());
    }

    try {
        const [
            { data: allQuizAttemptsData, error: quizError },
            { data: allSimRecordsData, error: simError },
            { data: allUsersData, error: usersError }
        ] = await Promise.all([
            allQuizAttemptsQuery,
            allSimRecordsQuery,
            allUsersQuery
        ]);
        
        if (quizError) { console.error("Error loading quiz attempts:", quizError); throw new Error(`Erro ao carregar quizzes: ${quizError.message}`); }
        if (simError) { console.error("Error loading simulation records:", simError); throw new Error(`Erro ao carregar simulações: ${simError.message}`);}
        if (usersError) { console.error("Error loading users:", usersError); throw new Error(`Erro ao carregar usuários: ${usersError.message}`);}

        const allQuizAttempts: AppQuizAttemptRecord[] = (allQuizAttemptsData || []) as AppQuizAttemptRecord[];
        const allSimRecords: AppSimulationRecord[] = (allSimRecordsData || []) as AppSimulationRecord[];
        const allKnownUsersList: { id: string, displayName: string, lastLogin?: string }[] = (allUsersData || []).map(u => ({
            id: u.id,
            displayName: u.nome,
            lastLogin: localStorage.getItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${u.id}`) || undefined
        }));


        const activitiesMap = new Map<string, UserActivityData>();
        allKnownUsersList.forEach(user => {
            activitiesMap.set(user.id, {
                id: user.id, displayName: user.displayName, lastLogin: user.lastLogin,
                simulationsCompleted: 0, quizAttempts: 0, averageQuizScore: null,
                simulationSuccessRate: null, totalActivities: 0,
            });
        });
        
        allQuizAttempts.forEach(attempt => {
        const activity = activitiesMap.get(attempt.usuario_id);
        if (activity) activity.quizAttempts++;
        });

        allSimRecords.forEach(record => {
        const activity = activitiesMap.get(record.usuario_id);
        if (activity) activity.simulationsCompleted++;
        });
        
        activitiesMap.forEach(activity => {
            const userQuizAttemptsInPeriod = allQuizAttempts.filter(qa => qa.usuario_id === activity.id);
            if (userQuizAttemptsInPeriod.length > 0) {
                const totalScore = userQuizAttemptsInPeriod.reduce((sum, qa) => sum + (qa.resultado.totalQuestions > 0 ? (qa.resultado.score / qa.resultado.totalQuestions) : 0), 0);
                activity.averageQuizScore = (totalScore / userQuizAttemptsInPeriod.length) * 100;
            }

            const userSimRecordsInPeriod = allSimRecords.filter(sr => sr.usuario_id === activity.id);
            const successfulSims = userSimRecordsInPeriod.filter(sr => isSuccessOutcome(sr.conteudo.evaluation)).length;
            if (userSimRecordsInPeriod.length > 0) {
                activity.simulationSuccessRate = (successfulSims / userSimRecordsInPeriod.length) * 100;
            }
            activity.totalActivities = activity.quizAttempts + activity.simulationsCompleted;
        });

        const finalActivities = Array.from(activitiesMap.values())
            .sort((a,b) => (b.lastLogin && a.lastLogin) ? new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime() : (b.totalActivities - a.totalActivities));
        setUserActivities(finalActivities);

        const activeUserIdsInPeriod = new Set<string>();
        allQuizAttempts.forEach(qa => activeUserIdsInPeriod.add(qa.usuario_id));
        allSimRecords.forEach(sr => activeUserIdsInPeriod.add(sr.usuario_id));

        let overallAvgQuizScore: number | null = null;
        if (allQuizAttempts.length > 0) {
            const totalOverallScore = allQuizAttempts.reduce((sum, qa) => sum + (qa.resultado.totalQuestions > 0 ? (qa.resultado.score / qa.resultado.totalQuestions) : 0), 0);
            overallAvgQuizScore = (totalOverallScore / allQuizAttempts.length) * 100;
        }

        let overallSimSuccessRate: number | null = null;
        if (allSimRecords.length > 0) {
            const totalSuccessfulSims = allSimRecords.filter(sr => isSuccessOutcome(sr.conteudo.evaluation)).length;
            overallSimSuccessRate = (totalSuccessfulSims / allSimRecords.length) * 100;
        }
        
        const scoreRanges = [
            { range: '90-100%', min: 0.9, max: 1.0, count: 0 }, { range: '70-89%', min: 0.7, max: 0.899, count: 0 },
            { range: '50-69%', min: 0.5, max: 0.699, count: 0 }, { range: '<50%', min: 0, max: 0.499, count: 0 }
        ];
        allQuizAttempts.forEach(qa => {
            const percentage = qa.resultado.totalQuestions > 0 ? qa.resultado.score / qa.resultado.totalQuestions : 0;
            const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max + 0.0001); 
            if (range) range.count++;
        });
        const quizScoreDistributionPeriod = scoreRanges.map(r => ({ ...r, percentage: allQuizAttempts.length > 0 ? (r.count / allQuizAttempts.length) * 100 : 0 }));

        const outcomeCounts: Record<string, number> = {};
        allSimRecords.forEach(sr => {
            const outcome = sr.conteudo.evaluation?.headerMessage || 'Não Avaliado';
            outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
        });
        const simulationOutcomeDistributionPeriod = Object.entries(outcomeCounts).map(([outcome, count]) => ({
            outcome, count, percentage: allSimRecords.length > 0 ? (count / allSimRecords.length) * 100 : 0
        })).sort((a,b) => b.count - a.count);

        setOverallStats({
            totalUsers: allKnownUsersList.length,
            activeUsersPeriod: activeUserIdsInPeriod.size,
            totalSimulationsPeriod: allSimRecords.length,
            totalQuizAttemptsPeriod: allQuizAttempts.length,
            averageQuizScorePeriod: overallAvgQuizScore,
            simulationSuccessRatePeriod: overallSimSuccessRate,
            totalActivitiesPeriod: allQuizAttempts.length + allSimRecords.length,
            quizScoreDistributionPeriod,
            simulationOutcomeDistributionPeriod
        });

    } catch (error: any) {
        setFetchError(error.message || "Ocorreu um erro desconhecido ao buscar os dados.");
        setOverallStats(null); // Clear stats on error
        setUserActivities([]);
    } finally {
        setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleKpiCardClick = (title: string) => {
    setKpiModalContent({ title, summary: kpiSummaries[title] || "Informação não disponível." });
    setIsKpiModalOpen(true);
  };

  const allUserDisplayNamesForFilter = useMemo(() => {
     const usersForFilter = new Map<string, string>();
     userActivities.forEach(act => {
       if (!usersForFilter.has(act.id)) usersForFilter.set(act.id, act.displayName);
     });
    const sorted = Array.from(usersForFilter.entries()).map(([id, displayName]) => ({id, displayName}));
    sorted.sort((a,b) => a.displayName.localeCompare(b.displayName));
    return sorted;

  }, [userActivities]);


  const filteredUserActivitiesForTable = useMemo(() => {
    if (!filterUser) return userActivities;
    return userActivities.filter(ua => ua.id.toLowerCase() === filterUser.toLowerCase());
  },[userActivities, filterUser]);

  const kpiCardData = useMemo(() => {
    if (!overallStats) return [];
    return [
        { title: 'Total de Usuários Registrados', value: overallStats.totalUsers.toString(), icon: 'fa-users', color: 'bg-sky-500' },
        { title: 'Usuários Ativos no Período', value: overallStats.activeUsersPeriod.toString(), icon: 'fa-user-clock', color: 'bg-teal-500' },
        { title: 'Simulações no Período', value: overallStats.totalSimulationsPeriod.toString(), icon: 'fa-comments', color: 'bg-green-500' },
        { title: 'Tentativas de Quiz no Período', value: overallStats.totalQuizAttemptsPeriod.toString(), icon: 'fa-file-alt', color: 'bg-yellow-500' },
        { title: 'Média Quiz (Período)', value: overallStats.averageQuizScorePeriod !== null ? `${overallStats.averageQuizScorePeriod.toFixed(1)}%` : 'N/A', icon: 'fa-graduation-cap', color: 'bg-purple-500' },
        { title: 'Sucesso Simulações (Período)', value: overallStats.simulationSuccessRatePeriod !== null ? `${overallStats.simulationSuccessRatePeriod.toFixed(1)}%` : 'N/A', icon: 'fa-bullseye', color: 'bg-pink-500' },
        { title: 'Total Atividades (Período)', value: overallStats.totalActivitiesPeriod.toString(), icon: 'fa-tasks', color: 'bg-orange-500' },
    ];
  }, [overallStats]);

  if (isLoading) {
    return <div className="py-12"><LoadingSpinner text="Carregando dados do painel admin..." /></div>;
  }
   if (!supabase && !fetchError) { // If supabase is null and no fetch error set by initial check
    setFetchError(`Não foi possível carregar dados do painel: ${SUPABASE_ERROR_MESSAGE}`);
  }

  if (fetchError) {
    return (
        <section id="admin-panel" className="py-8">
            <GlassCard className="p-6 text-center">
                <h1 className="section-title !text-center text-[var(--error)]">Erro ao Carregar Painel</h1>
                <p className="text-[var(--color-text)]">{fetchError}</p>
                <GlassButton onClick={fetchData} className="mt-4">Tentar Novamente</GlassButton>
            </GlassCard>
        </section>
    );
  }
  
  if (!overallStats) { // If fetch was successful but overallStats is still null (should not happen if no error)
    return <div className="py-12"><p className="text-center text-[var(--color-text-light)]">Nenhum dado disponível para o painel.</p></div>;
  }


  return (
    <section id="admin-panel" className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="section-title !mb-0 !border-b-0">Painel do Administrador</h1>
        <div className="flex items-center gap-x-2 mt-3 sm:mt-0">
          <label htmlFor="adminPeriodFilter" className="text-sm text-[var(--color-text-light)] whitespace-nowrap">Período:</label>
          <select 
            id="adminPeriodFilter" 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="themed-input themed-select !text-sm !py-1.5 !px-2.5 max-w-[180px]"
          >
            {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {kpiCardData.map(kpi => (
          <GlassCard 
            key={kpi.title} 
            className={`p-4 themed-surface hover:shadow-lg transition-shadow cursor-pointer ${kpi.color} bg-opacity-10 !border-l-4 !border-[${kpi.color.replace('bg-','var(--color-')}]`} // Tailwind might not support var in border color like this. It will fallback.
            onClick={() => handleKpiCardClick(kpi.title)}
            title={`Clique para saber mais sobre "${kpi.title}"`}
            style={{borderLeftColor: `var(--${kpi.color.replace('bg-','color-')})`}} // Inline style for dynamic border color
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--color-text-light)] uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{kpi.value}</p>
              </div>
              <div className={`p-2 rounded-full text-white ${kpi.color}`}>
                <i className={`fas ${kpi.icon} text-lg`}></i>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {isKpiModalOpen && <KpiModal isOpen={isKpiModalOpen} onClose={() => setIsKpiModalOpen(false)} title={kpiModalContent.title} summary={kpiModalContent.summary}/>}

      {/* User Activity Table */}
      <GlassCard className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2 sm:mb-0">Atividade dos Usuários ({selectedPeriod === 'allTime' ? 'Todo o Período' : periodOptions.find(o => o.value === selectedPeriod)?.label})</h2>
            <div className="flex items-center gap-x-2 w-full sm:w-auto">
                <label htmlFor="userFilter" className="text-sm text-[var(--color-text-light)] whitespace-nowrap">Filtrar:</label>
                <select id="userFilter" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="themed-input themed-select !text-sm !py-1.5 !px-2.5 flex-grow">
                    <option value="">Todos os Usuários</option>
                    {allUserDisplayNamesForFilter.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}
                </select>
            </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-input-bg)]">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Usuário</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Visto por Último</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Quizzes</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Média Quiz</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Simulações</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Sucesso Sim.</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Total Ativ.</th>
                <th scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUserActivitiesForTable.map(user => (
                <tr key={user.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                  <td className="px-3 py-2 text-[var(--color-text-light)] whitespace-nowrap">{user.displayName}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] whitespace-nowrap">{user.lastLogin ? formatDate(user.lastLogin) : 'N/A'}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.quizAttempts}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">
                    {user.averageQuizScore !== null ? `${user.averageQuizScore.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.simulationsCompleted}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">
                     {user.simulationSuccessRate !== null ? `${user.simulationSuccessRate.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-center">{user.totalActivities}</td>
                  <td className="px-3 py-2 text-center">
                    <Link to={`/${NavigationSection.AdminPanel}/collaborator/${user.id}`}>
                      <GlassButton className="!text-xs !py-1 !px-2">Ver Detalhes</GlassButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         {filteredUserActivitiesForTable.length === 0 && <p className="text-center text-sm text-[var(--color-text-light)] mt-4">Nenhum usuário encontrado com os filtros aplicados.</p>}
      </GlassCard>
      
      {/* Charts (Example: Quiz Score Distribution) */}
      {overallStats.quizScoreDistributionPeriod.some(d => d.count > 0) && (
        <GlassCard className="mt-8 p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Distribuição de Pontuação em Quizzes ({selectedPeriod === 'allTime' ? 'Todo o Período' : periodOptions.find(o => o.value === selectedPeriod)?.label})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {overallStats.quizScoreDistributionPeriod.map(dist => (
              dist.count > 0 && ( // Only show ranges with data
                <div key={dist.range}>
                  <div className="flex justify-between text-xs text-[var(--color-text-light)] mb-1">
                    <span>Faixa de {dist.range}</span>
                    <span>{dist.count} Tentativas ({dist.percentage.toFixed(1)}%)</span>
                  </div>
                  <ProgressBar percentage={dist.percentage} />
                </div>
              )
            ))}
          </div>
        </GlassCard>
      )}

      {overallStats.simulationOutcomeDistributionPeriod.some(d => d.count > 0) && (
        <GlassCard className="mt-8 p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Distribuição de Resultados em Simulações ({selectedPeriod === 'allTime' ? 'Todo o Período' : periodOptions.find(o => o.value === selectedPeriod)?.label})</h2>
           <div className="space-y-3">
            {overallStats.simulationOutcomeDistributionPeriod.map(dist => (
              dist.count > 0 && (
                <div key={dist.outcome}>
                  <div className="flex justify-between text-xs text-[var(--color-text-light)] mb-1">
                    <span className="truncate max-w-[70%]" title={dist.outcome}>{dist.outcome.length > 50 ? dist.outcome.substring(0,47) + '...' : dist.outcome}</span>
                    <span>{dist.count} Simulações ({dist.percentage.toFixed(1)}%)</span>
                  </div>
                  <ProgressBar percentage={dist.percentage} colorClass={dist.outcome.toLowerCase().includes('sucesso') || dist.outcome.toLowerCase().includes('realizada') ? 'bg-[var(--success)]' : dist.outcome.toLowerCase().includes('encerrada') ? 'bg-[var(--error)]' : 'bg-[var(--color-accent)]'} />
                </div>
              )
            ))}
          </div>
        </GlassCard>
      )}

    </section>
  );
};

export default AdminDashboard;
