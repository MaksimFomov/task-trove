import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { performerApi } from '../../services/api';
import { Search, Eye, CheckCircle, Clock, X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import type { Order, Reply, UpdateReplyDto } from '../../types';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

type TabType = 'new' | 'pending' | 'active' | 'completed';
type SortOrder = 'newest' | 'oldest';

export default function PerformerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Получаем вкладку из URL или localStorage, по умолчанию 'new'
  const getInitialTab = (): TabType => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl) return tabFromUrl;
    
    const savedTab = localStorage.getItem('performerOrdersTab') as TabType;
    return savedTab || 'new';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showOnlyWithoutReplies, setShowOnlyWithoutReplies] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [refuseOrderId, setRefuseOrderId] = useState<number | null>(null);
  const [showRefuseConfirm, setShowRefuseConfirm] = useState(false);
  const [completeOrderId, setCompleteOrderId] = useState<number | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // Синхронизация вкладки с URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      localStorage.setItem('performerOrdersTab', tabFromUrl);
    } else if (!tabFromUrl && activeTab) {
      // Если в URL нет параметра, добавляем текущую вкладку
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [searchParams]);

  // Обновление URL и localStorage при смене вкладки
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    localStorage.setItem('performerOrdersTab', tab);
  };

  // Debounce для поиска - обновление происходит через 500мс после остановки ввода
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Сбрасываем страницу при новом поиске
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Запрос для новых заказов (доступные для отклика)
  const { data: newOrdersData, isLoading: isLoadingNew } = useQuery({
    queryKey: ['performerOrders', debouncedSearchTerm, page],
    queryFn: () =>
      performerApi
        .getOrders({ searchTerm: debouncedSearchTerm || undefined, page, pageSize: 20 })
        .then((res) => res.data.orders),
    enabled: activeTab === 'new',
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
  });

  const isLoading = activeTab === 'new' ? isLoadingNew : isLoadingReplies;

  const refuseOrderMutation = useMutation({
    mutationFn: (orderId: number) => performerApi.refuseOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['performerMyActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['performerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerOrder', orderId.toString()] });
      showSuccessToast('Вы успешно отказались от заказа');
      setShowRefuseConfirm(false);
      setRefuseOrderId(null);
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось отказаться от заказа. Попробуйте еще раз.');
      setShowRefuseConfirm(false);
      setRefuseOrderId(null);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (data: UpdateReplyDto) => performerApi.updateTaskStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerMyActiveOrders'] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerOrders'] });
      showSuccessToast('Заказ успешно завершен и отправлен на проверку');
      setShowCompleteConfirm(false);
      setCompleteOrderId(null);
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось завершить заказ. Попробуйте еще раз.');
      setShowCompleteConfirm(false);
      setCompleteOrderId(null);
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (id: number) => performerApi.deleteReply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      showSuccessToast('Отклик успешно отменен');
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось отменить отклик. Попробуйте еще раз.');
    },
  });

  const deleteCompletedReplyMutation = useMutation({
    mutationFn: (id: number) => performerApi.deleteCompletedReply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      showSuccessToast('Выполненный заказ успешно удален из истории');
    },
    onError: (error) => {
      showErrorToast(error, 'Не удалось удалить заказ. Попробуйте еще раз.');
    },
  });

  const handleCompleteClick = (replyId: number) => {
    setCompleteOrderId(replyId);
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = () => {
    if (completeOrderId) {
      completeOrderMutation.mutate({
        id: completeOrderId,
        isDoneThisTask: true,
      });
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteConfirm(false);
    setCompleteOrderId(null);
  };

  const handleRefuseClick = (orderId: number) => {
    setRefuseOrderId(orderId);
    setShowRefuseConfirm(true);
  };

  const handleConfirmRefuse = () => {
    if (refuseOrderId) {
      refuseOrderMutation.mutate(refuseOrderId);
    }
  };

  const handleCancelRefuse = () => {
    setShowRefuseConfirm(false);
    setRefuseOrderId(null);
  };

  const getStatusBadge = (reply: Reply) => {
    // Завершено заказчиком
    if (reply.donned) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          Завершено
        </span>
      );
    }
    // На проверке у заказчика
    if (reply.isDoneThisTask && reply.isOnCustomer) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          На проверке
        </span>
      );
    }
    // В работе (утвержден заказчиком, но еще не завершен исполнителем)
    if (reply.isOnCustomer && !reply.isDoneThisTask) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          В работе
        </span>
      );
    }
    // Ожидает утверждения заказчика
    return (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        Ожидает
      </span>
    );
  };

  // Фильтруем и сортируем данные в зависимости от вкладки
  const filteredData = useMemo(() => {
    if (activeTab === 'new') {
      // Новые заказы
      if (!newOrdersData) return [];
      let orders = newOrdersData.filter((order) => order.isActived === true);
      
      if (showOnlyWithoutReplies) {
        orders = orders.filter((order) => !order.hasReplied);
      }
      
      orders.sort((a, b) => sortOrder === 'newest' ? b.id - a.id : a.id - b.id);
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
      
      // Применяем поиск
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        replies = replies.filter(
          (reply) =>
            (reply.orderNameByOrder || reply.orderName || '')
              .toLowerCase()
              .includes(searchLower) ||
            reply.orderId.toString().includes(searchLower)
        );
      }
      
      // Сортировка
      replies.sort((a, b) => sortOrder === 'newest' ? b.id - a.id : a.id - b.id);
      
      return replies;
    }
  }, [newOrdersData, repliesData, showOnlyWithoutReplies, activeTab, sortOrder, debouncedSearchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>

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
            Новые заказы
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Мои отклики
          </button>
          <button
            onClick={() => handleTabChange('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            В работе
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Завершенные
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, описанию, области или технологиям..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex flex-col gap-4 pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              
              {activeTab === 'new' && (
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyWithoutReplies}
                      onChange={(e) => setShowOnlyWithoutReplies(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Только заказы без моих откликов
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            {/* Подсказка по поиску */}
            {debouncedSearchTerm && (
              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
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
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {reply.orderNameByOrder || reply.orderName}
                        </h3>
                        {getStatusBadge(reply)}
                      </div>
                      {reply.orderDescription && (
                        <p className="text-gray-600 mb-2 line-clamp-2">{reply.orderDescription}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        {reply.orderScope && <span>Область: {reply.orderScope}</span>}
                        {reply.orderStackS && <span>• Технологии: {reply.orderStackS}</span>}
                        {reply.orderPublicationTime && (
                          <span>
                            • Опубликован:{' '}
                            {format(new Date(reply.orderPublicationTime), 'dd MMM yyyy')}
                          </span>
                        )}
                        {/* Показываем количество откликов только для вкладки "Мои отклики" (pending) */}
                        {activeTab === 'pending' && reply.orderHowReplies !== undefined && (
                          <span>• Откликов: {reply.orderHowReplies}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Кнопки для заказов в работе (не завершенных) */}
                      {reply.isOnCustomer && !reply.isDoneThisTask && !reply.donned && (
                        <>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/performer/orders/${reply.orderId}`)}
                              className="btn btn-primary flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Просмотр
                            </button>
                            <button
                              onClick={() => handleRefuseClick(reply.orderId)}
                              className="btn btn-danger flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Отказаться
                            </button>
                          </div>
                          <button
                            onClick={() => handleCompleteClick(reply.id)}
                            disabled={completeOrderMutation.isPending}
                            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center w-full"
                          >
                            {completeOrderMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Завершение...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Завершить
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {/* Кнопка отмены отклика для неутвержденных откликов */}
                      {!reply.isOnCustomer && !reply.isDoneThisTask && !reply.donned && (
                        <button
                          onClick={() => deleteReplyMutation.mutate(reply.id)}
                          disabled={deleteReplyMutation.isPending}
                          className="btn btn-danger flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {deleteReplyMutation.isPending ? 'Отмена...' : 'Отменить отклик'}
                        </button>
                      )}
                      {/* Кнопки для заказов на проверке или завершенных */}
                      {(reply.isDoneThisTask || reply.donned) && (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/performer/orders/${reply.orderId}`)}
                            className="btn btn-primary flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Просмотр
                          </button>
                          {/* Кнопка удаления только для завершенных заказов */}
                          {reply.donned && (
                            <button
                              onClick={() => deleteCompletedReplyMutation.mutate(reply.id)}
                              disabled={deleteCompletedReplyMutation.isPending}
                              className="btn btn-danger flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {deleteCompletedReplyMutation.isPending ? 'Удаление...' : 'Удалить'}
                            </button>
                          )}
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
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{order.title}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Активен
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-2">{order.description}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span>Область: {order.scope}</span>
                        {order.stackS && <span>• Технологии: {order.stackS}</span>}
                        {order.publicationTime && (
                          <span>
                            • Опубликован:{' '}
                            {format(new Date(order.publicationTime), 'dd MMM yyyy')}
                          </span>
                        )}
                        {/* Показываем количество откликов для новых заказов */}
                        {order.howReplies !== undefined && <span>• Откликов: {order.howReplies}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/performer/orders/${order.id}`)}
                        className="btn btn-primary flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
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
                  ? 'Заказов без ваших откликов не найдено'
                  : 'Новых заказов не найдено'
                : activeTab === 'pending'
                ? 'Откликов не найдено'
                : activeTab === 'active'
                ? 'Заказов в работе не найдено'
                : 'Завершенных заказов не найдено'}
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения отказа */}
      <Modal isOpen={showRefuseConfirm} onClose={handleCancelRefuse}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Подтверждение отказа</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-orange-700 text-sm">
                Вы уверены, что хотите отказаться от этого заказа? Заказ вернется в статус активного, 
                и заказчику будет отправлено уведомление об отказе.
              </p>
            </div>
            
            <p className="text-gray-700">
              Это действие нельзя отменить.
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmRefuse}
                disabled={refuseOrderMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {refuseOrderMutation.isPending ? 'Отказ...' : 'Да, отказаться'}
              </button>
              <button
                onClick={handleCancelRefuse}
                disabled={refuseOrderMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения завершения */}
      <Modal isOpen={showCompleteConfirm} onClose={handleCancelComplete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Подтверждение завершения</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✓ Завершить заказ
              </p>
              <p className="text-green-700 text-sm">
                Вы уверены, что хотите завершить этот заказ? После завершения заказ перейдет на проверку заказчику, 
                и ему будет отправлено уведомление.
              </p>
            </div>
            
            <p className="text-gray-700">
              После завершения вы сможете внести исправления, если заказчик их запросит.
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmComplete}
                disabled={completeOrderMutation.isPending}
                className="btn bg-green-600 hover:bg-green-700 text-white flex items-center flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeOrderMutation.isPending ? 'Завершение...' : 'Да, завершить'}
              </button>
              <button
                onClick={handleCancelComplete}
                disabled={completeOrderMutation.isPending}
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

