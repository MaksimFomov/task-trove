import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface GuestRouteProps {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, user, isInitialized } = useAuthStore();

  // Ждем завершения инициализации перед проверкой аутентификации
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // Если пользователь уже авторизован, редиректим на соответствующую страницу
  if (isAuthenticated && user) {
    if (user.role === 'Customer') {
      return <Navigate to="/customer/orders" replace />;
    } else if (user.role === 'Performer') {
      return <Navigate to="/performer/orders" replace />;
    } else if (user.role === 'Administrator') {
      return <Navigate to="/admin/users" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
