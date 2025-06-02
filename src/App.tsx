import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ReceiptConfigPage } from './pages/ReceiptConfigPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminRoute, VolunteerRoute } from './components/security/ProtectedRoute';
import './App.css';

function App() {
  const { checkSession, isLoading } = useAuthStore();

  useEffect(() => {
    // Save the current path when the app first loads
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      localStorage.setItem('redirectPath', currentPath);
    }

    // Check for an existing session when the app loads
    checkSession();
  }, [checkSession]);

  return (
    <Router>
      {/* Show a loading indicator while checking the session */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen bg-iskcon-light">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-iskcon-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-iskcon-primary font-medium">Loading...</p>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <VolunteerRoute>
                <DashboardPage />
              </VolunteerRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <VolunteerRoute>
                <POSPage />
              </VolunteerRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <VolunteerRoute>
                <OrdersPage />
              </VolunteerRoute>
            }
          />

          <Route
            path="/menu"
            element={
              <AdminRoute>
                <MenuPage />
              </AdminRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />

          <Route
            path="/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />

          <Route
            path="/receipt-config"
            element={
              <AdminRoute>
                <ReceiptConfigPage />
              </AdminRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
