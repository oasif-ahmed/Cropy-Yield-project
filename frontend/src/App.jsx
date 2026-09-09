import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useLanguage } from './i18n/LanguageContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';

import Landing from './pages/landing/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Farmers from './pages/Farmers.jsx';
import Lands from './pages/Lands.jsx';
import Crops from './pages/Crops.jsx';
import Weather from './pages/Weather.jsx';
import Forecast from './pages/Forecast.jsx';
import Soil from './pages/Soil.jsx';
import Diseases from './pages/Diseases.jsx';
import Advisories from './pages/Advisories.jsx';
import Market from './pages/Market.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import Notifications from './pages/Notifications.jsx';
import Recommendations from './pages/Recommendations.jsx';
import AIMonitor from './pages/AIMonitor.jsx';
import Profile from './pages/Profile.jsx';
import Elements from './pages/Elements.jsx';
import NotFound from './pages/NotFound.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <Spinner label={t('লোড হচ্ছে...', 'Loading...')} />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <Spinner label={t('লোড হচ্ছে...', 'Loading...')} />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/elements" element={<Elements />} />
        <Route path="/farmers" element={<Protected roles={['OFFICER', 'ADMIN']}><Farmers /></Protected>} />
        <Route path="/lands" element={<Lands />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/advisories" element={<Advisories />} />
        <Route path="/market" element={<Market />} />
        <Route path="/reports" element={<Protected roles={['OFFICER', 'ADMIN']}><Reports /></Protected>} />
        <Route path="/ai-monitor" element={<Protected roles={['ADMIN']}><AIMonitor /></Protected>} />
        <Route path="/users" element={<Protected roles={['ADMIN']}><Users /></Protected>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}