import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAndSetUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUser({ user: response.data, token });
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSetUser();
  }, []);

  const login = async (userData) => {
    localStorage.setItem('token', userData.token);
    await fetchAndSetUser(); // Reutilizamos la misma lógica para obtener el perfil completo
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/'); // Redirigir a la landing
  };

  // La nueva función para refrescar los datos del usuario
  const refreshUser = async () => {
    setLoading(true);
    await fetchAndSetUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};