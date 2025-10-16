import React, { useState, useEffect } from 'react';
import axios from 'axios';

// COMPONENTES REUTILIZABLES Y SUB-COMPONENTES

const FormInput = ({ id, label, type, value, onChange, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      required={required}
    />
  </div>
);

const EventCreator = ({ onEventCreated }) => {
  const [eventName, setEventName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/events`,
        { name: eventName, close_date: closeDate },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
      <FormInput id="closeDate" label="Fecha Límite de Apuestas" type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
        Crear Evento
      </button>
      {message.text && <p className={`mt-4 text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
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
    if (events.length > 0) {
      setSelectedEvent(events[0].id);
    }
  }, [events]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un evento.' });
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/matches`,
        { event_id: selectedEvent, local_team: localTeam, visitor_team: visitorTeam, match_date: matchDate },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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
        <label htmlFor="event-select" className="block text-sm font-medium text-gray-300 mb-1">Seleccionar Evento</label>
        <select 
          id="event-select" 
          value={selectedEvent} 
          onChange={(e) => setSelectedEvent(e.target.value)} 
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          {events.length > 0 ? (
            events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))
          ) : (
            <option disabled>No hay eventos disponibles. Crea uno primero.</option>
          )}
        </select>
      </div>
      <FormInput id="localTeam" label="Equipo Local" type="text" value={localTeam} onChange={(e) => setLocalTeam(e.target.value)} />
      <FormInput id="visitorTeam" label="Equipo Visitante" type="text" value={visitorTeam} onChange={(e) => setVisitorTeam(e.target.value)} />
      <FormInput id="matchDate" label="Fecha del Partido" type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
        Agregar Partido
      </button>
      {message.text && <p className={`mt-4 text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/generate-key`, 
        { quantity: parseInt(quantity, 10) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setNewKey(response.data);
    } catch (err) {
      setError('Error al generar la llave.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <FormInput 
        id="quantity" 
        label="Cantidad de Llaves en el Código" 
        type="number" 
        value={quantity} 
        onChange={(e) => setQuantity(e.target.value)} 
      />
      <button 
        onClick={handleGenerateKey}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
        {loading ? 'Generando...' : 'Generar Código'}
      </button>
      {error && <p className="mt-4 text-red-400">{error}</p>}
      {newKey && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <p className="text-gray-300">Código Generado (vale por {newKey.quantity} llaves):</p>
          <p className="text-green-400 font-mono text-lg break-all">{newKey.key_code}</p>
          <p className="text-xs text-gray-500 mt-2">(Cópialo y compártelo con el usuario)</p>
        </div>
      )}
    </div>
  );
};

const UserCreator = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`,
        { username, password, email, role },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: `¡Usuario "${response.data.username}" creado!` });
      setUsername('');
      setPassword('');
      setEmail('');
      setRole('player');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al crear el usuario.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput id="email" label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <FormInput id="username" label="Nombre de Usuario" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      <FormInput id="password" label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div>
        <label htmlFor="role-select" className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
        <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
          <option value="player">Player</option>
          <option value="vip">VIP</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">
        Crear Usuario
      </button>
      {message.text && <p className={`mt-4 text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
    </form>
  );
};

const PasswordResetter = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!window.confirm(`¿Estás seguro de que quieres resetear la contraseña para ${email}? Esta acción no se puede deshacer.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/reset-password`,
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
      <FormInput id="reset-email" label="Email del Usuario" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <FormInput id="new-password" label="Nueva Contraseña Temporal" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition">
        Resetear Contraseña
      </button>
      {message.text && <p className={`mt-4 text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error al cargar los eventos", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    setActiveTab('matches');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'events':
        return <EventCreator onEventCreated={handleEventCreated} />;
      case 'matches':
        return <MatchManager events={events} />;
      case 'keys':
        return <KeyGenerator />;
      case 'users':
        return <UserCreator />;
      case 'resetPassword':
        return <PasswordResetter />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl mt-6 text-white">
      <h3 className="text-2xl font-bold mb-6 text-center">Panel de Administrador</h3>
      
      <div className="flex flex-wrap justify-center border-b border-gray-600 mb-6">
        <button onClick={() => setActiveTab('events')} className={`py-2 px-4 font-semibold transition ${activeTab === 'events' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          Eventos
        </button>
        <button onClick={() => setActiveTab('matches')} className={`py-2 px-4 font-semibold transition ${activeTab === 'matches' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          Partidos
        </button>
        <button onClick={() => setActiveTab('keys')} className={`py-2 px-4 font-semibold transition ${activeTab === 'keys' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          Llaves
        </button>
        <button onClick={() => setActiveTab('users')} className={`py-2 px-4 font-semibold transition ${activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          Usuarios
        </button>
        <button onClick={() => setActiveTab('resetPassword')} className={`py-2 px-4 font-semibold transition ${activeTab === 'resetPassword' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}>
          Resetear Contraseña
        </button>
      </div>

      <div className="max-w-lg mx-auto">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default AdminPanel;
