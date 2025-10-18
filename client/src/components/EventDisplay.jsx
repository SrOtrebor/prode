import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

// --- Componente Refactorizado ---
function EventDisplay({ setEvent }) {
  const { user: authInfo } = useAuth();
  const profile = authInfo?.user;

  // Estado para la lista de eventos y el evento seleccionado
  const [openEvents, setOpenEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Estado para los datos del evento actual
  const [eventData, setEventData] = useState(null);
  const [isVipForEvent, setIsVipForEvent] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [hasAnyMatchStarted, setHasAnyMatchStarted] = useState(false);
  
  // Estado para la UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // 1. Cargar la lista de eventos abiertos al montar el componente
  useEffect(() => {
    const fetchOpenEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/open`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setOpenEvents(response.data);
        if (response.data.length > 0) {
          setSelectedEventId(response.data[0].id); // Seleccionar el primero por defecto
        } else {
          setLoading(false); // No hay eventos, dejar de cargar
        }
      } catch (err) {
        setError('No se pudieron cargar los eventos abiertos.');
        setLoading(false);
      }
    };
    fetchOpenEvents();
  }, []);

  // 2. Cargar los detalles de un evento cuando se selecciona uno
  useEffect(() => {
    if (!selectedEventId) {
      setEventData(null);
      return;
    };

    const fetchEventDetails = async () => {
      setLoading(true);
      setEventData(null); // Limpiar datos anteriores
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${selectedEventId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data;
        setEventData(data);
        setEvent(data.event); // Propagar el evento al Dashboard
        setIsVipForEvent(data.is_vip_for_event);

        const now = new Date();
        const anyMatchStarted = data.matches.some(match => new Date(match.match_datetime) <= now);
        setHasAnyMatchStarted(anyMatchStarted);

        const initialPredictions = {};
        data.matches.forEach(match => {
          if (match.user_prediction) {
            initialPredictions[match.id] = {
              prediction_main: match.user_prediction,
              score_local: match.predicted_score_local ?? '',
              score_visitor: match.predicted_score_visitor ?? ''
            };
          }
        });
        setPredictions(initialPredictions);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el evento.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [selectedEventId, setEvent]);

  // ... (resto de los handlers: handlePrediction, handleScoreChange, handleSave)
  const handlePrediction = (matchId, prediction) => {
    setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], prediction_main: prediction } }));
  };

  const handleScoreChange = (matchId, team, value) => {
    const sanitizedValue = value.replace(/[^0-9]/g, '');
    setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], [team]: sanitizedValue } }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback({ message: '', type: '' });

    const validPredictions = Object.entries(predictions).filter(([, pred]) => pred.prediction_main);

    if (validPredictions.length === 0) {
      setFeedback({ message: 'No has hecho ninguna predicción para guardar.', type: 'error' });
      setIsSaving(false);
      return;
    }

    // --- INICIO: Validación de consistencia de pronósticos ---
    for (const [matchId, pred] of validPredictions) {
      if (isVipForEvent && pred.score_local !== undefined && pred.score_visitor !== undefined) {
        const local = parseInt(pred.score_local, 10);
        const visitor = parseInt(pred.score_visitor, 10);

        if (isNaN(local) || isNaN(visitor)) {
          setFeedback({ message: 'Los resultados exactos deben ser números válidos.', type: 'error' });
          setIsSaving(false);
          return;
        }

        switch (pred.prediction_main) {
          case 'L':
            if (local <= visitor) {
              setFeedback({ message: 'El resultado exacto para un pronóstico "L" debe ser una victoria local.', type: 'error' });
              setIsSaving(false);
              return;
            }
            break;
          case 'V':
            if (visitor <= local) {
              setFeedback({ message: 'El resultado exacto para un pronóstico "V" debe ser una victoria visitante.', type: 'error' });
              setIsSaving(false);
              return;
            }
            break;
          case 'E':
            if (local !== visitor) {
              setFeedback({ message: 'El resultado exacto para un pronóstico "E" debe ser un empate.', type: 'error' });
              setIsSaving(false);
              return;
            }
            break;
        }
      }
    }
    // --- FIN: Validación de consistencia de pronósticos ---

    const token = localStorage.getItem('token');
    const payload = {
      predictions: validPredictions.map(([matchId, pred]) => ({
        match_id: parseInt(matchId, 10),
        prediction_main: pred.prediction_main,
        predicted_score_local: pred.score_local ? parseInt(pred.score_local, 10) : null,
        predicted_score_visitor: pred.score_visitor ? parseInt(pred.score_visitor, 10) : null,
      })),
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/predictions`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFeedback({ message: '¡Pronósticos guardados con éxito!', type: 'success' });
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || 'Error al guardar los pronósticos.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const PredictionButton = ({ matchId, predictionType, currentPrediction, isDisabled }) => {
    const isSelected = currentPrediction === predictionType;
    return (
      <button 
        onClick={() => handlePrediction(matchId, predictionType)} 
        disabled={isDisabled}
        className={`py-2 px-4 rounded-md font-display font-bold uppercase text-sm transition-all ${isSelected ? 'bg-primario text-white shadow-lg' : 'bg-fondo-principal text-texto-secundario hover:bg-tarjeta hover:text-texto-principal'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {predictionType}
      </button>
    );
  };

  const isEventClosed = eventData && new Date() > new Date(eventData.event.close_date); // <-- NUEVA LÓGICA

  return (
    <div className="bg-tarjeta p-5 rounded-lg shadow-lg">
      {/* Selector de Eventos */}
      <div className="mb-6">
        <label htmlFor="event-selector" className="block text-sm font-bold text-texto-secundario mb-1">Seleccionar Evento:</label>
        <select
          id="event-selector"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
          disabled={openEvents.length === 0}
        >
          {openEvents.length > 0 ? (
            openEvents.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} {profile?.vip_events?.includes(event.id) ? '(VIP)' : ''}
              </option>
            ))
          ) : (
            <option>No hay eventos abiertos</option>
          )}
        </select>
      </div>

      {loading && <p className="text-center text-texto-secundario">Cargando evento...</p>}
      {error && <div className="bg-primario/20 text-primario p-4 rounded-lg text-center">{error}</div>}
      
      {/* Display del Evento */}
      {eventData && eventData.event.status === 'open' && (
        <div>
          <h3 className="font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider">
            {eventData.event.name}
            {isVipForEvent && <span className="ml-2 px-2 py-1 text-xs rounded-full bg-secundario text-black">VIP</span>}
          </h3>
          <div className="space-y-4">
            {eventData.matches.map(match => {
              const isMatchStarted = new Date(match.match_datetime) <= new Date();
              return (
                <div key={match.id} className="p-4 bg-fondo-principal rounded-lg">
                  <p className="font-display font-bold text-lg text-texto-principal text-center mb-1">{match.local_team} vs {match.visitor_team}</p>
                  <p className="text-center text-xs text-texto-secundario mb-3 italic">{formatDateTime(match.match_datetime)}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-4">
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                      <PredictionButton matchId={match.id} predictionType="L" currentPrediction={predictions[match.id]?.prediction_main} isDisabled={isMatchStarted} />
                      <PredictionButton matchId={match.id} predictionType="E" currentPrediction={predictions[match.id]?.prediction_main} isDisabled={isMatchStarted} />
                      <PredictionButton matchId={match.id} predictionType="V" currentPrediction={predictions[match.id]?.prediction_main} isDisabled={isMatchStarted} />
                    </div>
                    <div className="flex items-center gap-2">
                      {isVipForEvent ? (
                        <div className="flex items-center gap-2">
                          <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_local || ''} onChange={(e) => handleScoreChange(match.id, 'score_local', e.target.value)} className="w-14 text-center bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors" placeholder="L" disabled={isMatchStarted} />
                          <span className="font-bold text-texto-secundario">-</span>
                          <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_visitor || ''} onChange={(e) => handleScoreChange(match.id, 'score_visitor', e.target.value)} className="w-14 text-center bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors" placeholder="V" disabled={isMatchStarted} />
                        </div>
                      ) : (
                        <div className="text-center text-xs text-texto-secundario/70 p-2 rounded-md bg-black/20">
                          <p>Hazte VIP para predecir el resultado exacto.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {isEventClosed && (
            <p className="mt-4 text-center text-primario font-semibold">El tiempo para enviar pronósticos para este evento ha finalizado.</p>
          )}
          {hasAnyMatchStarted && (
            <p className="mt-4 text-center text-primario font-semibold">Algunos partidos de este evento ya han comenzado, no puedes modificar tus pronósticos.</p>
          )}
          <button onClick={handleSave} disabled={isSaving || isEventClosed || hasAnyMatchStarted} className={`px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed mt-6 w-full text-lg ${isSaving || isEventClosed || hasAnyMatchStarted ? 'bg-gray-600' : 'bg-confirmacion'}`}>
            {isSaving ? 'Guardando...' : 'Guardar Pronósticos'}
          </button>
          {feedback.message && <div className={`mt-4 text-center font-semibold ${feedback.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{feedback.message}</div>}
        </div>
      )}
    </div>
  );
}

export default EventDisplay;