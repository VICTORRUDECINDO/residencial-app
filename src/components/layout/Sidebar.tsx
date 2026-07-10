'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Flame,
  FileText,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { href: '/',              label: 'Dashboard',    icon: <LayoutDashboard size={20} /> },
  { href: '/apartamentos',  label: 'Apartamentos', icon: <Building2 size={20} /> },
  { href: '/propietarios',  label: 'Propietarios', icon: <Users size={20} /> },
  { href: '/lecturas',      label: 'Lecturas Gas',  icon: <Flame size={20} /> },
  { href: '/financiero',    label: 'Financiero',   icon: <FileText size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      {/* Logo / Título */}
      <div className="sidebar-header">
        <div className="sidebar-logo-circle">
          <img
            src="/logo.png"
            alt="Logo"
            className="sidebar-logo-img"
          />
        </div>
        <span className="sidebar-title">Residencial</span>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar-nav">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? 'sidebar-link--active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Configuración en la parte inferior */}
      <div className="sidebar-footer">
        <Link
          href="/configuracion"
          className={`sidebar-link ${isActive('/configuracion') ? 'sidebar-link--active' : ''}`}
        >
          <span className="sidebar-icon"><Settings size={20} /></span>
          <span className="sidebar-label">Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
