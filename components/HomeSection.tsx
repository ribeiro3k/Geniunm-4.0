
import React, { useState, useEffect, useCallback } from 'react';
import { SimpleUserCredentials, AppUser } from '../../types'; 
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner'; 
import { LOCAL_STORAGE_CONSULTANT_USERS_KEY } from '../../constants';

const UserManagementPanel: React.FC = () => {
  const [consultantUsers, setConsultantUsers] = useState<AppUser[]>([]); 
  const [newConsultant, setNewConsultant] = useState<Omit<SimpleUserCredentials, 'id' | 'tipo'>>({
    username: '', passwordPlainText: ''
  });
  
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newPasswordForEdit, setNewPasswordForEdit] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadConsultantUsers = useCallback(() => {
    setIsLoading(true);
    try {
      const storedUsersRaw = localStorage.getItem(LOCAL_STORAGE_CONSULTANT_USERS_KEY);
      const users: AppUser[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      users.sort((a, b) => a.nome.localeCompare(b.nome));
      setConsultantUsers(users);
    } catch (error) {
      setMessage({type: 'error', text: 'Erro ao carregar usuários do localStorage.'});
      setConsultantUsers([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConsultantUsers();
  }, [loadConsultantUsers]);


  const handleNewConsultantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConsultant(prev => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleCreateConsultant = () => {
    setMessage(null);
    if (!newConsultant.username.trim() || !newConsultant.passwordPlainText.trim()) {
      setMessage({ type: 'error', text: 'Nome de usuário e senha são obrigatórios.' });
      return;
    }
    if (newConsultant.passwordPlainText.length < 4) { // Simple password requirement for local
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (consultantUsers.some(u => u.nome.toLowerCase() === newConsultant.username.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Este nome de usuário já existe.' });
      return;
    }

    setIsLoading(true);
    try {
      const newUserToAdd: AppUser = {
        id: `local_${newConsultant.username.trim().toLowerCase()}_${Date.now()}`,
        nome: newConsultant.username.trim(),
        password: newConsultant.passwordPlainText, // Storing password directly for local auth
        tipo: 'consultor',
      };
      const updatedUsers = [...consultantUsers, newUserToAdd];
      localStorage.setItem(LOCAL_STORAGE_CONSULTANT_USERS_KEY, JSON.stringify(updatedUsers));
      setConsultantUsers(updatedUsers.sort((a, b) => a.nome.localeCompare(b.nome)));
      setMessage({ type: 'success', text: `Consultor "${newUserToAdd.nome}" criado com sucesso!` });
      setNewConsultant({ username: '', passwordPlainText: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Falha ao salvar usuário no localStorage.' });
    }
    setIsLoading(false);
  };
  
  const handleDeleteConsultant = (userId: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o consultor? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setMessage(null);
    setIsLoading(true);
    try {
      const updatedUsers = consultantUsers.filter(user => user.id !== userId);
      localStorage.setItem(LOCAL_STORAGE_CONSULTANT_USERS_KEY, JSON.stringify(updatedUsers));
      setConsultantUsers(updatedUsers);
      setMessage({ type: 'success', text: `Consultor excluído com sucesso.` });
      if (editingUser?.id === userId) {
        setEditingUser(null);
        setNewPasswordForEdit('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Falha ao excluir usuário do localStorage.' });
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

  const handleConfirmEditPassword = () => {
    if (!editingUser || !newPasswordForEdit.trim()) {
        setMessage({ type: 'error', text: 'Nova senha não pode ser vazia.' });
        return;
    }
    if (newPasswordForEdit.length < 4) {
        setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 4 caracteres.' });
        return;
    }
    setIsLoading(true);
    try {
        const updatedUsers = consultantUsers.map(u => 
            u.id === editingUser.id ? { ...u, password: newPasswordForEdit } : u
        );
        localStorage.setItem(LOCAL_STORAGE_CONSULTANT_USERS_KEY, JSON.stringify(updatedUsers));
        setConsultantUsers(updatedUsers.sort((a, b) => a.nome.localeCompare(b.nome)));
        setMessage({ type: 'success', text: `Senha do consultor "${editingUser.nome}" atualizada!` });
        setEditingUser(null);
        setNewPasswordForEdit('');
    } catch (error) {
        setMessage({ type: 'error', text: 'Falha ao atualizar senha no localStorage.' });
    }
    setIsLoading(false);
  };

  return (
    <section id="user-management-panel" className="py-8">
      <h1 className="section-title">Gerenciamento de Usuários (Consultores)</h1>
      <p className="mb-4 text-sm text-[var(--color-text-light)]">
        Crie e gerencie os usuários consultores da plataforma. As senhas são armazenadas localmente.
        <strong className="text-[var(--error)]"> Atenção: Este método de armazenamento de senhas é inseguro e não recomendado para produção.</strong>
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
            <label htmlFor="new-consultant-username" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nome do Consultor:</label>
            <input type="text" id="new-consultant-username" name="username" value={newConsultant.username} onChange={handleNewConsultantChange} className="themed-input w-full" placeholder="Ex: Consultor Silva"/>
          </div>
          <div>
            <label htmlFor="new-consultant-password" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Senha:</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} id="new-consultant-password" name="passwordPlainText" value={newConsultant.passwordPlainText} onChange={handleNewConsultantChange} className="themed-input w-full pr-10" placeholder="Mínimo 4 caracteres"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--color-text-light)] hover:text-[var(--color-primary)]" aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}>
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <GlassButton onClick={handleCreateConsultant} className="themed-button" disabled={isLoading}>
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
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Lista de Consultores Cadastrados</h2>
        {isLoading && consultantUsers.length === 0 && <LoadingSpinner text="Carregando consultores..." />}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-input-bg)]">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Nome</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">ID Local</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {consultantUsers.map(user => (
                <tr key={user.id} className="hover:bg-[var(--color-input-bg)] transition-colors">
                  <td className="px-3 py-2 text-[var(--color-text-light)]">{user.nome}</td>
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
                        onClick={() => handleDeleteConsultant(user.id)} 
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
        {!isLoading && consultantUsers.length === 0 && (
            <p className="text-sm text-[var(--color-text-light)] italic text-center py-4">Nenhum consultor cadastrado.</p>
        )}
      </GlassCard>
    </section>
  );
};

export default UserManagementPanel;
