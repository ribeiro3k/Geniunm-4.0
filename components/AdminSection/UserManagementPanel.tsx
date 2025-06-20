
import React, { useState, useEffect, useCallback } from 'react';
import { SimpleUserCredentials, QuizAttemptRecord, SimulationRecord, NewUserCredentials } from '../../types'; // Ensured SimpleUserCredentials is imported
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { 
    LOCAL_STORAGE_SIMPLE_USERS_KEY, 
    LOCAL_STORAGE_SIMPLE_USERS_CREDENTIALS_KEY, 
    BASE_SIMPLE_USER_NAMES,
    DEFAULT_SIMPLE_USER_PASSWORD,
    LOCAL_STORAGE_QUIZ_ATTEMPTS_KEY,
    LOCAL_STORAGE_SIMULATION_RECORDS_KEY,
    LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX,
    TABLE_USUARIOS, // For potential future Supabase integration
} from '../../constants';
import { supabase } from '../../lib/supabaseClient'; // For potential future Supabase integration

interface UserManagementPanelProps {
  // onUserListChange: () => void; // This was for a simple user system, can be adapted for Supabase
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ /*onUserListChange*/ }) => {
  // For Supabase users (NewUserCredentials type)
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([]); // Use a more specific type if available or define one
  const [newSupabaseUser, setNewSupabaseUser] = useState<Omit<NewUserCredentials, 'senhaPlainText'> & { senhaPlainText: string }>({
    nome: '', email: '', senhaPlainText: '', tipo: 'consultor'
  });
  const [editingSupabaseUser, setEditingSupabaseUser] = useState<any | null>(null);
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
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newSupabaseUser.email,
      password: newSupabaseUser.senhaPlainText,
    });

    if (authError || !authData.user) {
      setMessage({ type: 'error', text: `Erro ao criar usuário na autenticação: ${authError?.message || 'Usuário não criado.'}` });
      setIsLoading(false);
      return;
    }

    // 2. Insert into 'usuarios' table
    const { error: dbError } = await supabase
      .from(TABLE_USUARIOS)
      .insert({
        id: authData.user.id, // Use the ID from the auth user
        nome: newSupabaseUser.nome,
        email: newSupabaseUser.email,
        tipo: newSupabaseUser.tipo,
        // avatarUrl can be added later or set to a default
      });

    if (dbError) {
      // Potentially roll back auth user creation or mark for cleanup
      setMessage({ type: 'error', text: `Erro ao salvar dados do usuário no banco: ${dbError.message}. O usuário foi criado na autenticação, mas pode não estar funcional.` });
    } else {
      setMessage({ type: 'success', text: `Usuário "${newSupabaseUser.nome}" criado com sucesso!` });
      setNewSupabaseUser({ nome: '', email: '', senhaPlainText: '', tipo: 'consultor' });
      fetchSupabaseUsers(); // Refresh list
    }
    setIsLoading(false);
  };
  
  const handleDeleteSupabaseUser = async (userId: string, userEmail: string | undefined) => {
    if (!supabase) {
        setMessage({type: 'error', text: 'Supabase não configurado.'});
        return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o usuário com email "${userEmail || userId}"? Esta ação é IRREVERSÍVEL e removerá o usuário da autenticação e do banco de dados.`)) {
      return;
    }
    setMessage(null);
    setIsLoading(true);

    // Note: Supabase Admin client needed to delete users by ID directly.
    // This example assumes we might not have admin client setup in frontend.
    // Deleting from 'usuarios' table first. Auth user deletion might require server-side logic or manual cleanup if not using admin client.
    // For a full solution, an Edge Function callable by an admin would handle both.

    const { error: dbError } = await supabase.from(TABLE_USUARIOS).delete().eq('id', userId);

    if (dbError) {
      setMessage({ type: 'error', text: `Erro ao excluir usuário do banco de dados: ${dbError.message}` });
    } else {
      // Ideally, also delete from supabase.auth.users here if an admin client is available.
      // For now, we'll assume it needs to be handled separately or this panel is for managing 'usuarios' table entries mainly.
      // We can try to sign out the user if they happen to be the current user, though an admin typically wouldn't delete themselves.
      setMessage({ type: 'success', text: `Usuário (registro em 'usuarios') com ID "${userId}" excluído. A remoção da autenticação pode precisar de ação manual ou via backend.` });
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
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Criar Novo Usuário (Supabase)</h2>
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
            {isLoading ? <LoadingSpinner size="sm" /> : <><i className="fas fa-plus mr-2"></i>Criar Usuário Supabase</>}
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Lista de Usuários (Supabase)</h2>
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
                    >
                      <i className="fas fa-trash-alt mr-1"></i>Excluir
                    </GlassButton>
                    {/* TODO: Add edit functionality, possibly password reset */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && supabaseUsers.length === 0 && (
            <p className="text-sm text-[var(--color-text-light)] italic text-center py-4">Nenhum usuário Supabase encontrado.</p>
        )}
      </GlassCard>
    </section>
  );
};

export default UserManagementPanel;
