import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EventDisplay({ setEvent }) {
  const [eventData, setEventData] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Estado para el proceso de guardado
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // Estado para mensajes de feedback

  useEffect(() => {
    const fetchActiveEvent = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEventData(response.data);
        setEvent(response.data.event);
        const initialPredictions = {};
        response.data.matches.forEach(match => {
          if (match.user_prediction) {
            initialPredictions[match.id] = {
              prediction_main: match.user_prediction,
              score_local: match.predicted_score_local ?? '',
              score_visitor: match.predicted_score_visitor ?? ''
            };
          }
        });
        setPredictions(initialPredictions);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el evento.');
      }
    };
    fetchActiveEvent();
  }, [setEvent]);

  // Efecto para limpiar el mensaje de feedback después de 3 segundos
  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => {
        setFeedback({ message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback.message]);

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

    // FILTRAR: Solo incluir predicciones que tengan un valor en prediction_main ('L', 'E', o 'V')
    const validPredictions = Object.entries(predictions).filter(([, pred]) => pred.prediction_main);

    if (validPredictions.length === 0) {
      setFeedback({ message: 'No hay pronósticos válidos para guardar (debes elegir L, E o V).', type: 'error' });
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

  const calculateTotalPoints = () => {
    if (!eventData) return 0;
    return eventData.matches.reduce((total, match) => total + (match.points_obtained || 0), 0);
  };

  if (error) return <div className="bg-red-100 p-4 rounded">{error}</div>;
  if (!eventData) return <p>Cargando evento...</p>;

  if (eventData.event.status === 'open') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">{eventData.event.name}</h3>
        <div className="space-y-4">
          {eventData.matches.map(match => (
            <div key={match.id} className="p-4 border rounded-md">
              <p className="font-semibold text-gray-700">{match.local_team} vs {match.visitor_team}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 gap-4">
                <div className="flex items-center">
                  {['L', 'E', 'V'].map(p => (
                    <button
                      key={p}
                      onClick={() => handlePrediction(match.id, p)}
                      className={`px-4 py-1 border rounded transition-colors duration-200 ${predictions[match.id]?.prediction_main === p ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Arriesgar resultado:</span>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    value={predictions[match.id]?.score_local || ''}
                    onChange={(e) => handleScoreChange(match.id, 'score_local', e.target.value)}
                    className="w-12 text-center border rounded py-1"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    value={predictions[match.id]?.score_visitor || ''}
                    onChange={(e) => handleScoreChange(match.id, 'score_visitor', e.target.value)}
                    className="w-12 text-center border rounded py-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* CORRECCIÓN DE SINTAXIS EN CLASSNAME */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`mt-6 w-full font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${isSaving ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-700'} text-white`}
        >
          {isSaving ? 'Guardando...' : 'Guardar Pronósticos'}
        </button>
        {feedback.message && (
          <div className={`mt-4 text-center font-semibold ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-2 text-gray-800">{eventData.event.name} - Resultados Finales</h3>
      <h4 className="text-xl font-bold mb-4 text-blue-600">Puntaje Total: {calculateTotalPoints()}</h4>
      <div className="space-y-4">
        {eventData.matches.map(match => (
          <div key={match.id} className="p-4 border rounded-md">
            <p className="font-semibold text-gray-700">{match.local_team} vs {match.visitor_team}</p>
            <p className="text-lg font-bold text-gray-900">Resultado: {match.result_local} - {match.result_visitor}</p>
            <p className="text-gray-600">Tu predicción: {match.user_prediction || 'Ninguna'} ({match.predicted_score_local || '-' } - {match.predicted_score_visitor || '-'})</p>
            <p className={`font-bold ${match.points_obtained > 0 ? 'text-green-500' : 'text-red-500'}`}>
              Puntos obtenidos: {match.points_obtained || 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventDisplay;