import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, User, Mail, Phone, MapPin, Briefcase, Clock, Award, AlertTriangle, Loader2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import type { UpdatePortfolioDto } from '../../types';

export default function PerformerPortfolioPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdatePortfolioDto>({
    name: '',
    email: '',
    phone: '',
    townCountry: '',
    specializations: '',
    employment: '',
    experience: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['performerPortfolio'],
    queryFn: async () => {
      try {
        const response = await performerApi.getPortfolio();
        console.log('Portfolio response:', response.data);
        // Если ответ - массив, берем первый элемент
        if (Array.isArray(response.data)) {
          return response.data.length > 0 ? response.data[0] : null;
        }
        return response.data;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
  });

  // Получаем отзывы о текущем исполнителе
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['performerOwnReviews'],
    queryFn: async () => {
      try {
        const response = await performerApi.getMyReviews();
        console.log('Reviews response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [] };
      }
    },
  });

  useEffect(() => {
    console.log('Portfolio data received:', portfolio);
    if (portfolio) {
      setFormData({
        name: portfolio.name || '',
        email: portfolio.email || '',
        phone: portfolio.phone || '',
        townCountry: portfolio.townCountry || '',
        specializations: portfolio.specializations || '',
        employment: portfolio.employment || '',
        experience: portfolio.experience || '',
      });
      console.log('Form data set:', {
        name: portfolio.name || '',
        email: portfolio.email || '',
        phone: portfolio.phone || '',
        townCountry: portfolio.townCountry || '',
        specializations: portfolio.specializations || '',
        employment: portfolio.employment || '',
        experience: portfolio.experience || '',
      });
    } else {
      console.log('Portfolio is null or undefined');
    }
  }, [portfolio]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePortfolioDto) => {
      console.log('Sending portfolio update:', data);
      return performerApi.updatePortfolio(data);
    },
    onSuccess: async (response) => {
      console.log('Portfolio updated successfully, response:', response);
      // Инвалидируем и перезагружаем данные
      await queryClient.invalidateQueries({ queryKey: ['performerPortfolio'] });
      await queryClient.refetchQueries({ queryKey: ['performerPortfolio'] });
      toast.success('Портфолио обновлено');
    },
    onError: (error: any) => {
      console.error('Error updating portfolio:', error);
      console.error('Error response:', error.response);
      
      // Обработка ошибок валидации
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.errors) {
          // Ошибки валидации от Spring
          const errorMessages = Object.values(errorData.errors).flat().join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else if (errorData?.message) {
          toast.error(errorData.message);
        } else {
          toast.error('Ошибка валидации данных. Проверьте правильность заполнения полей.');
        }
      } else {
        toast.error(error.response?.data?.message || 'Ошибка при обновлении портфолио');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация на фронтенде
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Имя обязательно для заполнения');
      return;
    }
    
    if (!formData.email || formData.email.trim() === '') {
      toast.error('Email обязателен для заполнения');
      return;
    }
    
    // Простая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Введите корректный email адрес');
      return;
    }
    
    // Показываем диалог подтверждения
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    setShowConfirmDialog(false);
    updateMutation.mutate(formData);
  };

  const handleCancelUpdate = () => {
    setShowConfirmDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Мое портфолио</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Имя
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Город/Страна
            </label>
            <input
              type="text"
              value={formData.townCountry}
              onChange={(e) => setFormData({ ...formData, townCountry: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Специализации
            </label>
            <input
              type="text"
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Занятость
            </label>
            <input
              type="text"
              value={formData.employment}
              onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4 inline mr-2" />
              Опыт работы
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="input"
              rows={5}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Обновить портфолио
            </button>
          </div>
        </form>
      </div>

      {/* Раздел с отзывами */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Мои отзывы</h2>
        </div>

        {isLoadingReviews ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Загрузка отзывов...</p>
          </div>
        ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviewsData.reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{review.name}</h3>
                    {review.customerName && (
                      <p className="text-sm text-gray-500">От: {review.customerName}</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < (review.mark || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-semibold text-lg">{review.mark}</span>
                  </div>
                </div>
                {review.text && (
                  <p className="text-gray-700 mt-2">{review.text}</p>
                )}
                {review.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(review.createdAt), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">У вас пока нет отзывов</p>
            <p className="text-gray-400 text-sm">
              Отзывы от заказчиков будут отображаться здесь после завершения заказов
            </p>
          </div>
        )}
      </div>

      {/* Диалог подтверждения обновления */}
      <Modal isOpen={showConfirmDialog} onClose={handleCancelUpdate}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Подтверждение обновления</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Вы уверены, что хотите обновить портфолио? Все изменения будут сохранены.
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmUpdate}
                disabled={updateMutation.isPending}
                className="btn btn-primary flex items-center flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Да, обновить
                  </>
                )}
              </button>
              <button
                onClick={handleCancelUpdate}
                disabled={updateMutation.isPending}
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

