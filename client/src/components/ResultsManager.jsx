import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ResultsManager({ events = [] }) { // Mantenemos el valor por defecto
  const [selectedEvent, setSelectedEvent] = useState('');
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [message, setMessage] = useState('');

  // 1. Este useEffect ahora solo se encarga de seleccionar el primer evento
  // cuando la lista de eventos cambia (o se carga por primera vez).
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  // 2. Este segundo useEffect se encarga de buscar los partidos
  // y se ejecuta SOLO cuando 'selectedEvent' tiene un valor válido.
  useEffect(() => {
    if (!selectedEvent) {
      setMatches([]); // Si no hay evento seleccionado, la lista de partidos está vacía
      return;
    }

    const fetchMatches = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/matches/${selectedEvent}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setMatches(response.data);
        setResults({}); // Limpiamos los resultados anteriores al cambiar de fecha
        setMessage('');
      } catch (error) {
        console.error("Error al cargar los partidos", error);
        setMessage('Error al cargar los partidos de esta fecha.');
        setMatches([]); // Si hay error, vaciamos la lista de partidos
      }
    };
    
    fetchMatches();
  }, [selectedEvent]); // La dependencia clave es 'selectedEvent'

  // ... (el resto de las funciones como handleResultChange, handleSaveResults, etc., quedan igual)

  const handleResultChange = (matchId, team, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    setResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: sanitizedValue
      }
    }));
  };

  const handleSaveResults = async () => {
    const token = localStorage.getItem('token');
    const resultsToSave = matches.map(match => ({
        match_id: match.id,
        result_local: results[match.id]?.result_local ?? null,
        result_visitor: results[match.id]?.result_visitor ?? null,
    }));

    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/results`, 
        { results: resultsToSave },
        { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setMessage('Resultados guardados temporalmente.');
    } catch (error) {
        setMessage('Error al guardar los resultados.');
    }
  };

  const handleCalculatePoints = async () => {
    const token = localStorage.getItem('token');
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/events/${selectedEvent}/calculate`, 
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setMessage('¡Puntos calculados y fecha finalizada!');
    } catch (error) {
        setMessage('Error al calcular los puntos.');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xl font-semibold border-b pb-2">Cargar Resultados y Finalizar Fecha</h4>
      <div>
        <label className="block text-gray-700">Seleccionar Fecha a Finalizar:</label>
        <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white">
          {events.map(event => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {matches.map(match => (
          <div key={match.id} className="flex items-center justify-between p-2 border rounded">
            <span>{match.local_team} vs {match.visitor_team}</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                pattern="[0-9]*"
                onChange={(e) => handleResultChange(match.id, 'result_local', e.target.value)}
                className="w-12 text-center border rounded py-1"
                placeholder="L"
              />
              <span>-</span>
              <input
                type="text"
                pattern="[0-9]*"
                onChange={(e) => handleResultChange(match.id, 'result_visitor', e.target.value)}
                className="w-12 text-center border rounded py-1"
                placeholder="V"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={handleSaveResults} className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Guardar Resultados
        </button>
        <button onClick={handleCalculatePoints} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Finalizar y Calcular Puntos
        </button>
      </div>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}

export default ResultsManager;