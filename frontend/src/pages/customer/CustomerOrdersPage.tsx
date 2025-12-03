import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { customerApi } from '../../services/api';
import { Plus, Search, Eye, Trash2, CheckCircle, Clock, XCircle, AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '../../components/Modal';
import type { Order, Chat } from '../../types';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

type SortOrder = 'newest' | 'oldest';
type TabType = 'all' | 'in-progress' | 'done';

export default function CustomerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Получаем вкладку из URL или localStorage, по умолчанию 'all'
  const getInitialTab = (): TabType => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl) return tabFromUrl;
    
    const savedTab = localStorage.getItem('customerOrdersTab') as TabType;
    return savedTab || 'all';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Синхронизация вкладки с URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      localStorage.setItem('customerOrdersTab', tabFromUrl);
    } else if (!tabFromUrl && activeTab) {
      // Если в URL нет параметра, добавляем текущую вкладку
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [searchParams]);

  // Обновление URL и localStorage при смене вкладки
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    localStorage.setItem('customerOrdersTab', tab);
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
    enabled: true, // Всегда загружаем выполненные заказы
  });

  // Запрос чатов для отображения кнопки чата в списке
  const { data: chatsData } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
  });

  // Определяем какие данные использовать в зависимости от вкладки
  const isLoading = activeTab === 'done' ? isLoadingDone : isLoadingAll;
  
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
    
    // Все заказы - применяем фильтр по выполненным, если нужно скрыть их
    if (activeTab === 'all' && !showDone) {
      return allOrders.filter(order => !order.isDone);
    }
    
    // Все заказы
    return allOrders;
  };

  // Применяем поиск к отфильтрованным заказам
  const getFilteredAndSearchedOrders = (): Order[] => {
    const filtered = getFilteredOrders();
    
    if (!debouncedSearchTerm) {
      return filtered;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return filtered.filter(order =>
      order.title?.toLowerCase().includes(searchLower)
    );
  };

  const displayData = getFilteredAndSearchedOrders();


  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      showSuccessToast('Заказ сделан неактивным');
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось сделать заказ неактивным. Попробуйте еще раз.');
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: number) => customerApi.permanentlyDeleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      showSuccessToast('Заказ полностью удален');
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось удалить заказ. Попробуйте еще раз.');
      setShowDeleteConfirm(false);
      setDeleteOrderId(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => customerApi.activateOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      showSuccessToast('Заказ активирован');
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось активировать заказ. Попробуйте еще раз.');
    },
  });

  const handleDeleteClick = (orderId: number, permanent: boolean = false) => {
    setDeleteOrderId(orderId);
    setIsPermanentDelete(permanent);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteOrderId) {
      if (isPermanentDelete) {
        permanentDeleteMutation.mutate(deleteOrderId);
      } else {
        deleteMutation.mutate(deleteOrderId);
      }
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
    if (order.isDone) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          Выполнен
        </span>
      );
    }
    if (order.isOnCheck) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          На проверке
        </span>
      );
    }
    if (order.isInProcess) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          В работе
        </span>
      );
    }
    if (order.isActived) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Активен
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
        <XCircle className="w-3 h-3 mr-1" />
        Неактивен
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Мои заказы</h1>
        <button
          onClick={() => navigate('/customer/orders/new')}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Создать заказ
        </button>
      </div>

      <div className="card">
        {/* Вкладки */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Все заказы
          </button>
          <button
            onClick={() => handleTabChange('in-progress')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'in-progress'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Заказы в работе
          </button>
          <button
            onClick={() => handleTabChange('done')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'done'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Выполненные заказы
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию заказа..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          {/* Подсказка по поиску */}
          {debouncedSearchTerm && (
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="font-medium">Поиск:</span> "{debouncedSearchTerm}"
              {displayData.length > 0 ? (
                <span className="ml-2">— найдено {displayData.length} {displayData.length === 1 ? 'заказ' : displayData.length < 5 ? 'заказа' : 'заказов'}</span>
              ) : (
                <span className="ml-2 text-orange-600">— ничего не найдено</span>
              )}
            </div>
          )}
        </div>

        {/* Фильтры: сортировка и показ неактивных - показываем всегда */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 gap-4 mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Сортировка:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="input text-sm py-1 px-3"
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
              </select>
            </label>
          </div>
          
          {activeTab === 'all' && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Показать неактивные заказы
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDone}
                  onChange={(e) => setShowDone(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Показать выполненные заказы
                </span>
              </label>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Загрузка...</div>
          </div>
        ) : displayData && displayData.length > 0 ? (
          <div className="space-y-4">
            {sortOrders(displayData)
              .filter((order) => {
                // Для вкладки "Все заказы" применяем фильтр по активности
                if (activeTab === 'all') {
                  return showInactive || order.isActived;
                }
                // Для других вкладок показываем все отфильтрованные заказы
                return true;
              })
              .map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{order.title}</h3>
                      {getStatusBadge(order)}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                      {order.publicationTime && (
                        <span>
                          • Опубликован: {format(new Date(order.publicationTime), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      )}
                      {order.performerId && order.performerName ? (
                        <span>• Исполнитель: {order.performerName}</span>
                      ) : (
                        order.howReplies !== undefined && <span>• Откликов: {order.howReplies}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                      className="btn btn-secondary flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотр
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
                          title="Открыть чат с исполнителем"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Чат
                        </button>
                      ) : null;
                    })()}
                    
                    {/* Для активных незавершенных заказов БЕЗ исполнителя - кнопка "Сделать неактивным" */}
                    {order.isActived && !order.isDone && !order.performerId && (
                      <button
                        onClick={() => handleDeleteClick(order.id, false)}
                        className="btn btn-danger flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Сделать неактивным
                      </button>
                    )}
                    
                    {/* Для неактивных заказов - кнопка "Активировать" */}
                    {!order.isActived && !order.isDone && (
                      <button
                        onClick={() => activateMutation.mutate(order.id)}
                        disabled={activateMutation.isPending}
                        className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
                      >
                        {activateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Активация...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Сделать активным
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Сообщение если все заказы скрыты фильтром */}
            {activeTab === 'all' && sortOrders(displayData).filter((order) => showInactive || order.isActived).length === 0 && getFilteredOrders().length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {!showInactive && !showDone 
                    ? 'Нет активных незавершенных заказов. Включите фильтры для просмотра других заказов.'
                    : !showInactive
                    ? 'Нет активных заказов. Включите фильтр "Показать неактивные заказы" для просмотра всех заказов.'
                    : !showDone
                    ? 'Нет незавершенных заказов. Включите фильтр "Показать выполненные заказы" для просмотра выполненных заказов.'
                    : 'Нет заказов, соответствующих выбранным фильтрам.'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Заказов не найдено</p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isPermanentDelete ? 'Подтверждение удаления' : 'Сделать заказ неактивным'}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className={`border rounded-lg p-4 ${isPermanentDelete ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`font-semibold mb-2 ${isPermanentDelete ? 'text-red-800' : 'text-orange-800'}`}>
                {isPermanentDelete ? '⚠️ Внимание: заказ будет удален навсегда!' : '⚠️ Внимание!'}
              </p>
              <p className={`text-sm ${isPermanentDelete ? 'text-red-700' : 'text-orange-700'}`}>
                {isPermanentDelete 
                  ? 'Заказ будет полностью удален из базы данных. Это действие нельзя отменить.'
                  : 'Заказ будет помечен как неактивный. Вы сможете активировать его позже.'
                }
              </p>
            </div>
            
            <p className="text-gray-700">
              {isPermanentDelete 
                ? 'Вы уверены, что хотите полностью удалить этот заказ?'
                : 'Вы уверены, что хотите сделать этот заказ неактивным?'
              }
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending || permanentDeleteMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {(deleteMutation.isPending || permanentDeleteMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPermanentDelete ? 'Удаление...' : 'Деактивация...'}
                  </>
                ) : (
                  <>
                    {isPermanentDelete ? <Trash2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {isPermanentDelete ? 'Да, удалить' : 'Да, сделать неактивным'}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

