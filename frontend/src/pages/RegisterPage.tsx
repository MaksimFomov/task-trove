import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { UserPlus, Mail, Lock, User, Calendar, MapPin, Briefcase } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

type RegisterType = 'customer' | 'performer';

export default function RegisterPage() {
  const [type, setType] = useState<RegisterType>('customer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Customer fields
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    passwordUser: '',
    age: '',
    description: '',
    scopeS: '',
  });

  // Performer fields
  const [performerData, setPerformerData] = useState({
    name: '',
    email: '',
    passwordUser: '',
    age: '',
    phone: '',
    townCountry: '',
    specializations: '',
    employment: '',
    experience: '',
  });

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!customerData.name.trim() || !customerData.email.trim() || !customerData.passwordUser.trim()) {
      showErrorToast('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    if (customerData.passwordUser.length < 8) {
      showErrorToast('Пароль должен содержать минимум 8 символов');
      return;
    }
    
    const age = parseInt(customerData.age);
    if (isNaN(age) || age < 18 || age > 120) {
      showErrorToast('Пожалуйста, укажите корректный возраст (18-120 лет)');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.registerCustomer({
        ...customerData,
        age: age,
      });
      const { token, role, id, login } = response.data;
      
      setAuth({ id, login, role, token }, token);
      showSuccessToast('Регистрация успешна!');
      navigate('/customer/orders');
    } catch (error) {
      showErrorToast(error, 'Ошибка регистрации. Возможно, такой email уже используется.');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!performerData.name.trim() || !performerData.email.trim() || !performerData.passwordUser.trim()) {
      showErrorToast('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    if (performerData.passwordUser.length < 8) {
      showErrorToast('Пароль должен содержать минимум 8 символов');
      return;
    }
    
    const age = parseInt(performerData.age);
    if (isNaN(age) || age < 18 || age > 120) {
      showErrorToast('Пожалуйста, укажите корректный возраст (18-120 лет)');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.registerPerformer({
        ...performerData,
        age: age,
      });
      const { token, role, id, login } = response.data;
      
      setAuth({ id, login, role, token }, token);
      showSuccessToast('Регистрация успешна!');
      navigate('/performer/orders');
    } catch (error) {
      showErrorToast(error, 'Ошибка регистрации. Возможно, такой email уже используется.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">TaskTrove</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Регистрация</h2>
        </div>

        {/* Type selector */}
        <div className="card mb-6">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setType('customer')}
              className={`flex-1 btn ${type === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Заказчик
            </button>
            <button
              type="button"
              onClick={() => setType('performer')}
              className={`flex-1 btn ${type === 'performer' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Исполнитель
            </button>
          </div>
        </div>

        {/* Customer form */}
        {type === 'customer' && (
          <div className="card">
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Имя
                </label>
                <input
                  type="text"
                  required
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
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
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Пароль (минимум 8 символов)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={customerData.passwordUser}
                  onChange={(e) => setCustomerData({ ...customerData, passwordUser: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Возраст
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={120}
                  value={customerData.age}
                  onChange={(e) => setCustomerData({ ...customerData, age: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  required
                  value={customerData.description}
                  onChange={(e) => setCustomerData({ ...customerData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Область деятельности
                </label>
                <input
                  type="text"
                  required
                  value={customerData.scopeS}
                  onChange={(e) => setCustomerData({ ...customerData, scopeS: e.target.value })}
                  className="input"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary">
                <UserPlus className="w-5 h-5 inline mr-2" />
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        )}

        {/* Performer form */}
        {type === 'performer' && (
          <div className="card">
            <form onSubmit={handlePerformerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Имя
                </label>
                <input
                  type="text"
                  required
                  value={performerData.name}
                  onChange={(e) => setPerformerData({ ...performerData, name: e.target.value })}
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
                  value={performerData.email}
                  onChange={(e) => setPerformerData({ ...performerData, email: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Пароль (минимум 8 символов)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={performerData.passwordUser}
                  onChange={(e) => setPerformerData({ ...performerData, passwordUser: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Возраст
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={120}
                  value={performerData.age}
                  onChange={(e) => setPerformerData({ ...performerData, age: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={performerData.phone}
                  onChange={(e) => setPerformerData({ ...performerData, phone: e.target.value })}
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
                  value={performerData.townCountry}
                  onChange={(e) => setPerformerData({ ...performerData, townCountry: e.target.value })}
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
                  value={performerData.specializations}
                  onChange={(e) => setPerformerData({ ...performerData, specializations: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Занятость
                </label>
                <input
                  type="text"
                  value={performerData.employment}
                  onChange={(e) => setPerformerData({ ...performerData, employment: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Опыт работы
                </label>
                <textarea
                  value={performerData.experience}
                  onChange={(e) => setPerformerData({ ...performerData, experience: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary">
                <UserPlus className="w-5 h-5 inline mr-2" />
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Войти
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
