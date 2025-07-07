import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar'; 
import Footer from './components/Footer';
import HomeSection from './components/HomeSection';
import FlashcardSection from './components/FlashcardSection/FlashcardSection';
import QuizSection from './components/QuizSection/QuizSection';
import SimulatorSection from './components/SimulatorSection/SimulatorSection';
import AdminDashboard from './components/AdminSection/AdminDashboard'; 
import CollaboratorDashboard from './components/AdminSection/CollaboratorDashboard'; 
import UserManagementPanel from './components/AdminSection/UserManagementPanel';
import ReportsSection from './components/AdminSection/ReportsSection'; 
import PersonaCustomizationPanel from './components/AdminSection/PersonaCustomizationPanel'; 
import ProtectedRoute from './components/ProtectedRoute';
import { NavigationSection, AppUser, CurrentUserType } from './types'; 
import { NAV_ITEMS, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX, ADMIN_FIXED_PASSWORD, LOCAL_STORAGE_CURRENT_USER_KEY, TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from './constants'; 
import { supabase } from './lib/supabaseClient'; 
import LoadingSpinner from './components/ui/LoadingSpinner';
import ScriptLibrarySection from './components/ScriptLibrary/ScriptLibrarySection';

const LAST_ROUTE_KEY = 'geniunm_last_route';

const ScrollToSection: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const sectionIdFromPath = location.pathname.substring(1); 
    const sectionIdFromHash = location.hash.substring(2); 
    let sectionId = sectionIdFromHash || sectionIdFromPath;

    if (sectionId) {
      const element = document.getElementById(sectionId); 
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else if (sectionId === NavigationSection.Home || sectionId === '') {
         setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
    } else {
       setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [location]);

  return null;
};


const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [geniunmClickCount, setGeniunmClickCount] = useState(0);
  const [bossBattleTriggered, setBossBattleTriggered] = useState(false);
  const [isSimulatorPage, setIsSimulatorPage] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.matchMedia("(max-width: 767px)").matches);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<CurrentUserType>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);


  useEffect(() => {
    setIsLoadingAuth(true);
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
      if (storedUser) {
        const user: AppUser = JSON.parse(storedUser);
        // Basic validation of stored user structure
        if (user && user.id && user.nome && user.tipo) {
            setCurrentUser(user);
            if (user.tipo === 'admin' && (location.pathname === '/' || location.pathname === `/${NavigationSection.Home}` || location.hash === `#/` || location.hash === `#/home`)) {
                navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
            }
        } else {
             localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY); // Clear corrupted/invalid data
        }
      }
    } catch (error) {
      console.error("Error reading user from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY); 
    }
    setIsLoadingAuth(false);
  }, [navigate, location.pathname, location.hash]);


  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => {
        setIsSmallScreen(e.matches);
        if (!e.matches) setIsMobileMenuOpen(false); 
    }
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const handleNavigate = (section: NavigationSection) => { if (isSmallScreen) setIsMobileMenuOpen(false); };
  
  const handleGeniunmTextClick = () => {
    setGeniunmClickCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 5 && currentUser) { setBossBattleTriggered(true); return 0; }
        return newCount;
    });
  };
  const resetBossBattleTrigger = () => setBossBattleTriggered(false);

  const handleLogin = async (usernameOrAdminKeyword: string, passwordInput: string, isTryingAdminLogin: boolean): Promise<string | null> => {
    setAuthError(null);
    setIsLoadingAuth(true);

    if (isTryingAdminLogin) {
      if (passwordInput === ADMIN_FIXED_PASSWORD) {
        const adminUser: AppUser = {
          id: 'admin_fixed_user',
          nome: 'Administrador',
          tipo: 'admin',
        };
        setCurrentUser(adminUser);
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(adminUser));
        localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${adminUser.id}`, new Date().toISOString());
        navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
        setIsLoadingAuth(false);
        return null; // Success
      } else {
        setAuthError("Senha de administrador incorreta.");
        setIsLoadingAuth(false);
        return "Senha de administrador incorreta.";
      }
    } else { // Consultant login - now uses Supabase
      if (!supabase) {
        setAuthError(`Falha na autenticação: ${SUPABASE_ERROR_MESSAGE}`);
        setIsLoadingAuth(false);
        return `Falha na autenticação: ${SUPABASE_ERROR_MESSAGE}`;
      }
      try {
        const { data: consultantData, error: fetchError } = await supabase
          .from(TABLE_USUARIOS)
          .select('id, nome, email, tipo, password, criado_em')
          .eq('nome', usernameOrAdminKeyword)
          .eq('tipo', 'consultor')
          .single();

        if (fetchError || !consultantData) {
          setAuthError("Nome de usuário do consultor não encontrado ou erro na busca.");
          setIsLoadingAuth(false);
          return "Nome de usuário do consultor não encontrado.";
        }
        
        // WARNING: Direct password comparison. In production, this should be a hash comparison handled server-side.
        if (consultantData.password === passwordInput) {
          const consultantAppUser: AppUser = {
            id: consultantData.id,
            nome: consultantData.nome,
            tipo: consultantData.tipo as 'consultor', // Ensure correct type
            email: consultantData.email,
            criado_em: consultantData.criado_em,
          };
          setCurrentUser(consultantAppUser);
          localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(consultantAppUser));
          localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${consultantAppUser.id}`, new Date().toISOString());
          navigate(`/${NavigationSection.Home}`, { replace: true });
          setIsLoadingAuth(false);
          return null; // Success
        } else {
          setAuthError("Senha do consultor incorreta.");
          setIsLoadingAuth(false);
          return "Senha do consultor incorreta.";
        }
      } catch (error) {
        console.error("Error during consultant login:", error);
        setAuthError("Erro inesperado durante o login do consultor.");
        setIsLoadingAuth(false);
        return "Erro inesperado durante o login do consultor.";
      }
    }
  };
  
  const handleLogout = async () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    setGeniunmClickCount(0); 
    setIsMobileMenuOpen(false);
    navigate(`/${NavigationSection.Home}`, { replace: true });
  };

  useEffect(() => {
    const currentPathname = location.pathname;
    const currentHash = location.hash; 
    let effectivePath = currentHash.startsWith("#/") ? currentHash.substring(1) : currentPathname;
    if (effectivePath.startsWith('/')) effectivePath = effectivePath.substring(1);
    if (effectivePath === '') effectivePath = NavigationSection.Home;

    setIsSimulatorPage(effectivePath === NavigationSection.Simulador);

    let sectionName = "Início"; 
    const navItem = NAV_ITEMS.find(item => item.section === effectivePath);
    if (navItem) sectionName = navItem.label;
    else if (effectivePath.startsWith(`${NavigationSection.AdminPanel}/collaborator/`)) sectionName = "Detalhes do Colaborador";
    
    document.title = (sectionName && sectionName !== 'Início') ? `Geniunm - ${sectionName}` : 'Geniunm - Treinamento de Consultores';

    if (currentUser) {
        if (currentUser.tipo === 'admin') {
             const isAdminSpecificPath = 
                effectivePath === NavigationSection.AdminPanel ||
                NAV_ITEMS.some(item => item.adminOnly && item.section === effectivePath);
            if (!isAdminSpecificPath && effectivePath !== NavigationSection.Home) {
                // navigate(`/${NavigationSection.AdminPanel}`, { replace: true }); // This was causing loops, review redirection
            }
        } else if (currentUser.tipo === 'consultor') {
            const isForbiddenAdminPath = NAV_ITEMS.some(item => item.adminOnly && item.section === effectivePath);
            if (isForbiddenAdminPath) {
                navigate(`/${NavigationSection.Home}`, { replace: true });
            }
        }
    } else { 
        const isProtectedPath = NAV_ITEMS.some(item => 
            item.section !== NavigationSection.Home && 
            (effectivePath === item.section || effectivePath.startsWith(`${item.section}/`))
        );
        if (isProtectedPath) {
             navigate(`/${NavigationSection.Home}`, { replace: true });
        }
    }

  }, [location, currentUser, navigate]);
  
  const appContainerClass = `min-h-screen flex flex-col text-[var(--color-text)]`;
  const mainContentAreaClass = `flex-1 flex flex-col overflow-y-auto custom-scrollbar ${currentUser && isSimulatorPage && isSmallScreen ? 'p-0' : 'p-4 md:p-6 lg:p-8'} ${isSmallScreen ? 'main-content-mobile' : ''}`;
  const contentWrapperClass = currentUser 
    ? (isSimulatorPage ? 'flex-grow w-full' : 'flex-grow container mx-auto w-full') 
    : 'flex-grow flex flex-col items-center justify-center w-full';

  // Persistir a última rota acessada
  useEffect(() => {
    const path = location.pathname + location.search + location.hash;
    if (path !== '/') {
      localStorage.setItem(LAST_ROUTE_KEY, path);
    }
  }, [location]);

  // Redirecionar para a última rota salva ao iniciar
  useEffect(() => {
    const lastRoute = localStorage.getItem(LAST_ROUTE_KEY);
    if (lastRoute && location.pathname === '/') {
      navigate(lastRoute, { replace: true });
    }
    // Só executa no primeiro carregamento
    // eslint-disable-next-line
  }, []);

  if (isLoadingAuth) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner text="Carregando..." size="lg" />
      </div>
    );
  }
  
  return (
    <div className={appContainerClass}>
      {currentUser && ( 
        <>
          <button
            className="mobile-menu-button md:hidden"
            onClick={toggleMobileMenu} 
            aria-label="Abrir menu" 
            aria-expanded={isMobileMenuOpen}
          > 
            <i className="fas fa-bars"></i> 
          </button>
          {isMobileMenuOpen && isSmallScreen && (
            <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu} aria-label="Fechar menu"></div>
          )}
          <Sidebar onNavigate={handleNavigate} onGeniunmTextClick={handleGeniunmTextClick} currentUser={currentUser} onLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} onToggleMenu={toggleMobileMenu} />
        </>
      )}
      <main className={mainContentAreaClass}>
        <div className={contentWrapperClass}>
            <ScrollToSection />
            <Routes>
            <Route 
                path={`/${NavigationSection.Home}`} 
                element={ 
                  currentUser ? 
                    (currentUser.tipo === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : <HomeSection currentUser={currentUser} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} setAuthError={setAuthError} />)
                    : <HomeSection currentUser={null} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} setAuthError={setAuthError} />
                } 
            />
            <Route element={<ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`} />}>
                <Route path={`/${NavigationSection.Flashcards}`} element={ <FlashcardSection />} />
                <Route path={`/${NavigationSection.Quiz}`} element={<QuizSection currentUser={currentUser} />} />
                <Route 
                  path={`/${NavigationSection.Simulador}`} 
                  element={
                    <SimulatorSection 
                        currentUser={currentUser!} 
                        bossBattleTriggerFromApp={bossBattleTriggered} 
                        onBossBattleTriggerConsumed={resetBossBattleTrigger}
                    />} 
                />
                <Route 
                    path={`/${NavigationSection.AdminPanel}`} 
                    element={ currentUser?.tipo === 'admin' ? <AdminDashboard currentUser={currentUser} /> : <Navigate to={`/${NavigationSection.Home}`} replace />}
                />
                <Route 
                    path={`/${NavigationSection.AdminPanel}/collaborator/:userId`}
                    element={ currentUser?.tipo === 'admin' ? <CollaboratorDashboard /> : <Navigate to={`/${NavigationSection.Home}`} replace /> }
                />
                <Route 
                    path={`/${NavigationSection.UserManagement}`}
                    element={ currentUser?.tipo === 'admin' ? <UserManagementPanel /> : <Navigate to={`/${NavigationSection.Home}`} replace /> }
                />
                <Route 
                    path={`/${NavigationSection.Reports}`}
                    element={ currentUser?.tipo === 'admin' ? <ReportsSection currentUser={currentUser}/> : <Navigate to={`/${NavigationSection.Home}`} replace /> }
                />
                <Route 
                    path={`/${NavigationSection.PersonaCustomization}`}
                    element={ currentUser?.tipo === 'admin' ? <PersonaCustomizationPanel /> : <Navigate to={`/${NavigationSection.Home}`} replace /> }
                />
            </Route>
            <Route path="/scripts" element={<ScriptLibrarySection currentUser={currentUser} />} />
            <Route path="/" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
            <Route path="*" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
            </Routes>
        </div>
      </main>
      <Footer onGeniunmTextClick={handleGeniunmTextClick} />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;