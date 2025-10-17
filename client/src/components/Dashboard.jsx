import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EventDisplay from './EventDisplay';
import Chat from './Chat';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard';
import axios from 'axios';

// --- Estilos Base para Componentes ---
const cardStyle = "bg-tarjeta p-5 rounded-lg shadow-lg";
const titleStyle = "font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider";
const inputStyle = "w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors";
const buttonStyle = "px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed";

// --- SUB-COMPONENTES DEL DASHBOARD ---

const KeyRedeemer = () => {
  const [keyCode, setKeyCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/keys/redeem`, { keyCode }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: response.data.message });
      await refreshUser();
      setKeyCode('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al canjear la llave.' });
    }
    setLoading(false);
  };

  return (
    <div className={`${cardStyle} h-full flex flex-col`}>
      <h3 className={titleStyle}>Canjear Código</h3>
      <div className="flex-grow flex items-center">
        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row items-center gap-4">
          <input type="text" placeholder="Introduce tu código..." value={keyCode} onChange={(e) => setKeyCode(e.target.value)} className={inputStyle} />
          <button type="submit" disabled={loading} className={`${buttonStyle} w-full sm:w-auto bg-confirmacion`}>
            {loading ? 'Canjeando...' : 'Canjear'}
          </button>
        </form>
      </div>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </div>
  );
};

const BenefitUpgrader = ({ profile }) => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleSpendKey = async (benefit) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/keys/spend`, { benefit }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: response.data.message });
      await refreshUser();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al usar la llave.' });
    }
    setLoading(false);
  };

  if (!profile || profile.role === 'admin') {
    return null;
  }

  return (
    <div className={`${cardStyle} h-full flex flex-col`}>
      <h3 className={titleStyle}>Mejoras Disponibles</h3>
      <div className="flex-grow flex items-center">
        <div className="w-full space-y-4">
          {profile.role === 'player' && (
            <button onClick={() => handleSpendKey('become_vip')} disabled={loading || profile.key_balance < 1} className={`${buttonStyle} w-full bg-secundario text-black`}>
              Convertirse en VIP (Cuesta 1 llave)
            </button>
          )}
        </div>
      </div>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </div>
  );
};

const UsernameChanger = ({ profile }) => {
  const [newUsername, setNewUsername] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/profile/change-username`, { newUsername }, { headers: { 'Authorization': `Bearer ${token}` } });
      setMessage({ type: 'success', text: response.data.message });
      await refreshUser();
      setNewUsername('');
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al cambiar el nombre.' });
    }
    setLoading(false);
  };

  if (!profile || (profile.role !== 'vip' && profile.role !== 'admin')) {
    return null;
  }

  return (
    <div className={cardStyle}>
      <h3 className={titleStyle}>Personalización</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <input type="text" placeholder="Elige tu nuevo nick..." value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={inputStyle} />
        <button type="submit" disabled={loading} className={`${buttonStyle} w-full sm:w-auto bg-secundario text-black`}>
          {loading ? 'Cambiando...' : 'Cambiar Nick'}
        </button>
      </form>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </div>
  );
};

// COMPONENTE PRINCIPAL
function Dashboard() {
  const { user: authInfo, logout } = useAuth();
  const profile = authInfo?.user;
  const [activeEvent, setActiveEvent] = useState(null);

  const showRedeemer = profile && profile.role !== 'admin';

  const RoleTag = ({ role }) => {
    if (!role) return null;
    const styles = {
      admin: 'bg-primario text-white',
      vip: 'bg-secundario text-black',
      player: 'bg-texto-secundario text-texto-principal'
    }
    return <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${styles[role]}`}>{role}</span>
  }

  return (
    <div className="min-h-screen bg-fondo-principal text-texto-principal font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-texto-secundario/50 gap-4">
          {profile ? (
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Fulbito Play Logo" className="h-36" />
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-texto-principal">¡Bienvenido, {profile.username}!</h1>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-1">
                  <p className="text-texto-secundario">{profile.email}</p>
                  <RoleTag role={profile.role} />
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-tarjeta text-secundario">🔑 Llaves: {profile.key_balance}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Fulbito Play Logo" className="h-12" />
              <h1 className="font-display text-3xl font-bold">Cargando...</h1>
            </div>
          )}
          <button onClick={logout} className={`${buttonStyle} bg-primario`}>
            Cerrar Sesión
          </button>
        </header>

        {profile && profile.role === 'admin' && <section className="mb-8"><AdminPanel /></section>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {showRedeemer && <KeyRedeemer />}
          {profile && <BenefitUpgrader profile={profile} />}
          {profile && <div className="md:col-span-2"><UsernameChanger profile={profile} /></div>}
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-8">
            <EventDisplay setEvent={setActiveEvent} />
            {activeEvent && <Leaderboard eventId={activeEvent.id} />}
          </div>
          <div className="lg:col-span-2">
            <Chat />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
