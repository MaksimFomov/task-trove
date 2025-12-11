import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Save, User, Mail, Calendar, FileText, Building, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import type { CustomerPortfolio, UpdateCustomerPortfolioDto } from '../../types';

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

export default function CustomerPortfolioPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateCustomerPortfolioDto>({
    name: '',
    age: 18,
    description: '',
    scopeS: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Selected business areas for customer
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['customerPortfolio'],
    queryFn: async () => {
      try {
        const response = await customerApi.getPortfolio();
        console.log('Customer portfolio response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching customer portfolio:', error);
        return null;
      }
    },
  });

  // Handle business area selection
  const handleBusinessAreaChange = (area: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedBusinessAreas, area];
    } else {
      newSelected = selectedBusinessAreas.filter(a => a !== area);
    }
    
    setSelectedBusinessAreas(newSelected);
    // Update formData with comma-separated string
    setFormData({ 
      ...formData, 
      scopeS: newSelected.join(', ') 
    });
    
    // Clear error if at least one area is selected
    if (newSelected.length > 0 && errors.scopeS) {
      setErrors({ ...errors, scopeS: '' });
    }
  };

  useEffect(() => {
    console.log('Customer portfolio data received:', portfolio);
    if (portfolio) {
      const scopeSStr = portfolio.scopeS || '';
      const businessAreasArray = scopeSStr 
        ? scopeSStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];
      
      setSelectedBusinessAreas(businessAreasArray);
      
      setFormData({
        name: portfolio.name || '',
        age: portfolio.age || 18,
        description: portfolio.description || '',
        scopeS: scopeSStr,
      });
      console.log('Form data set:', {
        name: portfolio.name || '',
        age: portfolio.age || 18,
        description: portfolio.description || '',
        scopeS: scopeSStr,
      });
    } else {
      console.log('Customer portfolio is null or undefined');
    }
  }, [portfolio]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerPortfolioDto) => {
      console.log('Sending customer portfolio update:', data);
      return customerApi.updatePortfolio(data);
    },
    onSuccess: async (response) => {
      console.log('Customer portfolio updated successfully, response:', response);
      // Инвалидируем и перезагружаем данные
      await queryClient.invalidateQueries({ queryKey: ['customerPortfolio'] });
      await queryClient.refetchQueries({ queryKey: ['customerPortfolio'] });
      toast.success('Портфолио обновлено');
    },
    onError: (error: any) => {
      console.error('Error updating customer portfolio:', error);
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

    // Name validation (readonly, but check anyway)
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Имя обязательно для заполнения';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Возраст обязателен для заполнения';
    } else if (formData.age < 18 || formData.age > 120) {
      newErrors.age = 'Возраст должен быть от 18 до 120 лет';
    }

    // Description validation
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 10) {
      newErrors.description = 'Описание должно содержать минимум 10 символов';
    }

    // Scope validation
    if (!formData.scopeS || formData.scopeS.trim() === '' || selectedBusinessAreas.length === 0) {
      newErrors.scopeS = 'Выберите хотя бы одну область деятельности';
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
              Имя
            </label>
            <input
              type="text"
              required
              value={formData.name}
              readOnly
              disabled
              className="input bg-gray-100 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Имя нельзя изменить</p>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
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
              value={portfolio?.email || ''}
              readOnly
              disabled
              className="input bg-gray-100 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Возраст <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={18}
              max={120}
              value={formData.age}
              onChange={(e) => {
                setFormData({ ...formData, age: parseInt(e.target.value) || 18 });
                if (errors.age) {
                  setErrors({ ...errors, age: '' });
                }
              }}
              className={`input ${errors.age ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="18-120 лет"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.age}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              className={`input ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
              rows={5}
              placeholder="Расскажите о себе и своих потребностях (необязательно, но если заполняете - минимум 10 символов)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Области деятельности <span className="text-red-500">*</span>
            </label>
            <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${errors.scopeS ? 'border-red-500' : 'border-gray-300'}`}>
              <p className="text-sm text-gray-600 mb-3">Выберите одну или несколько областей деятельности:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BUSINESS_AREAS.map((area) => (
                  <label key={area} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedBusinessAreas.includes(area)}
                      onChange={(e) => handleBusinessAreaChange(area, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">{area}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedBusinessAreas.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Выбрано:</strong> {selectedBusinessAreas.join(', ')}
                </p>
              </div>
            )}
            {errors.scopeS && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.scopeS}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Обновить портфолио
            </button>
          </div>
        </form>
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
