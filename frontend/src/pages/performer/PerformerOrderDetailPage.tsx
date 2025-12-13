import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performerApi, customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, X, Loader2, CheckCircle, Trash2, AlertTriangle, User, Star, Briefcase, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Reply, Chat, UpdateReplyDto, Account, CustomerPortfolio, WorkExperience, Order } from '../../types';
import Modal from '../../components/Modal';

export default function PerformerOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['performerOrder', id],
    queryFn: () => performerApi.getOrder(Number(id)).then((res) => res.data),
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
  });

  // Состояния для модальных окон
  const [showRefuseConfirm, setShowRefuseConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerProfileTab, setCustomerProfileTab] = useState<'portfolio' | 'orders' | 'reviews'>('portfolio');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    mark: 5,
    text: '',
    customerId: 0,
  });

  // Запрос чатов для получения ID чата с заказчиком
  const { data: chatsData } = useQuery({
    queryKey: ['performerChats'],
    queryFn: () => performerApi.getChats().then((res) => res.data.chats),
    enabled: !!order?.customerId,
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
  });

  // Находим чат с заказчиком этого заказа
  const chatWithCustomer = chatsData?.find(
    (chat) => chat.customerId === order?.customerId
  );

  // Запрос информации о заказчике для карточки
  const { data: customerInfo } = useQuery({
    queryKey: ['customerInfo', order?.customerId],
    queryFn: async () => {
      if (!order?.customerId) return null;
      try {
        const response = await performerApi.getCustomerInfo(order.customerId);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!order?.customerId,
  });

  // Запрос портфолио заказчика для профиля
  const { data: customerPortfolio, isLoading: isLoadingCustomerPortfolio, error: customerPortfolioError } = useQuery({
    queryKey: ['customerPortfolio', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      try {
        const response = await performerApi.getCustomerPortfolio(selectedCustomerId);
        // Преобразуем ответ в CustomerPortfolio
        const data = response.data as any;
        // Конвертируем пустые строки в null для корректной проверки
        const normalizeField = (value: any) => (value && value.trim && value.trim() !== '' ? value.trim() : null);
        const portfolio = {
          id: data.id,
          name: normalizeField(data.name),
          lastName: normalizeField(data.lastName),
          firstName: normalizeField(data.firstName),
          middleName: normalizeField(data.middleName),
          email: normalizeField(data.email),
          phone: normalizeField(data.phone),
          description: normalizeField(data.description),
          scopeS: normalizeField(data.scopeS),
        } as CustomerPortfolio;
        return portfolio;
      } catch (error: any) {
        throw error; // Пробрасываем ошибку, чтобы React Query мог её обработать
      }
    },
    enabled: showCustomerProfile && selectedCustomerId !== null,
  });

  // Запрос выполненных заказов заказчика
  const { data: customerDoneOrdersData, isLoading: isLoadingCustomerDoneOrders } = useQuery({
    queryKey: ['customerDoneOrders', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      try {
        const response = await performerApi.getCustomerDoneOrders(selectedCustomerId);
        return response.data;
      } catch (error) {
        return { orders: [] };
      }
    },
    enabled: showCustomerProfile && selectedCustomerId !== null && customerProfileTab === 'orders',
  });

  // Запрос отзывов о заказчике
  const { data: customerReviewsData, isLoading: isLoadingCustomerReviews } = useQuery({
    queryKey: ['customerReviews', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      try {
        const response = await performerApi.getCustomerReviews(selectedCustomerId);
        return response.data;
      } catch (error) {
        return { reviews: [] };
      }
    },
    enabled: showCustomerProfile && selectedCustomerId !== null && customerProfileTab === 'reviews',
  });

  // Получаем все отклики исполнителя для поиска ID отклика на этот заказ
  const { data: replies } = useQuery({
    queryKey: ['performerReplies'],
    queryFn: () => performerApi.getReplies().then((res) => res.data.reply),
    enabled: !!order?.hasReplied, // Загружаем только если есть отклик
  });

  // Находим отклик для текущего заказа
  const currentReply = useMemo(() => {
    if (!replies || !order) return null;
    const reply = replies.find((r: Reply) => r.orderId === order.id);
    return reply || null;
  }, [replies, order]);
  
  const currentReplyId = currentReply?.id || null;

  const addReplyMutation = useMutation({
    mutationFn: (data: { orderId: number; orderName: string }) =>
      performerApi.addReply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success(t('orders.replySent'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('errors.generic'));
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: number) => performerApi.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success(t('orders.replyCancelled'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('errors.generic'));
    },
  });

  const handleAddReply = () => {
    if (!order) return;
    addReplyMutation.mutate({
      orderId: order.id,
      orderName: order.title,
    });
  };

  const handleCancelReply = () => {
    if (!currentReplyId) return;
    deleteReplyMutation.mutate(currentReplyId);
  };

  const refuseOrderMutation = useMutation({
    mutationFn: (orderId: number) => performerApi.refuseOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerMyActiveOrders'] });
      toast.success(t('orders.refuseOrderSuccess'));
      setShowRefuseConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Не удалось отказаться от заказа');
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (data: UpdateReplyDto) => performerApi.updateTaskStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      queryClient.invalidateQueries({ queryKey: ['performerMyActiveOrders'] });
      toast.success(t('orders.orderCompleted'));
      setShowCompleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.generic'));
    },
  });

  const deleteCompletedReplyMutation = useMutation({
    mutationFn: (replyId: number) => performerApi.deleteCompletedReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success(t('orders.completedOrderDeleted'));
      setShowDeleteConfirm(false);
      navigate('/performer/orders?tab=completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.generic'));
    },
  });

  // Получаем имя текущего пользователя из localStorage
  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return t('roles.performer');
      const user = JSON.parse(userStr);
      return user.name || user.login || t('roles.performer');
    } catch (error) {
      return t('roles.performer');
    }
  })();

  const addReviewMutation = useMutation({
    mutationFn: (data: WorkExperience) => performerApi.addReview(data),
    onSuccess: (_, variables) => {
      toast.success(t('orders.reviewAdded'));
      setShowReviewForm(false);
      setReviewData({ mark: 5, text: '', customerId: 0 });
      // Оптимистично обновляем список отзывов для текущего профиля
      if (selectedCustomerId) {
        queryClient.setQueryData(['customerReviews', selectedCustomerId], (oldData: any) => {
          if (!oldData) return oldData;
          const newReview: WorkExperience = {
            ...variables,
            id: Date.now(), // Временный ID
            reviewerType: 'PERFORMER',
            performerName: currentUserName,
            createdAt: new Date().toISOString(),
          };
          return {
            ...oldData,
            reviews: [...(oldData.reviews || []), newReview],
          };
        });
      }
      // Инвалидируем все запросы отзывов заказчиков для обновления всех открытых профилей
      queryClient.invalidateQueries({ queryKey: ['customerReviews'] });
      // Также инвалидируем собственные отзывы заказчика (если он смотрит свой профиль)
      queryClient.invalidateQueries({ queryKey: ['customerOwnReviews'] });
      // Инвалидируем собственные отзывы исполнителя (если он смотрит свой профиль)
      queryClient.invalidateQueries({ queryKey: ['performerOwnReviews'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при добавлении отзыва');
    },
  });

  const handleAddReview = () => {
    if (!reviewData.customerId || !order) return;
    if (!reviewData.text.trim()) {
      toast.error('Пожалуйста, заполните комментарий');
      return;
    }
    addReviewMutation.mutate({
      name: currentUserName,
      mark: reviewData.mark,
      text: reviewData.text.trim(),
      customerId: reviewData.customerId,
      performerId: 0, // Это будет установлено на бэкенде из текущего исполнителя
      orderId: order.id,
    });
  };

  const handleRefuseClick = () => {
    if (!order) return;
    setShowRefuseConfirm(true);
  };

  const handleConfirmRefuse = () => {
    if (order) {
      refuseOrderMutation.mutate(order.id);
    }
  };

  const handleCancelRefuse = () => {
    setShowRefuseConfirm(false);
  };

  const handleCompleteClick = () => {
    if (!currentReplyId) return;
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = () => {
    if (currentReplyId) {
      completeOrderMutation.mutate({
        id: currentReplyId,
        isDoneThisTask: true,
      });
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (currentReplyId) {
      deleteCompletedReplyMutation.mutate(currentReplyId);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('orders.orderNotFound')}</p>
      </div>
    );
  }

  // Проверяем, есть ли отклик от текущего исполнителя
  // Используем поле hasReplied, которое устанавливается на бэкенде
  const hasReplied = order.hasReplied === true;
  
  // Проверяем, утвержден ли отклик заказчиком
  const isReplyApproved = currentReply?.isOnCustomer === true;
  
  // Проверяем статус активности заказа (заказ активен если isActived === true)
  const isOrderActive = order.isActived === true;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/performer/orders')} className="btn btn-secondary flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </button>

      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">{order.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {order.publicationTime && (
                <span>
                  {t('orderDetail.created')}: {format(new Date(order.publicationTime), 'd MMMM yyyy HH:mm', { locale: ru })}
                </span>
              )}
              {order.howReplies !== undefined && <span>{t('orderDetail.replies')}: {order.howReplies}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {isOrderActive && (
              <>
                {hasReplied && !isReplyApproved ? (
                  <button 
                    onClick={handleCancelReply} 
                    disabled={deleteReplyMutation.isPending || !currentReplyId}
                    className="btn btn-danger flex items-center"
                  >
                    {deleteReplyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        {t('orders.cancelReply')}
                      </>
                    )}
                  </button>
                ) : hasReplied && isReplyApproved ? (
                  <>
                    {/* Кнопки для заказов в работе */}
                    {!currentReply?.isDoneThisTask && !currentReply?.donned && (
                      <>
                        <button
                          onClick={handleRefuseClick}
                          disabled={refuseOrderMutation.isPending}
                          className="btn btn-danger flex items-center"
                        >
                          {refuseOrderMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              {t('orderDetail.refuse')}
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCompleteClick}
                          disabled={completeOrderMutation.isPending}
                          className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
                        >
                          {completeOrderMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t('orderDetail.complete')}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handleAddReply} 
                    disabled={addReplyMutation.isPending}
                    className="btn btn-primary flex items-center"
                  >
                    {addReplyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('orders.replyToOrder')}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">{t('orderForm.description')}</h3>
            <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{order.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">{t('orderDetail.scope')}</h3>
            <p className="text-gray-700 dark:text-slate-300">{order.scope}</p>
          </div>
          {order.stackS && (
            <div>
              <h3 className="text-lg font-semibold mb-2 dark:text-slate-100">{t('register.technologies')}</h3>
              <p className="text-gray-700 dark:text-slate-300">{order.stackS}</p>
            </div>
          )}
        </div>

        {!isOrderActive && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <p className="text-gray-600 dark:text-slate-300">
              {t('orders.orderInactiveOrModeration')}
            </p>
          </div>
        )}
      </div>

      {/* Карточка заказчика */}
      {order.customerId && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('orders.customer')}</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {order.customerName || customerInfo?.login || t('roles.customer')}
                </p>
                {customerInfo?.email && (
                  <p className="text-sm text-gray-600">{customerInfo.email}</p>
                )}
              </div>
              <div className="ml-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedCustomerId(order.customerId!);
                    setShowCustomerProfile(true);
                    setCustomerProfileTab('portfolio');
                  }}
                  className="btn btn-secondary flex items-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  {t('orderDetail.viewProfile')}
                </button>
                {/* Кнопка "Оставить отзыв" показывается после завершения заказа */}
                {order.isDone && order.customerId && (
                  <button
                    onClick={() => {
                      setReviewData({ ...reviewData, customerId: order.customerId || 0 });
                      setShowReviewForm(true);
                    }}
                    className="btn btn-primary flex items-center"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    {t('orderDetail.review')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения отказа */}
      <Modal isOpen={showRefuseConfirm} onClose={handleCancelRefuse}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('orders.refuseOrderConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-semibold mb-2">
                ⚠️ {t('common.warning')}!
              </p>
              <p className="text-orange-700 text-sm">
                {t('orders.refuseOrderMessage')}
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              {t('orders.cannotUndo')}
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={handleConfirmRefuse}
                disabled={refuseOrderMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {refuseOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                <X className="w-4 h-4 mr-2" />
                    {t('common.yes')}, {t('orderDetail.refuse')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelRefuse}
                disabled={refuseOrderMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('orders.completeOrderConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✓ {t('orderDetail.complete')}
              </p>
              <p className="text-green-700 text-sm">
                {t('orders.completeOrderMessage')}
                  </p>
                </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              {t('orders.canMakeCorrections')}
            </p>
            
            <div className="flex space-x-2 pt-4">
                  <button
                onClick={handleConfirmComplete}
                disabled={completeOrderMutation.isPending}
                className="btn bg-green-600 hover:bg-green-700 text-white flex items-center flex-1"
              >
                {completeOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('common.yes')}, {t('orderDetail.complete')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelComplete}
                disabled={completeOrderMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение удаления</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-red-700 text-sm">
                Вы уверены, что хотите удалить этот завершенный заказ из истории? Это действие нельзя отменить.
              </p>
              </div>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={handleConfirmDelete}
                disabled={deleteCompletedReplyMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {deleteCompletedReplyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Да, удалить
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteCompletedReplyMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
          </div>
          </div>
      </div>
      </Modal>

      {/* Модальное окно профиля заказчика */}
      {showCustomerProfile && selectedCustomerId && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCustomerProfile(false);
              setSelectedCustomerId(null);
              setCustomerProfileTab('portfolio');
            }
          }}
        >
          <div
            className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-slate-100">Профиль заказчика</h2>
              <button
                onClick={() => {
                  setShowCustomerProfile(false);
                  setSelectedCustomerId(null);
                  setCustomerProfileTab('portfolio');
                }}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setCustomerProfileTab('portfolio')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  customerProfileTab === 'portfolio'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Портфолио
              </button>
              <button
                onClick={() => setCustomerProfileTab('orders')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  customerProfileTab === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Завершенные заказы
              </button>
              <button
                onClick={() => setCustomerProfileTab('reviews')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  customerProfileTab === 'reviews'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Отзывы
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {customerProfileTab === 'portfolio' && (
                <div>
                  {isLoadingCustomerPortfolio ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка портфолио...</div>
                    </div>
                  ) : customerPortfolioError ? (
                    <div className="text-center py-12">
                      <p className="text-red-500">Ошибка загрузки портфолио: {customerPortfolioError instanceof Error ? customerPortfolioError.message : 'Неизвестная ошибка'}</p>
                      <p className="text-sm text-gray-500 mt-2">Проверьте консоль для подробностей</p>
                    </div>
                  ) : customerPortfolio ? (
                    <div className="space-y-4">
                      {(customerPortfolio.name || customerPortfolio.firstName || customerPortfolio.lastName) && (
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Имя</h3>
                          <p className="text-gray-700 dark:text-slate-300">
                            {customerPortfolio.name || 
                             [customerPortfolio.lastName, customerPortfolio.firstName, customerPortfolio.middleName]
                               .filter(Boolean)
                               .join(' ') || 
                             'Не указано'}
                          </p>
                        </div>
                      )}
                      {customerPortfolio.email && (
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Email</h3>
                          <p className="text-gray-700 dark:text-slate-300">{customerPortfolio.email}</p>
                        </div>
                      )}
                      {customerPortfolio.phone && (
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Телефон</h3>
                          <p className="text-gray-700 dark:text-slate-300">{customerPortfolio.phone}</p>
                        </div>
                      )}
                      {customerPortfolio.description && (
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Описание</h3>
                          <p className="text-gray-700 dark:text-slate-300">{customerPortfolio.description}</p>
                        </div>
                      )}
                      {customerPortfolio.scopeS && (
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Область</h3>
                          <p className="text-gray-700 dark:text-slate-300">{customerPortfolio.scopeS}</p>
                        </div>
                      )}
                      {(!customerPortfolio.name && !customerPortfolio.firstName && !customerPortfolio.lastName && !customerPortfolio.email && !customerPortfolio.phone && !customerPortfolio.description && !customerPortfolio.scopeS) && (
                        <div className="text-center py-12">
                          <p className="text-gray-500">Портфолио не заполнено</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Портфолио не найдено</p>
                    </div>
                  )}
                </div>
              )}

              {customerProfileTab === 'orders' && (
                <div>
                  {isLoadingCustomerDoneOrders ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка заказов...</div>
                    </div>
                  ) : customerDoneOrdersData?.orders && customerDoneOrdersData.orders.length > 0 ? (
                    <div className="space-y-4">
                      {customerDoneOrdersData.orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-2">{order.title}</h3>
                          {order.performerName && (
                            <div className="mb-2">
                              <p className="font-medium text-gray-900 dark:text-slate-100">{order.performerName}</p>
                              {order.performerEmail && (
                                <p className="text-sm text-gray-600 dark:text-slate-400">{order.performerEmail}</p>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                            {order.scope && <span>Область: {order.scope}</span>}
                            {order.stackS && <span>• Технологии: {order.stackS}</span>}
                            {order.endTime && (
                              <span>
                                • Завершен: {format(new Date(order.endTime), 'd MMMM yyyy', { locale: ru })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Завершенных заказов не найдено</p>
                    </div>
                  )}
                </div>
              )}

              {customerProfileTab === 'reviews' && (
                <div>
                  {isLoadingCustomerReviews ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка отзывов...</div>
                    </div>
                  ) : customerReviewsData?.reviews && customerReviewsData.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {customerReviewsData.reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {review.text || 'Отзыв без текста'}
                              </h3>
                            </div>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (review.mark || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 font-semibold">{review.mark}</span>
                            </div>
                          </div>
                          {review.reviewerType === 'PERFORMER' && review.performerName && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{review.performerName}</p>
                              {review.performerEmail && (
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{review.performerEmail}</p>
                              )}
                            </div>
                          )}
                          {review.reviewerType === 'CUSTOMER' && review.customerName && (
                            <p className="text-sm text-gray-600 mt-2">От заказчика: {review.customerName}</p>
                          )}
                          {review.name && !review.performerName && !review.customerName && (
                            <p className="text-sm text-gray-500 mt-1">{review.name}</p>
                          )}
                          {review.createdAt && (
                            <p className="text-xs text-gray-400 mt-2">
                              {format(new Date(review.createdAt), 'd MMMM yyyy', { locale: ru })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Отзывов не найдено</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Review Form Modal */}
      {showReviewForm && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Оставить отзыв</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold mb-2">
                  ⭐ Оцените работу заказчика
                </p>
                <p className="text-blue-700 text-sm">
                  Ваш отзыв поможет другим исполнителям сделать правильный выбор.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Оценка
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, mark: rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= reviewData.mark
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewData.mark} из 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Комментарий
                </label>
                <textarea
                  value={reviewData.text}
                  onChange={(e) => setReviewData({ ...reviewData, text: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Расскажите о вашем опыте работы с заказчиком..."
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button 
                  onClick={handleAddReview} 
                  disabled={addReviewMutation.isPending}
                  className="btn btn-primary flex items-center"
                >
                  {addReviewMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Отправить отзыв
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowReviewForm(false)} 
                  disabled={addReviewMutation.isPending}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

