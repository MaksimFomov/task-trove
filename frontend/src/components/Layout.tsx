import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { LogOut, Home, Briefcase, MessageSquare, User, Bell, Check, Settings, Users, BarChart3, Trophy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/api';
import { useState, useRef, useEffect } from 'react';
import type { Notification } from '../types';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Запрос для счетчика непрочитанных (работает всегда)
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationApi.getUnreadCount().then((res) => res.data),
    enabled: isAuthenticated,
    refetchInterval: 1000, // Обновляем каждую секунду
  });

  // Запрос для полного списка уведомлений (только когда dropdown открыт)
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((res) => res.data),
    enabled: isAuthenticated && isNotificationsOpen,
    refetchInterval: isNotificationsOpen ? 1000 : false,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = countData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      toast.success(t('notifications.allMarkedAsRead'));
    },
  });

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const months = [
      t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
      t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
      t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
    ];
    
    return `${day} ${months[date.getMonth()]} ${year}, ${hours}:${minutes}`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REPLY':
        return '💬';
      case 'ASSIGNED':
        return '✅';
      case 'COMPLETED':
        return '🎉';
      case 'CORRECTION':
        return '✏️';
      case 'REFUSED':
        return '❌';
      default:
        return '🔔';
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(t('auth.logoutSuccess'));
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const role = user?.role || '';
  const isCustomer = role === 'Customer';
  const isPerformer = role === 'Performer';
  const isAdmin = role === 'Administrator';
  const isSuperAdmin = role === 'SuperAdministrator';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Customer':
        return t('roles.customer');
      case 'Performer':
        return t('roles.performer');
      case 'Administrator':
        return t('roles.administrator');
      case 'SuperAdministrator':
        return t('roles.superAdministrator');
      default:
        return role;
    }
  };

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: Home },
    ...(isCustomer
      ? [
          { path: '/customer/orders', label: t('navigation.myOrders'), icon: Briefcase },
          { path: '/customer/chats', label: t('navigation.chats'), icon: MessageSquare },
          { path: '/customer/portfolio', label: t('navigation.portfolio'), icon: User },
          { path: '/rating', label: t('navigation.rating', 'Рейтинг исполнителей'), icon: Trophy },
        ]
      : []),
    ...(isPerformer
      ? [
          { path: '/performer/orders', label: t('navigation.orders'), icon: Briefcase },
          { path: '/performer/chats', label: t('navigation.chats'), icon: MessageSquare },
          { path: '/performer/portfolio', label: t('navigation.portfolio'), icon: User },
          { path: '/rating', label: t('navigation.rating', 'Рейтинг исполнителей'), icon: Trophy },
        ]
      : []),
    ...((isAdmin || isSuperAdmin)
      ? [
          { path: '/admin/users', label: t('navigation.users'), icon: Users },
          { path: '/admin/orders', label: t('navigation.orders'), icon: Briefcase },
          { path: '/admin/statistics', label: t('navigation.statistics'), icon: BarChart3 },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">TaskTrove</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900 dark:text-slate-100 dark:border-primary-400'
                          : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                <span className="text-sm text-gray-700 dark:text-slate-200">{user?.email || user?.login}</span>
                <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full border dark:border-primary-800/50">
                  {getRoleLabel(role)}
                </span>
              </div>
              
              {/* Кнопка настроек */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 rounded-full transition-colors"
                aria-label={t('navigation.settings')}
              >
                <Settings className="w-6 h-6" />
              </button>

              {/* Уведомления с выпадающим списком */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 rounded-full transition-colors"
                  aria-label={t('navigation.notifications')}
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Выпадающий список уведомлений */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-950">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{t('notifications.title')}</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsReadMutation.mutate()}
                          disabled={markAllAsReadMutation.isPending}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium disabled:opacity-50"
                        >
                          {t('notifications.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                          {notifications.map((notification: Notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsReadMutation.mutate(notification.id);
                                }
                                if (notification.relatedOrderId) {
                                  const orderPath = isCustomer 
                                    ? `/customer/orders/${notification.relatedOrderId}`
                                    : `/performer/orders/${notification.relatedOrderId}`;
                                  navigate(orderPath);
                                  setIsNotificationsOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                        {notification.title}
                                      </h4>
                                      {!notification.isRead && (
                                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-1">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-slate-500">
                                      <span>{formatDate(notification.createdAt)}</span>
                                      {notification.relatedOrderId && (
                                        <span>• {t('notifications.relatedOrder', { id: notification.relatedOrderId })}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsReadMutation.mutate(notification.id);
                                    }}
                                    className="ml-2 p-1 text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                                    title={t('notifications.markAsRead')}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.noNotifications')}</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                          {t('notifications.showAll')}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
      
      {/* Модальное окно настроек */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

