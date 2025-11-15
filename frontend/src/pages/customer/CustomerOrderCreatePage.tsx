import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Order } from '../../types';

export default function CustomerOrderCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Order>>({
    title: '',
    description: '',
    scope: '',
    stackS: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Order>) => {
      console.log('Sending order data:', data);
      return customerApi.addOrder(data);
    },
    onSuccess: async () => {
      toast.success('Заказ создан');
      // Инвалидируем и обновляем кэш заказов
      await queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      // Переходим на страницу заказов - данные обновятся автоматически
      navigate('/customer/orders');
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Ошибка при создании заказа');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Убеждаемся, что отправляем данные в правильном формате
    const orderData = {
      title: formData.title,
      description: formData.description,
      scope: formData.scope,
      stackS: formData.stackS || undefined,
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
        <h1 className="text-3xl font-bold mb-6">Создать заказ</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Область</label>
            <input
              type="text"
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Технологии (опционально)</label>
            <input
              type="text"
              value={formData.stackS}
              onChange={(e) => setFormData({ ...formData, stackS: e.target.value })}
              className="input"
            />
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

