import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppUser, QuizAttemptRecord, SimulationRecord, ReportFilterConfig, ReportKPIs, ProcessedReportDataRow, ReportPeriod, ReportContentType, ParsedEvaluation, QuizQuestionType } from '../../types';
import { DEFAULT_REPORT_FILTER_CONFIG, DEFAULT_REPORT_KPIS, TABLE_QUIZZES, TABLE_SIMULACOES, TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from '../../constants';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { supabase } from '../../lib/supabaseClient';
// Chart.js, jsPDF, and jsPDF-AutoTable are expected to be globally available via CDN

interface ReportsSectionProps {
  currentUser: AppUser | null;
}

const isSuccessOutcome = (evalData: SimulationRecord['conteudo']['evaluation']): boolean => { 
    if (!evalData) return false;
    return evalData.outcomeType === 'VENDA_REALIZADA';
};

const CustomCheckbox: React.FC<{
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubItem?: boolean;
  disabled?: boolean;
}> = ({ name, label, checked, onChange, isSubItem = false, disabled = false }) => (
  <label htmlFor={name} className={`custom-checkbox-label ${isSubItem ? 'ml-6' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} disabled={disabled}/>
    <span className="custom-checkbox-display">
      <i className="fas fa-check check-icon"></i>
    </span>
    <span>{label}</span>
  </label>
);


const ReportsSection: React.FC<ReportsSectionProps> = ({ currentUser }) => {
  const [filters, setFilters] = useState<ReportFilterConfig>(DEFAULT_REPORT_FILTER_CONFIG);
  const [kpis, setKpis] = useState<ReportKPIs>(DEFAULT_REPORT_KPIS);
  const [reportData, setReportData] = useState<ProcessedReportDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generatedReportTitle, setGeneratedReportTitle] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null); // Using 'any' for Chart.js instance for simplicity

  useEffect(() => {
    const fetchUsers = async () => {
        if (!supabase) {
            setFetchError(`Não é possível carregar usuários: ${SUPABASE_ERROR_MESSAGE}`);
            setIsLoading(false);
            return;
        }
        setFetchError(null);
        const { data, error } = await supabase.from(TABLE_USUARIOS).select('id, nome');
        if (error) {
            console.error("Error fetching users for reports:", error);
            setFetchError(`Erro ao carregar lista de usuários: ${error.message}`);
            setUsersList([]);
        } else {
            const formattedUsers = (data || []).map(u => ({ id: u.id, name: u.nome }));
            formattedUsers.sort((a,b) => a.name.localeCompare(b.name));
            setUsersList(formattedUsers);
        }
        setIsLoading(false); // Initial load done
    };
    fetchUsers();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFilters(prev => ({
        ...prev,
        contentTypes: checked
          ? [...prev.contentTypes, value as ReportContentType]
          : prev.contentTypes.filter(ct => ct !== value),
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name.startsWith("simulationAverageStars.")) {
        const starName = name.split(".")[1] as keyof NonNullable<ReportKPIs['simulationAverageStars']>;
        setKpis(prev => ({
            ...prev,
            simulationAverageStars: {
                ...(prev.simulationAverageStars || { enabled: false }),
                enabled: prev.simulationAverageStars?.enabled || checked, 
                [starName]: checked,
            }
        }));
    } else if (name === "simulationSkillSummary") {
        setKpis(prev => ({
            ...prev,
            simulationSkillSummary: checked,
            simulationAverageStars: {
                ...(prev.simulationAverageStars || {}), // Preserve existing star states if any
                enabled: checked, 
                acolhimento: checked ? true : prev.simulationAverageStars?.acolhimento,
                clareza: checked ? true : prev.simulationAverageStars?.clareza,
                argumentacao: checked ? true : prev.simulationAverageStars?.argumentacao,
                fechamento: checked ? true : prev.simulationAverageStars?.fechamento,
            }
        }));
    }
    else {
        setKpis(prev => ({ ...prev, [name]: checked as boolean }));
    }
  };
  
  const processData = useCallback(async (): Promise<ProcessedReportDataRow[]> => {
    if (!supabase) {
        setFetchError(`Não é possível processar dados: ${SUPABASE_ERROR_MESSAGE}`);
        return [];
    }
    setFetchError(null);
    
    let quizQuery = supabase.from(TABLE_QUIZZES).select('*');
    let simQuery = supabase.from(TABLE_SIMULACOES).select('*');

    const now = new Date();
    if (filters.period !== 'allTime') {
      const periodStartDate = new Date(now);
      if (filters.period === 'last7days') periodStartDate.setDate(now.getDate() - 7);
      else if (filters.period === 'last30days') periodStartDate.setDate(now.getDate() - 30);
      periodStartDate.setHours(0,0,0,0);
      quizQuery = quizQuery.gte('criado_em', periodStartDate.toISOString());
      simQuery = simQuery.gte('criado_em', periodStartDate.toISOString());
    }

    if (filters.collaboratorId !== 'all') {
      quizQuery = quizQuery.eq('usuario_id', filters.collaboratorId);
      simQuery = simQuery.eq('usuario_id', filters.collaboratorId);
    }
    
    try {
        const [quizRes, simRes] = await Promise.all([quizQuery, simQuery]);

        if (quizRes.error) throw new Error(`Erro ao buscar quizzes para relatório: ${quizRes.error.message}`);
        if (simRes.error) throw new Error(`Erro ao buscar simulações para relatório: ${simRes.error.message}`);

        const filteredQuizAttempts: QuizAttemptRecord[] = (quizRes.data || []) as QuizAttemptRecord[];
        const filteredSimRecords: SimulationRecord[] = (simRes.data || []) as SimulationRecord[];

        const dataMap = new Map<string, ProcessedReportDataRow>();
        const userIdsWithData = new Set<string>();
        
        if (filters.contentTypes.includes('quizzes')) {
            filteredQuizAttempts.forEach(qa => userIdsWithData.add(qa.usuario_id));
        }
        if (filters.contentTypes.includes('simulations')) {
            filteredSimRecords.forEach(sr => userIdsWithData.add(sr.usuario_id));
        }
        
        if (filters.collaboratorId !== 'all' && userIdsWithData.size === 0 && usersList.find(u => u.id === filters.collaboratorId)) { 
            userIdsWithData.add(filters.collaboratorId);
        } else if (filters.collaboratorId === 'all' && userIdsWithData.size === 0) { 
            usersList.forEach(u => userIdsWithData.add(u.id));
        }


        userIdsWithData.forEach(userId => {
        const user = usersList.find(u => u.id === userId) || { id: userId, name: `Usuário ${userId}` };
        dataMap.set(userId, {
            userId: user.id, userName: user.name, totalActivities: 0,
            quizAttempts: 0, quizAverageScore: null, quizHighestScore: null, quizLowestScore: null,
            strongQuizTopics: [], challengingQuizTopics: [],
            simulationAttempts: 0, simulationSuccessRate: null,
            simulationAverageAcolhimento: null, simulationAverageClareza: null,
            simulationAverageArgumentacao: null, simulationAverageFechamento: null,
        });
        });

        if (filters.contentTypes.includes('quizzes')) {
        dataMap.forEach(userRow => {
            const userQuizAttempts = filteredQuizAttempts.filter(qa => qa.usuario_id === userRow.userId);
            userRow.quizAttempts = userQuizAttempts.length;
            userRow.totalActivities += userRow.quizAttempts;

            if (userQuizAttempts.length > 0) {
                let totalScoreSum = 0;
                userQuizAttempts.forEach(qa => {
                    const scorePercent = qa.resultado.totalQuestions > 0 ? (qa.resultado.score / qa.resultado.totalQuestions) * 100 : 0;
                    totalScoreSum += scorePercent;
                    if (userRow.quizHighestScore === null || scorePercent > userRow.quizHighestScore) userRow.quizHighestScore = scorePercent;
                    if (userRow.quizLowestScore === null || scorePercent < userRow.quizLowestScore) userRow.quizLowestScore = scorePercent;

                    if (kpis.quizTopicAnalysis) {
                        const topicScores: Record<string, { correct: number, total: number }> = {};
                        qa.resultado.answers.forEach(ans => {
                            const question = qa.perguntas.find(q => q.id === ans.questionId);
                            if (question?.topicTags) {
                                question.topicTags.forEach(tag => {
                                    topicScores[tag] = topicScores[tag] || { correct: 0, total: 0 };
                                    topicScores[tag].total++;
                                    if (ans.isCorrect) topicScores[tag].correct++;
                                });
                            }
                        });
                        Object.entries(topicScores).forEach(([topic, scores]) => {
                            const accuracy = scores.total > 0 ? (scores.correct / scores.total) * 100 : 0;
                            if (accuracy >= 80 && scores.total >= 2) { 
                                if (!userRow.strongQuizTopics.some(t => t.startsWith(topic))) userRow.strongQuizTopics.push(`${topic} (${accuracy.toFixed(0)}%)`);
                            } else if (accuracy < 50 && scores.total >= 2) { 
                                if (!userRow.challengingQuizTopics.some(t => t.startsWith(topic))) userRow.challengingQuizTopics.push(`${topic} (${accuracy.toFixed(0)}%)`);
                            }
                        });
                    }
                });
                userRow.quizAverageScore = totalScoreSum / userQuizAttempts.length;
            }
        });
        }

        if (filters.contentTypes.includes('simulations')) {
        dataMap.forEach(userRow => {
            const userSims = filteredSimRecords.filter(sr => sr.usuario_id === userRow.userId);
            userRow.simulationAttempts = userSims.length;
            userRow.totalActivities += userRow.simulationAttempts;

            if (userSims.length > 0) {
                let successfulSims = 0;
                let sumAcolhimento = 0, sumClareza = 0, sumArgumentacao = 0, sumFechamento = 0;
                let countAcolhimento = 0, countClareza = 0, countArgumentacao = 0, countFechamento = 0;

                userSims.forEach(sr => {
                    if (sr.conteudo.evaluation) {
                        if (isSuccessOutcome(sr.conteudo.evaluation)) successfulSims++;
                        if (sr.conteudo.evaluation.generalNotes) {
                            if (sr.conteudo.evaluation.generalNotes.acolhimento !== null) { sumAcolhimento += sr.conteudo.evaluation.generalNotes.acolhimento; countAcolhimento++; }
                            if (sr.conteudo.evaluation.generalNotes.clareza !== null) { sumClareza += sr.conteudo.evaluation.generalNotes.clareza; countClareza++; }
                            if (sr.conteudo.evaluation.generalNotes.argumentacao !== null) { sumArgumentacao += sr.conteudo.evaluation.generalNotes.argumentacao; countArgumentacao++; }
                            if (sr.conteudo.evaluation.generalNotes.fechamento !== null) { sumFechamento += sr.conteudo.evaluation.generalNotes.fechamento; countFechamento++; }
                        }
                    }
                });
                userRow.simulationSuccessRate = (successfulSims / userSims.length) * 100;
                if (countAcolhimento > 0) userRow.simulationAverageAcolhimento = sumAcolhimento / countAcolhimento;
                if (countClareza > 0) userRow.simulationAverageClareza = sumClareza / countClareza;
                if (countArgumentacao > 0) userRow.simulationAverageArgumentacao = sumArgumentacao / countArgumentacao;
                if (countFechamento > 0) userRow.simulationAverageFechamento = sumFechamento / countFechamento;
            }
        });
        }
        return Array.from(dataMap.values()).filter(row => row.totalActivities > 0 || filters.collaboratorId !== 'all' || filters.period === 'allTime');

    } catch (error: any) {
        setFetchError(error.message || "Erro desconhecido ao processar dados do relatório.");
        return [];
    }
  }, [filters, usersList, kpis.quizTopicAnalysis]);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setGeneratedReportTitle(null); // Clear previous title
    setReportData([]); // Clear previous data
    const data = await processData();
    setReportData(data);
    
    const collaboratorName = filters.collaboratorId === 'all' ? 'Todos os Colaboradores' : usersList.find(u => u.id === filters.collaboratorId)?.name || filters.collaboratorId;
    const periodName = filters.period === 'allTime' ? 'Todo o Período' : filters.period === 'last7days' ? 'Últimos 7 Dias' : 'Últimos 30 Dias';
    const contentTypeName = filters.contentTypes.map(ct => ct === 'quizzes' ? 'Quizzes' : 'Simulações').join(' e ');
    setGeneratedReportTitle(`Relatório: ${collaboratorName} - ${contentTypeName} (${periodName})`);

    setIsLoading(false);
  }, [processData, filters, usersList]);

  useEffect(() => {
    if (reportData.length > 0 && chartRef.current && kpis.quizAverageScore && filters.contentTypes.includes('quizzes')) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx && (window as any).Chart) { // Ensure Chart is available
        const labels = reportData.map(d => d.userName);
        const dataValues = reportData.map(d => d.quizAverageScore !== null ? d.quizAverageScore : 0);
        
        chartInstanceRef.current = new (window as any).Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Média de Acertos em Quizzes (%)',
              data: dataValues,
              backgroundColor: 'rgba(var(--color-primary-rgb), 0.7)',
              borderColor: 'rgba(var(--color-primary-rgb), 1)',
              borderWidth: 1,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { color: 'var(--color-text-light)'}, grid: { color: 'var(--color-border)' } },
              x: { ticks: { color: 'var(--color-text-light)'}, grid: { display: false } }
            },
            plugins: { legend: { display: true, labels: { color: 'var(--color-text)' } } }
          }
        });
      }
    } else if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
    }
    return () => { 
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
    };
  }, [reportData, kpis.quizAverageScore, filters.contentTypes]);

  const getVisibleColumns = useMemo(() => {
    const columns = [{ key: 'userName', header: 'Colaborador' }];
    if (kpis.totalActivities) columns.push({ key: 'totalActivities', header: 'Total Ativ.' });
    if (filters.contentTypes.includes('quizzes')) {
        if (kpis.quizAttempts) columns.push({ key: 'quizAttempts', header: 'Tent. Quiz' });
        if (kpis.quizAverageScore) columns.push({ key: 'quizAverageScore', header: 'Média Quiz (%)' });
        if (kpis.quizHighestScore) columns.push({ key: 'quizHighestScore', header: 'Maior Nota Quiz (%)' });
        if (kpis.quizLowestScore) columns.push({ key: 'quizLowestScore', header: 'Menor Nota Quiz (%)' });
        if (kpis.quizTopicAnalysis) {
             columns.push({ key: 'strongQuizTopics', header: 'Tópicos Fortes (Quiz)' });
             columns.push({ key: 'challengingQuizTopics', header: 'Tópicos Desafiadores (Quiz)' });
        }
    }
    if (filters.contentTypes.includes('simulations')) {
        if (kpis.simulationAttempts) columns.push({ key: 'simulationAttempts', header: 'Tent. Simulação' });
        if (kpis.simulationSuccessRate) columns.push({ key: 'simulationSuccessRate', header: 'Sucesso Sim. (%)' });
        if (kpis.simulationSkillSummary && kpis.simulationAverageStars?.enabled) {
            if (kpis.simulationAverageStars.acolhimento) columns.push({ key: 'simulationAverageAcolhimento', header: 'Méd. Acolhimento' });
            if (kpis.simulationAverageStars.clareza) columns.push({ key: 'simulationAverageClareza', header: 'Méd. Clareza' });
            if (kpis.simulationAverageStars.argumentacao) columns.push({ key: 'simulationAverageArgumentacao', header: 'Méd. Argumentação' });
            if (kpis.simulationAverageStars.fechamento) columns.push({ key: 'simulationAverageFechamento', header: 'Méd. Fechamento' });
        }
    }
    return columns;
  }, [kpis, filters.contentTypes]);

  const exportToCSV = () => {
    const headers = getVisibleColumns.map(col => col.header).join(',');
    const rows = reportData.map(row => 
      getVisibleColumns.map(col => {
        const key = col.key as keyof ProcessedReportDataRow;
        let value = row[key];
        if (typeof value === 'number') value = value.toFixed(1);
        if (Array.isArray(value)) value = `"${value.join('; ')}"`; // Quote if array (for topics)
        return value !== null && value !== undefined ? value : '';
      }).join(',')
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_geniunm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!(window as any).jspdf || !(window as any).jspdf.jsPDF) {
        alert("Erro: Biblioteca jsPDF não carregada. Verifique o console.");
        return;
    }
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text(generatedReportTitle || "Relatório Geniunm", 14, 15);
    
    doc.setFontSize(10);
    let filterText = `Filtros: Colaborador: ${filters.collaboratorId === 'all' ? 'Todos' : usersList.find(u => u.id === filters.collaboratorId)?.name || filters.collaboratorId}, `;
    filterText += `Período: ${filters.period === 'allTime' ? 'Todo o Período' : filters.period === 'last7days' ? 'Últimos 7 Dias' : 'Últimos 30 Dias'}, `;
    filterText += `Conteúdo: ${filters.contentTypes.map(ct => ct === 'quizzes' ? 'Quizzes' : 'Simulações').join(' & ')}`;
    doc.text(filterText, 14, 22);

    const tableHeaders = getVisibleColumns.map(col => col.header);
    const tableBody = reportData.map(row => 
      getVisibleColumns.map(col => {
        const key = col.key as keyof ProcessedReportDataRow;
        let value = row[key];
        if (typeof value === 'number') return value.toFixed(1);
        if (Array.isArray(value)) return value.join('; ');
        return value !== null && value !== undefined ? String(value) : '';
      })
    );

    if (typeof (doc as any).autoTable !== 'function') {
        alert("Erro: Plugin jsPDF-AutoTable não carregado. Verifique o console.");
        return;
    }

    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableBody,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [229, 122, 68] }, 
      styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
      columnStyles: {
        userName: {cellWidth: 30},
        strongQuizTopics: {cellWidth: 40},
        challengingQuizTopics: {cellWidth: 40}
      }
    });

    if (chartRef.current && chartInstanceRef.current && kpis.quizAverageScore && filters.contentTypes.includes('quizzes')) {
        const chartImage = chartRef.current.toDataURL('image/png', 1.0);
        let yPos = (doc as any).lastAutoTable.finalY + 10;
        const chartWidth = 180;
        const chartHeight = (chartRef.current.height / chartRef.current.width) * chartWidth;
        if (yPos + chartHeight > doc.internal.pageSize.height -15) { 
            doc.addPage();
            yPos = 15;
        }
        doc.addImage(chartImage, 'PNG', 14, yPos, chartWidth, chartHeight);
    }
    
    doc.save('relatorio_geniunm.pdf');
  };

  if (isLoading && usersList.length === 0 && !fetchError) { 
    return <section id="reports" className="py-8"><LoadingSpinner text="Carregando dados para relatórios..." /></section>;
  }
  if (fetchError && usersList.length === 0) {
    return (
        <section id="reports" className="py-8">
            <GlassCard className="p-6 text-center">
                <h1 className="section-title !text-center text-[var(--error)]">Erro ao Carregar Dados Iniciais</h1>
                <p className="text-[var(--color-text)]">{fetchError}</p>
                <GlassButton onClick={() => window.location.reload()} className="mt-4">Recarregar Página</GlassButton>
            </GlassCard>
        </section>
    );
  }


  return (
    <section id="reports" className="py-8">
      <h1 className="section-title">Relatórios Gerenciais</h1>
      
      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Configurar Relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="collaboratorId" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Colaborador:</label>
            <select name="collaboratorId" id="collaboratorId" value={filters.collaboratorId} onChange={handleFilterChange} className="themed-input themed-select w-full">
              <option value="all">Todos os Colaboradores</option>
              {usersList.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Período:</label>
            <select name="period" id="period" value={filters.period} onChange={handleFilterChange} className="themed-input themed-select w-full">
              <option value="allTime">Todo o Período</option>
              <option value="last7days">Últimos 7 Dias</option>
              <option value="last30days">Últimos 30 Dias</option>
            </select>
          </div>
          <div>
            <span className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Tipo de Conteúdo:</span>
            <div className="flex flex-col space-y-1 mt-1">
              <CustomCheckbox name="quizzes" label="Quizzes" checked={filters.contentTypes.includes('quizzes')} onChange={handleFilterChange} />
              <CustomCheckbox name="simulations" label="Simulações" checked={filters.contentTypes.includes('simulations')} onChange={handleFilterChange} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-[var(--color-text-light)] mb-2">Selecionar KPIs/Colunas:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
            <CustomCheckbox name="totalActivities" label="Total de Atividades" checked={!!kpis.totalActivities} onChange={handleKpiChange}/>
            {filters.contentTypes.includes('quizzes') && (
              <>
                <CustomCheckbox name="quizAttempts" label="Tentativas de Quiz" checked={!!kpis.quizAttempts} onChange={handleKpiChange}/>
                <CustomCheckbox name="quizAverageScore" label="Média Quiz (%)" checked={!!kpis.quizAverageScore} onChange={handleKpiChange}/>
                <CustomCheckbox name="quizHighestScore" label="Maior Nota Quiz (%)" checked={!!kpis.quizHighestScore} onChange={handleKpiChange}/>
                <CustomCheckbox name="quizLowestScore" label="Menor Nota Quiz (%)" checked={!!kpis.quizLowestScore} onChange={handleKpiChange}/>
                <CustomCheckbox name="quizTopicAnalysis" label="Análise Tópicos Quiz" checked={!!kpis.quizTopicAnalysis} onChange={handleKpiChange}/>
              </>
            )}
            {filters.contentTypes.includes('simulations') && (
              <>
                <CustomCheckbox name="simulationAttempts" label="Tentativas de Simulação" checked={!!kpis.simulationAttempts} onChange={handleKpiChange}/>
                <CustomCheckbox name="simulationSuccessRate" label="Taxa Sucesso Sim. (%)" checked={!!kpis.simulationSuccessRate} onChange={handleKpiChange}/>
                <CustomCheckbox name="simulationSkillSummary" label="Resumo Habilidades Sim." checked={!!kpis.simulationSkillSummary} onChange={handleKpiChange}/>
                {kpis.simulationSkillSummary && (
                    <>
                        <CustomCheckbox name="simulationAverageStars.acolhimento" label="Méd. Acolhimento" checked={!!kpis.simulationAverageStars?.acolhimento} onChange={handleKpiChange} isSubItem disabled={!kpis.simulationAverageStars?.enabled} />
                        <CustomCheckbox name="simulationAverageStars.clareza" label="Méd. Clareza" checked={!!kpis.simulationAverageStars?.clareza} onChange={handleKpiChange} isSubItem disabled={!kpis.simulationAverageStars?.enabled} />
                        <CustomCheckbox name="simulationAverageStars.argumentacao" label="Méd. Argumentação" checked={!!kpis.simulationAverageStars?.argumentacao} onChange={handleKpiChange} isSubItem disabled={!kpis.simulationAverageStars?.enabled} />
                        <CustomCheckbox name="simulationAverageStars.fechamento" label="Méd. Fechamento" checked={!!kpis.simulationAverageStars?.fechamento} onChange={handleKpiChange} isSubItem disabled={!kpis.simulationAverageStars?.enabled} />
                    </>
                )}
              </>
            )}
          </div>
        </div>
        <GlassButton onClick={generateReport} disabled={isLoading} className="themed-button">
          {isLoading ? <LoadingSpinner size="sm" /> : <><i className="fas fa-cogs mr-2"></i>Gerar Relatório</>}
        </GlassButton>
         {fetchError && !isLoading && (
            <p className="text-[var(--error)] text-sm mt-3">{fetchError}</p>
        )}
      </GlassCard>

      {reportData.length > 0 && !isLoading && (
        <GlassCard className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-xl font-semibold text-[var(--color-primary)]">{generatedReportTitle || "Resultados do Relatório"}</h2>
            <div className="flex gap-2">
              <GlassButton onClick={exportToCSV} className="themed-button !text-sm !py-1.5 !px-3">
                <i className="fas fa-file-csv mr-1.5"></i>Exportar CSV
              </GlassButton>
              <GlassButton onClick={exportToPDF} className="themed-button !text-sm !py-1.5 !px-3">
                <i className="fas fa-file-pdf mr-1.5"></i>Exportar PDF
              </GlassButton>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar mb-6">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-input-bg)]">
                <tr>
                  {getVisibleColumns.map(col => <th key={col.key} scope="col" className="px-3 py-2 text-left font-medium text-[var(--color-text)]">{col.header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {reportData.map((row) => (
                  <tr key={row.userId} className="hover:bg-[var(--color-input-bg)] transition-colors">
                    {getVisibleColumns.map(col => {
                       const key = col.key as keyof ProcessedReportDataRow;
                       let value = row[key];
                       if (typeof value === 'number') value = value.toFixed(1);
                       if (Array.isArray(value)) value = value.join(', ');
                       return <td key={`${row.userId}-${col.key}`} className="px-3 py-2 text-[var(--color-text-light)] whitespace-nowrap">{value !== null && value !== undefined ? String(value) : 'N/A'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {kpis.quizAverageScore && filters.contentTypes.includes('quizzes') && (
              <div className="mt-6 h-64 md:h-80">
                  <canvas ref={chartRef}></canvas>
              </div>
          )}
        </GlassCard>
      )}
      {reportData.length === 0 && !isLoading && generatedReportTitle && !fetchError && (
         <GlassCard className="p-4 md:p-6 text-center">
            <p className="text-lg text-[var(--color-text-light)]">Nenhum dado encontrado para os filtros selecionados.</p>
        </GlassCard>
      )}
    </section>
  );
};

export default ReportsSection;
