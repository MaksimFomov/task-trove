import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/api';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { ru, enUS, uk, be, kk, hy, az, ka, uz } from 'date-fns/locale';
import i18n from '../i18n/config';

const getLocale = () => {
  const lang = i18n.language;
  switch (lang) {
    case 'ru': return ru;
    case 'uk': return uk;
    case 'be': return be;
    case 'kk': return kk;
    case 'hy': return hy;
    case 'az': return az;
    case 'ka': return ka;
    case 'uz': return uz;
    default: return enUS;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'd MMMM yyyy, HH:mm', { locale: getLocale() });
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((res) => res.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notifications.markedAsRead'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      toast.success(t('notifications.allMarkedAsRead'));
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      toast.success(t('notifications.allDeleted'));
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error(t('errors.generic'));
    },
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <span className="px-3 py-1 text-sm font-medium bg-red-500 text-white rounded-full">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  {t('notifications.markAllAsRead')}
                </>
              )}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('notifications.clearAll')}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-colors ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{notification.title}</h3>
                      <p className="text-gray-700 dark:text-slate-300 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(notification.createdAt)}</span>
                        {notification.relatedOrderId && (
                          <span>{t('notifications.order')} #{notification.relatedOrderId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      disabled={markAsReadMutation.isPending}
                      className="ml-4 p-2 text-gray-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                      title={t('notifications.markAsRead')}
                    >
                      {markAsReadMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления всех уведомлений */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('notifications.deleteAllConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                ⚠️ {t('common.warning')}!
              </p>
              <p className="text-red-700 text-sm">
                {t('notifications.deleteAllMessage')}
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              {t('notifications.deleteAllConfirm')}?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => deleteAllMutation.mutate()}
                disabled={deleteAllMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {deleteAllMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.yes')}, {t('common.delete')} {t('common.all')}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteAllMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

