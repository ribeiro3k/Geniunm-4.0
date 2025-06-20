
import React, { useState, useEffect, useCallback } from 'react';
import { AppUser, NewUserCredentials } from '../../types'; 
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner'; 
import { supabase } from '../../lib/supabaseClient';
import { TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from '../../constants';

const UserManagementPanel: React.FC = () => {
  const [consultantUsers, setConsultantUsers] = useState<AppUser[]>([]); 
  const [newConsultant, setNewConsultant] = useState<Omit<NewUserCredentials, 'tipo'>>({
    nome: '', email: '', senhaPlainText: ''
  });
  
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newPasswordForEdit, setNewPasswordForEdit] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);

  const loadConsultantUsers = useCallback(async () => {
    if (!supabase) {
      setMessage({ type: 'error', text: `Erro ao carregar usuários: ${SUPABASE_ERROR_MESSAGE}` });
      setIsFetchingUsers(false);
      return;
    }
    setIsFetchingUsers(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from(TABLE_USUARIOS)
        .select('id, nome, email, tipo, criado_em') // Removido avatarUrl da seleção
        .eq('tipo', 'consultor')
        .order('nome', { ascending: true });

      if (error) throw error;
      setConsultantUsers(data || []);
    } catch (error: any) {
      setMessage({type: 'error', text: `Erro ao carregar usuários do Supabase: ${error.message}`});
      setConsultantUsers([]);
    }
    setIsFetchingUsers(false);
  }, []);

  useEffect(() => {
    loadConsultantUsers();
  }, [loadConsultantUsers]);


  const handleNewConsultantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConsultant(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleCreateConsultant = async () => {
    setMessage(null);
    if (!newConsultant.nome.trim() || !newConsultant.senhaPlainText.trim()) {
      setMessage({ type: 'error', text: 'Nome de usuário e senha são obrigatórios.' });
      return;
    }
    if (newConsultant.senhaPlainText.length < 4) { 
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (consultantUsers.some(u => u.nome.toLowerCase() === newConsultant.nome.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Este nome de usuário já existe.' });
      return;
    }
    if (newConsultant.email && consultantUsers.some(u => u.email?.toLowerCase() === newConsultant.email?.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Este email já está em uso.' });
      return;
    }
     if (!supabase) {
      setMessage({ type: 'error', text: `Erro ao criar usuário: ${SUPABASE_ERROR_MESSAGE}` });
      return;
    }

    setIsLoading(true);
    try {
      const userToInsert = {
        nome: newConsultant.nome.trim(),
        password: newConsultant.senhaPlainText, // ATENÇÃO: SENHA EM TEXTO PLANO!
        email: newConsultant.email?.trim() || null,
        tipo: 'consultor' as 'consultor',
        // avatarUrl não é mais incluído
      };

      const { error: insertError } = await supabase
        .from(TABLE_USUARIOS)
        .insert(userToInsert);

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: `Consultor "${userToInsert.nome}" criado com sucesso no Supabase!` });
      setNewConsultant({ nome: '', email: '', senhaPlainText: '' });
      loadConsultantUsers(); // Recarregar a lista
    } catch (error: any) {
      setMessage({ type: 'error', text: `Falha ao salvar usuário no Supabase: ${error.message}. Verifique se o nome/email já existe ou se há problemas de permissão (RLS).` });
    }
    setIsLoading(false);
  };
  
  const handleDeleteConsultant = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o consultor "${userName}"? Esta ação removerá o usuário do Supabase e não pode ser desfeita.`)) {
      return;
    }
    if (!supabase) {
      setMessage({ type: 'error', text: `Erro ao excluir usuário: ${SUPABASE_ERROR_MESSAGE}` });
      return;
    }
    setMessage(null);
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from(TABLE_USUARIOS)
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      setMessage({ type: 'success', text: `Consultor "${userName}" excluído com sucesso do Supabase.` });
      loadConsultantUsers(); // Recarregar a lista
      if (editingUser?.id === userId) {
        setEditingUser(null);
        setNewPasswordForEdit('');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Falha ao excluir usuário do Supabase: ${error.message}` });
    }
    setIsLoading(false);
  };

  const handleStartEditPassword = (user: AppUser) => {
    setEditingUser(user);
    setNewPasswordForEdit('');
    setMessage(null);
  };

  const handleCancelEditPassword = () => {
    setEditingUser(null);
    setNewPasswordForEdit('');
  };

  const handleConfirmEditPassword = async () => {
    if (!editingUser || !newPasswordForEdit.trim()) {
        setMessage({ type: 'error', text: 'Nova senha não pode ser vazia.' });
        return;
    }
    if (newPasswordForEdit.length < 4) {
        setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 4 caracteres.' });
        return;
    }
    if (!supabase) {
      setMessage({ type: 'error', text: `Erro ao atualizar senha: ${SUPABASE_ERROR_MESSAGE}` });
      return;
    }
    setIsLoading(true);
    try {
        const { error: updateError } = await supabase
          .from(TABLE_USUARIOS)
          .update({ password: newPasswordForEdit }) // ATENÇÃO: SENHA EM TEXTO PLANO!
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        
        setMessage({ type: 'success', text: `Senha do consultor "${editingUser.nome}" atualizada no Supabase!` });
        setEditingUser(null);
        setNewPasswordForEdit('');
        // Não precisa recarregar a lista aqui, pois a senha não é exibida.
    } catch (error: any) {
        setMessage({ type: 'error', text: `Falha ao atualizar senha no Supabase: ${error.message}` });
    }
    setIsLoading(false);
  };

  return (
    <section id="user-management-panel" className="py-8">
      <h1 className="section-title">Gerenciamento de Usuários (Consultores)</h1>
      <p className="mb-4 text-sm text-[var(--color-text-light)]">
        Crie e gerencie os usuários consultores da plataforma. Os dados são salvos no Supabase.
        <br />
        <strong className="text-[var(--error)]">ATENÇÃO: As senhas estão sendo salvas em texto plano no Supabase. Para produção, implemente hashing seguro URGENTEMENTE!</strong>
      </p>

      {message && (
        <GlassCard className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-[rgba(var(--success-rgb),0.15)] text-[var(--success)] border-[rgba(var(--success-rgb),0.3)]' : 'bg-[rgba(var(--error-rgb),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb),0.3)]'}`}>
          {message.text}
        </GlassCard>
      )}

      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Criar Novo Consultor</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-consultant-username" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nome do Consultor (Login):</label>
            <input type="text" id="new-consultant-username" name="nome" value={newConsultant.nome} onChange={handleNewConsultantChange} className="themed-input w-full" placeholder="Ex: Consultor Silva (será o login)"/>
          </div>
          <div>
            <label htmlFor="new-consultant-email" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Email (Opcional):</label>
            <input type="email" id="new-consultant-email" name="email" value={newConsultant.email || ''} onChange={handleNewConsultantChange} className="themed-input w-full" placeholder="consultor.silva@email.com"/>
          </div>
          <div>
            <label htmlFor="new-consultant-password" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Senha:</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} id="new-consultant-password" name="senhaPlainText" value={newConsultant.senhaPlainText} onChange={handleNewConsultantChange} className="themed-input w-full pr-10" placeholder="Mínimo 4 caracteres"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]" aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}>
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <GlassButton onClick={handleCreateConsultant} className="themed-button" disabled={isLoading || isFetchingUsers}>
            {isLoading ? <LoadingSpinner size="sm" /> : <><i className="fas fa-plus mr-2"></i>Criar Consultor</>}
          </GlassButton>
        </div>
      </GlassCard>

      {editingUser && (
        <GlassCard className="my-8 p-4 md:p-6 border-2 border-[var(--color-primary)]">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Alterar Senha de "{editingUser.nome}"</h2>
            <div>
                <label htmlFor="edit-consultant-password" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nova Senha:</label>
                <div className="relative mb-3">
                <input type={showEditPassword ? "text" : "password"} id="edit-consultant-password" value={newPasswordForEdit} onChange={(e) => setNewPasswordForEdit(e.target.value)} className="themed-input w-full pr-10" placeholder="Mínimo 4 caracteres"/>
                <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]" aria-label={showEditPassword ? "Esconder senha" : "Mostrar senha"}>
                    <i className={`fas ${showEditPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
                </div>
                <div className="flex gap-3">
                    <GlassButton onClick={handleConfirmEditPassword} className="themed-button !bg-[var(--success)] hover:!bg-[rgba(var(--success-rgb),0.8)] !border-[var(--success)]" disabled={isLoading}>
                        {isLoading ? <LoadingSpinner size="sm" /> : "Confirmar Nova Senha"}
                    </GlassButton>
                    <GlassButton onClick={handleCancelEditPassword} className="themed-button !bg-gray-500 hover:!bg-gray-600 !border-gray-500" disabled={isLoading}>
                        Cancelar
                    </GlassButton>
                </div>
            </div>
        </GlassCard>
      )}

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Lista de Consultores Cadastrados (Supabase)</h2>
        {isFetchingUsers && <LoadingSpinner text="Carregando consultores do Supabase..." />}
        {!isFetchingUsers && consultantUsers.length === 0 && !message?.text.includes('Erro ao carregar usuários') && (
            <p className="text-sm text-[var(--color-text-light)] italic text-center py-4">Nenhum consultor cadastrado no Supabase.</p>
        )}
        {!isFetchingUsers && consultantUsers.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
              <thead className="bg-[var(--color-input-bg)]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Nome (Login)</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">ID Supabase</th>
                  <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {consultantUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                    <td className="px-3 py-2 text-[var(--color-text-light)]">{user.nome}</td>
                    <td className="px-3 py-2 text-[var(--color-text-light)]">{user.email || 'N/A'}</td>
                    <td className="px-3 py-2 text-[var(--color-text-light)] text-xs">{user.id}</td>
                    <td className="px-3 py-2 text-[var(--color-text-light)] space-x-2">
                      <GlassButton 
                          onClick={() => handleStartEditPassword(user)} 
                          className="!text-xs !py-1 !px-2 !bg-[rgba(var(--color-accent-rgb),0.15)] !text-[var(--color-accent)] hover:!bg-[rgba(var(--color-accent-rgb),0.25)] !border-transparent"
                          disabled={isLoading || !!editingUser}
                      >
                        <i className="fas fa-key mr-1"></i>Alterar Senha
                      </GlassButton>
                      <GlassButton 
                          onClick={() => handleDeleteConsultant(user.id, user.nome)} 
                          className="!text-xs !py-1 !px-2 !bg-[rgba(var(--error-rgb),0.1)] !text-[var(--error)] hover:!bg-[rgba(var(--error-rgb),0.2)] !border-transparent"
                          disabled={isLoading || !!editingUser}
                      >
                        <i className="fas fa-trash-alt mr-1"></i>Excluir
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </section>
  );
};

export default UserManagementPanel;
