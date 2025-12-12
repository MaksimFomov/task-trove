import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Order } from '../../types';

// Список областей деятельности для заказчиков
const BUSINESS_AREAS = [
  'IT и технологии',
  'Маркетинг и реклама',
  'Дизайн и творчество',
  'Образование',
  'Финансы',
  'Здравоохранение',
  'Торговля',
  'Производство',
  'Строительство',
  'Транспорт',
  'Туризм',
  'Недвижимость',
  'Юриспруденция',
  'Консалтинг',
  'Другое'
];

export default function CustomerOrderCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Order>>({
    title: '',
    description: '',
    scope: '',
    stackS: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Order>) => {
      console.log('Sending order data:', data);
      return customerApi.addOrder(data);
    },
    onSuccess: async () => {
      toast.success('Заказ отправлен на рассмотрение администратору. После одобрения он станет доступен для исполнителей.');
      // Немедленное обновление всех связанных запросов
      await queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['adminOrdersOnReview'] });
      // Переходим на страницу заказов - данные обновятся автоматически
      navigate('/customer/orders');
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Ошибка при создании заказа');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Валидация названия
    if (!formData.title?.trim()) {
      newErrors.title = 'Название обязательно для заполнения';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Название должно содержать минимум 3 символа';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Название не должно превышать 200 символов';
    }

    // Валидация описания
    if (!formData.description?.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Описание должно содержать минимум 10 символов';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Описание не должно превышать 5000 символов';
    }

    // Валидация области
    if (selectedBusinessAreas.length === 0) {
      newErrors.scope = 'Выберите хотя бы одну область деятельности';
    }

    // Валидация технологий (опциональное поле)
    if (formData.stackS && formData.stackS.trim().length > 500) {
      newErrors.stackS = 'Технологии не должны превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    // Убеждаемся, что отправляем данные в правильном формате
    const orderData = {
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      scope: selectedBusinessAreas.join(', '),
      stackS: formData.stackS?.trim() || undefined,
    };
    createMutation.mutate(orderData);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customer/orders')} className="btn btn-secondary flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </button>

      <div className="card">
        <h1 className="text-3xl font-bold mb-6 dark:text-slate-100">Создать заказ</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              className={`input ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Введите название заказа"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Описание <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              className={`input ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              rows={6}
              placeholder="Опишите детали заказа, требования и ожидания"
              maxLength={5000}
            />
            {formData.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {formData.description.length} / 5000 символов
              </p>
            )}
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Область <span className="text-red-500">*</span>
            </label>
            <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${errors.scope ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Выберите одну или несколько областей деятельности:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BUSINESS_AREAS.map((area) => (
                  <label key={area} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBusinessAreas.includes(area)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        let newSelected: string[];
                        if (checked) {
                          newSelected = [...selectedBusinessAreas, area];
                        } else {
                          newSelected = selectedBusinessAreas.filter(a => a !== area);
                        }
                        setSelectedBusinessAreas(newSelected);
                        if (errors.scope && newSelected.length > 0) {
                          setErrors({ ...errors, scope: '' });
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-slate-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{area}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedBusinessAreas.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Выбрано:</strong> {selectedBusinessAreas.join(', ')}
                </p>
              </div>
            )}
            {errors.scope && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.scope}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Технологии
            </label>
            <input
              type="text"
              value={formData.stackS}
              onChange={(e) => {
                setFormData({ ...formData, stackS: e.target.value });
                if (errors.stackS) {
                  setErrors({ ...errors, stackS: '' });
                }
              }}
              className={`input ${errors.stackS ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="React, Node.js, PostgreSQL"
              maxLength={500}
            />
            {errors.stackS && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.stackS}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={createMutation.isPending}
            className="btn btn-primary flex items-center"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Создать заказ
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

