import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Importar Link

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!import.meta.env.VITE_API_URL) {
      setError('Error de configuración: La URL de la API no está definida.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, {
        email,
        password,
      });
      login(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error al intentar iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-tarjeta p-8 rounded-lg shadow-lg text-center">
          <img src="/logo.png" alt="Fulbito Play Logo" className="h-24 mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold text-center uppercase tracking-wider text-texto-principal">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6 text-left">
            <div>
              <label className="block text-sm font-bold text-texto-secundario mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-texto-secundario mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
                required
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-primario text-center text-sm">{error}</p>}
            <div>
              <button
                type="submit"
                className="w-full px-4 py-3 font-bold text-white uppercase transition-all bg-confirmacion rounded-md hover:brightness-110 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
        <p className="mt-6 text-center text-texto-secundario">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-bold text-secundario hover:brightness-110">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;