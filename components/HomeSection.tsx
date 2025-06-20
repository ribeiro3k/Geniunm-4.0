
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from './ui/GlassCard'; 
import GlassButton from './ui/GlassButton';
import { CurrentUserType, NavigationSection, NavItem } from '../types';
import { NAV_ITEMS } from '../constants';
import LoadingSpinner from './ui/LoadingSpinner';

interface HomeSectionProps {
  currentUser: CurrentUserType;
  onLogin: (usernameOrAdminKeyword: string, passwordPlainText: string, isTryingAdminLogin: boolean) => Promise<string | null>;
  authError: string | null;
  isLoadingAuth: boolean;
  setAuthError: (error: string | null) => void;
}

type LoginMode = 'consultor' | 'admin';

const HomeSection: React.FC<HomeSectionProps> = ({ 
  currentUser, 
  onLogin,
  authError, 
  isLoadingAuth,
  setAuthError
}) => {
  const [loginMode, setLoginMode] = useState<LoginMode>('consultor');
  const [consultantName, setConsultantName] = useState('');
  const [password, setPassword] = useState('');
  const [showAccessInfo, setShowAccessInfo] = useState(false);
  
  const handleLoginAttempt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const usernameOrAdminKeyword = loginMode === 'admin' ? 'admin_fixed_user' : consultantName;
    const errorMsg = await onLogin(usernameOrAdminKeyword, password, loginMode === 'admin');
    
    if (!errorMsg) { 
      setConsultantName('');
      setPassword('');
    }
  };

  if (!currentUser) {
    return (
      <section id="login-home" className="py-8 flex-grow flex items-center justify-center w-full">
        <GlassCard className="p-6 md:p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Geniunm Logo" className="w-20 h-20 mx-auto mb-3" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <h2 className="font-display text-3xl md:text-4xl text-[var(--color-primary)] mb-1">Bem-vindo(a)</h2>
            <p className="text-[var(--color-text-light)] text-sm">
              Plataforma de Treinamento Geniunm.
            </p>
          </div>

          <div className="mb-4 flex border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              onClick={() => { setLoginMode('consultor'); setAuthError(null); setPassword(''); }}
              className={`flex-1 py-2 px-3 text-sm transition-colors duration-150
                ${loginMode === 'consultor' ? 'bg-[var(--color-primary)] text-white font-medium shadow-inner' : 'bg-[var(--color-input-bg)] text-[var(--color-text-light)] hover:bg-[var(--color-border)]'}`}
            >
              Sou Consultor
            </button>
            <button
              onClick={() => { setLoginMode('admin'); setAuthError(null); setPassword(''); }}
              className={`flex-1 py-2 px-3 text-sm transition-colors duration-150
                ${loginMode === 'admin' ? 'bg-[var(--color-primary)] text-white font-medium shadow-inner' : 'bg-[var(--color-input-bg)] text-[var(--color-text-light)] hover:bg-[var(--color-border)]'}`}
            >
              Sou Administrador
            </button>
          </div>

          <form onSubmit={handleLoginAttempt} className="mb-5">
            {loginMode === 'consultor' && (
              <div className="mb-3">
                <label htmlFor="consultant-name-login" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">Nome de Usuário:</label>
                <input
                  type="text"
                  id="consultant-name-login"
                  className="themed-input w-full !text-sm"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  placeholder="Seu nome de consultor"
                  required
                  autoComplete="username"
                  aria-describedby={authError ? "auth-error-message" : undefined}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="password-login" className="block text-sm font-medium text-[var(--color-text-light)] mb-1">
                {loginMode === 'admin' ? 'Senha do Administrador:' : 'Senha:'}
              </label>
              <input
                type="password"
                id="password-login"
                className="themed-input w-full !text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                autoComplete="current-password"
                aria-describedby={authError ? "auth-error-message" : undefined}
              />
            </div>
            
            {authError && (
              <p id="auth-error-message" className="text-xs text-[var(--error)] mb-3 text-center bg-[rgba(var(--error-rgb),0.1)] p-1.5 rounded-md border border-[rgba(var(--error-rgb),0.2)]" role="alert">
                {authError}
              </p>
            )}

            <GlassButton type="submit" className="w-full !py-2.5" disabled={isLoadingAuth}>
              {isLoadingAuth ? <LoadingSpinner size="sm" /> : 'Entrar'}
            </GlassButton>
          </form>
          
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAccessInfo(prev => !prev)}
              className="text-xs text-[var(--color-text-light)] hover:text-[var(--color-primary)] underline"
            >
              Informações de Acesso {showAccessInfo ? <i className="fas fa-chevron-up ml-1"></i> : <i className="fas fa-chevron-down ml-1"></i>}
            </button>
            {showAccessInfo && (
              <p className="text-xs text-[var(--color-text-light)] mt-2 bg-[var(--color-input-bg)] p-2 rounded-md border border-[var(--color-border)]">
                {loginMode === 'admin' 
                  ? "Insira a senha de administrador definida no sistema." 
                  : "Consultores: utilizem o nome de usuário e senha cadastrados pelo administrador."}
              </p>
            )}
          </div>

        </GlassCard>
      </section>
    );
  }

  // Logged-in view
  const welcomeNavItems = NAV_ITEMS.filter(item => 
    item.section !== NavigationSection.Home && 
    (!item.adminOnly || (item.adminOnly && currentUser?.tipo === 'admin')) &&
    item.icon && // Ensure item has an icon to display
    // For admin, only show adminOnly items on the home page.
    // For consultant, show non-adminOnly items.
    (currentUser?.tipo === 'admin' ? item.adminOnly : !item.adminOnly)
  );


  return (
    <section id="home" className="py-8">
      <GlassCard className="text-center p-6 md:p-10">
        <img src={currentUser.avatarUrl || "/logo.png"} alt={currentUser.avatarUrl ? "Avatar do Usuário" : "Geniunm Logo"} className={`w-24 h-24 mx-auto mb-4 ${currentUser.avatarUrl ? 'rounded-full object-cover' : ''}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png';}} />
        <h1 className="section-title !text-3xl md:!text-4xl !text-center !border-b-0">
          Olá, {currentUser.nome || 'Usuário'}!
        </h1>
        <p className="text-lg text-[var(--color-text-light)] mb-8">
          Bem-vindo(a) de volta à Plataforma de Treinamento Geniunm. Escolha uma ferramenta abaixo para começar.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-xl mx-auto">
          {welcomeNavItems.map((item: NavItem) => (
            <Link 
                key={item.section} 
                to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
                className="block"
            >
              <GlassButton className="w-full h-full text-md py-4 transition transform hover:scale-105 hover:shadow-lg !font-medium">
                {item.icon && <i className={`fas ${item.icon} mr-2.5 text-[var(--color-primary-dark)] opacity-70`}></i>}
                {item.label}
              </GlassButton>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--color-text-light)]">
          "O sucesso é a soma de pequenos esforços repetidos dia após dia."
        </p>
      </GlassCard>
    </section>
  );
};

export default HomeSection;
