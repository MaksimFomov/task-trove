import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerOrderCreatePage from './pages/customer/CustomerOrderCreatePage';
import CustomerOrderEditPage from './pages/customer/CustomerOrderEditPage';
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage';
import CustomerChatsPage from './pages/customer/CustomerChatsPage';
import CustomerPortfolioPage from './pages/customer/CustomerPortfolioPage';
import PerformerOrdersPage from './pages/performer/PerformerOrdersPage';
import PerformerOrderDetailPage from './pages/performer/PerformerOrderDetailPage';
import PerformerChatsPage from './pages/performer/PerformerChatsPage';
import PerformerPortfolioPage from './pages/performer/PerformerPortfolioPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminStatisticsPage from './pages/admin/AdminStatisticsPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import { Loader2 } from 'lucide-react';

function App() {
  const { initialize, logout, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
    
    // Обработчик для события logout из API interceptor
    const handleLogout = () => {
      logout();
    };
    
    window.addEventListener('auth-logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, [initialize, logout]);

  // Показываем загрузку пока инициализируется приложение
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
          <Route 
            path="/login" 
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            } 
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          {/* Customer routes */}
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/new"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerOrderCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerOrderEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/chats"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/portfolio"
            element={
              <ProtectedRoute allowedRoles={['Customer']}>
                <CustomerPortfolioPage />
              </ProtectedRoute>
            }
          />
          {/* Performer routes */}
          <Route
            path="/performer/orders"
            element={
              <ProtectedRoute allowedRoles={['Performer']}>
                <PerformerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['Performer']}>
                <PerformerOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/chats"
            element={
              <ProtectedRoute allowedRoles={['Performer']}>
                <PerformerChatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/portfolio"
            element={
              <ProtectedRoute allowedRoles={['Performer']}>
                <PerformerPortfolioPage />
              </ProtectedRoute>
            }
          />
          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'SuperAdministrator']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'SuperAdministrator']}>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'SuperAdministrator']}>
                <AdminStatisticsPage />
              </ProtectedRoute>
            }
          />
          {/* Chat route */}
          <Route
            path="/chat/:chatId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          {/* Notifications route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

