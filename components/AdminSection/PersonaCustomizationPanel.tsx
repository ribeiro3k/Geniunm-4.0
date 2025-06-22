import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { GEMINI_SIMULATOR_PROMPT_TEMPLATE, CUSTOM_SIMULATOR_PROMPT_KEY, SUPABASE_ERROR_MESSAGE, TABLE_CONFIGURACOES_IA, GLOBAL_SIMULATOR_PROMPT_ID } from '../../constants';
import { supabase } from '../../lib/supabaseClient';

const PersonaCustomizationPanel: React.FC = () => {
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadPrompt = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    if (!supabase) {
        const localPrompt = localStorage.getItem(CUSTOM_SIMULATOR_PROMPT_KEY);
        const promptToUse = localPrompt || GEMINI_SIMULATOR_PROMPT_TEMPLATE;
        setCurrentPrompt(promptToUse);
        setEditingPrompt(promptToUse);
        setMessage({ type: 'error', text: `Supabase não configurado. O prompt será gerenciado localmente (menos seguro e não compartilhado). ${SUPABASE_ERROR_MESSAGE}` });
        setIsLoading(false);
        return;
    }

    try {
        const { data, error } = await supabase
            .from(TABLE_CONFIGURACOES_IA)
            .select('prompt_content')
            .eq('id', GLOBAL_SIMULATOR_PROMPT_ID)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: "Searched for a single row, but 0 rows were found"
            throw error;
        }
        const promptToUse = data?.prompt_content || GEMINI_SIMULATOR_PROMPT_TEMPLATE;
        setCurrentPrompt(promptToUse);
        setEditingPrompt(promptToUse);
        if (!data?.prompt_content) {
            setMessage({ type: 'info', text: 'Nenhum prompt customizado encontrado no Supabase. Usando prompt padrão. Você pode editar e salvar para criar um.' });
        }
    } catch (e: any) {
        setMessage({ type: 'error', text: `Erro ao carregar prompt do Supabase: ${e.message}. Usando prompt padrão.` });
        setCurrentPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
        setEditingPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  const handleEdit = () => {
    setEditingPrompt(currentPrompt);
    setIsEditing(true);
    setMessage(null);
  };

  const handleSave = async () => {
    if (editingPrompt.trim() === '') {
      setMessage({ type: 'error', text: 'O prompt não pode estar vazio.' });
      return;
    }
    if (!supabase) {
        // Fallback to localStorage if Supabase isn't configured
        localStorage.setItem(CUSTOM_SIMULATOR_PROMPT_KEY, editingPrompt);
        setCurrentPrompt(editingPrompt);
        setIsEditing(false);
        setMessage({ type: 'success', text: `Prompt salvo localmente (Supabase não configurado). ${SUPABASE_ERROR_MESSAGE}` });
        return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
        const { error } = await supabase
            .from(TABLE_CONFIGURACOES_IA)
            .upsert({ id: GLOBAL_SIMULATOR_PROMPT_ID, prompt_content: editingPrompt, updated_at: new Date().toISOString() }, { onConflict: 'id' });
        if (error) throw error;
        
        setCurrentPrompt(editingPrompt);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Prompt da IA do Simulador salvo com sucesso no Supabase!' });
        localStorage.removeItem(CUSTOM_SIMULATOR_PROMPT_KEY); // Remove old local storage item if it exists
    } catch (e: any) {
        setMessage({ type: 'error', text: `Erro ao salvar prompt no Supabase: ${e.message}` });
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditingPrompt(currentPrompt); 
    setIsEditing(false);
    setMessage(null);
  };

  const handleResetToDefault = async () => {
    if (window.confirm("Tem certeza que deseja redefinir o prompt para o padrão original? Esta ação removerá o prompt customizado do banco de dados (Supabase) e do armazenamento local (se existir).")) {
      setIsLoading(true);
      setMessage(null);
      
      if (supabase) {
        try {
          const { error } = await supabase
              .from(TABLE_CONFIGURACOES_IA)
              .delete()
              .eq('id', GLOBAL_SIMULATOR_PROMPT_ID);

          if (error && error.code !== 'PGRST116') { // PGRST116 means no row found, which is fine for delete.
               throw error;
          }
           setMessage({ type: 'success', text: 'Prompt da IA redefinido para o padrão com sucesso (configuração no Supabase removida)!' });
        } catch (e:any) {
          setMessage({ type: 'error', text: `Erro ao redefinir prompt no Supabase: ${e.message}. Tentando redefinir localmente.` });
        }
      } else {
         setMessage({ type: 'info', text: `Supabase não configurado. Redefinindo prompt localmente. ${SUPABASE_ERROR_MESSAGE}` });
      }
      
      localStorage.removeItem(CUSTOM_SIMULATOR_PROMPT_KEY);
      setCurrentPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
      setEditingPrompt(GEMINI_SIMULATOR_PROMPT_TEMPLATE);
      setIsEditing(false);
      // Append to existing message if Supabase operation happened
      if (message && message.type === 'success') {
         // message already set
      } else if (!message || message.type !== 'error') { // If no error from Supabase or Supabase not used
         setMessage({ type: 'success', text: 'Prompt da IA redefinido para o padrão com sucesso!' });
      }
      setIsLoading(false);
    }
  };


  if (isLoading && !currentPrompt) {
    return (
      <section id="persona-customization" className="py-8">
        <LoadingSpinner text="Carregando configurações do prompt..." />
      </section>
    );
  }

  return (
    <section id="persona-customization" className="py-8">
      <h1 className="section-title">Customizar IA do Simulador</h1>
      <p className="mb-6 text-[var(--color-text-light)] text-sm">
        Neste painel, você pode visualizar e alterar o prompt base que instrui a Inteligência Artificial
        utilizada nas simulações de vendas. Alterações aqui impactarão o comportamento e as avaliações da IA.
        {supabase ? " O prompt customizado é salvo no banco de dados (Supabase)." : " O prompt customizado será salvo localmente (Supabase não configurado)."}
      </p>

      {message && (
        <GlassCard className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-[rgba(var(--success-rgb),0.15)] text-[var(--success)] border-[rgba(var(--success-rgb),0.3)]' : message.type === 'error' ? 'bg-[rgba(var(--error-rgb),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb),0.3)]' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>
          {message.text}
        </GlassCard>
      )}

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-3 text-[var(--color-primary)]">Prompt Atual da IA do Simulador</h2>
        
        <div className="mb-4 p-3 bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-md max-h-[400px] overflow-y-auto custom-scrollbar">
          {isEditing ? (
            <textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              className="themed-textarea w-full min-h-[300px] text-xs leading-relaxed font-mono"
              rows={25}
              aria-label="Campo de edição do prompt da IA"
              disabled={isLoading}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-[var(--color-text-light)]">
              {currentPrompt}
            </pre>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {!isEditing ? (
            <GlassButton onClick={handleEdit} className="themed-button" disabled={isLoading}>
              <i className="fas fa-edit mr-2"></i>Editar Prompt
            </GlassButton>
          ) : (
            <>
              <GlassButton onClick={handleSave} className="themed-button !bg-[var(--success)] hover:!bg-[rgba(var(--success-rgb),0.8)] !border-[var(--success)]" disabled={isLoading}>
                {isLoading && isEditing ? <LoadingSpinner size="sm"/> : <><i className="fas fa-save mr-2"></i>Salvar Prompt</>}
              </GlassButton>
              <GlassButton onClick={handleCancel} className="themed-button !bg-gray-500 hover:!bg-gray-600 !border-gray-500" disabled={isLoading}>
                <i className="fas fa-times mr-2"></i>Cancelar Edição
              </GlassButton>
            </>
          )}
           <GlassButton 
            onClick={handleResetToDefault} 
            className="themed-button !bg-[rgba(var(--error-rgb),0.1)] !text-[var(--error)] hover:!bg-[rgba(var(--error-rgb),0.2)] !border-transparent"
            title="Redefinir prompt para o valor padrão do sistema"
            disabled={isLoading || (currentPrompt === GEMINI_SIMULATOR_PROMPT_TEMPLATE)} // Disabled if already default or loading
          >
             {isLoading && (!isEditing || currentPrompt !== GEMINI_SIMULATOR_PROMPT_TEMPLATE) ? <LoadingSpinner size="sm"/> : <><i className="fas fa-undo mr-2"></i>Redefinir para Padrão</>}
          </GlassButton>
        </div>
        {!supabase && (
            <p className="text-xs text-[var(--error)] mt-4">
              <strong>Atenção:</strong> {SUPABASE_ERROR_MESSAGE} As alterações no prompt serão salvas apenas localmente neste navegador e não serão compartilhadas.
            </p>
        )}
        <p className="text-xs text-[var(--color-text-light)] mt-4">
          <strong>Lembre-se:</strong> Modificar este prompt pode alterar significativamente o comportamento da IA. 
          Use as variáveis (ex: <code>{'{SCENARIO_TITLE}'}</code>, <code>{'{BEHAVIORAL_PROFILE}'}</code>) conforme documentado no prompt original
          para garantir que a IA receba o contexto correto da simulação.
        </p>
      </GlassCard>
    </section>
  );
};

export default PersonaCustomizationPanel;
