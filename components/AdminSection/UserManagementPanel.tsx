
import React, { useState, useEffect, useCallback } from 'react';
import { NewUserCredentials } from '../../types'; 
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner'; 
import { TABLE_USUARIOS } from '../../constants';
import { supabase } from '../../lib/supabaseClient';

interface UserManagementPanelProps {
  // onUserListChange: () => void; // This was for a simple user system, can be adapted for Supabase
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ /*onUserListChange*/ }) => {
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([]); 
  const [newSupabaseUser, setNewSupabaseUser] = useState<Omit<NewUserCredentials, 'senhaPlainText'> & { senhaPlainText: string }>({
    nome: '', email: '', senhaPlainText: '', tipo: 'consultor'
  });
  // const [editingSupabaseUser, setEditingSupabaseUser] = useState<any | null>(null); // Placeholder for future edit functionality
  const [showSupabasePassword, setShowSupabasePassword] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const fetchSupabaseUsers = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase.from(TABLE_USUARIOS).select('*').order('nome', { ascending: true });
    if (error) {
      setMessage({ type: 'error', text: `Erro ao carregar usuários: ${error.message}` });
    } else {
      setSupabaseUsers(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSupabaseUsers();
  }, [fetchSupabaseUsers]);


  const handleNewSupabaseUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSupabaseUser(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleCreateSupabaseUser = async () => {
    if (!supabase) {
        setMessage({type: 'error', text: 'Supabase não configurado.'});
        return;
    }
    setMessage(null);
    if (!newSupabaseUser.email.trim() || !newSupabaseUser.nome.trim() || !newSupabaseUser.senhaPlainText.trim()) {
      setMessage({ type: 'error', text: 'Nome, email e senha são obrigatórios.' });
      return;
    }
    if (newSupabaseUser.senhaPlainText.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setIsLoading(true);
    
    // 1. Create Supabase Auth user. The trigger 'on_auth_user_created' 
    //    will then call 'handle_new_user' function to insert into 'public.usuarios'.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newSupabaseUser.email,
      password: newSupabaseUser.senhaPlainText,
      options: {
        data: { // These will be available in the trigger via NEW.raw_user_meta_data
          nome_completo: newSupabaseUser.nome,
          tipo_usuario: newSupabaseUser.tipo,
          // avatar_url: 'URL_PADRAO_AQUI_SE_QUISER' // Opcional: pode adicionar um avatar padrão
        }
      }
    });

    setIsLoading(false);

    if (authError || !authData.user) {
        if (authError && authError.message.includes("User already registered")) {
             setMessage({ type: 'error', text: `Este email (${newSupabaseUser.email}) já está registrado no sistema de autenticação. Se o usuário não aparece na lista abaixo, pode ter ocorrido uma falha na criação automática do perfil via trigger. Verifique os logs da função no Supabase.` });
        } else {
            setMessage({ type: 'error', text: `Erro ao registrar usuário na autenticação: ${authError?.message || 'Usuário não criado na autenticação.'}` });
        }
      return;
    }

    // Se chegou aqui, o signUp na auth.users foi bem-sucedido.
    // O trigger 'on_auth_user_created' e a função 'handle_new_user' no Supabase
    // devem ter cuidado da inserção na tabela 'public.usuarios'.
    
    // Não precisamos mais da verificação de perfil existente nem da inserção manual aqui.
    // O sistema de autenticação do Supabase já lida com emails duplicados.
    // O trigger deve inserir na tabela 'usuarios' ou falhar (e a falha pode ser vista nos logs do Supabase).

    setMessage({ type: 'success', text: `Usuário "${newSupabaseUser.nome}" registrado. O perfil deve ter sido criado automaticamente. Verifique a lista.` });
    setNewSupabaseUser({ nome: '', email: '', senhaPlainText: '', tipo: 'consultor' });
    
    // Aguardar um pouco para dar tempo ao trigger de executar antes de recarregar a lista.
    // Idealmente, você não precisaria disso se o trigger for síncrono, mas para UI pode ser bom.
    setTimeout(() => {
        fetchSupabaseUsers(); // Atualiza a lista para mostrar o novo usuário
    }, 1000); // Ajuste o tempo se necessário

  };
  
  const handleDeleteSupabaseUser = async (userId: string, userEmail: string | undefined) => {
    if (!supabase) {
        setMessage({type: 'error', text: 'Supabase não configurado.'});
        return;
    }
    // Lembrete: A exclusão completa (auth + tabela) idealmente é feita por uma função de backend.
    // Esta função no cliente só remove da tabela 'usuarios'.
    if (!window.confirm(`Tem certeza que deseja excluir o perfil do usuário "${userEmail || userId}" da tabela 'usuarios'? Esta ação NÃO removerá o usuário do sistema de autenticação do Supabase (tabela auth.users). Para remoção completa, use o painel do Supabase ou uma função de backend apropriada.`)) {
      return;
    }
    setMessage(null);
    setIsLoading(true);

    const { error: dbError } = await supabase.from(TABLE_USUARIOS).delete().eq('id', userId);

    if (dbError) {
      setMessage({ type: 'error', text: `Erro ao excluir perfil da tabela 'usuarios': ${dbError.message}` });
    } else {
      setMessage({ type: 'success', text: `Perfil do usuário com ID "${userId}" excluído da tabela 'usuarios'. Lembre-se de verificar o sistema de autenticação do Supabase.` });
      fetchSupabaseUsers(); // Refresh list
    }
    setIsLoading(false);
  };


  return (
    <section id="user-management-panel" className="py-8">
      <h1 className="section-title">Gerenciamento de Usuários (Supabase)</h1>

      {message && (
        <GlassCard className={`p-3 mb-6 text-sm ${message.type === 'success' ? 'bg-[rgba(var(--success-rgb),0.15)] text-[var(--success)] border-[rgba(var(--success-rgb),0.3)]' : 'bg-[rgba(var(--error-rgb),0.15)] text-[var(--error)] border-[rgba(var(--error-rgb),0.3)]'}`}>
          {message.text}
        </GlassCard>
      )}

      <GlassCard className="mb-8 p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Criar Novo Usuário</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-supabase-nome" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nome Completo:</label>
            <input type="text" id="new-supabase-nome" name="nome" value={newSupabaseUser.nome} onChange={handleNewSupabaseUserChange} className="themed-input w-full" placeholder="Ex: João Silva"/>
          </div>
          <div>
            <label htmlFor="new-supabase-email" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Email:</label>
            <input type="email" id="new-supabase-email" name="email" value={newSupabaseUser.email} onChange={handleNewSupabaseUserChange} className="themed-input w-full" placeholder="Ex: joao.silva@email.com"/>
          </div>
          <div>
            <label htmlFor="new-supabase-password" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Senha:</label>
            <div className="relative">
              <input type={showSupabasePassword ? "text" : "password"} id="new-supabase-password" name="senhaPlainText" value={newSupabaseUser.senhaPlainText} onChange={handleNewSupabaseUserChange} className="themed-input w-full pr-10" placeholder="Mínimo 6 caracteres"/>
              <button type="button" onClick={() => setShowSupabasePassword(!showSupabasePassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]" aria-label={showSupabasePassword ? "Esconder senha" : "Mostrar senha"}>
                <i className={`fas ${showSupabasePassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="new-supabase-tipo" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Tipo de Usuário:</label>
            <select name="tipo" id="new-supabase-tipo" value={newSupabaseUser.tipo} onChange={handleNewSupabaseUserChange} className="themed-input themed-select w-full">
              <option value="consultor">Consultor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <GlassButton onClick={handleCreateSupabaseUser} className="themed-button" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : <><i className="fas fa-plus mr-2"></i>Criar Usuário</>}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Lista de Usuários Cadastrados</h2>
        {isLoading && supabaseUsers.length === 0 && <LoadingSpinner text="Carregando usuários..." />}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-input-bg)]">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Nome</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Email</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Tipo</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">ID (Supabase)</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {supabaseUsers.map(user => (
                <tr key={user.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                  <td className="px-3 py-2 text-[var(--color-text-light)]">{user.nome}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)]">{user.email}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] capitalize">{user.tipo}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)] text-xs">{user.id}</td>
                  <td className="px-3 py-2 text-[var(--color-text-light)]">
                    <GlassButton 
                        onClick={() => handleDeleteSupabaseUser(user.id, user.email)} 
                        className="!text-xs !py-1 !px-2 !bg-[rgba(var(--error-rgb),0.1)] !text-[var(--error)] hover:!bg-[rgba(var(--error-rgb),0.2)] !border-transparent"
                        disabled={isLoading}
                        title="Excluir perfil do usuário da tabela 'usuarios'. A exclusão da autenticação é manual."
                    >
                      <i className="fas fa-trash-alt mr-1"></i>Excluir Perfil
                    </GlassButton>
                    {/* TODO: Add edit functionality for nome/tipo. Password reset would typically be handled by Supabase Auth UI or admin functions. */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && supabaseUsers.length === 0 && (
            <p className="text-sm text-[var(--color-text-light)] italic text-center py-4">Nenhum usuário cadastrado encontrado na tabela 'usuarios'.</p>
        )}
      </GlassCard>
    </section>
  );
};

export default UserManagementPanel;
