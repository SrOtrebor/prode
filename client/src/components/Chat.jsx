import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Picker from 'emoji-picker-react';

function Chat({ isFullScreen = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');
  const { user: authInfo } = useAuth();
  const chatBodyRef = useRef(null);

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      // Ensure scroll happens after DOM updates
      requestAnimationFrame(() => {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      });
    }
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (err) {
        setError('No se pudieron cargar los mensajes del chat.');
      }
    };
    fetchMessages();

    const socket = io(import.meta.env.VITE_API_URL);
    socket.on('new_message', (newMessage) => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/messages`,
        { message_content: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setNewMessage('');
    } catch (err) {
      setError('Error al enviar el mensaje.');
    }
  };

  const getRoleStyles = (role, username) => {
    if (username === authInfo?.user?.username) {
      return { className: 'text-secundario', icon: '' }; // Tus propios mensajes en amarillo
    }
    switch (role) {
      case 'admin':
        return { className: 'text-primario', icon: '👑' };
      case 'vip':
        return { className: 'text-secundario', icon: '⭐' };
      default:
        return { className: 'text-texto-principal', icon: '' };
    }
  };
  
  const containerClasses = isFullScreen 
    ? "p-4 flex flex-col h-screen bg-fondo-principal"
    : "bg-tarjeta p-5 rounded-lg shadow-lg flex flex-col h-full";

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-display text-xl font-bold text-texto-principal uppercase tracking-wider">Chat General</h4>
        {!isFullScreen && (
          <Link to="/chat-completo" target="_blank" rel="noopener noreferrer" title="Abrir chat en nueva pestaña" className="text-texto-secundario hover:text-secundario transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        )}
      </div>
      <div ref={chatBodyRef} className="flex-grow overflow-y-auto bg-fondo-principal rounded-lg p-4 space-y-4 text-sm">
        {messages.map((msg, index) => {
          const { className, icon } = getRoleStyles(msg.role, msg.username);
          return (
            <div key={msg.id || index}>
              <span className={`font-bold ${className}`}>
                {icon && <span className="mr-1">{icon}</span>}
                {msg.username}:
              </span> 
              <span className="text-texto-principal break-words ml-1">{msg.message_content}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 relative">
        {showPicker && (
            <div className="absolute bottom-14 right-0 z-10">
                <Picker onEmojiClick={onEmojiClick} theme="dark" pickerStyle={{ backgroundColor: '#2c3e50' }} />
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-grow">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors pr-10"
                />
                <button 
                    type="button"
                    onClick={() => setShowPicker(val => !val)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-texto-secundario text-xl hover:text-secundario"
                >
                    😊
                </button>
            </div>
            <button
                type="submit"
                className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 bg-primario"
            >
                Enviar
            </button>
        </form>
      </div>
      {error && <p className="text-primario text-xs text-center mt-2">{error}</p>}
    </div>
  );
}

export default Chat;