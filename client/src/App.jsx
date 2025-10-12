import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth(); // <-- Obtenemos el nuevo estado 'loading'

  if (loading) {
    return <div>Cargando...</div>; // <-- Mostramos un mensaje de carga
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;