import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import { NavigationSection, NavItem as NavItemType, CurrentUserType } from '../types';
import { useTheme } from './ui/useTheme';
import Tooltip from './ui/Tooltip';
import { Popover, PopoverTrigger, PopoverContent, PopoverItem } from './ui/PopoverMenu';
import {
  IconSun, IconMoon, IconLogout
} from '@tabler/icons-react';

interface SidebarProps {
  onNavigate: (section: NavigationSection) => void;
  currentUser: CurrentUserType;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  currentUser,
  onLogout,
  isMobileMenuOpen,
  isCollapsed,
}) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<NavigationSection>(NavigationSection.Home);

  useEffect(() => {
    const currentPath = location.pathname.substring(1) || NavigationSection.Home;
    setActiveSection(currentPath as NavigationSection);
  }, [location]);

  const handleNavClick = (section: NavigationSection) => {
    onNavigate(section);
  };

  const NavLinkItem: React.FC<{ item: NavItemType }> = ({ item }) => {
    const isActive = activeSection === item.section;
    const isEffectivelyCollapsed = isCollapsed && !isMobileMenuOpen;
    const linkClasses = `flex items-center w-full relative rounded-md p-3 my-1 transition-colors duration-200 ${
      isEffectivelyCollapsed ? 'justify-center' : ''
    } ${isActive ? 'bg-primary/10 text-primary' : 'text-[var(--color-text-light)] hover:bg-primary/5 hover:text-[var(--color-text-main)]'}`;

    const linkContent = (
      <Link
        to={item.href.startsWith('#') ? item.href.substring(1) : item.href}
        className={linkClasses}
        onClick={() => handleNavClick(item.section)}
        aria-label={item.label}
      >
        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>}
        {item.icon && <i className={`fas ${item.icon} w-8 text-center text-lg`} />}
        <span className={`ml-2 whitespace-nowrap transition-opacity ${isEffectivelyCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          {item.label}
        </span>
      </Link>
    );

    return isEffectivelyCollapsed ? (
      <Tooltip text={item.label}>{linkContent}</Tooltip>
    ) : (
      linkContent
    );
  };

  const visibleNavGroups = useMemo(() => {
    if (!currentUser) return [];
    return NAV_ITEMS.filter(group => currentUser.tipo === 'admin' ? group.adminOnly : !group.adminOnly);
  }, [currentUser]);

  const desktopSidebarClasses = `hidden md:flex flex-col h-screen sticky top-0 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-all duration-300 ease-in-out ${
    isCollapsed ? 'w-24' : 'w-64'
  }`;
  
  const mobileSidebarClasses = `fixed md:hidden inset-y-0 left-0 z-30 w-64 bg-[var(--color-bg-secondary)] shadow-xl flex flex-col h-screen border-r border-[var(--color-border)] transition-transform duration-300 ease-in-out ${
    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  const SidebarContent = () => {
    const isEffectivelyCollapsed = isCollapsed && !isMobileMenuOpen;
    return (
      <>
        <div className={`p-4 text-center border-b border-[var(--color-border)] flex items-center ${isEffectivelyCollapsed ? 'justify-center' : 'justify-start'}`}>
          <img src="/logo.png" alt="Logo Geniunm" className="h-12 w-12 transition-transform hover:scale-110 flex-shrink-0" />
          <div className={`ml-2 overflow-hidden transition-opacity ${isEffectivelyCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <h1 className="text-xl font-semibold text-primary font-display">Geniunm</h1>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar">
          {visibleNavGroups.map((group) => (
            <div key={group.group} className="mb-4">
              <h2 className={`px-3 mb-2 text-xs font-bold tracking-wider text-[var(--color-text-light)] uppercase transition-opacity ${isEffectivelyCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {group.group}
              </h2>
              {group.items.map((item) => <NavLinkItem key={item.section} item={item} />)}
            </div>
          ))}
        </nav>

        <div className="p-2 mt-auto border-t border-[var(--color-border)]">
          <Popover>
            <PopoverTrigger>
              <div className={`flex items-center p-2 rounded-lg hover:bg-primary/5 cursor-pointer ${isEffectivelyCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-primary/80 text-white flex items-center justify-center text-lg font-medium flex-shrink-0" title={currentUser.nome}>
                  {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div className={`ml-3 overflow-hidden transition-opacity ${isEffectivelyCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  <p className="text-sm font-medium text-[var(--color-text)] leading-tight truncate" title={currentUser.nome}>
                    {currentUser.nome}
                  </p>
                  <p className="text-xs text-[var(--color-text-light)] leading-tight capitalize">{currentUser.tipo}</p>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverItem onClick={toggleTheme}>
                {theme === 'dark' ? <IconSun size={18} className="mr-2" /> : <IconMoon size={18} className="mr-2" />}
                Mudar Tema
              </PopoverItem>
              <PopoverItem onClick={onLogout}>
                <IconLogout size={18} className="mr-2 text-danger" />
                <span className="text-danger">Sair</span>
              </PopoverItem>
            </PopoverContent>
          </Popover>
        </div>
      </>
    );
  }

  return (
    <>
      <aside className={desktopSidebarClasses}><SidebarContent /></aside>
      <aside className={mobileSidebarClasses}><SidebarContent /></aside>
    </>
  );
};

export default Sidebar;