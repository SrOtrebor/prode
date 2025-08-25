import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // <-- IMPORTAR

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // <-- USAR EL CONTEXTO

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/api/login', {
        email,
        password,
      });
      login(response.data); // <-- LLAMAR A LA FUNCIÓN DE LOGIN
    } catch (err) {
      setError(err.response.data.message);
    }
  };

  // El resto del componente (el return) queda igual que antes
  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        {/* ...inputs del formulario... */}
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;