'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, Info, RefreshCw } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [forceOverwrite, setForceOverwrite] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Error fetching database status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitialize = async () => {
    setBtnLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceOverwrite })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        await fetchStatus();
      } else {
        setError(data.message || data.error || 'Error al inicializar la base de datos');
      }
    } catch (err) {
      setError('Error de comunicación con la API del servidor');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
        <span style={{ marginLeft: '12px' }}>Cargando estado de base de datos...</span>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="card">
        <div className="card-header-flex" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Conexión con Google Apps Script</h2>
              <p className="card-subtext">Estado del motor de comunicación de base de datos en Google Sheets</p>
            </div>
          </div>
          <span style={{
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-full)',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: status?.configured ? 'var(--success-light)' : 'var(--warning-light)',
            color: status?.configured ? 'var(--success)' : 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {status?.configured ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {status?.configured ? 'Conectado (Apps Script Web App)' : 'Modo Offline (Simulado)'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <p>{status?.message}</p>
          {status?.configured && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div><strong>Script Web App URL:</strong> <code style={{ color: 'var(--primary)', fontSize: '12px', wordBreak: 'break-all' }}>{status.scriptUrl}</code></div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                💡 El CRM está comunicándose exitosamente con tu Google Sheet a través de Apps Script.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ALERTAS DE OPERACIONES */}
      {message && (
        <div className="alert-banner success">
          <CheckCircle2 size={18} />
          <div>{message}</div>
        </div>
      )}
      {error && (
        <div className="alert-banner danger">
          <XCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* ACCIÓN DE INICIALIZACIÓN */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Inicializar Estructura de Datos</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Esta acción creará automáticamente todas las pestañas requeridas (`users`, `contacts`, `interactions`, etc.) y sembrará los registros de prueba correspondientes en Google Sheets (o base de datos local).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={forceOverwrite} 
              onChange={(e) => setForceOverwrite(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <div>
              <strong>Forzar reinstalación (Sobrescribir datos)</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Reestablece la base de datos limpiando las hojas existentes y volviendo a sembrar los datos mock.</p>
            </div>
          </label>

          <button 
            onClick={handleInitialize} 
            disabled={btnLoading} 
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
          >
            <RefreshCw size={16} className={btnLoading ? 'spin' : ''} style={{ marginRight: '4px' }} />
            <span>{btnLoading ? 'Inicializando...' : 'Comenzar Inicialización'}</span>
          </button>
        </div>
        <style jsx>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>

      {/* DOCUMENTACIÓN / MANUAL DE CONFIGURACIÓN */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>¿Cómo conectar tu Google Sheet real con Apps Script?</h3>
        </div>
        
        <ol style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            Crea una hoja de cálculo nueva y en blanco en Google Sheets.
          </li>
          <li>
            En el menú superior, haz clic en <strong>Extensiones &gt; Apps Script</strong>.
          </li>
          <li>
            Borra todo el contenido existente y pega el código que se encuentra en el archivo <code>google-apps-script/Code.gs</code> en este proyecto.
          </li>
          <li>
            Modifica la constante <code>API_SECRET_KEY</code> en la línea 7 de ese script con una clave secreta personalizada (ej: una contraseña larga y segura).
          </li>
          <li>
            Haz clic en el icono de <strong>Guardar</strong> (el disquete).
          </li>
          <li>
            Haz clic en el botón <strong>Implementar &gt; Nueva implementación</strong> (Deploy &gt; New Deployment).
          </li>
          <li>
            Haz clic en el icono de engranaje al lado de "Seleccionar tipo" y elige <strong>Aplicación web</strong> (Web App).
          </li>
          <li>
            Configura los siguientes campos obligatorios:
            <ul style={{ paddingLeft: '20px', marginTop: '4px', listStyleType: 'disc' }}>
              <li><strong>Ejecutar como:</strong> Selecciona <strong>Mí (tu correo)</strong></li>
              <li><strong>Quién tiene acceso:</strong> Selecciona <strong>Cualquiera (Anyone)</strong></li>
            </ul>
          </li>
          <li>
            Haz clic en <strong>Implementar</strong>. Google te pedirá autorizar el acceso a tus hojas de cálculo. Otorga los permisos (haz clic en "Configuración Avanzada" e "Ir a Proyecto sin título (no seguro)" para confirmar tu propio script).
          </li>
          <li>
            Copia la <strong>URL de la aplicación web</strong> generada al finalizar.
          </li>
          <li>
            Crea tu archivo <code>.env.local</code> en la raíz de este proyecto (renombrando el archivo <code>.env.local.example</code>) y configura:
            <ul style={{ paddingLeft: '20px', marginTop: '4px', listStyleType: 'disc' }}>
              <li><code>GOOGLE_SCRIPT_URL</code>: Pega la URL copiada.</li>
              <li><code>GOOGLE_SCRIPT_SECRET</code>: Tu clave secreta definida en el Paso 4.</li>
            </ul>
          </li>
          <li>
            Reinicia el CRM local y presiona el botón <strong>Comenzar Inicialización</strong> arriba para preparar todas las pestañas de forma automática.
          </li>
        </ol>
      </div>

    </div>
  );
}
