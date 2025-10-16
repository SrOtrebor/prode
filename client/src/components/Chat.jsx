import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const { user: authInfo } = useAuth();
  const chatBodyRef = useRef(null);

  // Efecto para hacer scroll hacia abajo cuando llegan mensajes nuevos
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1. Cargar los mensajes iniciales
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

    // 2. Conectar al socket
    const socket = io(import.meta.env.VITE_API_URL);

    // 3. Escuchar nuevos mensajes
    socket.on('new_message', (newMessage) => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    // 4. Limpiar la conexión al desmontar el componente
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const token = localStorage.getItem('token');
    try {
      // La petición POST ahora solo envía el mensaje, el servidor se encarga de emitirlo
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/messages`,
        { message_content: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setNewMessage(''); // Limpiar el input
    } catch (err) {
      setError('Error al enviar el mensaje.');
    }
  };

  const getRoleStyles = (role, username) => {
    if (username === authInfo?.user?.username) {
      return { className: 'text-blue-400', icon: '' }; // Tus propios mensajes
    }
    switch (role) {
      case 'admin':
        return { className: 'text-red-500', icon: '👑' };
      case 'vip':
        return { className: 'text-yellow-400', icon: '⭐' };
      default:
        return { className: 'text-green-400', icon: '' };
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-2xl flex flex-col h-[32rem]">
      <h4 className="text-xl font-bold mb-4 text-white text-center">Chat General</h4>
      <div ref={chatBodyRef} className="flex-grow overflow-y-auto bg-gray-900 rounded-lg p-4 space-y-4">
        {messages.map((msg, index) => {
          const { className, icon } = getRoleStyles(msg.role, msg.username);
          return (
            <div key={msg.id || index}>
              <span className={`font-bold ${className}`}>
                {icon && <span className="mr-1">{icon}</span>}
                {msg.username}:
              </span> 
              <span className="text-gray-300 break-words">{msg.message_content}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition"
        >
          Enviar
        </button>
      </form>
      {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
    </div>
  );
}

export default Chat;