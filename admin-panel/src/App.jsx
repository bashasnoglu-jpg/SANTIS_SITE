import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SantisBoardroom from './components/dashboard/SantisBoardroom';
import Login from './pages/Login';
import Operations from './pages/Operations';
import Finance from './pages/Finance';
import ServiceManager from './pages/ServiceManager';
import useAuthStore from './store/useAuthStore';
import ClinicScanner from './components/dashboard/ClinicScanner';
import { BoardroomModeProvider } from './features/boardroom/context/BoardroomModeContext';

// Create a client
const queryClient = new QueryClient();

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BoardroomModeProvider>
        <Router>
          <Routes>
          {/* KIOSK MODU (İzole Rota - Navigasyon Yok) */}
          <Route 
            path="/scanner" 
            element={
              <div style={{ width: '100vw', height: '100vh', backgroundColor: 'var(--os-karanlik-madde, var(--sovereign-black))', overflow: 'hidden' }}>
                <ClinicScanner />
              </div>
            } 
          />
          
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <SantisBoardroom />
              </PrivateRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <PrivateRoute>
                <Operations />
              </PrivateRoute>
            }
          />
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <ServiceManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <Finance />
              </PrivateRoute>
            }
          />
          </Routes>
        </Router>
      </BoardroomModeProvider>
    </QueryClientProvider>
  );
}

export default App;
