import React, { useState, useEffect } from 'react';
import { HashRouter, useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ui/useTheme.tsx';
import { NAV_ITEMS, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX } from './constants';
import { CurrentUserType, NavigationSection } from './types';
import { authService } from './services/authService';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Sidebar from './components/Sidebar';
import HomeSection from './components/HomeSection';
import ProtectedRoute from './components/ProtectedRoute';
import FlashcardSection from './components/FlashcardSection/FlashcardSection';
import QuizSection from './components/QuizSection/QuizSection';
import SimulatorSection from './components/SimulatorSection/SimulatorSection';
import AdminDashboard from './components/AdminSection/AdminDashboard';
import CollaboratorDashboard from './components/AdminSection/CollaboratorDashboard';
import UserManagementPanel from './components/AdminSection/UserManagementPanel';
import ReportsSection from './components/AdminSection/ReportsSection';
import PersonaCustomizationPanel from './components/AdminSection/PersonaCustomizationPanel';
import ScriptLibrarySection from './components/ScriptLibrary/ScriptLibrarySection';
import Footer from './components/Footer';

// Mock de um componente que não foi encontrado, para evitar erros de compilação.
const ScrollToSection = () => null;
const LAST_ROUTE_KEY = 'lastRoute';


const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </HashRouter>
  );
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
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.tipo === 'admin' && (location.pathname === '/' || location.pathname === `/${NavigationSection.Home}` || location.hash === `#/` || location.hash === `#/home`)) {
        navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
      }
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

  const handleLogin = async (username: string, password?: string): Promise<void> => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const user = await authService.login(username, password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${user.id}`, new Date().toISOString());
        if (user.tipo === 'admin') {
          navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
        } else {
          navigate(`/${NavigationSection.Home}`, { replace: true });
        }
      } else {
        setAuthError("Credenciais inválidas.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError("Ocorreu um erro durante o login.");
    } finally {
      setIsLoadingAuth(false);
    }
  };
  
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
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
                    element={ currentUser?.tipo === 'admin' ? <CollaboratorDashboard /> : <Navigate to={`/${Navigation.Home}`} replace /> }
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

export default App;
