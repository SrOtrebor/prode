import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import EventDisplay from './EventDisplay';
import Chat from './Chat';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard';
import axios from 'axios';

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
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl">
      <h3 className="text-xl font-bold mb-4 text-center">Canjear Código de Llaves</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <input type="text" placeholder="Introduce tu código..." value={keyCode} onChange={(e) => setKeyCode(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
        <button type="submit" disabled={loading} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
          {loading ? 'Canjeando...' : 'Canjear'}
        </button>
      </form>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
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

  if (!profile || profile.role === 'admin' || (profile.role === 'vip' && profile.puede_apostar_resultado)) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl mt-8">
      <h3 className="text-xl font-bold mb-4 text-center">Mejoras Disponibles</h3>
      <div className="space-y-4">
        {profile.role === 'player' && (
          <button onClick={() => handleSpendKey('become_vip')} disabled={loading || profile.key_balance < 1} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
            Convertirse en VIP (Cuesta 1 llave)
          </button>
        )}
        {profile.role === 'vip' && !profile.puede_apostar_resultado && (
          <button onClick={() => handleSpendKey('unlock_score_bet')} disabled={loading || profile.key_balance < 1} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
            Activar Apuesta por Resultado (Cuesta 1 llave)
          </button>
        )}
        {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
      </div>
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
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl mt-8">
      <h3 className="text-xl font-bold mb-4 text-center">Personalización</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <input type="text" placeholder="Elige tu nuevo nick..." value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition" />
        <button type="submit" disabled={loading} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
          {loading ? 'Cambiando...' : 'Cambiar Nick'}
        </button>
      </form>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>}
    </div>
  );
};

// COMPONENTE PRINCIPAL
function Dashboard() {
  const { user: authInfo, logout } = useAuth();
  const profile = authInfo?.user;
  const [activeEvent, setActiveEvent] = useState(null);

  const showRedeemer = profile && profile.role !== 'admin';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-gray-700 gap-4">
          {profile ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">¡Bienvenido, {profile.username}!</h1>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-1">
                <p className="text-gray-400">{profile.email}</p>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${profile.role === 'admin' ? 'bg-red-500' : profile.role === 'vip' ? 'bg-yellow-500' : 'bg-gray-500'}`}>{profile.role}</span>
                <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-500">Llaves: {profile.key_balance}</span>
              </div>
            </div>
          ) : (
            <h1 className="text-3xl font-bold">Cargando...</h1>
          )}
          <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Cerrar Sesión
          </button>
        </header>

        {profile && profile.role === 'admin' && <section className="mb-8"><AdminPanel /></section>}
        
        {showRedeemer && <section className="mb-8"><KeyRedeemer /></section>}
        
        {profile && <section className="mb-8"><BenefitUpgrader profile={profile} /></section>}

        {profile && <section className="mb-8"><UsernameChanger profile={profile} /></section>}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><EventDisplay setEvent={setActiveEvent} /></div>
          <div className="lg:col-span-1 flex flex-col gap-8">
            {activeEvent && <Leaderboard eventId={activeEvent.id} />}
            <Chat />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
