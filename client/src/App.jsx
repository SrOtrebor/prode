import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Prode App</h1>
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;