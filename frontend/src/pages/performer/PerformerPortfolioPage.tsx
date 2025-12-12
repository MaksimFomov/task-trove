import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, User, Mail, Phone, MapPin, Briefcase, Clock, Award, AlertTriangle, Loader2, Star, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Modal from '../../components/Modal';
import type { UpdatePortfolioDto } from '../../types';

// Список специализаций для исполнителей
const SPECIALIZATIONS = [
  'Веб-разработка',
  'Мобильная разработка',
  'Дизайн',
  'Графический дизайн',
  'UX/UI дизайн',
  'Копирайтинг',
  'Переводы',
  'Маркетинг',
  'SMM',
  'SEO',
  'Контент-маркетинг',
  'Видеомонтаж',
  'Фотография',
  'Анимация',
  'Программирование',
  'Тестирование ПО',
  'Администрирование',
  'Консультации',
  'Обучение',
  'Другое'
];

export default function PerformerPortfolioPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdatePortfolioDto>({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    phone: '',
    townCountry: '',
    specializations: '',
    employment: '',
    experience: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Selected specializations for performer
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Handle specialization selection
  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedSpecializations, specialization];
    } else {
      newSelected = selectedSpecializations.filter(s => s !== specialization);
    }
    
    setSelectedSpecializations(newSelected);
    // Update formData with comma-separated string
    setFormData({ 
      ...formData, 
      specializations: newSelected.join(', ') 
    });
    
    // Clear error if at least one specialization is selected
    if (newSelected.length > 0 && errors.specializations) {
      setErrors({ ...errors, specializations: '' });
    }
  };

  useEffect(() => {
    console.log('Portfolio data received:', portfolio);
    if (portfolio) {
      const specializationsStr = portfolio.specializations || '';
      const specializationsArray = specializationsStr 
        ? specializationsStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];
      
      setSelectedSpecializations(specializationsArray);
      
      setFormData({
        lastName: portfolio.lastName || '',
        firstName: portfolio.firstName || '',
        middleName: portfolio.middleName || '',
        email: portfolio.email || '',
        phone: portfolio.phone || '',
        townCountry: portfolio.townCountry || '',
        specializations: specializationsStr,
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

  // Validation function
  const validateFormData = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Last name validation
    if (!formData.lastName || formData.lastName.trim() === '') {
      newErrors.lastName = 'Фамилия обязательна для заполнения';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Фамилия должна содержать минимум 2 символа';
    }

    // First name validation
    if (!formData.firstName || formData.firstName.trim() === '') {
      newErrors.firstName = 'Имя обязательно для заполнения';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Имя должно содержать минимум 2 символа';
    }

    // Middle name validation (optional)
    if (formData.middleName && formData.middleName.trim().length > 0 && formData.middleName.trim().length < 2) {
      newErrors.middleName = 'Отчество должно содержать минимум 2 символа';
    }

    // Email validation (readonly, but check anyway)
    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }

    // Specializations validation
    if (!formData.specializations || formData.specializations.trim() === '' || selectedSpecializations.length === 0) {
      newErrors.specializations = 'Выберите хотя бы одну специализацию';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFormData()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Мое портфолио</h1>

      <div className="card">
        <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            <span className="text-red-500">*</span> — обязательные поля для заполнения
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Фамилия <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value });
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: '' });
                }
              }}
              className={`input ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="Введите вашу фамилию"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.lastName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value });
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: '' });
                }
              }}
              className={`input ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="Введите ваше имя"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Отчество
            </label>
            <input
              type="text"
              value={formData.middleName || ''}
              onChange={(e) => {
                setFormData({ ...formData, middleName: e.target.value });
                if (errors.middleName) {
                  setErrors({ ...errors, middleName: '' });
                }
              }}
              className={`input ${errors.middleName ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="Введите ваше отчество"
            />
            {errors.middleName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.middleName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              readOnly
              disabled
              className="input bg-gray-100 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' });
                }
              }}
              className={`input ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="+375 (29) 123-45-67"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Город/Страна
            </label>
            <input
              type="text"
              value={formData.townCountry}
              onChange={(e) => setFormData({ ...formData, townCountry: e.target.value })}
              className="input"
              placeholder="Минск, Беларусь"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Специализации <span className="text-red-500">*</span>
            </label>
            <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${errors.specializations ? 'border-red-500' : 'border-gray-300'}`}>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Выберите одну или несколько специализаций:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <label key={spec} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSpecializations.includes(spec)}
                      onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{spec}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedSpecializations.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Выбрано:</strong> {selectedSpecializations.join(', ')}
                </p>
              </div>
            )}
            {errors.specializations && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.specializations}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Занятость
            </label>
            <select
              value={formData.employment}
              onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
              className="input"
            >
              <option value="">Выберите доступность для работы</option>
              <option value="Полный день">Полный день (8+ часов в день)</option>
              <option value="Неполный день">Неполный день (4-6 часов в день)</option>
              <option value="Несколько часов в день">Несколько часов в день (1-3 часа)</option>
              <option value="Выходные дни">Только выходные дни</option>
              <option value="Вечернее время">Вечернее время</option>
              <option value="По договоренности">По договоренности</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Мои отзывы</h2>
        </div>

        {isLoadingReviews ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-slate-400">Загрузка отзывов...</p>
          </div>
        ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
          <div className="space-y-4">
            {reviewsData.reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {review.text || 'Отзыв без текста'}
                    </h3>
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
                {review.customerName && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{review.customerName}</p>
                    {review.customerEmail && (
                      <p className="text-sm text-gray-500 mt-1">{review.customerEmail}</p>
                )}
                  </div>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение обновления</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-slate-300">
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

