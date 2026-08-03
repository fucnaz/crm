'use client';

import React, { useState, useEffect, useContext } from 'react';
import { CRMContext } from '../layout';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Activity,
  DollarSign,
  FileText,
  CheckSquare,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

export default function ContactsPage() {
  const { user } = useContext(CRMContext);

  // Lista de datos
  const [contacts, setContacts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [usersList, setUsersList] = useState([]); // Solo para asignación (si es Admin/Propietario)

  // Filtros
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modales
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('perfil');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editContactMode, setEditContactMode] = useState(false);
  const [contactForm, setContactForm] = useState({
    id: '',
    name: '',
    last_name: '',
    email: '',
    phones: '',
    address: '',
    social_profiles: '',
    job_title: '',
    preferences: '',
    segmentation: '',
    channel: 'Correo electrónico',
    assigned_to: ''
  });

  // Formularios de pestañas
  const [interactionForm, setInteractionForm] = useState({ type: 'Llamada', date: '', description: '' });
  const [transactionForm, setTransactionForm] = useState({ product_name: '', quantity: '1', price: '', date: '' });
  const [opportunityForm, setOpportunityForm] = useState({ title: '', value: '', stage: 'Prospección', close_date: '', notes: '' });
  const [budgetForm, setBudgetForm] = useState({ title: '', amount: '', status: 'Borrador', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', assigned_to: '' });

  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  // Cargar toda la información
  const loadCRMData = async () => {
    try {
      setLoading(true);
      const [contactsRes, interactionsRes, tasksRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/interactions'),
        fetch('/api/tasks')
      ]);

      const contactsData = await contactsRes.json();
      const interactionsData = await interactionsRes.json();
      const tasksData = await tasksRes.json();

      setContacts(contactsData.contacts || []);
      setInteractions(interactionsData.interactions || []);
      setTasks(tasksData.tasks || []);

      // Cargar financiero si no es secretario
      if (user.role !== 'secretario') {
        const [transactionsRes, opportunitiesRes, budgetsRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/opportunities'),
          fetch('/api/budgets')
        ]);
        const trxData = await transactionsRes.json();
        const oppsData = await opportunitiesRes.json();
        const budData = await budgetsRes.json();

        setTransactions(trxData.transactions || []);
        setOpportunities(oppsData.opportunities || []);
        setBudgets(budData.budgets || []);
      }

      // Cargar lista de usuarios para asignación si es Admin o Propietario
      if (user.role === 'administrador' || user.role === 'propietario') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersList(usersData.users || []);
        }
      }
    } catch (e) {
      console.error('Error loading CRM details:', e);
      showNotification('danger', 'Error al consultar datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCRMData();
  }, []);

  // Recargar el contacto seleccionado en el visor de pestañas
  useEffect(() => {
    if (selectedContact) {
      const updated = contacts.find(c => c.id === selectedContact.id);
      if (updated) setSelectedContact(updated);
    }
  }, [contacts]);

  // ==========================================
  // CONTACT CRUD OPERACIONES
  // ==========================================
  const handleOpenCreateContact = () => {
    setContactForm({
      id: '',
      name: '',
      last_name: '',
      email: '',
      phones: '',
      address: '',
      social_profiles: '',
      job_title: '',
      preferences: '',
      segmentation: '',
      channel: 'Correo electrónico',
      assigned_to: user.role === 'vendedor' ? user.id : ''
    });
    setEditContactMode(false);
    setContactModalOpen(true);
  };

  const handleOpenEditContact = (contact) => {
    setContactForm({
      id: contact.id,
      name: contact.name,
      last_name: contact.last_name,
      email: contact.email || '',
      phones: contact.phones || '',
      address: contact.address || '',
      social_profiles: contact.social_profiles || '',
      job_title: contact.job_title || '',
      preferences: contact.preferences || '',
      segmentation: contact.segmentation || '',
      channel: contact.channel || 'Correo electrónico',
      assigned_to: contact.assigned_to || ''
    });
    setEditContactMode(true);
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    try {
      const url = editContactMode ? `/api/contacts/${contactForm.id}` : '/api/contacts';
      const method = editContactMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', editContactMode ? 'Contacto actualizado correctamente' : 'Contacto creado correctamente');
        setContactModalOpen(false);
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error al guardar contacto');
      }
    } catch (err) {
      showNotification('danger', 'Error de comunicación con el servidor');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este contacto? Esta acción también borrará su historial.')) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Contacto eliminado');
        setSelectedContact(null);
        await loadCRMData();
      } else {
        const data = await res.json();
        showNotification('danger', data.error || 'Error al eliminar contacto');
      }
    } catch (err) {
      showNotification('danger', 'Error de comunicación');
    }
  };

  // ==========================================
  // LOG SUB-RECORDS (SUB-FORM SUBMITS)
  // ==========================================

  // Log Interaction
  const handleAddInteraction = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          ...interactionForm,
          date: interactionForm.date || new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Actividad registrada');
        setInteractionForm({ type: 'Llamada', date: '', description: '' });
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error');
      }
    } catch (err) {
      showNotification('danger', 'Error');
    }
  };

  // Add Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          product_name: transactionForm.product_name,
          quantity: Number(transactionForm.quantity),
          price: Number(transactionForm.price),
          date: transactionForm.date || new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Transacción de compra guardada');
        setTransactionForm({ product_name: '', quantity: '1', price: '', date: '' });
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error');
      }
    } catch (err) {
      showNotification('danger', 'Error');
    }
  };

  // Link Opportunity
  const handleAddOpportunity = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          ...opportunityForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Oportunidad comercial agregada');
        setOpportunityForm({ title: '', value: '', stage: 'Prospección', close_date: '', notes: '' });
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error');
      }
    } catch (err) {
      showNotification('danger', 'Error');
    }
  };

  // Add Budget
  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          ...budgetForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Presupuesto creado con éxito');
        setBudgetForm({ title: '', amount: '', status: 'Borrador', description: '' });
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error');
      }
    } catch (err) {
      showNotification('danger', 'Error');
    }
  };

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          title: taskForm.title,
          description: taskForm.description,
          due_date: taskForm.due_date,
          assigned_to: taskForm.assigned_to || user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Tarea agendada');
        setTaskForm({ title: '', description: '', due_date: '', assigned_to: '' });
        await loadCRMData();
      } else {
        showNotification('danger', data.error || 'Error');
      }
    } catch (err) {
      showNotification('danger', 'Error');
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showNotification('success', `Tarea marcada como ${nextStatus}`);
        await loadCRMData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getUserName = (userId) => {
    if (!userId) return '';
    const found = usersList.find(u => u.id === userId);
    return found ? found.name : userId.replace('usr_', '');
  };

  // ==========================================
  // FILTRADO DE CONTACTOS
  // ==========================================
  const filteredContacts = contacts.filter(c => {
    const fullName = `${c.name} ${c.last_name}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    const query = search.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Filtrado de Sub-registros para el contacto seleccionado
  const contactInteractions = selectedContact ? interactions.filter(i => i.contact_id === selectedContact.id) : [];
  const contactTransactions = selectedContact ? transactions.filter(t => t.contact_id === selectedContact.id) : [];
  const contactOpportunities = selectedContact ? opportunities.filter(o => o.contact_id === selectedContact.id) : [];
  const contactBudgets = selectedContact ? budgets.filter(b => b.contact_id === selectedContact.id) : [];
  const contactTasks = selectedContact ? tasks.filter(t => t.contact_id === selectedContact.id) : [];

  if (loading && contacts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando datos del CRM...</div>;
  }

  // Verificar si el usuario puede editar el contacto seleccionado
  const canEditSelected = selectedContact && (
    user.role === 'administrador' ||
    user.role === 'propietario' ||
    user.role === 'secretario' ||
    (user.role === 'vendedor' && selectedContact.assigned_to === user.id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {notification.message && (
        <div className={`alert-banner ${notification.type}`} style={{ position: 'fixed', top: '20px', right: '40px', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          <div>{notification.message}</div>
        </div>
      )}

      {/* HEADER DE CONTROL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar contactos por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <button onClick={handleOpenCreateContact} className="btn btn-primary">
          <Plus size={18} />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* TABLA PRINCIPAL DE CONTACTOS */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Puesto / Cargo</th>
                <th>Email / Teléfono</th>
                <th>Canal Preferido</th>
                <th>Ventas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                    No se encontraron contactos en la base de datos.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {c.name.substring(0, 2)}
                        </div>
                        <div>
                          <strong>{c.name} {c.last_name}</strong>
                          {c.assigned_to && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              Asignado a: {getUserName(c.assigned_to)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{c.job_title || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px' }}>{c.email || '-'}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phones || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: 'var(--border-radius-full)',
                        backgroundColor: 'var(--bg-tertiary)',
                        fontWeight: 600
                      }}>
                        {c.channel}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--success)' }}>
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(c.ltv) || 0)}
                      </strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setSelectedContact(c); setActiveDetailTab('perfil'); }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <ExternalLink size={14} style={{ marginRight: '4px' }} /> Ver Detalles
                        </button>
                        {(user.role === 'administrador' || user.role === 'propietario') && (
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="btn btn-icon"
                            style={{ width: '32px', height: '32px', color: 'var(--danger)', padding: 0 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLES DEL CONTACTO (CON PESTAÑAS SUB-FORMULARIOS) */}
      {selectedContact && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ width: '44px', height: '44px' }}>
                  {selectedContact.name.substring(0, 2)}
                </div>
                <div>
                  <h2 className="modal-title">{selectedContact.name} {selectedContact.last_name}</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Ficha comercial de cliente &bull; ID: {selectedContact.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="btn-icon"
                style={{ border: 'none' }}
              >
                ✕
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ padding: '0 24px' }}>
              <div className="tab-navigation">
                <button onClick={() => setActiveDetailTab('perfil')} className={`tab-btn ${activeDetailTab === 'perfil' ? 'active' : ''}`}>
                  <User size={14} style={{ marginRight: '4px' }} /> Perfil Comercial
                </button>
                <button onClick={() => setActiveDetailTab('interacciones')} className={`tab-btn ${activeDetailTab === 'interacciones' ? 'active' : ''}`}>
                  <Activity size={14} style={{ marginRight: '4px' }} /> Actividad ({contactInteractions.length})
                </button>
                <button onClick={() => setActiveDetailTab('tareas')} className={`tab-btn ${activeDetailTab === 'tareas' ? 'active' : ''}`}>
                  <CheckSquare size={14} style={{ marginRight: '4px' }} /> Tareas ({contactTasks.length})
                </button>
                {user.role !== 'secretario' && (
                  <>
                    <button onClick={() => setActiveDetailTab('transacciones')} className={`tab-btn ${activeDetailTab === 'transacciones' ? 'active' : ''}`}>
                      <DollarSign size={14} style={{ marginRight: '4px' }} /> Compras ({contactTransactions.length})
                    </button>
                    <button onClick={() => setActiveDetailTab('oportunidades')} className={`tab-btn ${activeDetailTab === 'oportunidades' ? 'active' : ''}`}>
                      <Plus size={14} style={{ marginRight: '4px' }} /> Oportunidades ({contactOpportunities.length})
                    </button>
                    <button onClick={() => setActiveDetailTab('presupuestos')} className={`tab-btn ${activeDetailTab === 'presupuestos' ? 'active' : ''}`}>
                      <FileText size={14} style={{ marginRight: '4px' }} /> Presupuestos ({contactBudgets.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="modal-body" style={{ minHeight: '380px' }}>

              {/* PESTAÑA: PERFIL */}
              {activeDetailTab === 'perfil' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="detail-section-title">Detalles Personales y Demográficos</h3>
                    {canEditSelected && (
                      <button
                        onClick={() => handleOpenEditContact(selectedContact)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        <Edit2 size={12} style={{ marginRight: '4px' }} /> Editar Perfil
                      </button>
                    )}
                  </div>

                  <div className="detail-layout">
                    {/* Información Básica */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                        <Briefcase size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div><strong>Puesto Laboral:</strong> {selectedContact.job_title || 'No asignado'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                        <Mail size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div><strong>Correo:</strong> {selectedContact.email || 'Sin correo'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                        <Phone size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div><strong>Teléfono:</strong> {selectedContact.phones || 'Sin teléfono'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                        <MapPin size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div><strong>Dirección Física:</strong> {selectedContact.address || 'Sin dirección'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}>
                        <User size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                        <div><strong>Redes Sociales:</strong> {selectedContact.social_profiles || 'Ninguna'}</div>
                      </div>
                    </div>

                    {/* Preferencias y Segmentación */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
                      <div>
                        <strong>Gustos y Necesidades:</strong>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedContact.preferences || 'No documentado'}</p>
                      </div>
                      <div>
                        <strong>Segmentación Demográfica/Psicográfica:</strong>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedContact.segmentation || 'No categorizado'}</p>
                      </div>
                      <div>
                        <strong>Canal de Comunicación Preferido:</strong>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedContact.channel || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PESTAÑA: INTERACCIONES */}
              {activeDetailTab === 'interacciones' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

                  {/* Historial */}
                  <div>
                    <h3 className="detail-section-title">Registro Histórico de Actividades</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                      {contactInteractions.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ningún contacto registrado.</p>
                      ) : (
                        contactInteractions.map(int => (
                          <div key={int.id} className="list-item-card" style={{ padding: '10px' }}>
                            <div className="list-item-header">
                              <span style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary)' }}>{int.type}</span>
                              <span>{new Date(int.date).toLocaleDateString('es-ES')}</span>
                            </div>
                            <p className="list-item-desc" style={{ fontSize: '12px' }}>{int.description}</p>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Agente: {int.agent_id.replace('usr_', '')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <h3 className="detail-section-title">Registrar Nueva Actividad</h3>
                    <form onSubmit={handleAddInteraction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Tipo de Contacto</label>
                        <select
                          className="form-select"
                          value={interactionForm.type}
                          onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                        >
                          <option value="Llamada">📞 Llamada Telefónica</option>
                          <option value="Correo">✉️ Correo Electrónico</option>
                          <option value="Reunión">🤝 Reunión Comercial</option>
                          <option value="Visita Comercial">💼 Visita de Comercial</option>
                          <option value="Soporte">🛠️ Ticket de Soporte</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Fecha y Hora</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={interactionForm.date}
                          onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Notas de Interacción</label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          placeholder="Temas tratados, conclusiones o acuerdos..."
                          value={interactionForm.description}
                          onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
                          required
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                        Guardar Actividad
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* PESTAÑA: TRANSACCIONES (COMPRAS) */}
              {activeDetailTab === 'transacciones' && user.role !== 'secretario' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

                  {/* Historial */}
                  <div>
                    <h3 className="detail-section-title">Historial de Compras</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {contactTransactions.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay transacciones guardadas.</p>
                      ) : (
                        contactTransactions.map(trx => (
                          <div key={trx.id} className="list-item-card" style={{ padding: '10px' }}>
                            <div className="list-item-header">
                              <strong>{trx.product_name}</strong>
                              <span>{new Date(trx.date).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                              <span>Cant: {trx.quantity} &times; ${trx.price}</span>
                              <strong style={{ color: 'var(--success)' }}>Total: ${trx.total}</strong>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <h3 className="detail-section-title">Registrar Nueva Venta</h3>
                    <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Producto / Servicio</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nombre del producto o pack adquirido"
                          value={transactionForm.product_name}
                          onChange={(e) => setTransactionForm({ ...transactionForm, product_name: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                          <label className="form-label">Cant.</label>
                          <input
                            type="number"
                            className="form-input"
                            value={transactionForm.quantity}
                            onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0, flex: 2 }}>
                          <label className="form-label">Precio Unitario ($ ARS)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Monto"
                            value={transactionForm.price}
                            onChange={(e) => setTransactionForm({ ...transactionForm, price: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Fecha de Compra</label>
                        <input
                          type="date"
                          className="form-input"
                          value={transactionForm.date}
                          onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                        Registrar Transacción
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* PESTAÑA: OPORTUNIDADES */}
              {activeDetailTab === 'oportunidades' && user.role !== 'secretario' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

                  {/* Historial */}
                  <div>
                    <h3 className="detail-section-title">Oportunidades en Curso</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {contactOpportunities.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay oportunidades vinculadas.</p>
                      ) : (
                        contactOpportunities.map(opp => (
                          <div key={opp.id} className="list-item-card" style={{ padding: '10px' }}>
                            <div className="list-item-header">
                              <strong>{opp.title}</strong>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: 'var(--border-radius-sm)',
                                fontWeight: 700,
                                backgroundColor: opp.stage === 'Cerrado Ganado' ? 'var(--success-light)' : opp.stage === 'Cerrado Perdido' ? 'var(--danger-light)' : 'var(--warning-light)',
                                color: opp.stage === 'Cerrado Ganado' ? 'var(--success)' : opp.stage === 'Cerrado Perdido' ? 'var(--danger)' : 'var(--warning)'
                              }}>
                                {opp.stage}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                              <span>Cierre estim.: {opp.close_date || '-'}</span>
                              <strong style={{ color: 'var(--primary)' }}>Valor: ${opp.value}</strong>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <h3 className="detail-section-title">Crear Oportunidad Comercial</h3>
                    <form onSubmit={handleAddOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Título del Trato</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: Licencias Enterprise v2.0"
                          value={opportunityForm.title}
                          onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                          <label className="form-label">Valor Estimado ($ ARS)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Importe"
                            value={opportunityForm.value}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, value: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0, flex: 1 }}>
                          <label className="form-label">Fase del Funnel</label>
                          <select
                            className="form-select"
                            value={opportunityForm.stage}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, stage: e.target.value })}
                          >
                            <option value="Prospección">Prospección</option>
                            <option value="Calificación">Calificación</option>
                            <option value="Propuesta">Propuesta</option>
                            <option value="Negociación">Negociación</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Cierre Esperado</label>
                        <input
                          type="date"
                          className="form-input"
                          value={opportunityForm.close_date}
                          onChange={(e) => setOpportunityForm({ ...opportunityForm, close_date: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                        Crear Trato
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* PESTAÑA: PRESUPUESTOS */}
              {activeDetailTab === 'presupuestos' && user.role !== 'secretario' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

                  {/* Historial */}
                  <div>
                    <h3 className="detail-section-title">Presupuestos Generados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {contactBudgets.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ningún presupuesto registrado.</p>
                      ) : (
                        contactBudgets.map(bud => (
                          <div key={bud.id} className="list-item-card" style={{ padding: '10px' }}>
                            <div className="list-item-header">
                              <strong>{bud.title}</strong>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: 'var(--border-radius-sm)',
                                fontWeight: 700,
                                backgroundColor: bud.status === 'Firmado' ? 'var(--success-light)' : bud.status === 'Rechazado' ? 'var(--danger-light)' : 'var(--warning-light)',
                                color: bud.status === 'Firmado' ? 'var(--success)' : bud.status === 'Rechazado' ? 'var(--danger)' : 'var(--warning)'
                              }}>
                                {bud.status}
                              </span>
                            </div>
                            <p className="list-item-desc" style={{ fontSize: '12px', margin: '4px 0' }}>{bud.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                              <span style={{ color: 'var(--text-tertiary)' }}>Creado: {bud.date_created}</span>
                              <span style={{ color: 'var(--primary)' }}>Monto: ${bud.amount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <h3 className="detail-section-title">Generar Presupuesto</h3>
                    <form onSubmit={handleAddBudget} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Título del Presupuesto</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: Presupuesto Licencias Standard v1.0"
                          value={budgetForm.title}
                          onChange={(e) => setBudgetForm({ ...budgetForm, title: e.target.value })}
                          required
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0, flex: 2 }}>
                          <label className="form-label">Total Presupuestado ($ ARS)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Monto total"
                            value={budgetForm.amount}
                            onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0, flex: 1.5 }}>
                          <label className="form-label">Estado Inicial</label>
                          <select
                            className="form-select"
                            value={budgetForm.status}
                            onChange={(e) => setBudgetForm({ ...budgetForm, status: e.target.value })}
                          >
                            <option value="Borrador">Borrador</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Firmado">Firmado</option>
                            <option value="Rechazado">Rechazado</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Condiciones / Detalle</label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          placeholder="Especifica los conceptos, horas de trabajo, o licencias incluidas..."
                          value={budgetForm.description}
                          onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                        Emitir Presupuesto
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* PESTAÑA: TAREAS */}
              {activeDetailTab === 'tareas' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

                  {/* Historial */}
                  <div>
                    <h3 className="detail-section-title">Tareas Comerciales Programadas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {contactTasks.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No hay tareas agendadas.</p>
                      ) : (
                        contactTasks.map(tsk => (
                          <div key={tsk.id} style={{ display: 'flex', gap: '12px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                            <input
                              type="checkbox"
                              checked={tsk.status === 'Completada'}
                              onChange={() => handleToggleTaskStatus(tsk)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '2px' }}
                            />
                            <div style={{ flexGrow: 1 }}>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, textDecoration: tsk.status === 'Completada' ? 'line-through' : 'none', color: tsk.status === 'Completada' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {tsk.title}
                              </h4>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tsk.description}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                                <span>Vence: {tsk.due_date}</span>
                                <span>Agente: {tsk.assigned_to.replace('usr_', '')}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Formulario */}
                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <h3 className="detail-section-title">Agendar Nueva Tarea</h3>
                    <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Acción Comercial</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ej: Llamar para validar feedback"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label font-label">Fecha Límite</label>
                        <input
                          type="date"
                          className="form-input"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Asignado a (Agente)</label>
                        <select
                          className="form-select"
                          value={taskForm.assigned_to}
                          onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                        >
                          <option value={user.id}>Mí mismo</option>
                          {usersList.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Descripción</label>
                        <textarea
                          className="form-textarea"
                          rows="2"
                          placeholder="Detalles sobre lo que se debe hacer..."
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                        Agendar Tarea
                      </button>
                    </form>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CONTACTO */}
      {contactModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editContactMode ? 'Modificar Ficha de Contacto' : 'Dar de Alta Nuevo Contacto'}</h2>
              <button onClick={() => setContactModalOpen(false)} className="btn-icon" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleSaveContact}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Apellidos *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={contactForm.last_name}
                      onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Teléfonos</label>
                    <input
                      type="text"
                      className="form-input"
                      value={contactForm.phones}
                      onChange={(e) => setContactForm({ ...contactForm, phones: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Puesto Laboral</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Director IT"
                      value={contactForm.job_title}
                      onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Canal Preferido</label>
                    <select
                      className="form-select"
                      value={contactForm.channel}
                      onChange={(e) => setContactForm({ ...contactForm, channel: e.target.value })}
                    >
                      <option value="Correo electrónico">Correo electrónico</option>
                      <option value="Llamada telefónica">Llamada telefónica</option>
                      <option value="Reunión presencial">Reunión presencial</option>
                      <option value="Videollamada">Videollamada</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Dirección Física</label>
                  <input
                    type="text"
                    className="form-input"
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Perfiles en Redes Sociales</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: LinkedIn: linkedin.com/in/nombre"
                    value={contactForm.social_profiles}
                    onChange={(e) => setContactForm({ ...contactForm, social_profiles: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Preferencias y Comportamiento</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Gustos, hábitos de compra, necesidades específicas..."
                    value={contactForm.preferences}
                    onChange={(e) => setContactForm({ ...contactForm, preferences: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Segmentación Demográfica/Psicográfica</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Edad 30-40, Directivo, Innovador"
                    value={contactForm.segmentation}
                    onChange={(e) => setContactForm({ ...contactForm, segmentation: e.target.value })}
                  />
                </div>

                {/* Mostrar asignación de agente solo para Admin / Propietario */}
                {(user.role === 'administrador' || user.role === 'propietario') && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Agente Asignado (Propietario)</label>
                    <select
                      className="form-select"
                      value={contactForm.assigned_to}
                      onChange={(e) => setContactForm({ ...contactForm, assigned_to: e.target.value })}
                    >
                      <option value="">Ninguno</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setContactModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Contacto</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
