import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import EventDisplay from './EventDisplay';
import Chat from './Chat';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard'; // Importar el nuevo componente

function Dashboard() {
  const { user, logout } = useAuth(); // Obtener todo el perfil del usuario desde el contexto
  const [error, setError] = useState('');
  const [activeEvent, setActiveEvent] = useState(null);

  // El perfil del usuario ahora viene del contexto, no es necesario un fetch local
  const profile = user;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4 md:p-8">
        {/* Encabezado */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          {profile ? (
            <div>
              <h1 className="text-3xl font-bold">¡Bienvenido, {profile.username}!</h1>
              <p className="text-gray-400">{profile.email}</p>
            </div>
          ) : (
            <h1 className="text-3xl font-bold">Cargando...</h1>
          )}
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Contenido Principal */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <EventDisplay setEvent={setActiveEvent} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* El Leaderboard y el Chat ahora se renderizan aquí */}
            {activeEvent && <Leaderboard eventId={activeEvent.id} />}
            <Chat />
          </div>
        </main>

        {/* Panel de Administración */}
        {profile && profile.role === 'admin' && (
          <section className="mt-8">
            <AdminPanel />
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;