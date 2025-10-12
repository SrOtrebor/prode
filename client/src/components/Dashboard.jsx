import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import EventDisplay from './EventDisplay';
import Chat from './Chat';
import AdminPanel from './AdminPanel'; // <-- Se importa el nuevo panel

function Dashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró token de autenticación.');
        return;
      }
      try {
        const response = await axios.get('http://localhost:3001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setProfile(response.data);
      } catch (err) {
        setError('No se pudo cargar el perfil.');
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Encabezado */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        {profile ? (
          <div>
            <h1 className="text-3xl font-bold text-gray-800">¡Bienvenido, {profile.username}!</h1>
            <p className="text-gray-600">{profile.email}</p>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-gray-800">Cargando...</h1>
        )}
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EventDisplay />
        </div>
        <div className="lg:col-span-1">
          <Chat />
        </div>
      </main>

      {/* -- NUEVO BLOQUE CONDICIONAL PARA EL PANEL DE ADMIN -- */}
      {profile && profile.role === 'admin' && (
        <section className="mt-8">
          <AdminPanel />
        </section>
      )}
    </div>
  );
}

export default Dashboard;