import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResultsManager from './ResultsManager';
import EventManager from './EventManager';
import { useAuth } from '../context/AuthContext';
import ChatManager from './ChatManager';
import Prizes from './Prizes';
import BatchLoadMatches from './admin/BatchLoadMatches';

const adminTitleStyle = "font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider";
const adminInputStyle = "w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors";
const adminSelectStyle = "w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors";
const adminButtonStyle = "px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50";

const FormInput = ({ id, label, type, value, onChange, required = true, min }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-texto-secundario mb-1">{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={adminInputStyle}
      required={required}
      min={min}
    />
  </div>
);

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventCreator = ({ onEventCreated }) => {
  const [eventName, setEventName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentDateTime = new Date();
    const selectedDateTime = new Date(closeDate);

    if (selectedDateTime < currentDateTime) {
      setMessage({ type: 'error', text: 'La fecha límite no puede ser en el pasado.' });
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/events`, { name: eventName, close_date: closeDate }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: `¡Evento "${response.data.name}" creado!` });
      onEventCreated(response.data);
      setEventName('');
      setCloseDate('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al crear el evento.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput id="eventName" label="Nombre del Evento" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} />
      <FormInput id="closeDate" label="Fecha Límite" type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} min={getCurrentDateTimeLocal()} />
      <button type="submit" className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 w-full bg-primario">Crear Evento</button>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </form>
  );
};

const MatchManager = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // State for the Add New Match form
  const [newLocalTeam, setNewLocalTeam] = useState('');
  const [newVisitorTeam, setNewVisitorTeam] = useState('');
  const [newMatchDatetime, setNewMatchDatetime] = useState('');

  // State for inline editing
  const [editingMatch, setEditingMatch] = useState(null); 

  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedEvent) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/matches/${selectedEvent}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        setMatches(response.data);
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al cargar los partidos.' });
      }
      setLoading(false);
    };

    fetchMatches();
  }, [selectedEvent]);

  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un evento.' });
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const payload = { 
        event_id: selectedEvent, 
        local_team: newLocalTeam, 
        visitor_team: newVisitorTeam, 
        match_datetime: newMatchDatetime
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/matches`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: '¡Partido agregado exitosamente!' });
      setNewLocalTeam('');
      setNewVisitorTeam('');
      setNewMatchDatetime('');
      // Refresh matches list
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/matches/${selectedEvent}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setMatches(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al agregar el partido.' });
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este partido?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/matches/${matchId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Partido eliminado.' });
      setMatches(matches.filter(m => m.id !== matchId));
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar el partido.' });
    }
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    const token = localStorage.getItem('token');
    try {
      const payload = { 
        local_team: editingMatch.local_team, 
        visitor_team: editingMatch.visitor_team, 
        match_datetime: editingMatch.match_datetime.substring(0, 16) // Formato para datetime-local
      };
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/matches/${editingMatch.id}`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: 'Partido actualizado.' });
      setEditingMatch(null);
      // Refresh matches list
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/matches/${selectedEvent}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setMatches(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el partido.' });
    }
  };

  const handleEditChange = (e) => {
    setEditingMatch({ ...editingMatch, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-8">
      {/* Event Selector */}
      <div>
        <label htmlFor="event-select" className="block text-sm font-bold text-texto-secundario mb-1">Seleccionar Evento</label>
        <select id="event-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className={adminSelectStyle}>
          {events.length > 0 ? events.map(event => <option key={event.id} value={event.id}>{event.name}</option>) : <option disabled>No hay eventos disponibles.</option>}
        </select>
      </div>

      {message.text && <p className={`my-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}

      {/* Matches List */}
      <div className="space-y-4">
        <h4 className="text-lg font-display font-semibold text-texto-principal">Partidos del Evento</h4>
        {loading ? <p>Cargando partidos...</p> : matches.map(match => (
          <div key={match.id} className="bg-fondo-principal p-4 rounded-lg shadow-md">
            {editingMatch && editingMatch.id === match.id ? (
              <form onSubmit={handleUpdateMatch} className="space-y-4">
                <FormInput id="edit-local" label="Local" type="text" name="local_team" value={editingMatch.local_team} onChange={handleEditChange} />
                <FormInput id="edit-visitor" label="Visitante" type="text" name="visitor_team" value={editingMatch.visitor_team} onChange={handleEditChange} />
                <FormInput id="edit-datetime" label="Fecha y Hora" type="datetime-local" name="match_datetime" value={editingMatch.match_datetime.substring(0, 16)} onChange={handleEditChange} />
                <div className="flex gap-4">
                  <button type="submit" className={`${adminButtonStyle} w-full bg-confirmacion`}>Guardar</button>
                  <button type="button" onClick={() => setEditingMatch(null)} className={`${adminButtonStyle} w-full bg-gray-500`}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <p className="font-bold text-texto-principal">{match.local_team} vs {match.visitor_team}</p>
                  <p className="text-sm text-texto-secundario">{new Date(match.match_datetime).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button onClick={() => setEditingMatch(match)} className={`${adminButtonStyle} bg-secundario text-black text-sm`}>Editar</button>
                  <button onClick={() => handleDeleteMatch(match.id)} className={`${adminButtonStyle} bg-primario text-sm`}>Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {matches.length === 0 && !loading && <p>No hay partidos para este evento.</p>}
      </div>

      {/* Add Match Form */}
      <div className="border-t border-texto-secundario/20 pt-8">
        <h4 className="text-lg font-display font-semibold text-texto-principal mb-4">Agregar Nuevo Partido</h4>
        <form onSubmit={handleAddMatch} className="space-y-4">
          <FormInput id="newLocalTeam" label="Equipo Local" type="text" value={newLocalTeam} onChange={(e) => setNewLocalTeam(e.target.value)} />
          <FormInput id="newVisitorTeam" label="Equipo Visitante" type="text" value={newVisitorTeam} onChange={(e) => setNewVisitorTeam(e.target.value)} />
          <FormInput id="newMatchDatetime" label="Fecha y Hora del Partido" type="datetime-local" value={newMatchDatetime} onChange={(e) => setNewMatchDatetime(e.target.value)} />
          <button type="submit" className={`${adminButtonStyle} w-full bg-confirmacion`}>Agregar Partido</button>
        </form>
      </div>
    </div>
  );
};

const KeyGenerator = () => {
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    setNewKey(null);
    setCopied(false);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/generate-key`, { quantity: parseInt(quantity, 10) }, { headers: { 'Authorization': `Bearer ${token}` } });
      setNewKey(response.data);
    } catch (err) {
      setError('Error al generar la llave.');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="space-y-4">
      <FormInput id="quantity" label="Cantidad de Llaves en el Código" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <button onClick={handleGenerateKey} disabled={loading} className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 w-full bg-secundario text-black">{loading ? 'Generando...' : 'Generar Código'}</button>
      {error && <p className="mt-4 text-primario">{error}</p>}
      {newKey && (
        <div className="mt-4 p-4 bg-fondo-principal rounded-lg">
          <p className="text-texto-secundario">Código Generado (vale por {newKey.quantity} llaves):</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-confirmacion font-mono text-lg break-all flex-grow">{newKey.key_code}</p>
            <button onClick={handleCopy} className={`px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 ${copied ? 'bg-confirmacion' : 'bg-primario'} text-sm`}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const UserManager = ({ profile }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listMessage, setListMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(response.data);
    } catch (error) {
      setListMessage({ type: 'error', text: 'Error al cargar los usuarios.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, { username, password, email, role }, { headers: { 'Authorization': `Bearer ${token}` } });
      setCreateMessage({ type: 'success', text: `¡Usuario "${username}" creado!` });
      fetchUsers();
      setUsername(''); setPassword(''); setEmail(''); setRole('player');
      setShowCreateForm(false);
    } catch (error) {
      setCreateMessage({ type: 'error', text: error.response?.data?.message || 'Error al crear el usuario.' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/role`, { role: newRole }, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setListMessage({ type: 'success', text: 'Rol actualizado.' });
      setTimeout(() => setListMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setListMessage({ type: 'error', text: 'Error al actualizar el rol.' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(users.filter(u => u.id !== userId));
      setListMessage({ type: 'success', text: 'Usuario eliminado.' });
      setTimeout(() => setListMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setListMessage({ type: 'error', text: error.response?.data?.message || 'Error al eliminar.' });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'activar' : 'desactivar';
    if (!window.confirm(`¿Estás seguro de que quieres ${actionText} este usuario?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/status`, { is_active: newStatus }, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
      setListMessage({ type: 'success', text: `Usuario ${actionText}ado.` });
      setTimeout(() => setListMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setListMessage({ type: 'error', text: error.response?.data?.message || `Error al ${actionText}.` });
    }
  };

  const handleToggleMute = async (userId, currentMuteStatus) => {
    const newMuteStatus = !currentMuteStatus;
    const actionText = newMuteStatus ? 'silenciar' : 'reactivar';
    if (!window.confirm(`¿Estás seguro de que quieres ${actionText} a este usuario?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/mute`, { is_muted: newMuteStatus }, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(users.map(u => u.id === userId ? { ...u, is_muted: newMuteStatus } : u));
      setListMessage({ type: 'success', text: `Usuario ${actionText}ado.` });
      setTimeout(() => setListMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setListMessage({ type: 'error', text: error.response?.data?.message || `Error al ${actionText}.` });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="border-b border-texto-secundario/20 pb-6">
        <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 w-full ${showCreateForm ? 'bg-primario' : 'bg-confirmacion'}`}>
            {showCreateForm ? 'Cancelar Creación' : 'Crear Nuevo Usuario'}
        </button>

        {showCreateForm && (
            <form onSubmit={handleCreateUser} className="space-y-4 mt-6">
              <FormInput id="email" label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <FormInput id="username" label="Nombre de Usuario" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              <FormInput id="password" label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div>
                <label htmlFor="role-select" className="block text-sm font-bold text-texto-secundario mb-1">Rol</label>
                <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)} className={adminSelectStyle}>
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 w-full bg-primario">Confirmar Creación</button>
              {createMessage.text && <p className={`mt-2 text-center text-sm ${createMessage.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{createMessage.text}</p>}
            </form>
        )}
      </div>
      
      <div>
        <h4 className="text-lg font-display font-semibold text-texto-principal mb-4">Gestionar Usuarios</h4>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre de usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={adminInputStyle}
          />
        </div>
        {listMessage.text && <p className={`mb-4 text-center text-sm ${listMessage.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{listMessage.text}</p>}
        {loading ? <p>Cargando usuarios...</p> : (
          <ul className="space-y-4">
            {filteredUsers.map(user => (
              <li key={user.id} className="bg-fondo-principal p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <p className="font-bold text-texto-principal text-lg">{user.username}</p>
                    <p className="text-sm text-texto-secundario">{user.email}</p>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.is_active ? 'bg-confirmacion text-white' : 'bg-primario text-white'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {user.is_muted && (
                        <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-yellow-500 text-black">
                          Silenciado
                        </span>
                      )}
                      <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-gray-600 text-white">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {profile && profile.role === 'admin' && user.id !== profile.id && (
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className={`${adminSelectStyle} text-sm py-1`}>
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {user.role !== 'admin' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleStatus(user.id, user.is_active)} className={`text-white font-bold py-1 px-3 rounded-md text-sm transition-all ${user.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-confirmacion hover:bg-green-600'}`}>
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => handleToggleMute(user.id, user.is_muted)} className={`text-white font-bold py-1 px-3 rounded-md text-sm transition-all ${user.is_muted ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}>
                          {user.is_muted ? 'Reactivar' : 'Silenciar'}
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="bg-primario hover:brightness-110 text-white font-bold py-1 px-3 rounded-md text-sm transition-all">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const PasswordResetter = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm(`¿Estás seguro de que quieres resetear la contraseña para ${email}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reset-password`,
        { email, newPassword },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: response.data.message });
      setEmail('');
      setNewPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al resetear la contraseña.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="reset-email"
        label="Email del Usuario"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormInput
        id="new-password"
        label="Nueva Contraseña"
        type="text"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button type="submit" className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 w-full bg-primario">
        Resetear Contraseña
      </button>
      {message.text && (
        <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
};




// COMPONENTE PRINCIPAL
function AdminPanel({ onLeaderboardUpdate }) {
  const { user: authInfo } = useAuth();
  const profile = authInfo?.user;
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('manageEvents');

  const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/events`, { headers: { 'Authorization': `Bearer ${token}` } });
      setEvents(response.data);
    } catch (error) {
      console.error("Error al cargar los eventos", error);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    setActiveTab('matches');
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento? Se borrarán todos sus partidos y predicciones. Esta acción es irreversible.')) {
        return;
    }
    const token = localStorage.getItem('token');
    try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchEvents();
    } catch (error) {
        console.error("Error al eliminar el evento", error);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'createEvent': return <EventCreator onEventCreated={handleEventCreated} />;
      case 'manageEvents': return <EventManager events={events} onDeleteEvent={handleDeleteEvent} />;
      case 'matches': return <MatchManager events={events} />;
      case 'results': return <ResultsManager events={events} onLeaderboardUpdate={onLeaderboardUpdate} />;
      case 'keys': return <KeyGenerator />;
      case 'users': return <UserManager profile={profile} />;
      case 'chat': return <ChatManager />;
      case 'premios': return <Prizes />;
      case 'resetPassword': return <PasswordResetter />;
      case 'batchLoad': return <BatchLoadMatches />;
      default: return null;
    }
  };

  const TabButton = ({ tabName, children }) => (
    <button onClick={() => setActiveTab(tabName)} className={`py-2 px-4 font-display font-bold uppercase tracking-wider transition-colors ${activeTab === tabName ? 'text-secundario border-b-2 border-secundario' : 'text-texto-secundario hover:text-white'}`}>
      {children}
    </button>
  );

  return (
    <div className="bg-tarjeta p-5 rounded-lg shadow-lg mt-6">
      <h3 className={adminTitleStyle}>Panel de Administrador</h3>
      <div className="flex flex-wrap justify-center border-b border-texto-secundario/20 mb-6">
        <TabButton tabName="manageEvents">Gestionar Eventos</TabButton>
        <TabButton tabName="createEvent">Crear Evento</TabButton>
        <TabButton tabName="matches">Partidos</TabButton>
        <TabButton tabName="results">Resultados</TabButton>
        <TabButton tabName="keys">Llaves</TabButton>
        <TabButton tabName="users">Usuarios</TabButton>
        <TabButton tabName="chat">Chat</TabButton>
        <TabButton tabName="premios">Premios</TabButton>
        <TabButton tabName="resetPassword">Reset Pass</TabButton>
        <TabButton tabName="batchLoad">Carga Rápida</TabButton>
      </div>
      <div className="max-w-lg mx-auto">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default AdminPanel;