import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import EventDisplay from './EventDisplay';
import Chat from './Chat';

function Dashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  // useEffect se usa SOLO para buscar los datos. No devuelve nada visual.
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró token de autenticación.');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProfile(response.data);
      } catch (err) {
        setError('No se pudo cargar el perfil. Tu sesión puede haber expirado.');
        console.error('Error al obtener el perfil:', err);
      }
    };

    fetchProfile();
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez

  // Este es el ÚNICO return del componente. Decide qué mostrar en la pantalla.
  return (
    <div>
      {/* Sección del Perfil */}
      {!profile && !error && <p>Cargando perfil...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {profile && (
        <div>
          <h2>¡Bienvenido, {profile.username}!</h2>
          <p>Email: {profile.email}</p>
        </div>
      )}

      <hr />

      {/* Sección del Prode (solo se muestra si el perfil cargó bien) */}
      {profile && <EventDisplay />}

      {/* Sección del Chat (solo se muestra si el perfil cargó bien) */}
      {profile && <Chat />}

      <button onClick={logout} style={{ marginTop: '20px' }}>Cerrar Sesión</button>
    </div>
  );
}

export default Dashboard;