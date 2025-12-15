import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MessageSquare, Users, CheckCircle, BarChart3, User } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || '';

  const isCustomer = role === 'Customer';
  const isPerformer = role === 'Performer';
  const isAdmin = role === 'Administrator';
  const isSuperAdmin = role === 'SuperAdministrator';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          {t('app.welcome', { name: user?.email || user?.login })}
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          {t('app.platformDescription')}
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
              <h3 className="text-xl font-semibold mb-2">{t('navigation.myOrders')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('navigation.myOrders')}</p>
            </div>
            <div
              onClick={() => navigate('/customer/chats')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('navigation.chats')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('navigation.chats')}</p>
            </div>
            <div
              onClick={() => navigate('/customer/portfolio')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <User className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('navigation.portfolio')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('navigation.portfolio')}</p>
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
              <h3 className="text-xl font-semibold mb-2">{t('navigation.orders')}</h3>
              <p className="text-gray-600">{t('navigation.orders')}</p>
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
              <User className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('navigation.portfolio')}</h3>
              <p className="text-gray-600">{t('navigation.portfolio')}</p>
            </div>
          </>
        )}

        {(isAdmin || isSuperAdmin) && (
          <>
          <div
            onClick={() => navigate('/admin/users')}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Users className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('navigation.users')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('admin.userManagement')}</p>
            </div>
            <div
              onClick={() => navigate('/admin/orders')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <Briefcase className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('navigation.orders')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('admin.orderManagement')}</p>
            </div>
            <div
              onClick={() => navigate('/admin/statistics')}
              className="card cursor-pointer hover:shadow-lg transition-shadow"
            >
              <BarChart3 className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('navigation.statistics')}</h3>
              <p className="text-gray-600 dark:text-slate-400">{t('admin.systemAnalytics')}</p>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

