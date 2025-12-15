import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { performerApi, notificationApi } from '../../services/api';
import { Search, Eye, CheckCircle, Clock, X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '../../components/Modal';
import type { Order, Reply, UpdateReplyDto, Notification } from '../../types';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { saveState, loadState } from '../../utils/stateStorage';

type TabType = 'new' | 'pending' | 'active' | 'completed';
type SortOrder = 'newest' | 'oldest';

const PAGE_KEY = 'performerOrders';

export default function PerformerOrdersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Получаем вкладку из URL или localStorage, по умолчанию 'new'
  const getInitialTab = (): TabType => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl) return tabFromUrl;
    
    return loadState<TabType>(PAGE_KEY, 'tab', 'new');
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlSearch = searchParams.get('search');
    return urlSearch || loadState<string>(PAGE_KEY, 'searchTerm', '');
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showOnlyWithoutReplies, setShowOnlyWithoutReplies] = useState(() => {
    const urlValue = searchParams.get('showOnlyWithoutReplies') === 'true';
    return urlValue || loadState<boolean>(PAGE_KEY, 'showOnlyWithoutReplies', false);
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const urlSort = searchParams.get('sortOrder') as SortOrder;
    return urlSort || loadState<SortOrder>(PAGE_KEY, 'sortOrder', 'newest');
  });

  // Сохранение состояния в localStorage
  useEffect(() => {
    saveState(PAGE_KEY, 'tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveState(PAGE_KEY, 'searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveState(PAGE_KEY, 'showOnlyWithoutReplies', showOnlyWithoutReplies);
  }, [showOnlyWithoutReplies]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortOrder', sortOrder);
  }, [sortOrder]);

  // Синхронизация фильтров и сортировки с URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    if (showOnlyWithoutReplies) params.set('showOnlyWithoutReplies', 'true');
    else params.delete('showOnlyWithoutReplies');
    if (sortOrder !== 'newest') params.set('sortOrder', sortOrder);
    else params.delete('sortOrder');
    setSearchParams(params, { replace: true });
  }, [activeTab, searchTerm, showOnlyWithoutReplies, sortOrder, setSearchParams, searchParams]);

  // Обновление вкладки
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Debounce для поиска - обновление происходит через 500мс после остановки ввода
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Сбрасываем страницу при новом поиске
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Отслеживание уведомлений для автоматического обновления списка заказов и откликов
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((res) => res.data),
    refetchInterval: 1000, // Проверяем уведомления каждую секунду
    enabled: true,
  });

  const previousNotificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (notificationsData?.notifications) {
      const currentNotifications = notificationsData.notifications;
      const previousNotifications = previousNotificationsRef.current;

      // Проверяем, есть ли новые непрочитанные уведомления ASSIGNED, REFUSED, CORRECTION, COMPLETED
      const relevantNotificationTypes = ['ASSIGNED', 'REFUSED', 'CORRECTION', 'COMPLETED'];
      const newRelevantNotifications = currentNotifications.filter(
        (notif: Notification) =>
          !notif.isRead &&
          relevantNotificationTypes.includes(notif.type) &&
          !previousNotifications.some((prev: Notification) => prev.id === notif.id)
      );

      // Если найдены новые релевантные уведомления, обновляем списки
      if (newRelevantNotifications.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['performerOrders'] });
        queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      }

      previousNotificationsRef.current = currentNotifications;
    }
  }, [notificationsData, queryClient]);

  // Запрос для новых заказов (доступные для отклика)
  const { data: newOrdersData, isLoading: isLoadingNew } = useQuery({
    queryKey: ['performerOrders', page],
    queryFn: () =>
      performerApi
        .getOrders({ page, pageSize: 20 })
        .then((res) => res.data.orders),
    enabled: activeTab === 'new',
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 1000, // Автоматическое обновление каждую секунду
  });

  // Запрос для откликов (используется для вкладок: pending, active, completed)
  const { data: repliesData, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['performerReplies', activeTab],
    queryFn: () => {
      // pending - все отклики (будем фильтровать где isOnCustomer = false)
      // active - все отклики (будем фильтровать где isOnCustomer = true)
      // completed - завершенные отклики (donned = true)
      const tab = activeTab === 'completed' ? 'done' : '';
      return performerApi.getReplies(tab || undefined).then((res) => res.data.reply);
    },
    enabled: activeTab === 'pending' || activeTab === 'completed' || activeTab === 'active',
    refetchInterval: 1000, // Автоматическое обновление каждую секунду
  });


  const isLoading = activeTab === 'new' ? isLoadingNew : isLoadingReplies;


  const deleteReplyMutation = useMutation({
    mutationFn: (id: number) => performerApi.deleteReply(id),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerOrders'] });
      showSuccessToast(t('orders.replyCancelled'));
    },
    onError: (error) => {
      showErrorToast(error, t('errors.generic'));
    },
  });

  const deleteCompletedReplyMutation = useMutation({
    mutationFn: (id: number) => performerApi.deleteCompletedReply(id),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerChats'] });
      showSuccessToast(t('orders.completedOrderDeleted'));
    },
    onError: (error) => {
      showErrorToast(error, t('errors.generic'));
    },
  });


  const getStatusBadge = (reply: Reply) => {
    // Завершено заказчиком
    if (reply.donned) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('orderStatus.done')}
        </span>
      );
    }
    // На проверке у заказчика
    if (reply.isDoneThisTask && reply.isOnCustomer) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {t('orderStatus.onCheck')}
        </span>
      );
    }
    // В работе (утвержден заказчиком, но еще не завершен исполнителем)
    if (reply.isOnCustomer && !reply.isDoneThisTask) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {t('orderStatus.inProcess')}
        </span>
      );
    }
    // Ожидает утверждения заказчика
    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-full flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        {t('orders.pending')}
      </span>
    );
  };

  // Фильтруем данные в зависимости от вкладки
  const getFilteredOrders = () => {
    if (activeTab === 'new') {
      // Новые заказы
      if (!newOrdersData) return [];
      let orders = newOrdersData.filter((order) => order.status === 'ACTIVE' || order.isActived === true);
      
      if (showOnlyWithoutReplies) {
        orders = orders.filter((order) => !order.hasReplied);
      }
      
      return orders;
    } else {
      // Все остальные вкладки работают с откликами
      if (!repliesData) return [];
      
      let replies = [...repliesData];
      
      // Фильтрация по вкладкам
      if (activeTab === 'pending') {
        // "Мои отклики" - только неутвержденные (ожидают решения заказчика)
        // Не показываем завершенные и те, что уже в работе
        replies = replies.filter((reply) => 
          !reply.isOnCustomer && !reply.isDoneThisTask && !reply.donned
        );
      } else if (activeTab === 'active') {
        // "В работе" - утвержденные заказчиком, но еще не завершенные полностью
        // Показываем только те, что утверждены (isOnCustomer = true) и не завершены заказчиком (donned = false)
        // Это включает как заказы в работе (isDoneThisTask = false), так и на проверке (isDoneThisTask = true)
        replies = replies.filter((reply) => 
          reply.isOnCustomer === true && reply.donned !== true
        );
      }
      // Для 'completed' фильтрация уже применена на бэкенде (tab='done', donned = true)
      
      return replies;
    }
  };

  // Применяем поиск к отфильтрованным данным
  const getFilteredAndSearchedData = () => {
    const filtered = getFilteredOrders();
    
    if (!debouncedSearchTerm) {
      return filtered;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    if (activeTab === 'new') {
      // Поиск по новым заказам
      return (filtered as Order[]).filter((order) =>
        order.title?.toLowerCase().includes(searchLower) ||
        order.scope?.toLowerCase().includes(searchLower) ||
        order.stackS?.toLowerCase().includes(searchLower) ||
        order.description?.toLowerCase().includes(searchLower)
      );
    } else {
      // Поиск по откликам
      return (filtered as Reply[]).filter(
        (reply) =>
          (reply.orderNameByOrder || reply.orderName || '')
            .toLowerCase()
            .includes(searchLower) ||
          reply.orderId.toString().includes(searchLower)
      );
    }
  };

  // Сортируем данные
  const sortData = (data: (Order | Reply)[]) => {
    return [...data].sort((a, b) => sortOrder === 'newest' ? b.id - a.id : a.id - b.id);
  };

  const filteredData = sortData(getFilteredAndSearchedData());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('orders.orders')}</h1>

      <div className="card">
        {/* Вкладки */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => handleTabChange('new')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'new'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orders.newOrders')}
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orders.myReplies')}
          </button>
          <button
            onClick={() => handleTabChange('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orderList.ordersInProgress')}
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orderList.doneOrders')}
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('orderList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex flex-col gap-4 pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="newest">{t('orderList.sortNewest')}</option>
                  <option value="oldest">{t('orderList.sortOldest')}</option>
                </select>
              </div>
              
              {activeTab === 'new' && (
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyWithoutReplies}
                      onChange={(e) => setShowOnlyWithoutReplies(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                      {t('orders.onlyWithoutReplies')}
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            {/* Подсказка по поиску */}
            {debouncedSearchTerm && (
              <div className="text-sm text-gray-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <span className="font-medium">Поиск:</span> "{debouncedSearchTerm}"
                {filteredData.length > 0 ? (
                  <span className="ml-2">— найдено {filteredData.length} {filteredData.length === 1 ? 'заказ' : filteredData.length < 5 ? 'заказа' : 'заказов'}</span>
                ) : (
                  <span className="ml-2 text-orange-600">— ничего не найдено</span>
                )}
              </div>
            )}
          </div>
        </div>

        {filteredData.length > 0 ? (
          <div className="space-y-4">
            {activeTab !== 'new' ? (
              // Отображение откликов (для вкладок: pending, active, completed)
              (filteredData as Reply[]).map((reply) => (
                <div
                  key={reply.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {reply.orderPublicationTime && (
                        <p className="text-xs text-gray-500 mb-1">
                          {format(new Date(reply.orderPublicationTime), 'd MMMM yyyy', { locale: ru })}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                          {reply.orderNameByOrder || reply.orderName}
                        </h3>
                        {getStatusBadge(reply)}
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        {reply.orderScope && <span>• {t('orderDetail.scope')}: {reply.orderScope}</span>}
                        {reply.orderStackS && <span>• {t('register.technologies')}: {reply.orderStackS}</span>}
                        {/* Показываем количество откликов только для вкладки "Мои отклики" (pending) */}
                        {activeTab === 'pending' && reply.orderHowReplies !== undefined && (
                          <span>• {t('orderDetail.replies')}: {reply.orderHowReplies}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Кнопки для заказов в работе (не завершенных) */}
                      {reply.isOnCustomer && !reply.isDoneThisTask && !reply.donned && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/performer/orders/${reply.orderId}`)}
                            className="btn btn-secondary"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t('orderList.view')}
                          </button>
                        </div>
                      )}
                      {/* Кнопка просмотра для неутвержденных откликов */}
                      {!reply.isOnCustomer && !reply.isDoneThisTask && !reply.donned && (
                        <button
                          onClick={() => navigate(`/performer/orders/${reply.orderId}`)}
                          className="btn btn-secondary"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('orderList.view')}
                        </button>
                      )}
                      {/* Кнопки для заказов на проверке или завершенных */}
                      {(reply.isDoneThisTask || reply.donned) && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/performer/orders/${reply.orderId}`)}
                            className="btn btn-secondary"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t('orderList.view')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Отображение заказов (только для вкладки "Новые заказы")
              (filteredData as Order[]).map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {order.publicationTime && (
                        <p className="text-xs text-gray-500 mb-1">
                          {format(new Date(order.publicationTime), 'd MMMM yyyy', { locale: ru })}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{order.title}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('orderStatus.active')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <span>• {t('orderDetail.scope')}: {order.scope}</span>
                        {order.stackS && <span>• {t('register.technologies')}: {order.stackS}</span>}
                        {/* Показываем количество откликов для новых заказов */}
                        {order.howReplies !== undefined && <span>• {t('orderDetail.replies')}: {order.howReplies}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/performer/orders/${order.id}`)}
                        className="btn btn-secondary"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {t('orderList.view')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {activeTab === 'new'
                ? showOnlyWithoutReplies
                  ? t('orders.noRepliesWithoutYours')
                  : t('orders.noNewOrders')
                : activeTab === 'pending'
                ? t('orders.noReplies')
                : activeTab === 'active'
                ? t('orders.noOrdersInWork')
                : t('orders.noCompletedOrders')}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

