import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventDisplay from './EventDisplay';
import Chat from './Chat';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard';
import PopcornBucket from './PopcornBucket';
import WinnersMonitor from './WinnersMonitor';
import { io } from 'socket.io-client';
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

const BenefitUpgrader = ({ profile, activeEvent }) => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSpendKey = async (benefit, eventId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/keys/spend`,
        { benefit, eventId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: response.data.message });
      // Forzar un refresh para que todos los componentes se actualicen
      window.location.reload();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al usar la llave.' });
    }
    setLoading(false);
  };

  if (!profile) {
    return null;
  }

  const isAlreadyVipForEvent = activeEvent && profile.vip_events && profile.vip_events.includes(activeEvent.id);
  const canBecomeVip = activeEvent && activeEvent.status === 'open' && !isAlreadyVipForEvent;

  return (
    <div className={`${cardStyle} h-full flex flex-col`}>
      <h3 className={titleStyle}>Mejoras Disponibles</h3>
      <div className="flex-grow flex items-center">
        <div className="w-full space-y-4">
          {canBecomeVip && (
            <button
              onClick={() => handleSpendKey('become_vip', activeEvent.id)}
              disabled={loading || profile.key_balance < 1}
              className={`${buttonStyle} w-full bg-secundario text-black`}
            >
              Ser VIP para "{activeEvent.name}" (1 Llave)
            </button>
          )}
          {isAlreadyVipForEvent && (
            <p className="text-center text-texto-secundario">Ya eres VIP para el evento actual.</p>
          )}
          {(!activeEvent || activeEvent.status !== 'open') && !isAlreadyVipForEvent && (
            <p className="text-center text-texto-secundario">No hay un evento activo para el cual puedas volverte VIP.</p>
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

  // Permiso para cambiar nombre si es admin o tiene algún VIP activo
  const hasPermission = profile && (profile.role === 'admin' || (profile.vip_events && profile.vip_events.length > 0));

  if (!hasPermission) {
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
  const navigate = useNavigate();
  const profile = authInfo?.user;
  const [activeEvent, setActiveEvent] = useState(null);
  const [currentLeaderboardData, setCurrentLeaderboardData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const showRedeemer = profile;

  // Función para manejar el logout y redirigir
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Socket.IO para detectar mensajes nuevos
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on('new_message', (newMessage) => {
      // Solo contar como no leído si el chat está cerrado y no es mensaje propio
      if (!isChatOpen && newMessage.username !== profile?.username) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    return () => {
      socket.off('new_message');
      socket.disconnect();
    };
  }, [isChatOpen, profile?.username]);

  // Resetear contador cuando se abre el chat
  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadMessages(0);
  };

  const RoleTag = ({ profile }) => {
    if (!profile?.role) return null;

    const styles = {
      admin: 'bg-primario text-white',
      vip: 'bg-secundario text-black',
      player: 'bg-texto-secundario text-texto-principal'
    };

    const vipCount = profile.vip_events?.length || 0;

    if (profile.role === 'admin') {
      return <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${styles.admin}`}>Admin</span>;
    }

    return (
      <>
        <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${styles.player}`}>Player</span>
        {vipCount > 0 && (
          <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full uppercase ${styles.vip}`}>
            VIP
            <sup className="ml-0.5 font-bold">{vipCount}</sup>
          </span>
        )}
      </>
    );
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
                  <RoleTag profile={profile} />
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
          <button onClick={handleLogout} className={`${buttonStyle} bg-primario`}>
            Cerrar Sesión
          </button>
        </header>

        {profile && profile.role === 'admin' && <section className="mb-8"><AdminPanel onLeaderboardUpdate={setCurrentLeaderboardData} /></section>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {showRedeemer && <KeyRedeemer />}
          {profile && <BenefitUpgrader profile={profile} activeEvent={activeEvent} />}
          {profile && <div className="md:col-span-2"><UsernameChanger profile={profile} /></div>}
        </div>

        {/* Balde de Pochoclos y Monitor de Ganadores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className={cardStyle}>
            <PopcornBucket />
          </div>
          <div className={cardStyle}>
            <WinnersMonitor />
          </div>
        </div>

        <main className="flex flex-col gap-8">
          <EventDisplay setEvent={setActiveEvent} />
          {activeEvent && <Leaderboard eventId={activeEvent.id} leaderboardData={currentLeaderboardData} />}
        </main>

        {/* Botón flotante del chat */}
        <button
          onClick={handleOpenChat}
          className={`fixed bottom-6 right-6 bg-secundario hover:bg-secundario/90 text-black font-bold p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-40 flex items-center gap-2 ${unreadMessages > 0 ? 'animate-pulse' : ''}`}
          aria-label="Abrir chat"
        >
          {/* Badge de mensajes no leídos */}
          {unreadMessages > 0 && (
            <span className="absolute -top-2 -right-2 bg-primario text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline">Chat</span>
        </button>

        {/* Modal del chat */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-fondo-principal rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative">
              {/* Header del modal */}
              <div className="flex items-center justify-between p-4 border-b border-texto-secundario/30">
                <h3 className="text-xl font-bold text-texto-principal flex items-center gap-2">
                  <svg className="w-6 h-6 text-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat en Vivo
                </h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-texto-secundario hover:text-texto-principal transition-colors p-2 hover:bg-tarjeta rounded-lg"
                  aria-label="Cerrar chat"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Contenido del chat */}
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
