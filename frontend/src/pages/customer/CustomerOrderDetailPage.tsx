import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Send, Star, FileText, Upload, X, User, Briefcase, Award, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../../components/Modal';
import type { WorkExperience, AddPerformerToOrderDto, Reply, Order, Chat } from '../../types';

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
        const response = await customerApi.getPortfolio(reply.performerId);
        return response.data;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
  });

  const performerName = portfolio?.name || reply.perfName || 'Исполнитель';
  
  // Формируем описание с префиксом "Опыт: " для experience
  let performerDescription = '';
  if (portfolio?.experience) {
    performerDescription = `Опыт: ${portfolio.experience}`;
  } else if (portfolio?.specializations) {
    performerDescription = portfolio.specializations;
  } else if (portfolio?.employment) {
    performerDescription = portfolio.employment;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-lg mb-1">{performerName}</p>
          {performerDescription && (
            <p className="text-sm text-gray-600 line-clamp-2">{performerDescription}</p>
          )}
          {isLoading && !portfolio && (
            <p className="text-sm text-gray-400 italic">Загрузка информации...</p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onViewProfile(reply.performerId)}
            className="btn btn-secondary flex items-center"
          >
            <User className="w-4 h-4 mr-1" />
            Профиль
          </button>
          {!order.performerId && (
            <button
              onClick={() => onApprove(reply.performerId)}
              className="btn btn-primary"
            >
              Утвердить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrderDetailPage() {
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
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [completeReviewData, setCompleteReviewData] = useState({
    mark: 5,
    text: '',
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['customerOrder', id],
    queryFn: () => customerApi.getOrder(Number(id)).then((res) => res.data),
  });

  // Получаем имя текущего пользователя из localStorage
  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'Заказчик';
      const user = JSON.parse(userStr);
      return user.name || user.login || 'Заказчик';
    } catch (error) {
      return 'Заказчик';
    }
  })();

  // Запрос портфолио утвержденного исполнителя
  const { data: approvedPerformerPortfolio } = useQuery({
    queryKey: ['approvedPerformerPortfolio', order?.performerId],
    queryFn: async () => {
      if (!order?.performerId) return null;
      try {
        const response = await customerApi.getPortfolio(order.performerId);
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
  });

  // Находим чат с текущим исполнителем
  const chatWithPerformer = chatsData?.find(
    (chat) => chat.performerId === order?.performerId
  );

  // Запросы для профиля исполнителя
  const { data: portfolio, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['performerPortfolio', selectedPerformerId],
    queryFn: async () => {
      try {
        const response = await customerApi.getPortfolio(selectedPerformerId!);
        console.log('Portfolio response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
    enabled: showPerformerProfile && selectedPerformerId !== null && profileTab === 'portfolio',
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
      // Уведомление показывается в sendEmailMutation.onSuccess
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { orderId?: number; performerId?: number; text?: string; document?: File }) =>
      customerApi.sendEmail(data),
    onSuccess: () => {
      // После успешной отправки ТЗ утверждаем исполнителя
      if (selectedPerformer && order) {
        addPerformerMutation.mutate({
          orderId: order.id,
          performerId: selectedPerformer,
        });
      }
      toast.success('ТЗ отправлено и исполнитель утвержден');
      setShowEmailForm(false);
      setEmailText('');
      setEmailFile(null);
      setSelectedPerformer(null);
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
    onSuccess: () => {
      toast.success('Отзыв добавлен');
      setShowReviewForm(false);
      setReviewData({ mark: 5, text: '', performerId: 0 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: number) => customerApi.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerDoneOrders'] });
      queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      toast.success('Заказ сделан неактивным');
      setShowDeleteConfirm(false);
      navigate('/customer/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Не удалось сделать заказ неактивным');
      setShowDeleteConfirm(false);
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

  const handleDeleteClick = (permanent: boolean = false) => {
    if (!order) return;
    setIsPermanentDelete(permanent);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!order) return;
    if (isPermanentDelete) {
      permanentDeleteMutation.mutate(order.id);
    } else {
      deleteMutation.mutate(order.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setIsPermanentDelete(false);
  };

  const handleApproveReply = (performerId: number) => {
    // Только открываем форму для отправки ТЗ, не утверждаем сразу
    setSelectedPerformer(performerId);
    setShowEmailForm(true);
  };

  const handleSendEmail = () => {
    if (!order || !selectedPerformer) return;
    
    // Валидация: нужно хотя бы текст или файл
    if (!emailText.trim() && !emailFile) {
      toast.error('Пожалуйста, заполните текст ТЗ или прикрепите файл');
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
        <p className="text-gray-500 text-lg">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customer/orders')} className="btn btn-secondary flex items-center">
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
                  Опубликован: {format(new Date(order.publicationTime), 'd MMMM yyyy', { locale: ru })}
                </span>
              )}
              {order.howReplies !== undefined && order.howReplies > 0 && (
                <span>Откликов: {order.howReplies}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {/* Кнопки показываются только если заказ на проверке (когда исполнитель завершил задачу) */}
            {order.isOnCheck && !order.isDone && (
              <>
                <button
                  onClick={() => setShowCorrectionsForm(true)}
                  className="btn btn-secondary min-w-[200px]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Добавить исправления
                </button>
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  className="btn btn-primary min-w-[200px]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Завершить заказ
                </button>
              </>
            )}
            {/* Кнопка удаления для неактивных заказов */}
            {!order.isActived && !order.isDone && (
              <button
                onClick={() => handleDeleteClick(true)}
                className="btn btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </button>
            )}
            {/* Кнопка удаления для завершенных заказов */}
            {order.isDone && (
              <button
                onClick={() => handleDeleteClick(true)}
                className="btn btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </button>
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
          {order.performerName && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Исполнитель</h3>
              <p className="text-gray-700">{order.performerName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Исполнитель или Отклики */}
      {order.performerId ? (
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Исполнитель</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {approvedPerformerPortfolio?.name || order.performerName || 'Исполнитель'}
                </p>
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
                  Профиль
                </button>
                {/* Кнопка "Оставить отзыв" показывается после завершения заказа */}
                {order.isDone && order.performerId && (
                  <button
                    onClick={() => {
                      setReviewData({ ...reviewData, performerId: order.performerId || 0 });
                      setShowReviewForm(true);
                    }}
                    className="btn btn-primary flex items-center"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Оставить отзыв
                  </button>
                )}
                {/* Кнопка "Отказаться от исполнителя" показывается только если заказ не завершен */}
                {!order.isDone && (
                  <button
                    onClick={() => setShowRefusePerformerConfirm(true)}
                    className="btn btn-danger flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Отказаться от исполнителя
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        order.replies && order.replies.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Отклики</h2>
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
            <h2 className="text-2xl font-bold mb-4">Отправить техническое задание</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Текст ТЗ</label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="input"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Документ (опционально)</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-input-email"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
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
                      <span className="text-sm text-gray-700 flex-1 truncate">{emailFile.name}</span>
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
                    Размер файла: {(emailFile.size / 1024).toFixed(2)} KB
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
            <h2 className="text-2xl font-bold mb-4">Добавить исправления</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Текст исправлений</label>
                <textarea
                  value={correctionsText}
                  onChange={(e) => setCorrectionsText(e.target.value)}
                  className="input"
                  rows={5}
                  placeholder="Опишите необходимые исправления..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Документ (опционально)</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={correctionsFileInputRef}
                    type="file"
                    id="file-input-corrections"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
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
                      <span className="text-sm text-gray-700 flex-1 truncate">{correctionsFile.name}</span>
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
                    Размер файла: {(correctionsFile.size / 1024).toFixed(2)} KB
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
              <h2 className="text-2xl font-bold text-gray-900">Оставить отзыв</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <h2 className="text-2xl font-bold">Профиль исполнителя</h2>
              <button
                onClick={() => {
                  setShowPerformerProfile(false);
                  setSelectedPerformerId(null);
                  setProfileTab('portfolio');
                }}
                className="text-gray-500 hover:text-gray-700"
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
                      <div className="text-lg text-gray-600">Загрузка портфолио...</div>
                    </div>
                  ) : portfolio ? (
                    <div className="space-y-4">
                      {portfolio.name && (
                        <div>
                          <h3 className="font-semibold mb-2">Имя</h3>
                          <p className="text-gray-700">{portfolio.name}</p>
                        </div>
                      )}
                      {portfolio.email && (
                        <div>
                          <h3 className="font-semibold mb-2">Email</h3>
                          <p className="text-gray-700">{portfolio.email}</p>
                        </div>
                      )}
                      {portfolio.phone && (
                        <div>
                          <h3 className="font-semibold mb-2">Телефон</h3>
                          <p className="text-gray-700">{portfolio.phone}</p>
                        </div>
                      )}
                      {portfolio.specializations && (
                        <div>
                          <h3 className="font-semibold mb-2">Специализации</h3>
                          <p className="text-gray-700">{portfolio.specializations}</p>
                        </div>
                      )}
                      {portfolio.experience && (
                        <div>
                          <h3 className="font-semibold mb-2">Опыт</h3>
                          <p className="text-gray-700">{portfolio.experience}</p>
                        </div>
                      )}
                      {portfolio.employment && (
                        <div>
                          <h3 className="font-semibold mb-2">Занятость</h3>
                          <p className="text-gray-700">{portfolio.employment}</p>
                        </div>
                      )}
                      {portfolio.townCountry && (
                        <div>
                          <h3 className="font-semibold mb-2">Местоположение</h3>
                          <p className="text-gray-700">{portfolio.townCountry}</p>
                        </div>
                      )}
                      {(!portfolio.name && !portfolio.email && !portfolio.phone && !portfolio.specializations && !portfolio.experience && !portfolio.employment && !portfolio.townCountry) && (
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
                          <p className="text-sm text-gray-600 mb-2">{order.description}</p>
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
                      <p className="text-gray-500">Выполненных заказов не найдено</p>
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
                              <h3 className="font-semibold">{review.name}</h3>
                              {review.customerName && (
                                <p className="text-sm text-gray-500">От: {review.customerName}</p>
                              )}
                            </div>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (review.mark || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 font-semibold">{review.mark}</span>
                            </div>
                          </div>
                          {review.text && (
                            <p className="text-gray-700 mt-2">{review.text}</p>
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

      {/* Модальное окно подтверждения отказа от исполнителя */}
      <Modal isOpen={showRefusePerformerConfirm} onClose={() => setShowRefusePerformerConfirm(false)}>
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
                Вы уверены, что хотите отказаться от исполнителя? Заказ вернется в статус активного, 
                и исполнителю будет отправлено уведомление об отказе.
              </p>
            </div>
            
            <p className="text-gray-700">
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
                <X className="w-4 h-4 mr-2" />
                {refusePerformerMutation.isPending ? 'Отказ...' : 'Да, отказаться'}
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
            <h2 className="text-2xl font-bold text-gray-900">Завершение заказа</h2>
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
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Оставить отзыв (необязательно)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {completeReviewData.mark} из 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                onClick={() => {
                  if (order) {
                    // Завершаем заказ
                    updateStatusMutation.mutate({
                      orderId: order.id,
                      isDone: true,
                    });
                    
                    // Если заполнен комментарий, отправляем отзыв
                    if (completeReviewData.text.trim()) {
                      addReviewMutation.mutate({
                        name: currentUserName,
                        mark: completeReviewData.mark,
                        text: completeReviewData.text.trim(),
                        performerId: order.performerId || 0,
                        orderId: order.id,
                      });
                    }
                    
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
                className={`btn flex items-center flex-1 ${isPermanentDelete ? 'btn-danger' : 'btn-primary'}`}
              >
                {deleteMutation.isPending || permanentDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPermanentDelete ? 'Удаление...' : 'Деактивация...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isPermanentDelete ? 'Да, удалить' : 'Да, сделать неактивным'}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteMutation.isPending || permanentDeleteMutation.isPending}
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

