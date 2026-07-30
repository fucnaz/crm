'use client';

import React, { useState, useEffect, useContext } from 'react';
import { CRMContext } from '../layout';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function DashboardPage() {
  const { user } = useContext(CRMContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    contacts: [],
    opportunities: [],
    interactions: [],
    tasks: []
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [contactsRes, oppsRes, interactionsRes, tasksRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/opportunities'),
        fetch('/api/interactions'),
        fetch('/api/tasks')
      ]);

      const contactsData = await contactsRes.json();
      const oppsData = await oppsRes.json();
      const interactionsData = await interactionsRes.json();
      const tasksData = await tasksRes.json();

      setData({
        contacts: contactsData.contacts || [],
        opportunities: oppsData.opportunities || [],
        interactions: interactionsData.interactions || [],
        tasks: tasksData.tasks || []
      });
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="avatar" style={{ width: '40px', height: '40px', animation: 'spin 1.5s linear infinite' }}>GS</div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ==========================================
  // AGREGACIONES & METRICAS
  // ==========================================

  // 1. Total LTV (Facturación total acumulada)
  const totalLTV = data.contacts.reduce((sum, c) => sum + (Number(c.ltv) || 0), 0);

  // 2. Total de Contactos
  const totalContacts = data.contacts.length;

  // 3. Valor del Embudo de Ventas Activo (Negocios no cerrados)
  const activeOpps = data.opportunities.filter(o => o.stage !== 'Cerrado Ganado' && o.stage !== 'Cerrado Perdido');
  const activePipelineValue = activeOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0);

  // 4. Mis Tareas Pendientes (Asignadas a mí y estado != Completada)
  const myPendingTasks = data.tasks.filter(t => t.assigned_to === user.id && t.status !== 'Completada');

  // ==========================================
  // PREPARACIÓN DE GRÁFICOS (RECHARTS)
  // ==========================================

  // Fases del embudo de ventas ordenadas
  const STAGES_ORDER = [
    'Prospección',
    'Calificación',
    'Propuesta',
    'Negociación',
    'Cerrado Ganado',
    'Cerrado Perdido'
  ];

  // Agrupar oportunidades por fase para el gráfico
  const pipelineStats = STAGES_ORDER.map(stage => {
    const stageOpps = data.opportunities.filter(o => o.stage === stage);
    const value = stageOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
    return {
      name: stage,
      Valor: value,
      Cantidad: stageOpps.length
    };
  });

  // Colores para el gráfico de barras por fase
  const BAR_COLORS = {
    'Prospección': '#94a3b8',
    'Calificación': '#38bdf8',
    'Propuesta': '#6366f1',
    'Negociación': '#fbbf24',
    'Cerrado Ganado': '#10b981',
    'Cerrado Perdido': '#ef4444'
  };

  // ==========================================
  // CLIENTES CON MAYOR VALOR DE VIDA (TOP LTV)
  // ==========================================
  const topClients = [...data.contacts]
    .sort((a, b) => (Number(b.ltv) || 0) - (Number(a.ltv) || 0))
    .slice(0, 5);

  // ==========================================
  // ÚLTIMAS INTERACCIONES
  // ==========================================
  const recentInteractions = data.interactions.slice(0, 5);

  // Utilidad para encontrar el nombre de contacto basado en ID
  const getContactName = (contactId) => {
    const contact = data.contacts.find(c => c.id === contactId);
    return contact ? `${contact.name} ${contact.last_name}` : 'Contacto Desconocido';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. SECCIÓN DE MÉTRICAS CLAVE */}
      <section className="metrics-grid">
        {/* Total Clientes */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Clientes Totales</span>
            <div className="card-icon-container" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="card-value">{totalContacts}</div>
          <span className="card-subtext">Contactos registrados en la base de datos</span>
        </div>

        {/* LTV Total */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Valor de Vida Total (LTV)</span>
            <div className="card-icon-container" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="card-value">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalLTV)}
          </div>
          <span className="card-subtext">Suma de compras facturadas e ingresadas</span>
        </div>

        {/* Embudo Activo */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Embudo en Negociación</span>
            <div className="card-icon-container" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="card-value">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(activePipelineValue)}
          </div>
          <span className="card-subtext">{activeOpps.length} oportunidades comerciales activas</span>
        </div>

        {/* Mis Tareas Pendientes */}
        <div className="card">
          <div className="card-header-flex">
            <span className="card-title">Mis Tareas</span>
            <div className="card-icon-container" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="card-value">{myPendingTasks.length}</div>
          <span className="card-subtext">Tareas comerciales pendientes para hoy</span>
        </div>
      </section>

      {/* 2. AREA GRÁFICOS Y CLIENTES TOP */}
      <section className="dashboard-grid">
        {/* Gráfico del Embudo de Ventas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Embudo de Ventas Comercial</h3>
          <div style={{ flexGrow: 1, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStats} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} unit="€" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                  formatter={(value, name, props) => [
                    `${new Intl.NumberFormat('es-ES').format(value)}€`, 
                    'Valor Estimado'
                  ]}
                />
                <Bar dataKey="Valor" radius={[4, 4, 0, 0]}>
                  {pipelineStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top LTV Clientes */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Clientes de Alto Valor (LTV)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topClients.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay registros de compras aún.</p>
            ) : (
              topClients.map(client => (
                <div key={client.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{client.name} {client.last_name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{client.job_title || 'Cliente'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(client.ltv)}
                    </span>
                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>LTV Acumulado</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. ÚLTIMAS ACCIONES & MIS TAREAS */}
      <section className="dashboard-grid">
        
        {/* Recientes interacciones logueadas */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Actividad Reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentInteractions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay actividades registradas.</p>
            ) : (
              recentInteractions.map(interaction => {
                const iconColor = 
                  interaction.type === 'Llamada' ? 'var(--info)' :
                  interaction.type === 'Correo' ? 'var(--primary)' :
                  interaction.type === 'Reunión' ? 'var(--warning)' : 'var(--success)';
                
                return (
                  <div key={interaction.id} className="list-item-card" style={{ margin: 0, padding: '12px' }}>
                    <div className="list-item-header">
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        color: iconColor, 
                        fontWeight: 700,
                        fontSize: '11px',
                        textTransform: 'uppercase'
                      }}>
                        {interaction.type}
                      </span>
                      <span>{new Date(interaction.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
                      {getContactName(interaction.contact_id)}
                    </div>
                    <p className="list-item-desc" style={{ fontSize: '12px' }}>
                      {interaction.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mis Tareas Corto Plazo */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Mis Tareas Pendientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myPendingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>¡Todo al día!</p>
                <p style={{ fontSize: '11px' }}>No tienes tareas pendientes asignadas.</p>
              </div>
            ) : (
              myPendingTasks.slice(0, 4).map(task => (
                <div key={task.id} style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                  <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700 }}>{task.title}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{task.description}</p>
                    <span style={{ 
                      display: 'inline-block', 
                      fontSize: '10px', 
                      color: 'var(--danger)', 
                      backgroundColor: 'var(--danger-light)', 
                      padding: '2px 6px', 
                      borderRadius: 'var(--border-radius-sm)',
                      fontWeight: 600,
                      marginTop: '6px'
                    }}>
                      Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </section>

    </div>
  );
}
