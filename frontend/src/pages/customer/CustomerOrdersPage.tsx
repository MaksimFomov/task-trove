import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { Plus, Search, Eye, Trash2, CheckCircle, Clock, XCircle, AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '../../components/Modal';
import type { Order, Chat } from '../../types';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { saveState, loadState } from '../../utils/stateStorage';

type SortOrder = 'newest' | 'oldest';
type TabType = 'all' | 'in-progress' | 'done';

const PAGE_KEY = 'customerOrders';

export default function CustomerOrdersPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Получаем вкладку из URL или localStorage, по умолчанию 'all'
  const getInitialTab = (): TabType => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['all', 'in-progress', 'done'].includes(tabFromUrl)) return tabFromUrl;
    
    return loadState<TabType>(PAGE_KEY, 'tab', 'all');
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlSearch = searchParams.get('search');
    return urlSearch || loadState<string>(PAGE_KEY, 'searchTerm', '');
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const urlStatus = searchParams.get('status');
    return urlStatus || loadState<string>(PAGE_KEY, 'statusFilter', 'all');
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
    saveState(PAGE_KEY, 'statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortOrder', sortOrder);
  }, [sortOrder]);

  // Синхронизация фильтров и сортировки с URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');
    if (statusFilter !== 'all') params.set('status', statusFilter);
    else params.delete('status');
    if (sortOrder !== 'newest') params.set('sortOrder', sortOrder);
    else params.delete('sortOrder');
    setSearchParams(params, { replace: true });
  }, [activeTab, searchTerm, statusFilter, sortOrder, setSearchParams, searchParams]);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Обновление вкладки
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Debounce для поиска - обновление происходит через 500мс после остановки ввода
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);


  const { data: allOrders, isLoading: isLoadingAll } = useQuery({
    queryKey: ['customerOrders', debouncedSearchTerm],
    queryFn: async () => {
      const response = await customerApi.getOrders(debouncedSearchTerm || undefined);
      console.log('Fetched orders:', response.data.orders);
      return response.data.orders;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
  });

  const { data: doneOrders, isLoading: isLoadingDone } = useQuery({
    queryKey: ['customerDoneOrders'],
    queryFn: async () => {
      try {
        const response = await customerApi.getDoneOrders();
        console.log('Fetched done orders:', response.data.orders);
        return response.data.orders || [];
      } catch (error) {
        console.error('Error fetching done orders:', error);
        return [];
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
    enabled: true, // Всегда загружаем выполненные заказы
  });

  // Запрос чатов для отображения кнопки чата в списке
  const { data: chatsData } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
    refetchInterval: 15000, // Автоматическое обновление каждые 15 секунд
  });

  // Определяем какие данные использовать в зависимости от вкладки
  const isLoading = activeTab === 'done' ? isLoadingDone : isLoadingAll;
  
  // Функция для определения статуса заказа
  const getOrderStatus = (order: Order) => {
    // Приоритет: На рассмотрении > Отклонен > Выполнен > На проверке > В процессе > Активен > Неактивен
    if (order.isOnReview) {
      return { label: t('orderStatus.onReview'), className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
    }
    if (order.isRejected) {
      return { label: t('orderStatus.rejected'), className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    if (order.isDone) {
      return { label: t('orderStatus.done'), className: 'bg-purple-100 text-purple-800' };
    }
    if (order.isOnCheck) {
      return { label: t('orderStatus.onCheck'), className: 'bg-yellow-100 text-yellow-800' };
    }
    if (order.isInProcess) {
      return { label: t('orderStatus.inProcess'), className: 'bg-blue-100 text-blue-800' };
    }
    if (order.isActived) {
      return { label: t('orderStatus.active'), className: 'bg-green-100 text-green-800' };
    }
    return { label: t('orderStatus.inactive'), className: 'bg-gray-100 text-gray-800' };
  };

  // Фильтруем заказы в зависимости от активной вкладки
  const getFilteredOrders = (): Order[] => {
    if (activeTab === 'done') {
      // Выполненные заказы: API уже возвращает только выполненные заказы
      return doneOrders || [];
    }
    
    if (!allOrders) return [];
    
    if (activeTab === 'in-progress') {
      // Заказы в работе: заказы в процессе или на проверке, но не выполненные, и с исполнителем
      return allOrders.filter(order => 
        !order.isDone && 
        order.performerId != null &&
        (order.isInProcess === true || order.isOnCheck === true)
      );
    }
    
    // Все заказы (исключаем отклоненные из основного списка)
    return allOrders.filter(order => !order.isRejected || activeTab === 'all');
  };

  // Применяем поиск и фильтр по статусу к отфильтрованным заказам
  const getFilteredAndSearchedOrders = (): Order[] => {
    let filtered = getFilteredOrders();
    
    // Фильтр по статусу (только для вкладки "Все заказы")
    if (statusFilter !== 'all' && activeTab === 'all') {
      filtered = filtered.filter(order => {
        const status = getOrderStatus(order);
        return status.label.toLowerCase() === statusFilter.toLowerCase();
      });
    }
    
    // Применяем поиск
    if (!debouncedSearchTerm) {
      return filtered;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return filtered.filter(order =>
      order.title?.toLowerCase().includes(searchLower) ||
      order.scope?.toLowerCase().includes(searchLower) ||
      order.stackS?.toLowerCase().includes(searchLower)
    );
  };

  const displayData = getFilteredAndSearchedOrders();


  const permanentDeleteMutation = useMutation({
    mutationFn: (id: number) => customerApi.permanentlyDeleteOrder(id),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      showSuccessToast(t('orders.orderDeleted'));
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
    onError: (error) => {
      showErrorToast(error, t('errors.generic'));
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
  });

  const handleDeleteClick = (orderId: number) => {
    setDeleteOrderId(orderId);
    setIsPermanentDelete(true);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteOrderId) {
      permanentDeleteMutation.mutate(deleteOrderId);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteOrderId(null);
    setIsPermanentDelete(false);
  };

  // Функция для сортировки заказов
  const sortOrders = (orders: Order[]) => {
    const sorted = [...orders].sort((a, b) => {
      // Для выполненных заказов используем endTime, иначе publicationTime
      const dateA = activeTab === 'done' && a.endTime 
        ? new Date(a.endTime).getTime() 
        : (a.publicationTime ? new Date(a.publicationTime).getTime() : 0);
      const dateB = activeTab === 'done' && b.endTime 
        ? new Date(b.endTime).getTime() 
        : (b.publicationTime ? new Date(b.publicationTime).getTime() : 0);
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Сначала новые (более поздние даты)
      } else {
        return dateA - dateB; // Сначала старые (более ранние даты)
      }
    });
    return sorted;
  };

  const getStatusBadge = (order: Order) => {
    const status = getOrderStatus(order);
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('orders.myOrders')}</h1>
        <button
          onClick={() => navigate('/customer/orders/new')}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('orders.createOrder')}
        </button>
      </div>

      <div className="card">
        {/* Вкладки */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-slate-700">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {t('orderList.allOrders')}
          </button>
          <button
            onClick={() => handleTabChange('in-progress')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'in-progress'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {t('orderList.ordersInProgress')}
          </button>
          <button
            onClick={() => handleTabChange('done')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'done'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
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
          
          {/* Подсказка по поиску */}
          {debouncedSearchTerm && (
            <div className="text-sm text-gray-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <span className="font-medium">Поиск:</span> "{debouncedSearchTerm}"
              {displayData.length > 0 ? (
                <span className="ml-2">— найдено {displayData.length} {displayData.length === 1 ? 'заказ' : displayData.length < 5 ? 'заказа' : 'заказов'}</span>
              ) : (
                <span className="ml-2 text-orange-600">— ничего не найдено</span>
              )}
            </div>
          )}
        </div>

        {/* Фильтры: сортировка и статус */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 gap-4 mb-4">
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
          
          {activeTab === 'all' && (
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">{t('orderList.filterAll')}</option>
                <option value={t('orderStatus.onReview')}>{t('orderStatus.onReview')}</option>
                <option value={t('orderStatus.rejected')}>{t('orderStatus.rejected')}</option>
                <option value={t('orderStatus.done')}>{t('orderStatus.done')}</option>
                <option value={t('orderStatus.onCheck')}>{t('orderStatus.onCheck')}</option>
                <option value={t('orderStatus.inProcess')}>{t('orderStatus.inProcess')}</option>
                <option value={t('orderStatus.active')}>{t('orderStatus.active')}</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">{t('common.loading')}</div>
          </div>
        ) : displayData && displayData.length > 0 ? (
          <div className="space-y-4">
            {sortOrders(displayData)
              .map((order) => (
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
                      {getStatusBadge(order)}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-slate-400">
                      {order.scope && <span>• {t('orderDetail.scope')}: {order.scope}</span>}
                      {order.stackS && <span>• {t('register.technologies')}: {order.stackS}</span>}
                      {order.performerId && order.performerName ? (
                        <span>• {t('orders.performer')}: {order.performerName}</span>
                      ) : (
                        order.howReplies !== undefined && <span>• {t('orderDetail.replies')}: {order.howReplies}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                      className="btn btn-secondary flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('orderList.view')}
                    </button>
                    
                    {/* Кнопка чата для заказов с исполнителем */}
                    {order.performerId && chatsData && (() => {
                      const chatWithPerformer = chatsData.find(
                        (chat: Chat) => chat.orderId === order.id
                      );
                      return chatWithPerformer ? (
                        <button
                          onClick={() => navigate(`/chat/${chatWithPerformer.id}`)}
                          className="btn btn-primary flex items-center"
                          title={t('chats.chat')}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {t('chats.chat')}
                        </button>
                      ) : null;
                    })()}
                    
                    {/* Для активных незавершенных заказов БЕЗ исполнителя - кнопка "Удалить заказ" */}
                    {order.isActived && !order.isDone && !order.performerId && (
                      <button
                        onClick={() => handleDeleteClick(order.id)}
                        className="btn btn-danger flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t('orderList.delete')}
                      </button>
                    )}
                    
                    {/* Информация о статусе модерации для неактивных заказов */}
                    {!order.isActived && !order.isDone && order.isOnReview && (
                      <div className="mt-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-md">
                        <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {t('orders.orderOnReview')}
                        </p>
                      </div>
                    )}
                    
                    {/* Информация о статусе отклонения */}
                    {order.isRejected && (
                      <div className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                        <p className="text-sm text-red-800 dark:text-red-200 flex items-center mb-2">
                          <XCircle className="w-4 h-4 mr-2" />
                          {t('orders.orderRejectedByAdmin')}
                        </p>
                      <button
                          onClick={() => navigate(`/customer/orders/edit/${order.id}`)}
                          className="btn btn-primary text-sm py-1 px-3"
                        >
                          {t('orders.orderUpdatedForReview')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Сообщение если все заказы скрыты фильтром */}
            {activeTab === 'all' && sortOrders(displayData).length === 0 && getFilteredOrders().length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Нет заказов со статусом "{statusFilter !== 'all' ? statusFilter : 'с указанными фильтрами'}". Попробуйте выбрать другой статус.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('orderList.noOrdersFound')}</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {t('orders.deleteOrderConfirm')}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ {t('common.warning')}: {t('orderList.permanentDeleteWarning')}
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {t('orderList.permanentDeleteWarning')}
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              {t('orders.deleteOrderConfirm')}?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmDelete}
                disabled={permanentDeleteMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {permanentDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.yes')}, {t('common.delete')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={permanentDeleteMutation.isPending}
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

