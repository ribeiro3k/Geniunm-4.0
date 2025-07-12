import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from './ui/GlassCard'; 
import GlassButton from './ui/GlassButton';
import { CurrentUserType, NavigationSection, NavItem } from '../types';
import { NAV_ITEMS } from '../constants';
import LoadingSpinner from './ui/LoadingSpinner';
import ModernLoginForm from './auth/ModernLoginForm';

interface HomeSectionProps {
  currentUser: CurrentUserType;
  onLogin: (usernameOrAdminKeyword: string, passwordPlainText: string, isTryingAdminLogin: boolean) => Promise<string | null>;
  authError: string | null;
  isLoadingAuth: boolean;
  setAuthError: (error: string | null) => void;
}

const HomeSection: React.FC<HomeSectionProps> = ({ 
  currentUser, 
  onLogin,
  authError, 
  isLoadingAuth,
  setAuthError
}) => {
  // Se não estiver logado, mostra o formulário de login moderno
  if (!currentUser) {
    return (
      <ModernLoginForm
        currentUser={currentUser}
        onLogin={onLogin}
        authError={authError}
        isLoadingAuth={isLoadingAuth}
        setAuthError={setAuthError}
      />
    );
  }

  // Logged-in view (mantém o design existente)
  const welcomeNavItems = NAV_ITEMS.filter(group => 
    currentUser?.tipo === 'admin' ? group.adminOnly : !group.adminOnly
  ).flatMap(group => group.items).filter(item => 
    item.section !== NavigationSection.Home && item.icon
  );

  return (
    <section id="home" className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo e Badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <img 
                src="/logo.png" 
                alt="Geniunm Logo" 
                className="w-20 h-20 mx-auto drop-shadow-lg" 
                onError={(e) => { e.currentTarget.style.display = 'none';}} 
              />
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                PRO
              </div>
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm font-medium mb-6">
              <i className="fas fa-trophy mr-2"></i>
              Plataforma #1 em Treinamento de Vendas
            </div>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--color-text)] mb-6 leading-tight">
            Transforme Seu
            <span className="block bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
              Potencial de Vendas
            </span>
            em Resultados Reais
          </h1>

          {/* Saudação Personalizada */}
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-[var(--color-text)] font-medium mb-2">
              Bem-vindo de volta, <span className="text-[var(--color-primary)] font-bold">{currentUser.nome}!</span>
            </p>
            <p className="text-lg text-[var(--color-text-light)]">
              Pronto para conquistar suas próximas vendas?
            </p>
          </div>

          {/* Texto Motivacional */}
          <div className="max-w-4xl mx-auto mb-12 space-y-6">
            <p className="text-lg md:text-xl text-[var(--color-text-light)] leading-relaxed">
              <strong className="text-[var(--color-text)]">Sabemos que vender não é fácil.</strong> Objeções difíceis, clientes indecisos, 
              metas desafiadoras e a pressão constante por resultados fazem parte da sua realidade diária. 
              Mas aqui está a diferença: <strong className="text-[var(--color-primary)]">vendedores de elite não nascem prontos, eles se preparam!</strong>
            </p>
            
            <p className="text-lg md:text-xl text-[var(--color-text-light)] leading-relaxed">
              Esta plataforma foi criada especialmente para <strong className="text-[var(--color-text)]">profissionais ambiciosos como você</strong> 
              que querem dominar as técnicas mais avançadas de vendas, superar objeções com confiança e 
              <strong className="text-[var(--color-accent)]"> multiplicar seus resultados de forma consistente.</strong>
            </p>

            <p className="text-lg md:text-xl text-[var(--color-text-light)] leading-relaxed">
              Chegou a hora de <strong className="text-[var(--color-primary)]">elevar seu jogo comercial</strong> e se tornar o vendedor 
              que seus clientes respeitam, seus colegas admiram e sua empresa valoriza. 
              <strong className="text-[var(--color-text)]">Seu próximo nível está a um clique de distância!</strong>
            </p>
          </div>

          {/* Estatísticas de Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl font-bold text-[var(--color-primary)] mb-2">+150%</div>
              <div className="text-sm text-[var(--color-text-light)]">Aumento médio em conversões</div>
            </div>
            <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl font-bold text-[var(--color-accent)] mb-2">5.000+</div>
              <div className="text-sm text-[var(--color-text-light)]">Vendedores treinados</div>
            </div>
            <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="text-3xl font-bold text-green-500 mb-2">R$ 50M+</div>
              <div className="text-sm text-[var(--color-text-light)]">Em vendas geradas</div>
            </div>
          </div>

          {/* Call to Action Principal */}
          <div className="mb-12">
            <p className="text-xl font-semibold text-[var(--color-text)] mb-6">
              Escolha sua ferramenta de crescimento:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {welcomeNavItems.map((item: NavItem) => (
                <Link 
                    key={item.section} 
                    to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
                    className="block group"
                >
                  <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-input-bg)] border border-[var(--color-border)] rounded-2xl p-6 hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <div className="flex flex-col items-center text-center">
                      {item.icon && (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                          <i className={`fas ${item.icon} text-lg`}></i>
                        </div>
                      )}
                      <h3 className="font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2">
                        {item.label}
                      </h3>
                      <div className="text-[var(--color-text-light)] group-hover:text-[var(--color-primary)] transition-colors">
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Frase Motivacional Final */}
          <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 border border-[var(--color-primary)]/20 rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white">
                <i className="fas fa-quote-left"></i>
              </div>
            </div>
            <blockquote className="text-xl md:text-2xl font-medium text-[var(--color-text)] text-center leading-relaxed">
              "Grandes vendedores não nascem prontos. Eles se preparam, praticam e persistem até que o sucesso se torne inevitável."
            </blockquote>
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium">
                <i className="fas fa-rocket mr-2"></i>
                Comece sua jornada agora!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos Visuais de Fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-[var(--color-primary)]/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-[var(--color-primary)]/5 rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default HomeSection;