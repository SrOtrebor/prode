import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResultsManager from './ResultsManager';

// --- Estilos Base para Componentes del Panel ---
const adminTitleStyle = "font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider";
const adminInputStyle = "w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors";
const adminSelectStyle = `${adminInputStyle}`;
const adminButtonStyle = "px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50";

// --- Componentes Reutilizables ---
const FormInput = ({ id, label, type, value, onChange, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-bold text-texto-secundario mb-1">{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className={adminInputStyle}
      required={required}
    />
  </div>
);

// --- Sub-componentes del Panel ---

const EventCreator = ({ onEventCreated }) => {
  const [eventName, setEventName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <FormInput id="closeDate" label="Fecha Límite" type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
      <button type="submit" className={`${adminButtonStyle} w-full bg-primario`}>Crear Evento</button>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </form>
  );
};

const MatchManager = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [localTeam, setLocalTeam] = useState('');
  const [visitorTeam, setVisitorTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (events.length > 0) setSelectedEvent(events[0].id);
  }, [events]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return setMessage({ type: 'error', text: 'Por favor, selecciona un evento.' });
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/matches`, { event_id: selectedEvent, local_team: localTeam, visitor_team: visitorTeam, match_date: matchDate }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: '¡Partido agregado exitosamente!' });
      setLocalTeam('');
      setVisitorTeam('');
      setMatchDate('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al agregar el partido.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="event-select" className="block text-sm font-bold text-texto-secundario mb-1">Seleccionar Evento</label>
        <select id="event-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className={adminSelectStyle}>
          {events.length > 0 ? events.map(event => <option key={event.id} value={event.id}>{event.name}</option>) : <option disabled>No hay eventos disponibles.</option>}
        </select>
      </div>
      <FormInput id="localTeam" label="Equipo Local" type="text" value={localTeam} onChange={(e) => setLocalTeam(e.target.value)} />
      <FormInput id="visitorTeam" label="Equipo Visitante" type="text" value={visitorTeam} onChange={(e) => setVisitorTeam(e.target.value)} />
      <FormInput id="matchDate" label="Fecha del Partido" type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
      <button type="submit" className={`${adminButtonStyle} w-full bg-confirmacion`}>Agregar Partido</button>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </form>
  );
};

const KeyGenerator = () => {
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    setNewKey(null);
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/generate-key`, { quantity: parseInt(quantity, 10) }, { headers: { 'Authorization': `Bearer ${token}` } });
      setNewKey(response.data);
    } catch (err) {
      setError('Error al generar la llave.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <FormInput id="quantity" label="Cantidad de Llaves en el Código" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <button onClick={handleGenerateKey} disabled={loading} className={`${adminButtonStyle} w-full bg-secundario text-black`}>{loading ? 'Generando...' : 'Generar Código'}</button>
      {error && <p className="mt-4 text-primario">{error}</p>}
      {newKey && (
        <div className="mt-4 p-4 bg-fondo-principal rounded-lg">
          <p className="text-texto-secundario">Código Generado (vale por {newKey.quantity} llaves):</p>
          <p className="text-confirmacion font-mono text-lg break-all">{newKey.key_code}</p>
          <p className="text-xs text-texto-secundario mt-2">(Cópialo y compártelo con el usuario)</p>
        </div>
      )}
    </div>
  );
};

const UserManager = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listMessage, setListMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        setUsers(response.data);
      } catch (error) {
        setListMessage({ type: 'error', text: 'Error al cargar los usuarios.' });
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`, { username, password, email, role }, { headers: { 'Authorization': `Bearer ${token}` } });
      setCreateMessage({ type: 'success', text: `¡Usuario "${response.data.username}" creado!` });
      setUsers(prevUsers => [...prevUsers, response.data]);
      setUsername(''); setPassword(''); setEmail(''); setRole('player');
    } catch (error) {
      setCreateMessage({ type: 'error', text: error.response?.data?.message || 'Error al crear el usuario.' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/role`, { role: newRole }, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setListMessage({ type: 'success', text: 'Rol actualizado correctamente.' });
      setTimeout(() => setListMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setListMessage({ type: 'error', text: 'Error al actualizar el rol.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-lg font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">Crear Nuevo Usuario</h4>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <FormInput id="email" label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput id="username" label="Nombre de Usuario" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          <FormInput id="password" label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div>
            <label htmlFor="role-select" className="block text-sm font-bold text-texto-secundario mb-1">Rol</label>
            <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)} className={adminSelectStyle}>
              <option value="player">Player</option>
              <option value="vip">VIP</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className={`${adminButtonStyle} w-full bg-primario`}>Crear Usuario</button>
          {createMessage.text && <p className={`mt-2 text-center text-sm ${createMessage.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{createMessage.text}</p>}
        </form>
      </div>
      <div>
        <h4 className="text-lg font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">Gestionar Usuarios</h4>
        {listMessage.text && <p className={`mb-4 text-center text-sm ${listMessage.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{listMessage.text}</p>}
        {loading ? <p>Cargando usuarios...</p> : (
          <ul className="space-y-3">
            {users.map(user => (
              <li key={user.id} className="flex flex-col sm:flex-row items-center justify-between bg-fondo-principal p-3 rounded-md">
                <span className="font-medium text-texto-principal mb-2 sm:mb-0">{user.username}</span>
                <div className="flex items-center">
                  <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className={`${adminSelectStyle} text-sm`}>
                    <option value="player">Player</option>
                    <option value="vip">VIP</option>
                    <option value="admin">Admin</option>
                  </select>
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/reset-password`, { email, newPassword }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: response.data.message });
      setEmail(''); setNewPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al resetear la contraseña.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput id="reset-email" label="Email del Usuario" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <FormInput id="new-password" label="Nueva Contraseña" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <button type="submit" className={`${adminButtonStyle} w-full bg-primario`}>Resetear Contraseña</button>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </form>
  );
};


// COMPONENTE PRINCIPAL
function AdminPanel() {
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('events');

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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events': return <EventCreator onEventCreated={handleEventCreated} />;
      case 'matches': return <MatchManager events={events} />;
      case 'results': return <ResultsManager events={events} />;
      case 'keys': return <KeyGenerator />;
      case 'users': return <UserManager />;
      case 'resetPassword': return <PasswordResetter />;
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
        <TabButton tabName="events">Eventos</TabButton>
        <TabButton tabName="matches">Partidos</TabButton>
        <TabButton tabName="results">Resultados</TabButton>
        <TabButton tabName="keys">Llaves</TabButton>
        <TabButton tabName="users">Usuarios</TabButton>
        <TabButton tabName="resetPassword">Reset Pass</TabButton>
      </div>
      <div className="max-w-lg mx-auto">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default AdminPanel;