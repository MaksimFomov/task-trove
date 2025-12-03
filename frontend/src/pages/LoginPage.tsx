import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!login.trim() || !password.trim()) {
      showErrorToast('Пожалуйста, заполните все поля');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.login({ login: login, password: password });
      const { token, role, id, login: userLogin } = response.data;
      
      setAuth({ id, login: userLogin, role, token }, token);
      showSuccessToast('Успешный вход!');
      
      // Navigate based on role
      if (role === 'Customer') {
        navigate('/customer/orders');
      } else if (role === 'Performer') {
        navigate('/performer/orders');
      } else if (role === 'Administrator') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
      showErrorToast(error, 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">TaskTrove</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Вход в систему</h2>
          <p className="mt-2 text-sm text-gray-600">Войдите в свой аккаунт</p>
        </div>
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Логин или Email
              </label>
              <input
                id="login"
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="input"
                placeholder="Введите логин или email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Пароль
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Введите пароль"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Войти
                </>
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Зарегистрироваться
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

