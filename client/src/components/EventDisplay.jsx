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

  if (error) return <div className="bg-primario/20 text-primario p-4 rounded-lg">{error}</div>;
  if (!eventData) return <div className="bg-tarjeta p-5 rounded-lg shadow-lg text-center"><p className="text-texto-secundario">Cargando evento...</p></div>;

  const PredictionButton = ({ matchId, predictionType, currentPrediction }) => {
    const isSelected = currentPrediction === predictionType;
    return (
      <button 
        onClick={() => handlePrediction(matchId, predictionType)} 
        className={`py-2 px-4 rounded-md font-display font-bold uppercase text-sm transition-all ${isSelected ? 'bg-primario text-white shadow-lg' : 'bg-fondo-principal text-texto-secundario hover:bg-tarjeta hover:text-texto-principal'}`}>
        {predictionType}
      </button>
    );
  };

  if (eventData.event.status === 'open') {
    return (
      <div className="bg-tarjeta p-5 rounded-lg shadow-lg">
        <h3 className="font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider">{eventData.event.name}</h3>
        <div className="space-y-4">
          {eventData.matches.map(match => (
            <div key={match.id} className="p-4 bg-fondo-principal rounded-lg">
              <p className="font-display font-bold text-lg text-texto-principal text-center mb-3">{match.local_team} vs {match.visitor_team}</p>
              <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-4">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <PredictionButton matchId={match.id} predictionType="L" currentPrediction={predictions[match.id]?.prediction_main} />
                  <PredictionButton matchId={match.id} predictionType="E" currentPrediction={predictions[match.id]?.prediction_main} />
                  <PredictionButton matchId={match.id} predictionType="V" currentPrediction={predictions[match.id]?.prediction_main} />
                </div>
                
                <div className="flex items-center gap-2">
                  {unlockedMatches.has(match.id) ? (
                    <div className="flex items-center gap-2">
                      <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_local || ''} onChange={(e) => handleScoreChange(match.id, 'score_local', e.target.value)} className="w-14 text-center bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors" placeholder="L" />
                      <span className="font-bold text-texto-secundario">-</span>
                      <input type="text" pattern="[0-9]*" value={predictions[match.id]?.score_visitor || ''} onChange={(e) => handleScoreChange(match.id, 'score_visitor', e.target.value)} className="w-14 text-center bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors" placeholder="V" />
                    </div>
                  ) : (
                    <button onClick={() => handleUnlockMatch(match.id)} disabled={profile.key_balance < 1} className="px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs bg-secundario text-black" >
                      Resultado Exacto (1 Llave)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={isSaving} className={`px-4 py-2 rounded-md font-bold text-white uppercase transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed mt-6 w-full text-lg ${isSaving ? 'bg-gray-600' : 'bg-confirmacion'}`}>
          {isSaving ? 'Guardando...' : 'Guardar Pronósticos'}
        </button>
        {feedback.message && <div className={`mt-4 text-center font-semibold ${feedback.type === 'success' ? 'text-confirmacion' : 'text-primario'}`}>{feedback.message}</div>}
      </div>
    );
  }

  // ... (La vista de resultados finales no cambia)
}

export default EventDisplay;