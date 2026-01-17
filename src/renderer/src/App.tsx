import { HashRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Rates } from './pages/Rates';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rates" element={<Rates />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;