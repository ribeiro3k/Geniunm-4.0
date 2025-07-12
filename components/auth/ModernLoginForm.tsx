import React, { useState } from 'react';
import { Meteors } from '../ui/meteors';
import { GlassCard } from '../ui/glass-card';
import { AnimatedInput } from '../ui/animated-input';
import GlassButton from '../ui/GlassButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { CurrentUserType } from '../../types';

interface ModernLoginFormProps {
  currentUser: CurrentUserType;
  onLogin: (usernameOrAdminKeyword: string, passwordPlainText: string, isTryingAdminLogin: boolean) => Promise<string | null>;
  authError: string | null;
  isLoadingAuth: boolean;
  setAuthError: (error: string | null) => void;
}

type LoginMode = 'consultor' | 'admin';

const ModernLoginForm: React.FC<ModernLoginFormProps> = ({
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

  if (currentUser) {
    return null; // Não renderiza se já logado
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel Esquerdo - Formulário */}
      <div className="w-full lg:w-2/5 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Elementos decorativos sutis */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-xl"></div>
        
        <GlassCard variant="light" className="w-full max-w-md p-8 relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="Geniunm Logo" 
              className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo</h1>
            <p className="text-gray-600">Plataforma de Treinamento Geniunm</p>
          </div>

          {/* Toggle de Modo */}
          <div className="mb-6 flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setLoginMode('consultor'); setAuthError(null); setPassword(''); }}
              className={`flex-1 py-2 px-4 text-sm rounded-md transition-all duration-200 ${
                loginMode === 'consultor' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sou Consultor
            </button>
            <button
              onClick={() => { setLoginMode('admin'); setAuthError(null); setPassword(''); }}
              className={`flex-1 py-2 px-4 text-sm rounded-md transition-all duration-200 ${
                loginMode === 'admin' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sou Administrador
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLoginAttempt} className="space-y-6">
            {loginMode === 'consultor' && (
              <div className="relative">
                <input
                  type="text"
                  id="consultant-name"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  placeholder="Nome de usuário"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400"></i>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={loginMode === 'admin' ? 'Senha do Administrador' : 'Senha'}
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-400"></i>
              </div>
            </div>
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <GlassButton 
              type="submit" 
              className="w-full !py-3 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !border-0" 
              disabled={isLoadingAuth}
            >
              {isLoadingAuth ? <LoadingSpinner size="sm" /> : 'Entrar'}
            </GlassButton>
          </form>
          
          {/* Informações de Acesso */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowAccessInfo(prev => !prev)}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              Informações de Acesso {showAccessInfo ? '↑' : '↓'}
            </button>
            {showAccessInfo && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-600">
                  {loginMode === 'admin' 
                    ? "Insira a senha de administrador definida no sistema." 
                    : "Consultores: utilizem o nome de usuário e senha cadastrados pelo administrador."}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Painel Direito - Visual com Meteoros */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden items-center justify-center">
        {/* Efeito de Meteoros */}
        <Meteors number={25} />
        
        {/* Elementos decorativos */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        {/* Card Informativo */}
        <GlassCard variant="dark" className="max-w-md p-8 relative z-10">
          <div className="text-center mb-6">
            <img 
              src="/logo.png" 
              alt="Geniunm Logo" 
              className="w-20 h-20 mx-auto mb-4 filter brightness-0 invert" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
            <h2 className="text-3xl font-bold text-white mb-4">
              Transforme Seu Potencial
            </h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              A Geniunm ajuda consultores a construir carreiras organizadas e bem estruturadas, 
              repletas de técnicas avançadas e módulos ricos. Junte-se a nós e comece a 
              construir seu sucesso hoje.
            </p>
            <p className="text-gray-400 text-sm">
              Mais de 5.000+ consultores já se juntaram a nós, é a sua vez
            </p>
          </div>
          
          {/* Avatares sobrepostos */}
          <div className="flex items-center justify-center space-x-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-gray-300 text-sm ml-3">+5k consultores</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ModernLoginForm;