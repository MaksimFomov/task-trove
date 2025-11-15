import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { Reply, Chat } from '../../types';

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

        {isOrderActive && (
          <div className="mt-6">
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
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    ✓ Вы утверждены заказчиком для выполнения этого заказа
                  </p>
                </div>
                {chatWithCustomer && (
                  <button
                    onClick={() => navigate(`/chat/${chatWithCustomer.id}`)}
                    className="btn btn-primary flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Открыть чат с заказчиком
                  </button>
                )}
              </div>
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
          </div>
        )}

        {!isOrderActive && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">
              Этот заказ неактивен или находится на модерации
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

