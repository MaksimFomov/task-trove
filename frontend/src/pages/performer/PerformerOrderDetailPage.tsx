import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, X, Loader2, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { Reply, Chat, UpdateReplyDto } from '../../types';
import Modal from '../../components/Modal';

export default function PerformerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['performerOrder', id],
    queryFn: () => performerApi.getOrder(Number(id)).then((res) => res.data),
  });

  // Запрос чатов для получения ID чата с заказчиком
  const { data: chatsData } = useQuery({
    queryKey: ['performerChats'],
    queryFn: () => performerApi.getChats().then((res) => res.data.chats),
    enabled: !!order?.customerId,
  });

  // Находим чат с заказчиком этого заказа
  const chatWithCustomer = chatsData?.find(
    (chat) => chat.customerId === order?.customerId
  );

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

  const [showRefuseConfirm, setShowRefuseConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addReplyMutation = useMutation({
    mutationFn: (data: { orderId: number; orderName: string }) =>
      performerApi.addReply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success('Отклик отправлен');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отправке отклика');
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: number) => performerApi.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success('Отклик отменен');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отмене отклика');
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
      toast.success('Вы успешно отказались от заказа');
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
      toast.success('Заказ успешно завершен и отправлен на проверку');
      setShowCompleteConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Не удалось завершить заказ');
    },
  });

  const deleteCompletedReplyMutation = useMutation({
    mutationFn: (replyId: number) => performerApi.deleteCompletedReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success('Выполненный заказ успешно удален из истории');
      setShowDeleteConfirm(false);
      navigate('/performer/orders?tab=completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Не удалось удалить заказ');
    },
  });

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
        <p className="text-gray-500 text-lg">Заказ не найден</p>
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
        Назад
      </button>

      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{order.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {order.publicationTime && (
                <span>
                  Опубликован: {format(new Date(order.publicationTime), 'dd MMM yyyy HH:mm')}
                </span>
              )}
              {order.howReplies !== undefined && <span>Откликов: {order.howReplies}</span>}
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
                    <X className="w-4 h-4 mr-2" />
                    {deleteReplyMutation.isPending ? 'Отмена...' : 'Отменить отклик'}
                  </button>
                ) : hasReplied && isReplyApproved ? (
                  <>
                    {/* Кнопки для заказов в работе */}
                    {!currentReply?.isDoneThisTask && !currentReply?.donned && (
                      <>
                        <button
                          onClick={handleRefuseClick}
                          className="btn btn-danger flex items-center"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Отказаться
                        </button>
                        <button
                          onClick={handleCompleteClick}
                          disabled={completeOrderMutation.isPending}
                          className="btn bg-green-600 hover:bg-green-700 text-white flex items-center"
                        >
                          {completeOrderMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Завершение...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Завершить
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {/* Кнопка удаления для завершенных заказов */}
                    {currentReply?.donned && (
                      <button
                        onClick={handleDeleteClick}
                        disabled={deleteCompletedReplyMutation.isPending}
                        className="btn btn-danger flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteCompletedReplyMutation.isPending ? 'Удаление...' : 'Удалить'}
                      </button>
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
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Откликнуться на заказ
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
            <h3 className="text-lg font-semibold mb-2">Описание</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Область</h3>
            <p className="text-gray-700">{order.scope}</p>
          </div>
          {order.stackS && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Технологии</h3>
              <p className="text-gray-700">{order.stackS}</p>
            </div>
          )}
          {order.customerName && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Заказчик</h3>
              <p className="text-gray-700">{order.customerName}</p>
            </div>
          )}
        </div>

        {!isOrderActive && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">
              Этот заказ неактивен или находится на модерации
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

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Подтверждение удаления</h2>
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
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteCompletedReplyMutation.isPending ? 'Удаление...' : 'Да, удалить'}
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
    </div>
  );
}

