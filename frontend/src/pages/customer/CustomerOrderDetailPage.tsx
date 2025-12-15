import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, notificationApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Send, Star, FileText, Upload, X, User, Briefcase, Award, Loader2, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../../components/Modal';
import type { WorkExperience, AddPerformerToOrderDto, Reply, Order, Chat, Notification } from '../../types';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_FILE_SIZE_KB = Math.floor(MAX_FILE_SIZE / 1024);

// Компонент для отображения отклика с информацией об исполнителе
function ReplyItem({
  reply,
  order,
  onViewProfile,
  onApprove,
}: {
  reply: Reply;
  order: Order;
  onViewProfile: (performerId: number) => void;
  onApprove: (performerId: number) => void;
}) {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['performerPortfolio', reply.performerId],
    queryFn: async () => {
      try {
        const response = await customerApi.getPerformerPortfolio(reply.performerId);
        return response.data;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
    enabled: !!reply.performerId && reply.performerId > 0, // Загружаем только если performerId валидный
    retry: false, // Не повторяем запрос при ошибке
  });

  const { t } = useTranslation();
  const performerName = portfolio?.name || reply.perfName || t('roles.performer');
  const performerEmail = portfolio?.email || reply.perfEmail;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-lg mb-1">{performerName}</p>
          {performerEmail && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 mb-1">
              {performerEmail}
            </p>
          )}
          {isLoading && !portfolio && (
            <p className="text-sm text-gray-400 italic">{t('common.loading')}</p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onViewProfile(reply.performerId)}
            className="btn btn-secondary flex items-center"
          >
            <User className="w-4 h-4 mr-1" />
            {t('orderDetail.viewProfile')}
          </button>
          {!order.performerId && (
            <button
              onClick={() => onApprove(reply.performerId)}
              className="btn btn-primary"
            >
              {t('orderDetail.approve')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPerformer, setSelectedPerformer] = useState<number | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [emailFile, setEmailFile] = useState<File | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCorrectionsForm, setShowCorrectionsForm] = useState(false);
  const [correctionsText, setCorrectionsText] = useState('');
  const [correctionsFile, setCorrectionsFile] = useState<File | null>(null);
  const [reviewData, setReviewData] = useState({
    mark: 5,
    text: '',
    performerId: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const correctionsFileInputRef = useRef<HTMLInputElement>(null);
  const [showPerformerProfile, setShowPerformerProfile] = useState(false);
  const [selectedPerformerId, setSelectedPerformerId] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<'portfolio' | 'orders' | 'reviews'>('portfolio');
  const [showRefusePerformerConfirm, setShowRefusePerformerConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [performerToApprove, setPerformerToApprove] = useState<number | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [completeReviewData, setCompleteReviewData] = useState({
    mark: 5,
    text: '',
  });

  // Отслеживание уведомлений для автоматического обновления заказа
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then((res) => res.data),
    refetchInterval: 1000, // Проверяем уведомления каждую секунду
    enabled: true,
  });

  const previousNotificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (notificationsData?.notifications && id) {
      const currentNotifications = notificationsData.notifications;
      const previousNotifications = previousNotificationsRef.current;

      // Проверяем, есть ли новые непрочитанные уведомления REPLY, COMPLETED, REFUSED для этого заказа
      const relevantNotificationTypes = ['REPLY', 'COMPLETED', 'REFUSED'];
      const orderId = Number(id);
      const newRelevantNotifications = currentNotifications.filter(
        (notif: Notification) =>
          !notif.isRead &&
          relevantNotificationTypes.includes(notif.type) &&
          notif.relatedOrderId === orderId &&
          !previousNotifications.some((prev: Notification) => prev.id === notif.id)
      );

      // Если найдены новые релевантные уведомления, обновляем заказ
      if (newRelevantNotifications.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
        queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
        queryClient.invalidateQueries({ queryKey: ['customerChats'] });
      }

      previousNotificationsRef.current = currentNotifications;
    }
  }, [notificationsData, id, queryClient]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['customerOrder', id],
    queryFn: () => customerApi.getOrder(Number(id)).then((res) => res.data),
    refetchInterval: 1000, // Автоматическое обновление каждую секунду
  });

  // Получаем имя текущего пользователя из localStorage
  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return t('roles.customer');
      const user = JSON.parse(userStr);
      return user.name || user.email || t('roles.customer');
    } catch (error) {
      return t('roles.customer');
    }
  })();

  // Запрос портфолио утвержденного исполнителя
  const { data: approvedPerformerPortfolio } = useQuery({
    queryKey: ['approvedPerformerPortfolio', order?.performerId],
    queryFn: async () => {
      if (!order?.performerId) return null;
      try {
        const response = await customerApi.getPerformerPortfolio(order.performerId);
        return response.data;
      } catch (error) {
        console.error('Error fetching approved performer portfolio:', error);
        return null;
      }
    },
    enabled: !!order?.performerId,
  });

  // Запрос чатов для получения ID чата с исполнителем
  const { data: chatsData } = useQuery({
    queryKey: ['customerChats'],
    queryFn: () => customerApi.getChats().then((res) => res.data.chats),
    enabled: !!order?.performerId,
    refetchInterval: 1000, // Автоматическое обновление каждую секунду
  });

  // Находим чат с текущим исполнителем (может быть общий чат для нескольких заказов)
  const chatWithPerformer = chatsData?.find(
    (chat) => chat.performerId === order?.performerId
  );

  // Запросы для профиля исполнителя
  const { data: portfolio, isLoading: isLoadingPortfolio, error: portfolioError } = useQuery({
    queryKey: ['performerPortfolio', selectedPerformerId],
    queryFn: async () => {
      if (!selectedPerformerId) {
        throw new Error('Performer ID is not set');
      }
      try {
        const response = await customerApi.getPerformerPortfolio(selectedPerformerId);
        console.log('Portfolio response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error fetching portfolio:', error);
        // Если ошибка 404, это означает что исполнитель не найден (возможно удален)
        if (error.response?.status === 404) {
          // Используем сообщение с бэкенда, если оно есть, иначе используем дефолтное
          const errorMessage = error.response?.data?.message || 'Исполнитель не найден. Возможно, он был удален из системы.';
          console.warn(`Performer with ID ${selectedPerformerId} not found:`, errorMessage);
          throw new Error(errorMessage);
        }
        throw error;
      }
    },
    enabled: showPerformerProfile && selectedPerformerId !== null && selectedPerformerId > 0 && profileTab === 'portfolio',
    retry: false,
  });

  const { data: doneOrdersData, isLoading: isLoadingDoneOrders } = useQuery({
    queryKey: ['performerDoneOrders', selectedPerformerId],
    queryFn: async () => {
      try {
        const response = await customerApi.getPerformerDoneOrders(selectedPerformerId!);
        console.log('Done orders response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching done orders:', error);
        return { orders: [] };
      }
    },
    enabled: showPerformerProfile && selectedPerformerId !== null && profileTab === 'orders',
  });

  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['performerReviews', selectedPerformerId],
    queryFn: async () => {
      try {
        const response = await customerApi.getPerformerReviews(selectedPerformerId!);
        console.log('Reviews response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [] };
      }
    },
    enabled: showPerformerProfile && selectedPerformerId !== null && profileTab === 'reviews',
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; isDone?: boolean; isOnCheck?: boolean }) =>
      customerApi.updateTaskStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      // Инвалидируем кэш откликов исполнителя, чтобы статус обновился
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success('Статус обновлен');
    },
  });

  const addPerformerMutation = useMutation({
    mutationFn: (data: AddPerformerToOrderDto) => customerApi.addPerformerToOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      // Также инвалидируем кэш заказов исполнителя, чтобы заказ исчез из списка доступных
      queryClient.invalidateQueries({ queryKey: ['performerOrders'] });
      // Инвалидируем кэш откликов исполнителя, чтобы утвержденный отклик появился в разделе утвержденных
      queryClient.invalidateQueries({ queryKey: ['performerReplies'] });
      toast.success('Исполнитель одобрен');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при одобрении исполнителя');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { orderId?: number; performerId?: number; text?: string; document?: File }) =>
      customerApi.sendEmail(data),
    onSuccess: () => {
      toast.success('ТЗ отправлено исполнителю');
      setShowEmailForm(false);
      setEmailText('');
      setEmailFile(null);
      setSelectedPerformer(null);
      // Обновляем данные заказа, чтобы увидеть обновленный статус
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отправке ТЗ');
    },
  });

  const sendCorrectionsMutation = useMutation({
    mutationFn: (data: { orderId?: number; performerId?: number; text?: string; document?: File; isCorrection?: boolean }) =>
      customerApi.sendEmail(data),
    onSuccess: () => {
      toast.success('Исправления отправлены исполнителю');
      setShowCorrectionsForm(false);
      setCorrectionsText('');
      setCorrectionsFile(null);
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отправке исправлений');
    },
  });

  const refusePerformerMutation = useMutation({
    mutationFn: (orderId: number) => customerApi.refusePerformer(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      toast.success('Вы отказались от исполнителя');
      setShowRefusePerformerConfirm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отказе от исполнителя');
      setShowRefusePerformerConfirm(false);
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: (data: WorkExperience) => customerApi.addReview(data),
    onSuccess: (_, variables) => {
      toast.success('Отзыв добавлен');
      setShowReviewForm(false);
      setReviewData({ mark: 5, text: '', performerId: 0 });
      // Оптимистично обновляем список отзывов для текущего профиля
      if (selectedPerformerId) {
        queryClient.setQueryData(['performerReviews', selectedPerformerId], (oldData: any) => {
          if (!oldData) return oldData;
          const newReview: WorkExperience = {
            ...variables,
            id: Date.now(), // Временный ID
            reviewerType: 'CUSTOMER',
            customerName: currentUserName,
            createdAt: new Date().toISOString(),
          };
          return {
            ...oldData,
            reviews: [...(oldData.reviews || []), newReview],
          };
        });
      }
      // Инвалидируем все запросы отзывов исполнителей для обновления всех открытых профилей
      queryClient.invalidateQueries({ queryKey: ['performerReviews'] });
      // Также инвалидируем собственные отзывы исполнителя (если он смотрит свой профиль)
      queryClient.invalidateQueries({ queryKey: ['performerOwnReviews'] });
      // Инвалидируем собственные отзывы заказчика (если он смотрит свой профиль)
      queryClient.invalidateQueries({ queryKey: ['customerOwnReviews'] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (orderId: number) => customerApi.permanentlyDeleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      toast.success('Заказ полностью удален');
      setShowDeleteConfirm(false);
      navigate('/customer/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось удалить заказ');
      setShowDeleteConfirm(false);
    },
  });

  const handleDeleteClick = () => {
    if (!order) return;
    setIsPermanentDelete(true);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!order) return;
    permanentDeleteMutation.mutate(order.id);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setIsPermanentDelete(false);
  };

  const handleApproveReply = (performerId: number) => {
    // Показываем модальное окно подтверждения
    setPerformerToApprove(performerId);
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = () => {
    if (!order || !performerToApprove) return;
    setSelectedPerformer(performerToApprove);
    addPerformerMutation.mutate({
      orderId: order.id,
      performerId: performerToApprove,
    });
    setShowApproveConfirm(false);
    setPerformerToApprove(null);
  };

  const handleCancelApprove = () => {
    setShowApproveConfirm(false);
    setPerformerToApprove(null);
  };

  const handleSendEmail = () => {
    if (!order || !selectedPerformer) return;
    
    // Валидация: нужно хотя бы текст или файл
    if (!emailText.trim() && !emailFile) {
      toast.error('Пожалуйста, заполните текст ТЗ или прикрепите файл');
      return;
    }
    if (emailFile && emailFile.size > MAX_FILE_SIZE) {
      toast.error(`Файл ТЗ превышает лимит ${MAX_FILE_SIZE_KB} КБ`);
      return;
    }
    
    sendEmailMutation.mutate({
      orderId: order.id,
      performerId: selectedPerformer,
      text: emailText,
      document: emailFile || undefined,
    });
  };

  const handleSendCorrections = () => {
    if (!order || !order.performerId) return;
    
    // Валидация: нужно хотя бы текст или файл
    if (!correctionsText.trim() && !correctionsFile) {
      toast.error('Пожалуйста, заполните текст исправлений или прикрепите файл');
      return;
    }
    if (correctionsFile && correctionsFile.size > MAX_FILE_SIZE) {
      toast.error(`Файл с исправлениями превышает лимит ${MAX_FILE_SIZE_KB} КБ`);
      return;
    }
    
    sendCorrectionsMutation.mutate({
      orderId: order.id,
      performerId: order.performerId,
      text: correctionsText.trim() || undefined,
      document: correctionsFile || undefined,
      isCorrection: true,
    });
  };

  const handleAddReview = () => {
    if (!reviewData.performerId || !order) return;
    addReviewMutation.mutate({
      name: currentUserName,
      mark: reviewData.mark,
      text: reviewData.text,
      performerId: reviewData.performerId,
      orderId: order.id,
    });
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

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customer/orders')} className="btn btn-secondary flex items-center">
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
              {order.howReplies !== undefined && !order.performerId && (
                <span>{t('orderDetail.replies')}: {order.howReplies}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end w-[240px]">
            {/* Кнопка "Отправить ТЗ" показывается если исполнитель одобрен, но ТЗ еще не отправлено и заказ не завершен */}
            {(order.status !== 'DONE' && !order.isDone) && 
             (order.status !== 'ON_CHECK' && !order.isOnCheck) &&
             order.performerId && 
             !order.isSpecSent && (
              <button
                onClick={() => {
                  setSelectedPerformer(order.performerId!);
                  setShowEmailForm(true);
                }}
                className="btn btn-primary flex items-center"
              >
                <Send className="w-4 h-4 mr-1" />
                Отправить ТЗ
              </button>
            )}
            {/* Кнопки показываются только если заказ на проверке (когда исполнитель завершил задачу) */}
            {(order.status === 'ON_CHECK' || order.isOnCheck) && (order.status !== 'DONE' && !order.isDone) && (
              <>
                <button
                  onClick={() => setShowCorrectionsForm(true)}
                  className="btn btn-secondary w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Добавить исправления
                </button>
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  className="btn btn-primary w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('orderDetail.complete')}
                </button>
              </>
            )}
            {/* Кнопка удаления для активных заказов без исполнителя */}
            {/* Кнопка удаления только для заказов, которые не в работе (нет исполнителя) */}
            {!order.performerId && (order.status === 'ACTIVE' || order.isActived) && (order.status !== 'DONE' && !order.isDone) && (
              <button
                onClick={handleDeleteClick}
                className="btn btn-danger flex items-center w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('orderList.delete')}
              </button>
            )}
            {/* Кнопка удаления для неактивных заказов (только если нет исполнителя) */}
            {!order.performerId && (order.status !== 'ACTIVE' && !order.isActived) && (order.status !== 'DONE' && !order.isDone) && (
              <button
                onClick={handleDeleteClick}
                className="btn btn-danger flex items-center w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </button>
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
      </div>

      {/* Исполнитель или Отклики */}
      {order.performerId ? (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('orders.performer')}</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {approvedPerformerPortfolio?.name || order.performerName || t('roles.performer')}
                </p>
                {(approvedPerformerPortfolio?.email || order.performerEmail) && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {approvedPerformerPortfolio?.email || order.performerEmail}
                  </p>
                )}
              </div>
              <div className="ml-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedPerformerId(order.performerId!);
                    setShowPerformerProfile(true);
                    setProfileTab('portfolio');
                  }}
                  className="btn btn-secondary flex items-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  {t('orderDetail.viewProfile')}
                </button>
                {/* Кнопка чата показывается если есть чат с исполнителем */}
                {chatWithPerformer && (
                  <button
                    onClick={() => navigate(`/chat/${chatWithPerformer.id}`)}
                    className="btn btn-primary flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {t('chats.chat')}
                  </button>
                )}
                {/* Кнопка "Отказаться от исполнителя" показывается только если заказ не завершен */}
                {(order.status !== 'DONE' && !order.isDone) && (
                  <button
                    onClick={() => setShowRefusePerformerConfirm(true)}
                    className="btn btn-danger flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('orderDetail.refuse')}
                  </button>
                )}
                {/* Кнопка "Оставить отзыв" показывается после завершения заказа */}
                {(order.status === 'DONE' || order.isDone) && order.performerId && (
                  <button
                    onClick={() => {
                      setReviewData({ ...reviewData, performerId: order.performerId || 0 });
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
      ) : (
        order.replies && order.replies.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('orderDetail.replies')}</h2>
            <div className="space-y-4">
              {order.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  order={order}
                  onViewProfile={(performerId) => {
                    setSelectedPerformerId(performerId);
                    setShowPerformerProfile(true);
                    setProfileTab('portfolio');
                  }}
                  onApprove={handleApproveReply}
                />
              ))}
            </div>
          </div>
        )
      )}

      {/* Email Form Modal */}
      {showEmailForm && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            // Закрываем модальное окно при клике на фон
            if (e.target === e.currentTarget) {
              setShowEmailForm(false);
              setEmailText('');
              setEmailFile(null);
              setSelectedPerformer(null);
            }
          }}
        >
          <div 
            className="card max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">Отправить техническое задание</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Текст ТЗ</label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="input"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Документ (опционально)</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-input-email"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > MAX_FILE_SIZE) {
                        toast.error(`Файл слишком большой. Максимум ${MAX_FILE_SIZE_KB} КБ.`);
                        e.target.value = '';
                        return;
                      }
                      setEmailFile(file);
                      if (file) {
                        toast.success(`Файл "${file.name}" выбран`);
                      }
                    }}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                  />
                  <label
                    htmlFor="file-input-email"
                    className="btn btn-secondary flex items-center cursor-pointer hover:bg-gray-300 active:bg-gray-400"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файл
                  </label>
                  {emailFile && (
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700 dark:text-slate-300 flex-1 truncate">{emailFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEmailFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Удалить файл"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {emailFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Размер файла: {(emailFile.size / 1024).toFixed(2)} KB (лимит {MAX_FILE_SIZE_KB} КБ)
                  </p>
                )}
                {!emailFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Максимальный размер файла: {MAX_FILE_SIZE_KB} КБ
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleSendEmail} 
                  disabled={sendEmailMutation.isPending || addPerformerMutation.isPending}
                  className="btn btn-primary flex items-center"
                >
                  {sendEmailMutation.isPending || addPerformerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Отправить
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmailText('');
                    setEmailFile(null);
                    setSelectedPerformer(null);
                  }}
                  disabled={sendEmailMutation.isPending || addPerformerMutation.isPending}
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

      {/* Corrections Form Modal */}
      {showCorrectionsForm && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            // Закрываем модальное окно при клике на фон
            if (e.target === e.currentTarget) {
              setShowCorrectionsForm(false);
              setCorrectionsText('');
              setCorrectionsFile(null);
            }
          }}
        >
          <div 
            className="card max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">Добавить исправления</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Текст исправлений</label>
                <textarea
                  value={correctionsText}
                  onChange={(e) => setCorrectionsText(e.target.value)}
                  className="input"
                  rows={5}
                  placeholder="Опишите необходимые исправления..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Документ (опционально)</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={correctionsFileInputRef}
                    type="file"
                    id="file-input-corrections"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > MAX_FILE_SIZE) {
                        toast.error(`Файл слишком большой. Максимум ${MAX_FILE_SIZE_KB} КБ.`);
                        e.target.value = '';
                        return;
                      }
                      setCorrectionsFile(file);
                      if (file) {
                        toast.success(`Файл "${file.name}" выбран`);
                      }
                    }}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                  />
                  <label
                    htmlFor="file-input-corrections"
                    className="btn btn-secondary flex items-center cursor-pointer hover:bg-gray-300 active:bg-gray-400"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файл
                  </label>
                  {correctionsFile && (
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700 dark:text-slate-300 flex-1 truncate">{correctionsFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setCorrectionsFile(null);
                          if (correctionsFileInputRef.current) {
                            correctionsFileInputRef.current.value = '';
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Удалить файл"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {correctionsFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Размер файла: {(correctionsFile.size / 1024).toFixed(2)} KB (лимит {MAX_FILE_SIZE_KB} КБ)
                  </p>
                )}
                {!correctionsFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Максимальный размер файла: {MAX_FILE_SIZE_KB} КБ
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleSendCorrections} 
                  disabled={sendCorrectionsMutation.isPending}
                  className="btn btn-primary flex items-center"
                >
                  {sendCorrectionsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Отправить исправления
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowCorrectionsForm(false);
                    setCorrectionsText('');
                    setCorrectionsFile(null);
                  }}
                  disabled={sendCorrectionsMutation.isPending}
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
                  ⭐ Оцените работу исполнителя
                </p>
                <p className="text-blue-700 text-sm">
                  Ваш отзыв поможет другим заказчикам сделать правильный выбор.
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
                  placeholder="Расскажите о вашем опыте работы с исполнителем..."
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

      {/* Performer Profile Modal */}
      {showPerformerProfile && selectedPerformerId && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPerformerProfile(false);
              setSelectedPerformerId(null);
              setProfileTab('portfolio');
            }
          }}
        >
          <div
            className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-slate-100">Профиль исполнителя</h2>
              <button
                onClick={() => {
                  setShowPerformerProfile(false);
                  setSelectedPerformerId(null);
                  setProfileTab('portfolio');
                }}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setProfileTab('portfolio')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  profileTab === 'portfolio'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4 inline mr-2" />
                Портфолио
              </button>
              <button
                onClick={() => setProfileTab('orders')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  profileTab === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Выполненные заказы
              </button>
              <button
                onClick={() => setProfileTab('reviews')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  profileTab === 'reviews'
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
              {profileTab === 'portfolio' && (
                <div>
                  {isLoadingPortfolio ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
                      <div className="text-lg text-gray-600">Загрузка портфолио...</div>
                    </div>
                  ) : portfolioError ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                      <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Исполнитель не найден</p>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">
                        {portfolioError instanceof Error ? portfolioError.message : 'Не удалось загрузить портфолио исполнителя'}
                      </p>
                    </div>
                  ) : portfolio ? (
                    <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Имя</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.name || 'Не указано'}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Email</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.email || 'Не указано'}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Телефон</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.phone || 'Не указано'}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Специализации</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.specializations || 'Не указано'}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Опыт</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.experience || 'Не указано'}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 dark:text-slate-100">Занятость</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.employment || 'Не указано'}</p>
                        </div>
                        <div>
                        <h3 className="font-semibold mb-2 dark:text-slate-100">Местоположение</h3>
                        <p className="text-gray-700 dark:text-slate-300">{portfolio.townCountry || 'Не указано'}</p>
                        </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-slate-400">Портфолио исполнителя не заполнено</p>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'orders' && (
                <div>
                  {isLoadingDoneOrders ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка заказов...</div>
                    </div>
                  ) : doneOrdersData?.orders && doneOrdersData.orders.length > 0 ? (
                    <div className="space-y-4">
                      {doneOrdersData.orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-lg mb-2">{order.title}</h3>
                          {order.customerName && (
                            <div className="mb-2">
                              <p className="font-medium text-gray-900 dark:text-slate-100">{order.customerName}</p>
                              {order.customerEmail && (
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{order.customerEmail}</p>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-2">
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
                      <p className="text-gray-500">{t('orderList.doneOrders')} {t('common.noData')}</p>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'reviews' && (
                <div>
                  {isLoadingReviews ? (
                    <div className="text-center py-12">
                      <div className="text-lg text-gray-600">Загрузка отзывов...</div>
                    </div>
                  ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviewsData.reviews.map((review) => (
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
                          {review.reviewerType === 'CUSTOMER' && review.customerName && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{review.customerName}</p>
                              {review.customerEmail && (
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{review.customerEmail}</p>
                              )}
                            </div>
                          )}
                          {review.reviewerType === 'PERFORMER' && review.performerName && (
                            <p className="text-sm text-gray-600 mt-2">От исполнителя: {review.performerName}</p>
                          )}
                          {review.name && !review.customerName && !review.performerName && (
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
                      <p className="text-gray-500">{t('orderDetail.review')} {t('common.noData')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Модальное окно подтверждения одобрения исполнителя */}
      <Modal isOpen={showApproveConfirm} onClose={handleCancelApprove}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение одобрения</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                ✓ Подтверждение одобрения исполнителя
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Вы собираетесь одобрить этого исполнителя для работы над заказом. После одобрения вам нужно будет отправить техническое задание.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите одобрить этого исполнителя?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmApprove}
                disabled={addPerformerMutation.isPending}
                className="btn btn-primary flex items-center flex-1"
              >
                {addPerformerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Одобрение...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Да, одобрить
                  </>
                )}
              </button>
              <button
                onClick={handleCancelApprove}
                disabled={addPerformerMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения отказа от исполнителя */}
      <Modal isOpen={showRefusePerformerConfirm} onClose={() => setShowRefusePerformerConfirm(false)}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение отказа</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-orange-700 text-sm">
                Вы уверены, что хотите отказаться от исполнителя? Заказ вернется в статус активного, 
                и исполнителю будет отправлено уведомление об отказе.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Это действие нельзя отменить.
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => {
                  if (order) {
                    refusePerformerMutation.mutate(order.id);
                  }
                }}
                disabled={refusePerformerMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {refusePerformerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Отказ...
                  </>
                ) : (
                  <>
                <X className="w-4 h-4 mr-2" />
                    Да, отказаться
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRefusePerformerConfirm(false)}
                disabled={refusePerformerMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения завершения заказа */}
      <Modal isOpen={showCompleteConfirm} onClose={() => {
        setShowCompleteConfirm(false);
        setCompleteReviewData({ mark: 5, text: '' });
      }}>
        <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Завершение заказа</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                ✓ Завершить заказ
              </p>
              <p className="text-green-700 text-sm">
                Заказ будет помечен как выполненный, и исполнитель получит уведомление.
              </p>
            </div>

            {/* Форма отзыва (необязательно) */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center dark:text-slate-100">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Оставить отзыв (необязательно)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Оценка
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setCompleteReviewData({ ...completeReviewData, mark: rating })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating <= completeReviewData.mark
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-400">
                      {completeReviewData.mark} из 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Комментарий
                  </label>
                  <textarea
                    value={completeReviewData.text}
                    onChange={(e) => setCompleteReviewData({ ...completeReviewData, text: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Расскажите о вашем опыте работы с исполнителем..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={async () => {
                  if (order && order.performerId) {
                    try {
                      // Сначала завершаем заказ
                      await updateStatusMutation.mutateAsync({
                        orderId: order.id,
                        isDone: true,
                      });
                      
                      // Затем отправляем отзыв, если есть performerId
                      // Отзыв отправляется всегда (даже если нет текста, только с оценкой)
                      await addReviewMutation.mutateAsync({
                        name: currentUserName,
                        mark: completeReviewData.mark,
                        text: completeReviewData.text.trim() || '',
                        performerId: order.performerId,
                        orderId: order.id,
                      });
                      
                      setShowCompleteConfirm(false);
                      setCompleteReviewData({ mark: 5, text: '' });
                    } catch (error) {
                      // Если что-то пошло не так, все равно закрываем модальное окно
                      setShowCompleteConfirm(false);
                      setCompleteReviewData({ mark: 5, text: '' });
                    }
                  } else if (order) {
                    // Если нет performerId, просто завершаем заказ
                    updateStatusMutation.mutate({
                      orderId: order.id,
                      isDone: true,
                    });
                    setShowCompleteConfirm(false);
                    setCompleteReviewData({ mark: 5, text: '' });
                  }
                }}
                disabled={updateStatusMutation.isPending || addReviewMutation.isPending}
                className="btn btn-primary flex items-center flex-1"
              >
                {updateStatusMutation.isPending || addReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Завершение...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Завершить заказ
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCompleteConfirm(false);
                  setCompleteReviewData({ mark: 5, text: '' });
                }}
                disabled={updateStatusMutation.isPending || addReviewMutation.isPending}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Подтверждение удаления
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ Внимание: заказ будет удален навсегда!
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Заказ будет полностью удален из базы данных. Это действие нельзя отменить.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите удалить этот заказ?
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
                disabled={permanentDeleteMutation.isPending}
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

