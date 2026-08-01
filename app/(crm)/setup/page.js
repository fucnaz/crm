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
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Conexión con Firebase Firestore</h2>
              <p className="card-subtext">Estado del motor de comunicación de base de datos en Firebase Cloud Firestore</p>
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
            {status?.configured ? 'Conectado (Firebase Firestore)' : 'Modo Offline (Simulado)'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <p>{status?.message}</p>
          {status?.configured && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
              <div><strong>Firebase Project ID:</strong> <code style={{ color: 'var(--primary)', fontSize: '12px', wordBreak: 'break-all' }}>{status.projectId}</code></div>
              <div><strong>Service Account Email:</strong> <code style={{ color: 'var(--primary)', fontSize: '12px', wordBreak: 'break-all' }}>{status.clientEmail}</code></div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                💡 El CRM está conectado exitosamente a tu base de datos de Firebase Cloud Firestore.
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
          Esta acción creará automáticamente todas las colecciones requeridas (`users`, `contacts`, `interactions`, etc.) y sembrará los registros de prueba correspondientes en Firebase Firestore (o base de datos local de respaldo).
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
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Restablece la base de datos limpiando las colecciones de Firestore y volviendo a sembrar los datos mock iniciales.</p>
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
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>¿Cómo configurar tu base de datos en Firebase Firestore?</h3>
        </div>
        
        <ol style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            Ve a la consola de Firebase (<a href="https://firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>firebase.google.com</a>) y crea un proyecto nuevo.
          </li>
          <li>
            En el panel lateral izquierdo de tu proyecto, ve a <strong>Build &gt; Firestore Database</strong> y haz clic en <strong>Crear base de datos</strong>.
          </li>
          <li>
            Elige la ubicación física para tu servidor de base de datos y configúrala en el modo que prefieras (producción o prueba). Al usar el SDK de Admin del servidor de Next.js, se omiten las reglas del cliente por defecto de forma segura.
          </li>
          <li>
            Ve al icono de engranaje al lado de "Descripción general del proyecto" en la esquina superior izquierda y selecciona <strong>Configuración del proyecto</strong>.
          </li>
          <li>
            Haz clic en la pestaña <strong>Cuentas de servicio</strong> (Service accounts) en la parte superior.
          </li>
          <li>
            Bajo el apartado de Node.js, haz clic en el botón <strong>Generar nueva clave privada</strong>. Esto descargará un archivo seguro en formato JSON a tu ordenador.
          </li>
          <li>
            Abre el archivo <code>.env.local</code> en la raíz del CRM (puedes crear uno copiando el archivo de ejemplo <code>.env.local.example</code>) y configura las siguientes variables con el contenido del JSON:
            <ul style={{ paddingLeft: '20px', marginTop: '4px', listStyleType: 'disc' }}>
              <li><code>FIREBASE_PROJECT_ID</code>: El valor del campo <code>project_id</code> del JSON.</li>
              <li><code>FIREBASE_CLIENT_EMAIL</code>: El valor del campo <code>client_email</code> del JSON.</li>
              <li><code>FIREBASE_PRIVATE_KEY</code>: El valor del campo <code>private_key</code> completo (incluyendo los encabezados <code>-----BEGIN PRIVATE KEY-----</code>, guiones y los saltos de línea de la clave). Envuélvelo en comillas dobles en el archivo.</li>
            </ul>
          </li>
          <li>
            Reinicia el servidor local del CRM para cargar las nuevas variables de entorno de tu máquina.
          </li>
          <li>
            Vuelve a esta pantalla de Configuración y pulsa en <strong>Comenzar Inicialización</strong> para preparar todas las colecciones automáticamente con los datos mock de prueba.
          </li>
        </ol>
      </div>

    </div>
  );
}
