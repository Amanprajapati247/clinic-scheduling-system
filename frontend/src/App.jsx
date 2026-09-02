import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AppointmentDetails from './pages/AppointmentDetails';
import SlotManagement from './pages/SlotManagement';
import ProviderSchedule from './pages/ProviderSchedule';
import Alerts from './pages/Alerts';
import VisitNotes from './pages/VisitNotes';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/:id" element={<AppointmentDetails />} />
              <Route path="/slots" element={<SlotManagement />} />
              <Route path="/schedule" element={<ProviderSchedule />} />

              {/* Front Desk Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['FRONT_DESK']} />}>
                <Route path="/alerts" element={<Alerts />} />
              </Route>

              {/* Provider Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['PROVIDER']} />}>
                <Route path="/notes" element={<VisitNotes />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
