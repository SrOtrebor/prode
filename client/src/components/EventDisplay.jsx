import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EventDisplay() {
  const [eventData, setEventData] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveEvent = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:3001/api/events/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEventData(response.data);

        // Este es el único bloque que cambió:
        // Lee las predicciones que llegaron de la DB y las carga en el estado
        const initialPredictions = {};
        response.data.matches.forEach(match => {
          if (match.user_prediction) {
            initialPredictions[match.id] = match.user_prediction;
          }
        });
        setPredictions(initialPredictions);

      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el evento.');
      }
    };

    fetchActiveEvent();
  }, []);

  // Esta función NO cambia.
  const handlePrediction = (matchId, prediction) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: prediction
    }));
  };

  // Esta función TAMPOCO cambia.
  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (Object.keys(predictions).length === 0) {
      alert('No hiciste ninguna predicción para guardar.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/api/predictions',
        { predictions },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert(response.data.message);
    } catch (error) {
      alert('Error al guardar los pronósticos.');
      console.error('Error al guardar:', error);
    }
  };


  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!eventData) return <p>Cargando evento...</p>;

  // El return TAMPOCO cambia.
  return (
    <div>
      <h3>{eventData.event.name}</h3>
      {eventData.matches.map(match => (
        <div key={match.id} style={{ marginBottom: '10px', padding: '5px', border: '1px solid #ccc' }}>
          <p>{match.local_team} vs {match.visitor_team}</p>
          <div>
            {['L', 'E', 'V'].map(p => (
              <button
                key={p}
                onClick={() => handlePrediction(match.id, p)}
                style={{
                  margin: '0 5px',
                  backgroundColor: predictions[match.id] === p ? 'lightblue' : 'white'
                }}
              >
                {p}
              </button>
            ))}
            <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>
              Tu predicción: {predictions[match.id] || 'Ninguna'}
            </span>
          </div>
        </div>
      ))}
      <button onClick={handleSave} style={{ marginTop: '20px', padding: '10px' }}>
        Guardar Pronósticos
      </button>
    </div>
  );
}

export default EventDisplay;