'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const router = useRouter();

  // Verificar estado de conexión de base de datos
  useEffect(() => {
    async function checkDBMode() {
      try {
        const res = await fetch('/api/setup');
        if (res.ok) {
          const data = await res.json();
          if (data.mode === 'mock') {
            setOfflineMode(true);
          }
        }
      } catch (e) {
        console.error('Error checking DB mode:', e);
      }
    }
    checkDBMode();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="login-container">
      {/* SECCIÓN IZQUIERDA (CORPORATIVA) */}
      <div className="login-left">
        <div>
          <img 
            src="/assets/image/logogestionsmart.png" 
            style={{ height: '50px', width: 'auto', marginBottom: '40px' }} 
            alt="Gestion Smart Logo" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 style={{ fontSize: '36px', fontWeight: 800, lineHeight: 1.2 }}>
            Gestiona de forma inteligente.
          </h2>
          <p style={{ color: '#a5b4fc', fontSize: '18px', marginTop: '16px', maxWidth: '460px' }}>
            Bienvenido al portal CRM de Gestion Smart. Controla tu flujo de ventas, segmentación, LTV y tareas comerciales en un solo lugar.
          </p>
        </div>

        <div>
          <p style={{ fontSize: '13px', color: '#818cf8' }}>
            &copy; 2026 Gestion Smart S.L. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA (FORMULARIO) */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Iniciar Sesión</h1>
            <p className="login-subtitle">Ingresa tus credenciales para acceder al CRM</p>
          </div>

          {offlineMode && (
            <div className="alert-banner info" style={{ marginBottom: '24px' }}>
              <ShieldAlert size={18} />
              <div>
                <strong>Modo Offline Activo:</strong> Usando base de datos simulada local.
              </div>
            </div>
          )}

          {error && (
            <div className="alert-banner danger" style={{ marginBottom: '24px' }}>
              <ShieldAlert size={18} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} /> Correo Electrónico
                </span>
              </label>
              <input
                className="form-input"
                id="email"
                type="email"
                placeholder="ejemplo@gestionsmart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} /> Contraseña
                </span>
              </label>
              <input
                className="form-input"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={loading}
              style={{ padding: '14px', borderRadius: '12px', marginTop: '10px' }}
            >
              <LogIn size={18} />
              <span>{loading ? 'Validando...' : 'Acceder al Sistema'}</span>
            </button>
          </form>

          {/* ACCESOS RÁPIDOS PARA PRUEBAS */}
          <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Accesos de Prueba (Auto-completar)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('admin@gestionsmart.com', 'admin123')}
                className="btn btn-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
              >
                🛠️ Admin
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('propietario@gestionsmart.com', 'propietario123')}
                className="btn btn-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
              >
                💼 Propietario
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('vendedor@gestionsmart.com', 'vendedor123')}
                className="btn btn-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
              >
                📈 Ventas
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('secretario@gestionsmart.com', 'secretario123')}
                className="btn btn-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'flex-start' }}
              >
                📝 Soporte
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
