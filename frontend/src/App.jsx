import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Fleet from './pages/Fleet.jsx';
import Trips from './pages/Trips.jsx';
import Drivers from './pages/Drivers.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Fuel from './pages/Fuel.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';

const LANDING = {
  fleet_manager: '/fleet',
  dispatcher: '/trips',
  safety_officer: '/drivers',
  financial_analyst: '/fuel',
};

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="shell">
      <Sidebar open={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />
      <div className="shell-main">
        <Topbar onMenu={() => setSidebarOpen(o => !o)} />
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="trips" element={<Trips />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="fuel" element={<Fuel />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { role, token } = useAuth();
  const landing = LANDING[role] || '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to={landing} replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Navigate to={landing} replace /></PrivateRoute>} />
      <Route path="/*" element={<PrivateRoute><Shell /></PrivateRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
