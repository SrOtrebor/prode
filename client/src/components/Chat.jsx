import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Chat() {
  const [messages, setMessages] = useState([]); // Para guardar la lista de mensajes
  const [newMessage, setNewMessage] = useState(''); // Para el texto que el usuario escribe
  const [error, setError] = useState('');

  // 1. Usamos useEffect para buscar los mensajes cuando el componente carga
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

  // 2. Función para manejar el envío de un nuevo mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post('http://localhost:3001/api/chat/messages', 
        { message_content: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Agregamos el nuevo mensaje a la lista actual para una actualización instantánea
      // ¡OJO! Esta es una versión simple. El backend nos devolvió el mensaje completo, pero
      // nos falta el "username". Lo solucionaremos después.
      setMessages([...messages, { username: 'Tú', message_content: newMessage }]);
      setNewMessage(''); // Limpiamos el campo de texto
    } catch (err) {
      setError('Error al enviar el mensaje.');
    }
  };

  return (
    <div style={{ border: '1px solid black', padding: '10px', marginTop: '20px' }}>
      <h4>Chat General</h4>
      <div style={{ height: '200px', overflowY: 'scroll', border: '1px solid #ccc', marginBottom: '10px', padding: '5px' }}>
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.username}:</strong> {msg.message_content}</p>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribí tu mensaje..."
          style={{ width: '80%' }}
        />
        <button type="submit">Enviar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Chat;