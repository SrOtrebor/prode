import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Leaderboard = ({ eventId }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const token = user?.token;

    // Función para obtener el ícono según el rol
    const getRoleIcon = (role) => {
      switch (role) {
        case 'admin':
          return '👑';
        case 'vip':
          return '⭐';
        default:
          return null;
      }
    };

    useEffect(() => {
        if (eventId && token) {
            const fetchLeaderboard = async () => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/leaderboard/${eventId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const sortedData = res.data.sort((a, b) => parseInt(b.total_points, 10) - parseInt(a.total_points, 10));
                    setLeaderboard(sortedData);
                } catch (err) {
                    console.error('Error fetching leaderboard:', err);
                    setError('No se pudo cargar la tabla de posiciones.');
                }
            };

            fetchLeaderboard();
        }
    }, [eventId, token]);

    if (error) {
        return <div className="bg-tarjeta p-5 rounded-lg shadow-lg text-center text-primario">{error}</div>;
    }

    return (
        <div className="bg-tarjeta p-5 rounded-lg shadow-lg flex flex-col h-full">
            <h2 className="font-display text-xl font-bold mb-4 text-center text-texto-principal uppercase tracking-wider">Tabla de Posiciones</h2>
            {leaderboard.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-texto-secundario">Aún no hay datos para mostrar.</p>
                </div>
            ) : (
                <div className="overflow-y-auto flex-grow">
                    <table className="min-w-full text-texto-principal">
                        <thead className="sticky top-0 bg-tarjeta">
                            <tr>
                                <th className="py-2 px-4 text-left font-display uppercase text-sm text-texto-secundario">#</th>
                                <th className="py-2 px-4 text-left font-display uppercase text-sm text-texto-secundario">Usuario</th>
                                <th className="py-2 px-4 text-right font-display uppercase text-sm text-texto-secundario">Puntaje</th>
                            </tr>
                        </thead>
                        <tbody className="bg-fondo-principal/50">
                            {leaderboard.map((player, index) => (
                                <tr 
                                    key={player.username} 
                                    title={player.role === 'vip' ? 'Usuario VIP' : ''}
                                    className={`border-b border-tarjeta/50 transition-colors hover:bg-tarjeta/50 ${player.role === 'vip' ? 'border-l-4 border-secundario' : ''}`}>
                                    <td className={`py-3 px-4 font-bold ${player.role === 'vip' ? 'text-secundario' : ''}`}>{index + 1}</td>
                                    <td className={`py-3 px-4 ${player.role === 'vip' ? 'text-secundario font-bold' : ''}`}>
                                        {getRoleIcon(player.role) && <span className="mr-2">{getRoleIcon(player.role)}</span>}
                                        {player.username}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-semibold ${player.role === 'vip' ? 'text-secundario' : ''}`}>{player.total_points || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
