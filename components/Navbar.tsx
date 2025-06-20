
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { NavigationSection, AppUser } from '../types'; // Changed from AuthenticatedUser
import GlassButton from './ui/GlassButton';

interface SidebarProps {
  onNavigate: (section: NavigationSection) => void;
  onGeniunmTextClick?: () => void;
  currentUser: AppUser | null; // Changed from AuthenticatedUser
  onLogout: () => void;
  isMobileMenuOpen: boolean; // New prop
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
    const currentPath = hashSection || pathSection || NavigationSection.Home;
    setActiveSection(currentPath as NavigationSection);
  }, [location]);

  const handleNavClick = (section: NavigationSection) => {
    onNavigate(section); // This now primarily closes mobile menu if open
  };

  const NavLinkItem: React.FC<{ item: typeof NAV_ITEMS[0], iconClass: string }> = ({ item, iconClass }) => (
     <Link
        to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
        className={`nav-link ${activeSection === item.section ? 'active' : ''}`}
        onClick={() => handleNavClick(item.section)}
        aria-current={activeSection === item.section ? 'page' : undefined}
        title={item.label}
    >
        <i className={`fas ${iconClass}`}></i>
        <span>{item.label}</span>
    </Link>
  );

  const getUserDisplayName = () => {
    if (!currentUser) return '';
    // Assuming AppUser has 'nome' and 'tipo'
    if (currentUser.tipo === 'admin') return 'Admin';
    // For other types, use 'nome'
    return currentUser.nome.split(' ')[0] || currentUser.nome; // First name or full name
  };
  
  const getIconForSection = (section: NavigationSection): string => {
    const navItem = NAV_ITEMS.find(item => item.section === section);
    return navItem?.icon || "fa-circle-notch"; // Fallback icon
  };

  const sidebarBaseClasses = "w-64 bg-[var(--color-surface)] shadow-xl flex flex-col h-screen border-r border-[var(--color-border)] transition-transform duration-300 ease-in-out";
  const mobileClasses = `fixed inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`;
  const desktopClasses = "md:sticky md:translate-x-0 md:flex-shrink-0";


  return (
    <aside className={`${sidebarBaseClasses} ${mobileClasses} ${desktopClasses}`}>
      {/* Sidebar Header */}
      <div className="p-6 text-center border-b border-[var(--color-border)]">
        <Link 
            to={currentUser?.tipo === 'admin' ? `/${NavigationSection.AdminPanel}` : `/${NavigationSection.Home}`} 
            onClick={() => handleNavClick(currentUser?.tipo === 'admin' ? NavigationSection.AdminPanel : NavigationSection.Home)} 
            className="inline-block"
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
          title={onGeniunmTextClick ? "Clique para uma surpresa..." : ""}
        >
          Geniunm
        </h1>
        <p className="text-xs text-[var(--color-text-light)]">Treinamento de Consultores</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.filter(item => !item.adminOnly || (item.adminOnly && currentUser?.tipo === 'admin')).map((item) => (
          <NavLinkItem key={item.section} item={item} iconClass={getIconForSection(item.section)} />
        ))}
      </nav>

      {/* User Info & Logout */}
      {currentUser && (
        <div className="p-4 mt-auto border-t border-[var(--color-border)]">
          <div className="flex items-center mb-3">
            {/* Avatar */}
             <div 
                className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-lg font-medium mr-3 overflow-hidden"
                title={currentUser.nome}
              >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.nome} className="w-full h-full object-cover" onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none'; // Hide img on error
                    // Optionally, show initial if img fails
                    const parent = target.parentElement;
                    if(parent && currentUser.nome) parent.innerHTML = currentUser.nome.charAt(0).toUpperCase() || '?';
                }} />
              ) : (
                currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : '?'
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{getUserDisplayName()}</p>
              <p className="text-xs text-[var(--color-text-light)] leading-tight capitalize">
                {currentUser.tipo}
              </p>
            </div>
          </div>
          <GlassButton 
            onClick={onLogout} 
            className="w-full !text-sm !py-2 !bg-[rgba(var(--color-primary-rgb),0.15)] !text-[var(--color-primary)] hover:!bg-[rgba(var(--color-primary-rgb),0.25)] !border-[rgba(var(--color-primary-rgb),0.2)]"
            title="Sair da plataforma"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>Sair
          </GlassButton>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
