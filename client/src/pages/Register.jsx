import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, formData);

      if (res.status === 201) {
        setSuccess('¡Registro exitoso! Redirigiendo al login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el registro. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="bg-tarjeta p-8 rounded-lg shadow-lg text-center">
          <img src="/logo.png" alt="Fulbito Play Logo" className="h-24 mx-auto mb-6" />
          <h1 className="font-display text-3xl font-bold text-center uppercase tracking-wider text-texto-principal">Crear una Cuenta</h1>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6 text-left">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-texto-secundario mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-texto-secundario mb-1">
                Nombre de usuario
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-texto-secundario mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                id="password"
                required
                className="w-full px-3 py-2 bg-fondo-principal border border-texto-secundario rounded-md text-texto-principal focus:outline-none focus:border-secundario transition-colors"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {error && <p className="text-primario text-center text-sm">{error}</p>}
            {success && <p className="text-confirmacion text-center text-sm">{success}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-bold text-white uppercase transition-all bg-primario rounded-md hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
        </div>
        <p className="mt-6 text-center text-texto-secundario">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-bold text-secundario hover:brightness-110">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;