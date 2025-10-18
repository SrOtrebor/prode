import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Prizes = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats/key-usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err) {
        setError('No se pudieron cargar las estadísticas.');
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  const totalVipKeys = stats ? stats.vip_by_event.reduce((acc, event) => acc + event.vip_count, 0) : 0;
  const totalKeys = stats ? totalVipKeys + stats.keys_spent_on_unlocks : 0;

  return (
    <div className="space-y-6">
      <h4 className="text-xl font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">
        Premios y Estadísticas de Llaves
      </h4>
      
      {loading && <p>Cargando estadísticas...</p>}
      {error && <p className="text-primario">{error}</p>}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div className="bg-fondo-principal p-6 rounded-lg">
              <p className="text-4xl font-bold text-secundario">{totalVipKeys}</p>
              <p className="text-texto-secundario mt-2">Llaves usadas para ser VIP</p>
            </div>
            <div className="bg-fondo-principal p-6 rounded-lg">
              <p className="text-4xl font-bold text-secundario">{stats.keys_spent_on_unlocks}</p>
              <p className="text-texto-secundario mt-2">Llaves usadas para Resultado Exacto</p>
            </div>
          </div>

          {stats.vip_by_event && stats.vip_by_event.length > 0 && (
            <div className="bg-fondo-principal p-6 rounded-lg">
              <h5 className="text-lg font-bold text-texto-principal mb-4 text-center">Desglose de VIP por Evento</h5>
              <ul className="space-y-2 max-w-sm mx-auto">
                {stats.vip_by_event.map(event => (
                  <li key={event.name} className="flex justify-between items-center border-b border-texto-secundario/10 py-1">
                    <span className="text-texto-secundario">{event.name}</span>
                    <span className="font-bold text-secundario">{event.vip_count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-tarjeta p-6 rounded-lg mt-4 text-center">
            <p className="text-5xl font-bold text-confirmacion">{totalKeys}</p>
            <p className="text-texto-principal mt-2 text-lg">Total de Llaves en el Pozo de Premios</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prizes;