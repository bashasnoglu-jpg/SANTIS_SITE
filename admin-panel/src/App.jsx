import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SpeedInsights } from '@vercel/speed-insights/react';
import SantisBoardroom from './components/dashboard/SantisBoardroom';
import AutomationControlCenter from './components/boardroom/AutomationControlCenter';
import Login from './pages/Login';
import useAuthStore from './store/useAuthStore';
import ClinicScanner from './components/dashboard/ClinicScanner';
import { BoardroomModeProvider } from './features/boardroom/context/BoardroomModeContext';
import { SovereignSocketProvider } from './context/SovereignSocketProvider';
import {
  AdminLazyBoundary,
  LazyOperations,
  LazyFinance,
  LazyServiceManager,
} from './routes/lazy-routes';

// Create a client
const queryClient = new QueryClient();

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
};

function AutomationControlRoute() {
  return (
    <div className="min-h-screen bg-sovereign-void text-sovereign-ink font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AutomationControlCenter />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BoardroomModeProvider>
        <SovereignSocketProvider>
          <Router basename={import.meta.env.BASE_URL}>
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
          
          <Route path="/index.html" element={<Navigate to="/" replace />} />
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
            path="/automation-control"
            element={
              <PrivateRoute>
                <AutomationControlRoute />
              </PrivateRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <PrivateRoute>
                <AdminLazyBoundary>
                  <LazyOperations />
                </AdminLazyBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/services"
            element={
              <PrivateRoute>
                <AdminLazyBoundary>
                  <LazyServiceManager />
                </AdminLazyBoundary>
              </PrivateRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PrivateRoute>
                <AdminLazyBoundary>
                  <LazyFinance />
                </AdminLazyBoundary>
              </PrivateRoute>
            }
          />
          </Routes>
        </Router>
      </SovereignSocketProvider>
    </BoardroomModeProvider>
      <SpeedInsights />
    </QueryClientProvider>
  );
}

export default App;
