import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ResultsManager from './ResultsManager'; // <-- Se importa el nuevo componente

function AdminPanel() {
  // Estados para los formularios
  const [eventName, setEventName] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [eventMessage, setEventMessage] = useState('');
  const [events, setEvents] = useState([]); // <-- El estado clave
  const [selectedEvent, setSelectedEvent] = useState('');
  const [localTeam, setLocalTeam] = useState('');
  const [visitorTeam, setVisitorTeam] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchMessage, setMatchMessage] = useState('');

  // useEffect para buscar la lista de eventos UNA SOLA VEZ al cargar
  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEvents(response.data);
      } catch (error) {
        console.error("Error al cargar las fechas", error);
      }
    };
    fetchEvents();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setEventMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/events`, 
        { name: eventName, close_date: closeDate },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setEventMessage(`¡Fecha "${response.data.name}" creada exitosamente!`);
      setEvents(prevEvents => [response.data, ...prevEvents]); // Actualiza la lista
      setEventName('');
      setCloseDate('');
    } catch (error) {
      setEventMessage('Error al crear la fecha.');
    }
  };

  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    setMatchMessage('');
    const token = localStorage.getItem('token');
    try {
      // Usamos el 'selectedEvent' del formulario de agregar partido
      const eventId = document.getElementById('event-select-for-match').value;
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/matches`, 
        { event_id: eventId, local_team: localTeam, visitor_team: visitorTeam, match_date: matchDate },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMatchMessage(`¡Partido agregado a la fecha seleccionada!`);
      setLocalTeam('');
      setVisitorTeam('');
      setMatchDate('');
    } catch (error) {
      setMatchMessage('Error al agregar el partido.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario de Crear Fecha */}
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <h4 className="text-xl font-semibold border-b pb-2">Crear Nueva Fecha</h4>
          {/* ... inputs del formulario ... */}
          <div>
            <label className="block text-gray-700">Nombre de la Fecha:</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full mt-1 p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-gray-700">Fecha Límite para Predecir:</label>
            <input type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} className="w-full mt-1 p-2 border rounded" required />
          </div>
          <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
            Crear Fecha
          </button>
          {eventMessage && <p className="mt-4 text-center">{eventMessage}</p>}
        </form>

        {/* Formulario de Agregar Partido */}
        <form onSubmit={handleMatchSubmit} className="space-y-4">
          <h4 className="text-xl font-semibold border-b pb-2">Agregar Partido a Fecha</h4>
          <div>
            <label className="block text-gray-700">Seleccionar Fecha:</label>
            <select id="event-select-for-match" className="w-full mt-1 p-2 border rounded bg-white">
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          {/* ... otros inputs del formulario ... */}
          <div>
            <label className="block text-gray-700">Equipo Local:</label>
            <input type="text" value={localTeam} onChange={(e) => setLocalTeam(e.target.value)} className="w-full mt-1 p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-gray-700">Equipo Visitante:</label>
            <input type="text" value={visitorTeam} onChange={(e) => setVisitorTeam(e.target.value)} className="w-full mt-1 p-2 border rounded" required />
          </div>
          <div>
            <label className="block text-gray-700">Fecha del Partido:</label>
            <input type="datetime-local" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full mt-1 p-2 border rounded" required />
          </div>
          <button type="submit" className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Agregar Partido
          </button>
          {matchMessage && <p className="mt-4 text-center">{matchMessage}</p>}
        </form>
      </div>

      {/* --- SECCIÓN DE RESULTADOS --- */}
      <div className="mt-8 pt-8 border-t">
        <ResultsManager events={events} />
      </div>
    </div>
  );
}

export default AdminPanel;