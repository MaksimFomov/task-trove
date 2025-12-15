import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Order } from '../../types';

export default function CustomerOrderEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Список областей деятельности для заказчиков
  const BUSINESS_AREAS = [
    t('businessAreas.it'),
    t('businessAreas.marketing'),
    t('businessAreas.design'),
    t('businessAreas.education'),
    t('businessAreas.finance'),
    t('businessAreas.healthcare'),
    t('businessAreas.retail'),
    t('businessAreas.manufacturing'),
    t('businessAreas.construction'),
    t('businessAreas.transport'),
    t('businessAreas.tourism'),
    t('businessAreas.realEstate'),
    t('businessAreas.law'),
    t('businessAreas.consulting'),
    t('businessAreas.other')
  ];
  const [formData, setFormData] = useState<Partial<Order>>({
    title: '',
    description: '',
    scope: '',
    stackS: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);

  // Загружаем данные заказа
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['customerOrder', id],
    queryFn: () => customerApi.getOrder(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // Заполняем форму данными заказа
  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title || '',
        description: order.description || '',
        scope: order.scope || '',
        stackS: order.stackS || '',
      });
      
      // Преобразуем область в массив для выбранных областей
      if (order.scope) {
        const scopeArray = order.scope.split(',').map(s => s.trim()).filter(Boolean);
        setSelectedBusinessAreas(scopeArray);
      }
    }
  }, [order]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Order>) => {
      console.log('Updating order data:', data);
      return customerApi.updateOrder(Number(id!), data);
    },
    onSuccess: async () => {
      toast.success(t('orders.orderUpdatedForReview'));
      await queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['customerOrder', id] });
      navigate('/customer/orders');
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || t('errors.generic'));
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Валидация названия
    if (!formData.title?.trim()) {
      newErrors.title = t('orderForm.titleRequired');
    } else if (formData.title.trim().length < 3) {
      newErrors.title = t('orderForm.titleMinLength');
    } else if (formData.title.trim().length > 200) {
      newErrors.title = t('orderForm.titleMaxLength');
    }

    // Валидация описания
    if (!formData.description?.trim()) {
      newErrors.description = t('orderForm.descriptionRequired');
    } else if (formData.description.trim().length < 10) {
      newErrors.description = t('orderForm.descriptionMinLength');
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = t('orderForm.descriptionMaxLength');
    }

    // Валидация области
    if (selectedBusinessAreas.length === 0) {
      newErrors.scope = t('orderForm.scopeRequired');
    }

    // Валидация технологий (опциональное поле)
    if (formData.stackS && formData.stackS.trim().length > 500) {
      newErrors.stackS = t('orderForm.technologiesMaxLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('register.fixErrors'));
      return;
    }

    const dataToSend: Partial<Order> = {
      ...formData,
      scope: selectedBusinessAreas.join(', '),
    };

    updateMutation.mutate(dataToSend);
  };

  const handleBusinessAreaToggle = (area: string) => {
    setSelectedBusinessAreas(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area);
      } else {
        return [...prev, area];
      }
    });
    // Очищаем ошибку при изменении
    if (errors.scope) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.scope;
        return newErrors;
      });
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{t('orderForm.orderNotFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (order.status !== 'REJECTED' && !order.isRejected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <div className="flex items-center text-orange-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{t('orders.orderRejectedByAdmin')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/customer/orders')}
        className="mb-6 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </button>

      <div className="card max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 dark:text-slate-100">{t('orders.editOrder')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название заказа */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t('orderForm.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                if (errors.title) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.title;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('orderForm.enterTitle')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t('orderForm.description')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.description;
                    return newErrors;
                  });
                }
              }}
              rows={8}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('orderForm.enterDescription')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Область деятельности */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t('orderForm.scope')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BUSINESS_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleBusinessAreaToggle(area)}
                  className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                    selectedBusinessAreas.includes(area)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            {errors.scope && (
              <p className="mt-1 text-sm text-red-600">{errors.scope}</p>
            )}
          </div>

          {/* Технологии */}
          <div>
            <label htmlFor="stackS" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              {t('register.technologies')} ({t('common.optional')})
            </label>
            <input
              type="text"
              id="stackS"
              value={formData.stackS}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, stackS: e.target.value }));
                if (errors.stackS) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.stackS;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.stackS ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('register.technologiesPlaceholder')}
            />
            {errors.stackS && (
              <p className="mt-1 text-sm text-red-600">{errors.stackS}</p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/customer/orders')}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-primary flex items-center"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('orderForm.updating')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('orders.saveAndSendForReview')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

