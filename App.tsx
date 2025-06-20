
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar'; 
import Footer from './components/Footer';
import HomeSection from './components/HomeSection';
import FlashcardSection from './components/FlashcardSection/FlashcardSection';
import QuizSection from './components/QuizSection/QuizSection';
import SimulatorSection from './components/SimulatorSection/SimulatorSection';
import ObjectionTrainerSection from './components/ObjectionTrainerSection/ObjectionTrainerSection'; 
import AdminDashboard from './components/AdminSection/AdminDashboard'; 
import CollaboratorDashboard from './components/AdminSection/CollaboratorDashboard'; 
import UserManagementPanel from './components/AdminSection/UserManagementPanel';
import ReportsSection from './components/AdminSection/ReportsSection'; 
import PersonaCustomizationPanel from './components/AdminSection/PersonaCustomizationPanel'; 
import ProtectedRoute from './components/ProtectedRoute';
import { NavigationSection, AppUser, CurrentUserType } from './types'; 
import { NAV_ITEMS, LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX, TABLE_USUARIOS, SUPABASE_ERROR_MESSAGE } from './constants'; 
import { supabase } from './lib/supabaseClient';
import LoadingSpinner from './components/ui/LoadingSpinner';


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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUserType>(null);

  const fetchAppUserDetails = async (supabaseUserId: string, email?: string): Promise<AppUser | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from(TABLE_USUARIOS)
            .select('id, nome, email, tipo, avatarUrl') // Assuming avatarUrl might be in usuarios
            .eq('id', supabaseUserId)
            .single();

        if (error) {
            console.error('Error fetching user details from usuarios table:', error);
            setAuthError(`Erro ao carregar dados do usuário: ${error.message}`);
            return null;
        }
        if (data) {
            return {
                id: data.id,
                email: data.email || email,
                nome: data.nome,
                tipo: data.tipo as 'admin' | 'consultor',
                avatarUrl: data.avatarUrl
            };
        }
        return null;
    } catch (e) {
        console.error('Catch fetching user details:', e);
        setAuthError(`Exceção ao carregar dados do usuário.`);
        return null;
    }
  };


  useEffect(() => {
    if (!supabase) {
      setAuthError(SUPABASE_ERROR_MESSAGE);
      setIsLoadingAuth(false);
      return;
    }

    setIsLoadingAuth(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchAppUserDetails(session.user.id, session.user.email);
        setCurrentUser(appUser);
        if (appUser) localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${appUser.id}`, new Date().toISOString());

      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true);
      if (session?.user) {
        const appUser = await fetchAppUserDetails(session.user.id, session.user.email);
        setCurrentUser(appUser);
         if (appUser) localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${appUser.id}`, new Date().toISOString());
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);


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

  const handleLogin = async (emailInput: string, passwordInput: string): Promise<string | null> => {
    if (!supabase) return SUPABASE_ERROR_MESSAGE;
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        setAuthError(error.message);
        setIsLoadingAuth(false);
        return error.message;
      }

      if (data.user) {
        const appUser = await fetchAppUserDetails(data.user.id, data.user.email);
        if (appUser) {
          setCurrentUser(appUser);
          localStorage.setItem(`${LOCAL_STORAGE_USER_LAST_LOGIN_PREFIX}${appUser.id}`, new Date().toISOString());
          if (appUser.tipo === 'admin') {
            navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
          } else {
            navigate(`/${NavigationSection.Home}`, { replace: true });
          }
          setIsLoadingAuth(false);
          return null; // Success
        } else {
           setAuthError("Usuário autenticado, mas não encontrado nos registros da aplicação.");
           await supabase.auth.signOut(); // Log out if app user details not found
           setIsLoadingAuth(false);
           return "Usuário autenticado, mas não encontrado nos registros da aplicação.";
        }
      }
    } catch (e: any) {
      setAuthError(e.message || "Ocorreu um erro inesperado durante o login.");
      setIsLoadingAuth(false);
      return e.message || "Ocorreu um erro inesperado durante o login.";
    }
    setIsLoadingAuth(false);
    return "Falha no login.";
  };
  
  const handleLogout = async () => {
    if (!supabase) return;
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
        setAuthError(`Erro ao sair: ${error.message}`);
        console.error('Error logging out:', error);
    }
    setCurrentUser(null); // Ensure state is cleared even if Supabase signout had minor issue
    setGeniunmClickCount(0); 
    setIsMobileMenuOpen(false);
    navigate(`/${NavigationSection.Home}`, { replace: true });
  };

  useEffect(() => {
    const currentPathname = location.pathname;
    const currentHash = location.hash; 
    let effectivePath = currentHash.startsWith("#/") ? currentHash.substring(1) : currentPathname;
    if (effectivePath.startsWith('/')) effectivePath = effectivePath.substring(1);

    setIsSimulatorPage(effectivePath === NavigationSection.Simulador);

    let sectionName = "Início"; 
    const navItem = NAV_ITEMS.find(item => item.section === effectivePath);
    if (navItem) sectionName = navItem.label;
    else if (effectivePath.startsWith(`${NavigationSection.AdminPanel}/collaborator/`)) sectionName = "Detalhes do Colaborador";
    
    document.title = (sectionName && sectionName !== 'Início') ? `Geniunm - ${sectionName}` : 'Geniunm - Treinamento de Consultores';

    if (currentUser?.tipo === 'admin') {
      const isAdminRelatedPath = effectivePath === NavigationSection.AdminPanel || 
                                 effectivePath.startsWith(`${NavigationSection.AdminPanel}/`) ||
                                 effectivePath === NavigationSection.UserManagement ||
                                 effectivePath === NavigationSection.Reports ||
                                 effectivePath === NavigationSection.PersonaCustomization; 
      if (!isAdminRelatedPath && effectivePath !== NavigationSection.Home && effectivePath !== '' && effectivePath !== '/') { 
            navigate(`/${NavigationSection.AdminPanel}`, { replace: true });
      }
    } else if (currentUser?.tipo === 'consultor') {
        const isConsultorForbiddenPath = effectivePath === NavigationSection.AdminPanel ||
                                         effectivePath.startsWith(`${NavigationSection.AdminPanel}/`) ||
                                         effectivePath === NavigationSection.UserManagement ||
                                         effectivePath === NavigationSection.Reports ||
                                         effectivePath === NavigationSection.PersonaCustomization;
        if (isConsultorForbiddenPath) {
            navigate(`/${NavigationSection.Home}`, { replace: true });
        }
    }
  }, [location, currentUser, navigate]);
  
  const appContainerClass = `min-h-screen flex text-[var(--color-text)] ${currentUser ? 'flex-row' : 'flex-col'}`;
  const mainContentAreaClass = `flex-1 flex flex-col overflow-y-auto ${currentUser && isSimulatorPage && isSmallScreen ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`;
  const contentWrapperClass = currentUser 
    ? (isSimulatorPage ? 'flex-grow w-full' : 'flex-grow container mx-auto w-full') 
    : 'flex-grow flex flex-col items-center justify-center w-full';

  if (isLoadingAuth && !authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <LoadingSpinner text="Carregando autenticação..." size="lg" />
      </div>
    );
  }
  
  if (authError && !currentUser && location.pathname !== `/${NavigationSection.Home}` && !location.hash.includes(NavigationSection.Home) && location.pathname !== `/` && location.hash !== `#/` && location.hash !== ``) {
    // If critical auth error and not on login page, redirect to login to show error
    return <Navigate to={`/${NavigationSection.Home}`} replace />;
  }


  return (
    <div className={appContainerClass}>
      {currentUser && ( 
        <>
          <button
            className="fixed top-3 left-3 z-40 md:hidden themed-button !p-2 !px-3 !rounded-md !bg-[var(--color-surface)] !text-[var(--color-text)] !border-[var(--color-border)] hover:!bg-[var(--color-border)]"
            onClick={toggleMobileMenu} aria-label="Abrir menu" aria-expanded={isMobileMenuOpen}
          > <i className="fas fa-bars text-lg"></i> </button>
          {isMobileMenuOpen && isSmallScreen && (
            <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu} aria-label="Fechar menu"></div>
          )}
          <Sidebar onNavigate={handleNavigate} onGeniunmTextClick={handleGeniunmTextClick} currentUser={currentUser} onLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} />
        </>
      )}
      <main className={mainContentAreaClass}>
        <div className={contentWrapperClass}>
            <ScrollToSection />
            <Routes>
            <Route 
                path={`/${NavigationSection.Home}`} 
                element={ 
                  currentUser?.tipo === 'admin' ? <Navigate to={`/${NavigationSection.AdminPanel}`} replace /> :
                  currentUser?.tipo === 'consultor' && location.pathname === `/${NavigationSection.Home}` ? <HomeSection currentUser={currentUser} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} /> : // Render Home if already logged in as consultor and on home page
                  <HomeSection currentUser={currentUser} onLogin={handleLogin} authError={authError} isLoadingAuth={isLoadingAuth} /> // Login form
                } 
            />
            
            <Route element={<ProtectedRoute user={currentUser} redirectPath={`/${NavigationSection.Home}`} />}>
                <Route path={`/${NavigationSection.Flashcards}`} element={ <FlashcardSection />} />
                <Route path={`/${NavigationSection.Quiz}`} element={<QuizSection currentUser={currentUser} />} />
                <Route 
                  path={`/${NavigationSection.Simulador}`} 
                  element={
                    <SimulatorSection 
                        currentUser={currentUser!} // ProtectedRoute ensures currentUser is not null
                        bossBattleTriggerFromApp={bossBattleTriggered} 
                        onBossBattleTriggerConsumed={resetBossBattleTrigger}
                    />} 
                />
                <Route path={`/${NavigationSection.ObjectionTrainer}`} element={ <ObjectionTrainerSection />} />
            
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
                    element={ currentUser?.tipo === 'admin' ? <UserManagementPanel onUserListChange={() => { /* No-op or refresh logic */ }} /> : <Navigate to={`/${NavigationSection.Home}`} replace /> }
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
            
            <Route path="/" element={<Navigate to={`/${NavigationSection.Home}`} replace />} />
            <Route path="*" element={<Navigate to={`/${NavigationSection.Home}`} replace />} /> 
            </Routes>
        </div>
        {currentUser && !(currentUser.tipo === 'admin') && <Footer onGeniunmTextClick={handleGeniunmTextClick} />}
        {currentUser && currentUser.tipo === 'admin' && (location.pathname.startsWith(`/${NavigationSection.AdminPanel}`) || location.pathname.startsWith(`/${NavigationSection.UserManagement}`) || location.pathname.startsWith(`/${NavigationSection.Reports}`) || location.pathname.startsWith(`/${NavigationSection.PersonaCustomization}`) || location.hash.startsWith(`#/${NavigationSection.AdminPanel}`) || location.hash.startsWith(`#/${NavigationSection.UserManagement}`) || location.hash.startsWith(`#/${NavigationSection.Reports}`) || location.hash.startsWith(`#/${NavigationSection.PersonaCustomization}`)) && <Footer />}
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
