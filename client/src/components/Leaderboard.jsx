import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = ({ eventId }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (eventId && token) {
            const fetchLeaderboard = async () => {
                try {
                    const res = await axios.get(`/api/leaderboard/${eventId}`, {
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
        return <div className="text-red-500 bg-gray-800 p-4 rounded-lg shadow-lg">{error}</div>;
    }

    if (leaderboard.length === 0) {
        return (
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">Tabla de Posiciones</h2>
                <p className="text-gray-400">Aún no hay datos para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Tabla de Posiciones</h2>
            <div className="overflow-y-auto max-h-96">
                <table className="min-w-full bg-gray-900 text-white">
                    <thead className="sticky top-0 bg-gray-700">
                        <tr>
                            <th className="py-2 px-4 text-left">#</th>
                            <th className="py-2 px-4 text-left">Usuario</th>
                            <th className="py-2 px-4 text-right">Puntaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((player, index) => (
                            <tr key={player.username} className="border-b border-gray-700 hover:bg-gray-800">
                                <td className="py-2 px-4 font-bold">{index + 1}</td>
                                <td className="py-2 px-4">{player.username}</td>
                                <td className="py-2 px-4 text-right font-semibold">{player.total_points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
