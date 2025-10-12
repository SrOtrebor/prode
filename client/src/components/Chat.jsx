import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:3001/api/chat/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (err) {
        setError('No se pudieron cargar los mensajes.');
      }
    };
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:3001/api/chat/messages',
        { message_content: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // Actualización simple para reflejar el cambio.
      setMessages([...messages, { username: 'Tú', message_content: newMessage }]);
      setNewMessage('');
    } catch (err) {
      setError('Error al enviar el mensaje.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-xl font-bold mb-4 text-gray-800">Chat General</h4>
      <div className="h-64 overflow-y-auto border rounded-md p-4 mb-4 bg-gray-50 space-y-2">
        {messages.map((msg, index) => (
          <div key={index}>
            <span className="font-bold text-blue-600">{msg.username}: </span>
            <span className="text-gray-700">{msg.message_content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribí tu mensaje..."
          className="flex-grow shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Enviar
        </button>
      </form>
      {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
    </div>
  );
}

export default Chat;