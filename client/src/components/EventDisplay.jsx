import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function EventDisplay({ setEvent }) {
  const { user: authInfo, refreshUser } = useAuth(); // <-- Obtener refreshUser
  const profile = authInfo?.user;

  const [eventData, setEventData] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [unlockedMatches, setUnlockedMatches] = useState(new Set());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchActiveEvent = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data;
        setEventData(data);
        setEvent(data.event);

        const initialPredictions = {};
        const initialUnlocked = new Set();
        data.matches.forEach(match => {
          if (match.user_prediction) {
            initialPredictions[match.id] = {
              prediction_main: match.user_prediction,
              score_local: match.predicted_score_local ?? '',
              score_visitor: match.predicted_score_visitor ?? ''
            };
          }
          if (match.is_unlocked) {
            initialUnlocked.add(match.id);
          }
        });
        setPredictions(initialPredictions);
        setUnlockedMatches(initialUnlocked);

      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el evento.');
      }
    };
    fetchActiveEvent();
  }, [setEvent]);

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

  const handleUnlockMatch = async (matchId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}/unlock-score-bet`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUnlockedMatches(prev => new Set(prev).add(matchId));
      setFeedback({ message: '¡Desbloqueado! Ahora puedes predecir el resultado exacto.', type: 'success' });
      await refreshUser(); // <-- Llamar a la función de refresco
    } catch (err) {
      setFeedback({ message: err.response?.data?.message || 'Error al desbloquear.', type: 'error' });
    }
  };

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

  if (error) return <div className="bg-red-900 bg-opacity-50 text-red-300 p-4 rounded-lg">{error}</div>;
  if (!eventData) return <p className="text-gray-400">Cargando evento...</p>;

  if (eventData.event.status === 'open') {
    return (
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl">
        <h3 className="text-2xl font-bold mb-4 text-white">{eventData.event.name}</h3>
        <div className="space-y-4">
          {eventData.matches.map(match => (
            <div key={match.id} className="p-4 bg-gray-900 rounded-lg">
              <p className="font-semibold text-white">{match.local_team} vs {match.visitor_team}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 gap-4">
                <div className="flex items-center rounded-md overflow-hidden border border-gray-600">
                  {['L', 'E', 'V'].map(p => (
                    <button key={p} onClick={() => handlePrediction(match.id, p)} className={`px-4 py-1 border-r border-gray-600 last:border-r-0 transition-colors duration-200 ${predictions[match.id]?.prediction_main === p ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
                
                {unlockedMatches.has(match.id) ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_local || ''} onChange={(e) => handleScoreChange(match.id, 'score_local', e.target.value)} className="w-12 text-center bg-gray-700 border border-gray-600 rounded py-1" />
                    <span className="font-bold">-</span>
                    <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_visitor || ''} onChange={(e) => handleScoreChange(match.id, 'score_visitor', e.target.value)} className="w-12 text-center bg-gray-700 border border-gray-600 rounded py-1" />
                  </div>
                ) : (
                  <button onClick={() => handleUnlockMatch(match.id)} disabled={profile.key_balance < 1} className="px-3 py-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 rounded-md transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Activar Resultado (1 Llave)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={isSaving} className={`mt-6 w-full font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isSaving ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white`}>
          {isSaving ? 'Guardando...' : 'Guardar Pronósticos'}
        </button>
        {feedback.message && <div className={`mt-4 text-center font-semibold ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.message}</div>}
      </div>
    );
  }

  // ... (La vista de resultados finales no cambia)
}

export default EventDisplay;