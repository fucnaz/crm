'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Database,
  FileText,
  UserCheck
} from 'lucide-react';

// Crear contextos de Autenticación y Temas
export const CRMContext = createContext(null);

export default function CRMLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const router = useRouter();
  const pathname = usePathname();

  // Cargar tema desde localStorage al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('gsm_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Función para alternar el tema claro/oscuro
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('gsm_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Cargar datos de sesión del usuario
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Error fetching user session:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Función de cierre de sesión
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div className="avatar" style={{
          width: '60px',
          height: '60px',
          fontSize: '24px',
          animation: 'spin 1.5s linear infinite',
          marginBottom: '16px'
        }}>
          GS
        </div>
        <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-secondary)' }}>
          Cargando Gestion Smart CRM...
        </p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Elementos de navegación del menú
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'propietario', 'vendedor', 'secretario'] },
    { name: 'Contactos', path: '/contacts', icon: Users, roles: ['administrador', 'propietario', 'vendedor', 'secretario'] },
    { name: 'Embudo de Ventas', path: '/pipeline', icon: LineChart, roles: ['administrador', 'propietario', 'vendedor'] }, // Secretarios no ven finanzas/pipeline
    { name: 'Tareas Pendientes', path: '/tasks', icon: CheckSquare, roles: ['administrador', 'propietario', 'vendedor', 'secretario'] },
    { name: 'Base de Datos (Google)', path: '/setup', icon: Database, roles: ['administrador'] }, // Solo Admin
    { name: 'Usuarios & Accesos', path: '/users', icon: UserCheck, roles: ['administrador', 'propietario'] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <CRMContext.Provider value={{ user, loading, logout: handleLogout, theme, toggleTheme, refreshUser: fetchSession }}>
      <div className="app-container">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="brand-section">
            <img 
              src="/assets/image/logogestionsmart.png" 
              className="brand-logo" 
              alt="Gestion Smart" 
              onError={(e) => {
                // Fallback si la imagen no carga
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="brand-title" style={{ display: 'none' }}>Gestion Smart</span>
          </div>

          <nav className="nav-menu">
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className={`nav-item-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </nav>

          {/* USER INFO PROFILE SECTION */}
          <div className="user-profile-section">
            <div className="user-profile-info">
              <div className="avatar">
                {user?.name ? user.name.substring(0, 2) : 'GS'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className={`user-role-badge ${user?.role}`}>
                  {user?.role === 'vendedor' ? 'Ventas' : user?.role === 'secretario' ? 'Soporte' : user?.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
              <button 
                onClick={toggleTheme} 
                className="btn-icon" 
                style={{ flexGrow: 1 }}
                title="Cambiar tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={handleLogout} 
                className="btn-icon" 
                style={{ color: 'var(--danger)', flexGrow: 1 }}
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <div className="main-wrapper">
          {/* HEADER */}
          <header className="header">
            <div className="header-title-section">
              <h1 className="page-title">
                {pathname === '/dashboard' && 'Panel de Control'}
                {pathname === '/contacts' && 'Directorio de Contactos'}
                {pathname === '/pipeline' && 'Embudo de Ventas'}
                {pathname === '/tasks' && 'Tareas Comerciales'}
                {pathname === '/setup' && 'Configuración de Google Sheets'}
                {pathname === '/users' && 'Gestión de Usuarios'}
              </h1>
            </div>
            
            <div className="header-actions">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Portal de CRM corporativo
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="content-body">
            {children}
          </main>
        </div>

      </div>
    </CRMContext.Provider>
  );
}
