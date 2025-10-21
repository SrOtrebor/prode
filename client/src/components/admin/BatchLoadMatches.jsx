import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BatchLoadMatches = () => {
    const [rawText, setRawText] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [events, setEvents] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    // Cargar eventos disponibles para el selector
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/events`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filtramos para mostrar solo eventos abiertos o pendientes
                setEvents(res.data.filter(event => event.status !== 'finished'));
            } catch (err) {
                setError('No se pudieron cargar los eventos.');
            }
        };
        fetchEvents();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEventId || !rawText) {
            setError('Por favor, selecciona un evento y pega el texto de los partidos.');
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/batch-load-matches`, {
                rawText,
                eventId: selectedEventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(res.data.message);
            setRawText('');
        } catch (err) {
            const detailedError = err.response?.data?.error ? `${err.response.data.message}: ${err.response.data.error}` : (err.response?.data?.message || 'Ocurrió un error al procesar el texto.');
            setError(detailedError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-tarjeta p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-display text-white mb-4">Carga Rápida de Partidos</h3>
            <p className="text-texto-secundario mb-6">
                Pega aquí el texto copiado de la web de la liga para crear todos los partidos de una fecha de una sola vez.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="event" className="block text-sm font-medium text-texto-secundario mb-1">
                        1. Selecciona el Evento
                    </label>
                    <select
                        id="event"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-fondo-principal border border-gray-600 rounded-md p-2 text-white focus:ring-secundario focus:border-secundario"
                        required
                    >
                        <option value="">-- Elige un evento --</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="rawText" className="block text-sm font-medium text-texto-secundario mb-1">
                        2. Pega el Texto de los Partidos
                    </label>
                    <textarea
                        id="rawText"
                        rows="10"
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="w-full bg-fondo-principal border border-gray-600 rounded-md p-2 text-white focus:ring-secundario focus:border-secundario font-mono text-sm"
                        placeholder="Pega aquí el texto copiado de la web de la liga..."
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primario text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-500"
                >
                    {loading ? 'Procesando...' : 'Procesar y Cargar Partidos'}
                </button>
            </form>
            {message && <p className="mt-4 text-confirmacion">{message}</p>}
            {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>
    );
};

export default BatchLoadMatches;