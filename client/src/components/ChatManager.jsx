import React, { useState } from 'react';
import axios from 'axios';

const adminButtonStyle = "px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50";

const ChatManager = () => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleClearChat = async () => {
    if (!window.confirm('¿Estás seguro de que quieres borrar TODO el historial del chat? Esta acción es irreversible.')) {
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/chat/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al borrar el chat.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">Gestionar Chat</h4>
      <p className="text-texto-secundario">Aquí puedes realizar acciones de moderación sobre el chat general.</p>
      <button 
        onClick={handleClearChat} 
        disabled={loading}
        className={`${adminButtonStyle} w-full bg-primario`}
      >
        {loading ? 'Borrando...' : 'Borrar Historial del Chat'}
      </button>
      {message.text && <p className={`mt-4 text-center font-semibold ${message.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{message.text}</p>}
    </div>
  );
};

export default ChatManager;