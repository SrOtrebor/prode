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

  const totalKeys = stats ? stats.keys_spent_on_vip + stats.keys_spent_on_unlocks : 0;

  return (
    <div className="space-y-6">
      <h4 className="text-xl font-display font-semibold text-texto-principal mb-4 border-b border-texto-secundario/50 pb-2">
        Premios y Estadísticas de Llaves
      </h4>
      
      {loading && <p>Cargando estadísticas...</p>}
      {error && <p className="text-primario">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
          <div className="bg-fondo-principal p-6 rounded-lg">
            <p className="text-4xl font-bold text-secundario">{stats.keys_spent_on_vip}</p>
            <p className="text-texto-secundario mt-2">Llaves usadas para ser VIP</p>
          </div>
          <div className="bg-fondo-principal p-6 rounded-lg">
            <p className="text-4xl font-bold text-secundario">{stats.keys_spent_on_unlocks}</p>
            <p className="text-texto-secundario mt-2">Llaves usadas para Resultado Exacto</p>
          </div>
          <div className="md:col-span-2 bg-tarjeta p-6 rounded-lg mt-4">
            <p className="text-5xl font-bold text-confirmacion">{totalKeys}</p>
            <p className="text-texto-principal mt-2 text-lg">Total de Llaves en el Pozo de Premios</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prizes;