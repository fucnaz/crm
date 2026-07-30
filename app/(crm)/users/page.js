'use client';

import React, { useState, useEffect, useContext } from 'react';
import { CRMContext } from '../layout';
import { Plus, User, Mail, Shield, ShieldAlert, Edit2, Trash2, Key, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useContext(CRMContext);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'vendedor'
  });

  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const err = await res.json();
        setError(err.error || 'No autorizado para ver este panel');
      }
    } catch (e) {
      setError('Error al consultar usuarios del servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setForm({ id: '', name: '', email: '', password: '', role: 'vendedor' });
    setEditMode(false);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Contraseña vacía por defecto al editar
      role: user.role
    });
    setEditMode(true);
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const url = editMode ? `/api/users/${form.id}` : '/api/users';
      const method = editMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(editMode ? 'Usuario actualizado con éxito' : 'Nuevo usuario registrado');
        setModalOpen(false);
        await loadUsers();
      } else {
        alert(data.error || 'Error al guardar el usuario');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      showNotification('No puedes eliminar tu propia cuenta de administrador en sesión');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario del sistema? Se perderá el acceso de esta persona.')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Usuario eliminado');
        await loadUsers();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Error al eliminar usuario');
      }
    } catch (err) {
      showNotification('Error al conectar');
    }
  };

  if (loading && users.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando administrador de accesos...</div>;
  }

  if (error) {
    return (
      <div className="alert-banner danger" style={{ margin: '40px' }}>
        <ShieldAlert size={20} />
        <div>
          <strong>Error de Acceso:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {notification && (
        <div className="alert-banner info" style={{ position: 'fixed', top: '20px', right: '40px', zIndex: 1000, boxShadow: 'var(--shadow-lg)' }}>
          <Shield size={18} />
          <div>{notification}</div>
        </div>
      )}

      {/* HEADER DE CONTROL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Gestiona las cuentas de acceso del personal de Gestion Smart y asigna sus respectivos niveles de permisos.
        </p>
        
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Nombre de Usuario</th>
              <th>Correo Electrónico</th>
              <th>Permisos / Rol</th>
              <th>ID Sistema</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = u.id === currentUser.id;
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {u.name.substring(0, 2)}
                      </div>
                      <div>
                        <strong>{u.name}</strong> {isSelf && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>(Tú)</span>}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`user-role-badge ${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td><code style={{ fontSize: '12px' }}>{u.id}</code></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Edit2 size={12} style={{ marginRight: '4px' }} /> Editar
                      </button>
                      
                      <button 
                        disabled={isSelf}
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn btn-icon" 
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          color: isSelf ? 'var(--text-tertiary)' : 'var(--danger)', 
                          padding: 0,
                          cursor: isSelf ? 'not-allowed' : 'pointer'
                        }}
                        title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar cuenta'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR USUARIO */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editMode ? 'Modificar Datos de la Cuenta' : 'Registrar Nueva Cuenta de Acceso'}</h2>
              <button onClick={() => setModalOpen(false)} className="btn-icon" style={{ border: 'none' }}>✕</button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="ejemplo@gestionsmart.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editMode ? 'Nueva Contraseña (Dejar vacío para mantener la actual)' : 'Contraseña de Acceso *'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Key size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-input" 
                      placeholder={editMode ? '••••••••' : 'Mínimo 6 caracteres'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editMode}
                      minLength={6}
                      style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nivel de Permisos (Rol)</label>
                  <select 
                    className="form-select" 
                    value={form.role}
                    disabled={editMode && form.id === currentUser.id} // Evitar quitarse el admin a sí mismo
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {currentUser.role === 'administrador' && (
                      <option value="administrador">Administrador (Control total)</option>
                    )}
                    <option value="propietario">Propietario / Dirección (Visualiza finanzas y LTV)</option>
                    <option value="vendedor">Vendedor (Solo gestiona sus tratos y clientes asignados)</option>
                    <option value="secretario">Secretario / Soporte (Registra contactos y actividades)</option>
                  </select>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cuenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
