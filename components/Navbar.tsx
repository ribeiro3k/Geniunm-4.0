import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { NavigationSection, AppUser, NavItem as NavItemType, CurrentUserType } from '../types'; 
import GlassButton from './ui/GlassButton';

interface SidebarProps {
  onNavigate: (section: NavigationSection) => void;
  onGeniunmTextClick?: () => void;
  currentUser: CurrentUserType; 
  onLogout: () => void;
  isMobileMenuOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onNavigate, 
  onGeniunmTextClick, 
  currentUser, 
  onLogout,
  isMobileMenuOpen
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<NavigationSection>(NavigationSection.Home);

  useEffect(() => {
    const hashSection = location.hash.substring(2); 
    const pathSection = location.pathname.substring(1);
    let currentPath = hashSection || pathSection || NavigationSection.Home;
    if (currentPath === '') currentPath = NavigationSection.Home;
    
    setActiveSection(currentPath as NavigationSection);

  }, [location]);


  const handleNavClick = (section: NavigationSection) => {
    onNavigate(section); 
  };

  const NavLinkItem: React.FC<{ item: NavItemType }> = ({ item }) => {
    const baseClasses = `nav-link`;
    const isActive = activeSection === item.section;
    
    return (
     <Link
        to={item.href.startsWith('#') ? item.href.substring(1) : item.href} // Ensure relative paths for HashRouter
        className={`${baseClasses} ${isActive ? 'active' : ''}`}
        onClick={() => handleNavClick(item.section)}
        aria-current={isActive ? 'page' : undefined}
        title={item.label}
    >
        {item.icon && <i className={`fas ${item.icon}`}></i>}
        <span>{item.label}</span>
    </Link>
    );
  };

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    // Use 'nome' from AppUser, get first name if multiple words
    const nameParts = currentUser.nome?.split(' ');
    return nameParts && nameParts[0] ? nameParts[0] : currentUser.nome || 'Usuário';
  };
  
  const sidebarBaseClasses = "w-64 bg-[var(--color-surface)] shadow-xl flex flex-col h-screen border-r border-[var(--color-border)] transition-transform duration-300 ease-in-out";
  const mobileClasses = `fixed inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const desktopClasses = "md:sticky md:translate-x-0 md:flex-shrink-0";

  const visibleNavItems = useMemo(() => {
    if (!currentUser) return []; // No items if no user (though sidebar is shown only if user exists)
    if (currentUser.tipo === 'admin') {
         return NAV_ITEMS.filter(item => item.adminOnly);
    }
    return NAV_ITEMS.filter(item => !item.adminOnly);
  }, [currentUser]);


  return (
    <aside className={`${sidebarBaseClasses} ${mobileClasses} ${desktopClasses}`}>
      {/* Sidebar Header */}
      <div className="p-6 text-center border-b border-[var(--color-border)]">
        <Link 
            to={currentUser?.tipo === 'admin' ? `/${NavigationSection.AdminPanel}` : `/${NavigationSection.Home}`} 
            onClick={() => handleNavClick(currentUser?.tipo === 'admin' ? NavigationSection.AdminPanel : NavigationSection.Home)} 
            className="inline-block"
            aria-label="Página inicial da plataforma"
        >
            <img 
              src="/logo.png" 
              alt="Logo Geniunm" 
              className="h-16 w-16 mx-auto mb-2 transition-transform hover:scale-110" 
              onError={(e) => (e.currentTarget.style.display = 'none')} 
            />
        </Link>
        <h1 
          className="text-2xl font-semibold text-[var(--color-primary)] font-display"
          onClick={onGeniunmTextClick} 
          style={{cursor: onGeniunmTextClick ? 'pointer' : 'default'}}
          title={onGeniunmTextClick ? "Clique para uma surpresa..." : "Geniunm Training Platform"}
        >
          Geniunm
        </h1>
        <p className="text-xs text-[var(--color-text-light)]">Treinamento de Consultores</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar" aria-label="Menu principal">
        {visibleNavItems.map((item) => (
          <NavLinkItem key={item.section} item={item} />
        ))}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 mt-auto border-t border-[var(--color-border)]">
          <div className="flex items-center mb-3">
             <div 
                className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg font-medium mr-3 overflow-hidden"
                title={currentUser.nome}
              >
              {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] leading-tight" title={currentUser.nome}>{getUserDisplayName()}</p>
              <p className="text-xs text-[var(--color-text-light)] leading-tight capitalize">
                {currentUser.tipo}
              </p>
            </div>
          </div>
          <GlassButton 
            onClick={onLogout} 
            className="w-full !text-sm !py-2 !bg-[rgba(var(--color-primary-rgb),0.15)] !text-[var(--color-primary)] hover:!bg-[rgba(var(--color-primary-rgb),0.25)] !border-[rgba(var(--color-primary-rgb),0.2)]"
            title="Sair da plataforma"
            aria-label="Sair da plataforma"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>Sair
          </GlassButton>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
