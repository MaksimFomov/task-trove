import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Users, UserCheck, UserCog, Briefcase, CheckCircle, Clock } from 'lucide-react';

export default function AdminStatisticsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['adminStatistics'],
    queryFn: () => adminApi.getStatistics().then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  const stats = data || {
    totalUsers: 0,
    totalCustomers: 0,
    totalPerformers: 0,
    totalAdministrators: 0,
    totalOrders: 0,
    activeOrders: 0,
    doneOrders: 0,
  };

  const statCards = [
    {
      title: t('admin.statistics.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: t('admin.statistics.totalCustomers'),
      value: stats.totalCustomers,
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      title: t('admin.statistics.totalPerformers'),
      value: stats.totalPerformers,
      icon: UserCog,
      color: 'bg-purple-500',
    },
    {
      title: t('admin.statistics.totalAdministrators'),
      value: stats.totalAdministrators,
      icon: Users,
      color: 'bg-red-500',
    },
    {
      title: t('admin.statistics.totalOrders'),
      value: stats.totalOrders,
      icon: Briefcase,
      color: 'bg-yellow-500',
    },
    {
      title: t('admin.statistics.activeOrders'),
      value: stats.activeOrders,
      icon: Clock,
      color: 'bg-indigo-500',
    },
    {
      title: t('admin.statistics.doneOrders'),
      value: stats.doneOrders,
      icon: CheckCircle,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('admin.systemAnalytics')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">{t('admin.additionalInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('admin.statistics.customersPercent')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {stats.totalUsers > 0
                ? ((stats.totalCustomers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('admin.statistics.performersPercent')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {stats.totalUsers > 0
                ? ((stats.totalPerformers / stats.totalUsers) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('admin.statistics.doneOrdersPercent')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {stats.totalOrders > 0
                ? ((stats.doneOrders / stats.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400">{t('admin.statistics.activeOrdersPercent')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {stats.totalOrders > 0
                ? ((stats.activeOrders / stats.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
