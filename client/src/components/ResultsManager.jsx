import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatDateTime = (isoString) => {
  if (!isoString) return 'Fecha no definida';
  const date = new Date(isoString);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', ' - ');
};

function ResultsManager({ events = [], onLeaderboardUpdate }) {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      setMatches([]);
      return;
    }

    const fetchMatches = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/matches/${selectedEvent}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setMatches(response.data);
        setResults({});
        setMessage('');
      } catch (error) {
        console.error("Error al cargar los partidos", error);
        setMessage('Error al cargar los partidos de esta fecha.');
        setMatches([]);
      }
    };
    
    fetchMatches();
  }, [selectedEvent]);

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
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/results`, 
        { results: resultsToSave },
        { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setMessage(response.data.message);
        if (onLeaderboardUpdate && response.data.leaderboard) {
          onLeaderboardUpdate(response.data.leaderboard);
        }
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

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/matches/${matchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMatches(prevMatches => prevMatches.filter(match => match.id !== matchId));
      setMessage('Partido eliminado correctamente.');
    } catch (error) {
      console.error("Error al eliminar el partido", error);
      setMessage('Error al eliminar el partido.');
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="text-xl font-semibold border-b pb-2 border-gray-600 text-white">Cargar Resultados y Finalizar Fecha</h4>
      <div>
        <label htmlFor="event-results-select" className="block text-sm font-medium text-gray-300 mb-1">Seleccionar Fecha a Finalizar:</label>
        <select id="event-results-select" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {events.length > 0 ? (
            events.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))
          ) : (
            <option disabled>No hay eventos para gestionar.</option>
          )}
        </select>
      </div>

      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id} className="flex flex-col sm:flex-row items-center justify-between bg-gray-900 p-3 rounded-md">
            <div className="flex-grow mb-2 sm:mb-0">
                <span className="text-gray-300">{match.local_team} vs {match.visitor_team}</span>
                <p className="text-xs text-gray-400 mt-1 italic">{formatDateTime(match.match_datetime)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                pattern="[0-9]*"
                onChange={(e) => handleResultChange(match.id, 'result_local', e.target.value)}
                className="w-16 text-center bg-gray-700 border border-gray-600 rounded-md py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="L"
              />
              <span className="text-gray-400">-</span>
              <input
                type="text"
                pattern="[0-9]*"
                onChange={(e) => handleResultChange(match.id, 'result_visitor', e.target.value)}
                className="w-16 text-center bg-gray-700 border border-gray-600 rounded-md py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="V"
              />
              <button onClick={() => handleDeleteMatch(match.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md text-xs transition-colors">
                X
              </button>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button onClick={handleSaveResults} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            Guardar Resultados
          </button>
          <button onClick={handleCalculatePoints} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            Finalizar y Calcular Puntos
          </button>
        </div>
      )}
      {message && <p className="mt-4 text-center text-green-400 font-semibold">{message}</p>}
    </div>
  );
}

export default ResultsManager;