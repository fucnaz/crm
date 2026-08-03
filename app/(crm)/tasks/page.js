'use client';

import React, { useState, useEffect, useContext } from 'react';
import { CRMContext } from '../layout';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Link as LinkIcon,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function TasksPage() {
  const { user } = useContext(CRMContext);
  
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [assigneeFilter, setAssigneeFilter] = useState('me'); // 'me' or 'all'
  const [statusFilter, setStatusFilter] = useState('pendiente'); // 'pendiente', 'completada', 'all'

  // Crear Tarea Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
    contact_id: ''
  });

  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadTasksData = async () => {
    try {
      setLoading(true);
      const [tasksRes, contactsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/contacts')
      ]);

      const tasksData = await tasksRes.json();
      const contactsData = await contactsRes.json();

      setTasks(tasksData.tasks || []);
      setContacts(contactsData.contacts || []);

      // Cargar lista de usuarios (si es admin) o resolver los nombres
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData.users || []);
      }
    } catch (e) {
      console.error(e);
      showNotification('Error al consultar tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksData();
  }, []);

  const getContactName = (contactId) => {
    if (!contactId) return 'General (Sin contacto)';
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.name} ${contact.last_name}` : 'Contacto no encontrado';
  };

  const getUserName = (userId) => {
    const u = usersList.find(item => item.id === userId);
    return u ? u.name : userId.replace('usr_', '');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          assigned_to: taskForm.assigned_to || user.id
        })
      });

      if (res.ok) {
        showNotification('Tarea agendada con éxito');
        setCreateModalOpen(false);
        setTaskForm({ title: '', description: '', due_date: '', assigned_to: '', contact_id: '' });
        await loadTasksData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Error al guardar tarea');
      }
    } catch (err) {
      showNotification('Error');
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showNotification(`Tarea marcada como ${nextStatus}`);
        await loadTasksData();
      }
    } catch (err) {
      showNotification('Error al actualizar estado');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm('¿Deseas eliminar esta tarea comercial?')) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Tarea eliminada');
        await loadTasksData();
      } else {
        const err = await res.json();
        showNotification(err.error || 'No tienes permisos para borrar esta tarea');
      }
    } catch (e) {
      showNotification('Error al conectar');
    }
  };

  if (loading && tasks.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando administrador de tareas...</div>;
  }

  // ==========================================
  // FILTRADO DE TAREAS
  // ==========================================
  const filteredTasks = tasks.filter(task => {
    // Filtro de asignado
    const matchAssignee = assigneeFilter === 'all' || task.assigned_to === user.id;
    
    // Filtro de estado
    const matchStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pendiente' && task.status === 'Pendiente') ||
      (statusFilter === 'completada' && task.status === 'Completada');

    return matchAssignee && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {notification && (
        <div className="alert-banner info" style={{ position: 'fixed', top: '20px', right: '40px', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          <AlertCircle size={18} />
          <div>{notification}</div>
        </div>
      )}

      {/* FILTROS Y HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Asignación */}
          <div className="form-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ fontSize: '13px' }}>Asignación:</span>
            <select 
              className="form-select" 
              value={assigneeFilter} 
              onChange={(e) => setAssigneeFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="me">Mis Tareas</option>
              <option value="all">Todas las Tareas</option>
            </select>
          </div>

          {/* Estado */}
          <div className="form-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ fontSize: '13px' }}>Estado:</span>
            <select 
              className="form-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="pendiente">Pendientes</option>
              <option value="completada">Completadas</option>
              <option value="all">Ver Todas</option>
            </select>
          </div>

        </div>

        <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* LISTADO DE TAREAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <CheckCircle size={40} style={{ color: 'var(--success)', marginBottom: '12px', opacity: 0.7 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No hay tareas para mostrar</h3>
            <p className="card-subtext">Ajusta los filtros o crea una nueva tarea arriba</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isDueTomorrow = task.status === 'Pendiente' && (() => {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const formatLocalDateStr = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              return task.due_date === formatLocalDateStr(tomorrow);
            })();

            const isOverdue = task.status === 'Pendiente' && !isDueTomorrow && (() => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const parts = task.due_date.split('-');
              if (parts.length !== 3) return false;
              const taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              taskDate.setHours(0,0,0,0);
              return taskDate < today;
            })();
            
            return (
              <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderLeft: task.status === 'Completada' ? '4px solid var(--success)' : isOverdue ? '4px solid var(--danger)' : isDueTomorrow ? '4px solid var(--warning)' : '4px solid var(--border-color)' }}>
                {/* Checkbox */}
                <input 
                  type="checkbox" 
                  checked={task.status === 'Completada'} 
                  onChange={() => handleToggleStatus(task)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                  title="Marcar estado"
                />

                {/* Detalles */}
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ 
                      fontSize: '15px', 
                      fontWeight: 700, 
                      textDecoration: task.status === 'Completada' ? 'line-through' : 'none',
                      color: task.status === 'Completada' ? 'var(--text-tertiary)' : 'var(--text-primary)'
                    }}>
                      {task.title}
                    </h4>
                    {isDueTomorrow && (
                      <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 6px', borderRadius: 'var(--border-radius-sm)' }}>
                        ⚠️ VENCE MAÑANA
                      </span>
                    )}
                    {isOverdue && (
                      <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 6px', borderRadius: 'var(--border-radius-sm)' }}>
                        VENCIDA
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {task.description || 'Sin descripción descriptiva.'}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> Agente: {getUserName(task.assigned_to)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <LinkIcon size={12} /> {getContactName(task.contact_id)}
                    </span>
                  </div>
                </div>

                {/* Eliminar */}
                <button 
                  onClick={() => handleDeleteTask(task)}
                  className="btn-icon" 
                  style={{ color: 'var(--danger)', border: 'none', background: 'none' }}
                  title="Eliminar tarea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CREAR TAREA */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title font-bold">Agendar Nueva Tarea Comercial</h2>
              <button onClick={() => setCreateModalOpen(false)} className="btn-icon" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Título de la Tarea *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej: Llamar por teléfono para acordar reunión"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Fecha Límite *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Asignado a (Agente)</label>
                    <select 
                      className="form-select" 
                      value={taskForm.assigned_to} 
                      onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    >
                      <option value="">Cargando agentes...</option>
                      <option value={user.id}>Mí mismo</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contacto / Cliente Relacionado</label>
                  <select 
                    className="form-select" 
                    value={taskForm.contact_id} 
                    onChange={(e) => setTaskForm({ ...taskForm, contact_id: e.target.value })}
                  >
                    <option value="">General (No vinculado a ningún contacto)</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Describe los temas a tratar o la razón de la tarea comercial..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Agendar Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
