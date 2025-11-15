import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MessageSquare, Users, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || '';

  const isCustomer = role === 'Customer';
  const isPerformer = role === 'Performer';
  const isAdmin = role === 'Administrator';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Добро пожаловать в TaskTrove, {user?.login}!
        </h1>
        <p className="text-lg text-gray-600">
          Платформа для управления задачами и проектами
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isCustomer && (
          <>
            <div
              onClick={() => navigate('/customer/orders')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Мои заказы</h3>
              <p className="text-gray-600">Просмотр и управление вашими заказами</p>
            </div>
            <div
              onClick={() => navigate('/customer/chats')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Чаты</h3>
              <p className="text-gray-600">Общение с исполнителями</p>
            </div>
          </>
        )}

        {isPerformer && (
          <>
            <div
              onClick={() => navigate('/performer/orders')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Заказы</h3>
              <p className="text-gray-600">Просмотр доступных заказов</p>
            </div>
            <div
              onClick={() => navigate('/performer/replies')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CheckCircle className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Мои отклики</h3>
              <p className="text-gray-600">Управление вашими откликами</p>
            </div>
            <div
              onClick={() => navigate('/performer/chats')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Чаты</h3>
              <p className="text-gray-600">Общение с заказчиками</p>
            </div>
            <div
              onClick={() => navigate('/performer/portfolio')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Портфолио</h3>
              <p className="text-gray-600">Управление вашим портфолио</p>
            </div>
          </>
        )}

        {isAdmin && (
          <div
            onClick={() => navigate('/admin/users')}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Users className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Пользователи</h3>
            <p className="text-gray-600">Управление пользователями системы</p>
          </div>
        )}
      </div>
    </div>
  );
}

