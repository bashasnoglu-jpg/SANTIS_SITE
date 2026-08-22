import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SpeedInsights } from '@vercel/speed-insights/react';
import SantisBoardroom from './components/dashboard/SantisBoardroom';
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

const queryClient = new QueryClient();

// UX gate only. Authority is always re-proven by the server-side BFF/WP2 boundary.
const PrivateRoute = ({ children }) => {
  const authStatus = useAuthStore((state) => state.authStatus);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    if (authStatus === 'unknown') void bootstrap();
  }, [authStatus, bootstrap]);

  if (authStatus === 'unknown' || authStatus === 'checking') return null;
  return authStatus === 'authenticated' ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BoardroomModeProvider>
        <SovereignSocketProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
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
              <Route path="/" element={<PrivateRoute><SantisBoardroom /></PrivateRoute>} />
              <Route path="/operations" element={<PrivateRoute><AdminLazyBoundary><LazyOperations /></AdminLazyBoundary></PrivateRoute>} />
              <Route path="/services" element={<PrivateRoute><AdminLazyBoundary><LazyServiceManager /></AdminLazyBoundary></PrivateRoute>} />
              <Route path="/finance" element={<PrivateRoute><AdminLazyBoundary><LazyFinance /></AdminLazyBoundary></PrivateRoute>} />
            </Routes>
          </Router>
        </SovereignSocketProvider>
      </BoardroomModeProvider>
      <SpeedInsights />
    </QueryClientProvider>
  );
}

export default App;
