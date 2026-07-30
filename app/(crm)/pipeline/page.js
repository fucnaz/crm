'use client';

import React, { useState, useEffect, useContext } from 'react';
import { CRMContext } from '../layout';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

const STAGES = [
  'Prospección',
  'Calificación',
  'Propuesta',
  'Negociación',
  'Cerrado Ganado',
  'Cerrado Perdido'
];

export default function PipelinePage() {
  const { user } = useContext(CRMContext);
  
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  
  // Oportunidad seleccionada para editar
  const [editingOpp, setEditingOpp] = useState(null);
  const [oppForm, setOppForm] = useState({
    title: '',
    value: '',
    stage: '',
    close_date: '',
    notes: ''
  });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const [oppsRes, contactsRes] = await Promise.all([
        fetch('/api/opportunities'),
        fetch('/api/contacts')
      ]);

      const oppsData = await oppsRes.json();
      const contactsData = await contactsRes.json();

      setOpportunities(oppsData.opportunities || []);
      setContacts(contactsData.contacts || []);
    } catch (e) {
      console.error('Error fetching pipeline:', e);
      showNotification('Error al cargar datos del embudo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelineData();
  }, []);

  const getClientName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.name} ${contact.last_name}` : 'Cliente no encontrado';
  };

  // Cambiar fase de forma rápida (botones de avance)
  const handleMoveStage = async (opp, direction) => {
    const currentIndex = STAGES.indexOf(opp.stage);
    let nextIndex = currentIndex + direction;
    
    if (nextIndex < 0 || nextIndex >= STAGES.length) return; // Fuera de rango
    
    const nextStage = STAGES[nextIndex];
    
    // RBAC: Vendedor solo puede modificar sus propias oportunidades
    if (user.role === 'vendedor' && opp.assigned_to !== user.id) {
      showNotification('No tienes permiso para modificar este trato (asignado a otro agente)');
      return;
    }

    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage })
      });

      if (res.ok) {
        showNotification(`Trato movido a "${nextStage}"`);
        await loadPipelineData();
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Error al actualizar fase');
      }
    } catch (e) {
      showNotification('Error de comunicación');
    }
  };

  const handleOpenEdit = (opp) => {
    // RBAC check
    if (user.role === 'vendedor' && opp.assigned_to !== user.id) {
      showNotification('No puedes editar oportunidades asignadas a otros agentes');
      return;
    }
    setEditingOpp(opp);
    setOppForm({
      title: opp.title,
      value: opp.value,
      stage: opp.stage,
      close_date: opp.close_date || '',
      notes: opp.notes || ''
    });
  };

  const handleSaveOpp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/opportunities/${editingOpp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oppForm)
      });

      if (res.ok) {
        showNotification('Trato comercial actualizado');
        setEditingOpp(null);
        await loadPipelineData();
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Error');
      }
    } catch (err) {
      showNotification('Error');
    }
  };

  const handleDeleteOpp = async (oppId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este trato comercial?')) return;
    
    try {
      const res = await fetch(`/api/opportunities/${oppId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Oportunidad comercial eliminada');
        setEditingOpp(null);
        await loadPipelineData();
      } else {
        const errData = await res.json();
        showNotification(errData.error || 'Error al eliminar');
      }
    } catch (e) {
      showNotification('Error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando embudo de ventas...</div>;
  }

  // Agrupar oportunidades por fase para renderizado en columnas
  const columnsData = STAGES.reduce((acc, stage) => {
    acc[stage] = opportunities.filter(o => o.stage === stage);
    return acc;
  }, {});

  // Calcular montos acumulados por columna
  const columnsTotalValue = STAGES.reduce((acc, stage) => {
    const total = columnsData[stage].reduce((sum, o) => sum + (Number(o.value) || 0), 0);
    acc[stage] = total;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {notification && (
        <div className="alert-banner info" style={{ position: 'fixed', top: '20px', right: '40px', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          <AlertCircle size={18} />
          <div>{notification}</div>
        </div>
      )}

      {/* KANBAN BOARD */}
      <div className="kanban-board">
        {STAGES.map(stage => {
          const list = columnsData[stage] || [];
          const totalValue = columnsTotalValue[stage] || 0;
          
          return (
            <div key={stage} className="kanban-column">
              <div className="kanban-column-header">
                <div>
                  <span style={{ display: 'block' }}>{stage}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}>
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalValue)}
                  </span>
                </div>
                <span className="kanban-count-badge">{list.length}</span>
              </div>

              {/* LIST OF CARDS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '300px' }}>
                {list.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius-md)', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    Sin tratos en esta fase
                  </div>
                ) : (
                  list.map(opp => {
                    const isEditable = user.role === 'administrador' || user.role === 'propietario' || opp.assigned_to === user.id;
                    
                    return (
                      <div key={opp.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span className="kanban-card-title">{opp.title}</span>
                          {isEditable && (
                            <button 
                              onClick={() => handleOpenEdit(opp)}
                              className="btn-icon" 
                              style={{ width: '22px', height: '22px', border: 'none', padding: 0 }}
                              title="Editar trato"
                            >
                              <Edit2 size={10} />
                            </button>
                          )}
                        </div>
                        <span className="kanban-card-client">{getClientName(opp.contact_id)}</span>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span className="kanban-card-value">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(opp.value)}
                          </span>
                          {opp.close_date && (
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={10} /> {opp.close_date}
                            </span>
                          )}
                        </div>

                        {/* CONTROLES DE MOVIMIENTO RÁPIDO */}
                        {isEditable && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '6px' }}>
                            <button 
                              disabled={STAGES.indexOf(stage) === 0}
                              onClick={() => handleMoveStage(opp, -1)}
                              className="btn btn-secondary" 
                              style={{ padding: '2px 8px', fontSize: '10px', minWidth: '40px' }}
                              title="Retroceder fase"
                            >
                              <ArrowLeft size={10} />
                            </button>
                            <button 
                              disabled={STAGES.indexOf(stage) === STAGES.length - 1}
                              onClick={() => handleMoveStage(opp, 1)}
                              className="btn btn-secondary" 
                              style={{ padding: '2px 8px', fontSize: '10px', minWidth: '40px' }}
                              title="Avanzar fase"
                            >
                              <ArrowRight size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL EDICIÓN DE OPORTUNIDAD */}
      {editingOpp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Editar Trato Comercial</h2>
              <button onClick={() => setEditingOpp(null)} className="btn-icon" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleSaveOpp}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--border-radius-md)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <strong>Cliente:</strong> {getClientName(editingOpp.contact_id)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Título del Trato</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={oppForm.title}
                    onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Valor Estimado ($ ARS)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={oppForm.value}
                      onChange={(e) => setOppForm({ ...oppForm, value: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Fase Actual</label>
                    <select 
                      className="form-select" 
                      value={oppForm.stage}
                      onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value })}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label font-label">Fecha Estimada de Cierre</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={oppForm.close_date}
                    onChange={(e) => setOppForm({ ...oppForm, close_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas Comerciales</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    value={oppForm.notes}
                    onChange={(e) => setOppForm({ ...oppForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                {(user.role === 'administrador' || user.role === 'propietario') && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteOpp(editingOpp.id)}
                    className="btn btn-danger" 
                    style={{ marginRight: 'auto' }}
                  >
                    Eliminar Trato
                  </button>
                )}
                <button type="button" onClick={() => setEditingOpp(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
