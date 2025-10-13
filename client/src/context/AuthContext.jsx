import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // <-- NUEVO: Estado de carga

  // Este useEffect se ejecuta UNA SOLA VEZ cuando la app carga
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Usamos la ruta /api/profile para verificar el token y obtener los datos del usuario
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          // Si el token es válido, guardamos los datos del usuario
          setUser({ user: response.data, token });
        } catch (error) {
          // Si el token es inválido o expiró, lo borramos
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false); // Terminamos de cargar
    };
    verifyUser();
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    // Para que el estado 'user' tenga la misma estructura que en la verificación
    setUser({ user: { username: 'temp' }, token: userData.token }); // Actualización temporal, la recarga lo corregirá
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};