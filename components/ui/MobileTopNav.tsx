import React from 'react';
import { IconMenu2, IconSun, IconMoon } from '@tabler/icons-react';

interface MobileTopNavProps {
  onToggleMenu: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const MobileTopNav: React.FC<MobileTopNavProps> = ({ onToggleMenu, theme, onToggleTheme }) => {
  return (
    <header className="md:hidden sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      {/* Botão do Menu (Hambúrguer) */}
      <button
        onClick={onToggleMenu}
        className="p-2 -ml-2 text-[var(--color-text-main)]"
        aria-label="Abrir menu"
      >
        <IconMenu2 size={24} />
      </button>

      {/* Título da Plataforma */}
      <h1 className="text-lg font-semibold text-primary font-display">
        Geniunm
      </h1>

      {/* Botão de Alternância de Tema */}
      <button
        onClick={onToggleTheme}
        className="p-2 -mr-2 text-[var(--color-text-main)]"
        aria-label={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
      >
        {theme === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
      </button>
    </header>
  );
};

export default MobileTopNav;
