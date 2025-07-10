import React, { useState, useEffect } from 'react';
import { HashRouter, useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './components/ui/useTheme';
import { NAV_ITEMS, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX } from './constants';
import { CurrentUserType, NavigationSection } from './types';
import { authService } from './services/authService';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Sidebar from './components/Sidebar';
import MobileTopNav from './components/ui/MobileTopNav';
import Footer from './components/Footer';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

// Importações das seções/páginas
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

const App: React.FC = () => (
  <HashRouter>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </HashRouter>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<CurrentUserType>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => 
    localStorage.getItem('sidebarCollapsed') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);

  const handleNavigate = (section: NavigationSection) => {
    if (isSmallScreen) setIsMobileMenuOpen(false);
  };

  const handleLogin = async (username: string, password?: string) => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const user = await authService.login(username, password);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${user.id}`, new Date().toISOString());
        navigate(user.tipo === 'admin' ? `/${NavigationSection.AdminPanel}` : `/${NavigationSection.Home}`, { replace: true });
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
    setIsMobileMenuOpen(false);
    navigate(`/${NavigationSection.Home}`, { replace: true });
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner text="Carregando..." size="lg" />
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen flex bg-[var(--color-bg)] text-[var(--color-text)]">
      {currentUser && (
        <>
          {isMobileMenuOpen && isSmallScreen && (
            <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm" onClick={toggleMobileMenu} />
          )}
          <Sidebar
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLogout={handleLogout}
            isMobileMenuOpen={isMobileMenuOpen}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
          />
        </>
      )}
      
      {/* Botão Flutuante para Expandir/Recolher Sidebar (Desktop) */}
      {currentUser && !isSmallScreen && (
        <button
          onClick={handleToggleSidebarCollapse}
          className={`absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full shadow-md hover:bg-primary/10 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'left-[84px]' : 'left-[244px]'
          }`}
          title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isSidebarCollapsed ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />}
        </button>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-y-hidden">
        {currentUser && isSmallScreen && (
          <MobileTopNav onToggleMenu={toggleMobileMenu} theme={theme} onToggleTheme={toggleTheme} />
        )}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className={currentUser ? 'container mx-auto w-full' : 'flex flex-col items-center justify-center w-full h-full'}>
            <Routes>
              <Route path={`/${NavigationSection.Home}`} element={currentUser ? (currentUser.tipo === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> : <HomeSection currentUser={currentUser} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} setAuthError={setAuthError} />) : <HomeSection currentUser={null} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} setAuthError={setAuthError} />} />
              <Route element={<ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`} />}>
                <Route path={`/${NavigationSection.Flashcards}`} element={<FlashcardSection />} />
                <Route path={`/${NavigationSection.Quiz}`} element={<QuizSection currentUser={currentUser} />} />
                <Route path={`/${NavigationSection.Simulador}`} element={<SimulatorSection currentUser={currentUser!} bossBattleTriggerFromApp={false} onBossBattleTriggerConsumed={() => {}} />} />
                <Route path={`/${NavigationSection.AdminPanel}`} element={currentUser?.tipo === 'admin' ? <AdminDashboard currentUser={currentUser} /> : <Navigate to={`/${NavigationSection.Home}`} replace />} />
                <Route path={`/${NavigationSection.AdminPanel}/collaborator/:userId`} element={currentUser?.tipo === 'admin' ? <CollaboratorDashboard /> : <Navigate to={`/${NavigationSection.Home}`} replace />} />
                <Route path={`/${NavigationSection.UserManagement}`} element={currentUser?.tipo === 'admin' ? <UserManagementPanel /> : <Navigate to={`/${NavigationSection.Home}`} replace />} />
                <Route path={`/${NavigationSection.Reports}`} element={currentUser?.tipo === 'admin' ? <ReportsSection currentUser={currentUser} /> : <Navigate to={`/${NavigationSection.Home}`} replace />} />
                <Route path={`/${NavigationSection.PersonaCustomization}`} element={currentUser?.tipo === 'admin' ? <PersonaCustomizationPanel /> : <Navigate to={`/${NavigationSection.Home}`} replace />} />
              </Route>
              <Route path="/scripts" element={<ScriptLibrarySection currentUser={currentUser} />} />
              <Route path="/" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
              <Route path="*" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;