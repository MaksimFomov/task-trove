import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { LogIn, Mail, Lock, Loader2, RotateCcw, Send, AlertCircle, CheckCircle, X } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetData, setResetData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [codeSent, setCodeSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Таймер обратного отсчета для повторной отправки кода
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const sendResetCodeMutation = useMutation({
    mutationFn: (email: string) => {
      return authApi.forgotPasswordPublic(email);
    },
    onSuccess: () => {
      toast.success('Если пользователь с таким email существует, код восстановления отправлен на почту');
      setCodeSent(true);
      setResetLoading(false);
      setResendCooldown(60);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Ошибка при отправке кода';
      toast.error(errorMessage);
      setResetLoading(false);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) => {
      return authApi.resetPasswordPublic(data.email, data.code, data.newPassword);
    },
    onSuccess: () => {
      setShowResetSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setCodeSent(false);
        setResetData({ code: '', newPassword: '', confirmPassword: '' });
        setResetErrors({});
        setResetEmail('');
        setResendCooldown(0);
        setShowResetSuccess(false);
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Ошибка при восстановлении пароля';
      
      // Если ошибка связана с кодом, показываем понятное сообщение в поле кода
      if (errorMessage.includes('код') || errorMessage.includes('Код') || errorMessage.includes('code') || 
          errorMessage.includes('восстановлен') || errorMessage.includes('истек')) {
        setResetErrors({ ...resetErrors, code: 'Неправильный код восстановления' });
        toast.error('Неправильный код восстановления');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const validateResetPassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!resetData.code.trim()) {
      errors.code = 'Введите код восстановления';
    }

    if (!resetData.newPassword.trim()) {
      errors.newPassword = 'Введите новый пароль';
    } else if (resetData.newPassword.length < 8) {
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
    }

    if (!resetData.confirmPassword.trim()) {
      errors.confirmPassword = 'Подтвердите новый пароль';
    } else if (resetData.newPassword !== resetData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    setResetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendResetCode = async () => {
    if (!resetEmail.trim()) {
      toast.error('Введите email адрес');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      toast.error('Введите корректный email адрес');
      return;
    }

    setResetLoading(true);
    setResetErrors({});
    sendResetCodeMutation.mutate(resetEmail.trim());
  };

  const handleResendResetCode = () => {
    if (resendCooldown > 0) {
      return;
    }
    setResetData({ ...resetData, code: '' });
    setResetLoading(true);
    setResetErrors({ ...resetErrors, code: '' });
    sendResetCodeMutation.mutate(resetEmail.trim());
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateResetPassword()) {
      resetPasswordMutation.mutate({
        email: resetEmail.trim(),
        code: resetData.code.trim(),
        newPassword: resetData.newPassword,
      });
    }
  };

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
      } else if (role === 'Administrator' || role === 'SuperAdministrator') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      // Проверяем, является ли ошибка связанной с заблокированным аккаунтом
      if (error?.response?.status === 403 && error?.response?.data?.error === 'Ваш аккаунт заблокирован') {
        showErrorToast('Ваш аккаунт заблокирован', 'Обратитесь к администратору для разблокировки.');
      } else {
      showErrorToast(error, 'Ошибка входа. Проверьте логин и пароль.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">TaskTrove</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Вход в систему</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Войдите в свой аккаунт</p>
        </div>
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Забыл пароль?
              </button>
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
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Нет аккаунта?{' '}
              <a href="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
                Зарегистрироваться
              </a>
            </p>
          </div>
        </div>

        {/* Модальное окно восстановления пароля */}
        {showForgotPassword && (
          <div className="card mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Восстановление пароля</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setCodeSent(false);
                  setResetData({ code: '', newPassword: '', confirmPassword: '' });
                  setResetErrors({});
                  setResetEmail('');
                  setResendCooldown(0);
                  setShowResetSuccess(false);
                }}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Enter Email and Send Code */}
            {!codeSent && !showResetSuccess && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Введите email адрес, привязанный к вашему аккаунту. Код восстановления будет отправлен на указанную почту.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetErrors.email) {
                        setResetErrors({ ...resetErrors, email: '' });
                      }
                    }}
                    className={`input ${resetErrors.email ? 'border-red-500' : ''}`}
                    placeholder="Введите email"
                  />
                  {resetErrors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {resetErrors.email}
                    </p>
                  )}
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleSendResetCode}
                    disabled={resetLoading || resendCooldown > 0}
                    className="btn btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Отправка...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2" />
                        Повторить через {resendCooldown}с
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Отправить код
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Code and New Password */}
            {codeSent && !showResetSuccess && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Код восстановления
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={resetData.code}
                      onChange={(e) => {
                        setResetData({ ...resetData, code: e.target.value });
                        if (resetErrors.code) {
                          setResetErrors({ ...resetErrors, code: '' });
                        }
                      }}
                      className={`input flex-1 ${resetErrors.code ? 'border-red-500' : ''}`}
                      placeholder="Введите код из письма"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleResendResetCode}
                      disabled={resetLoading || resendCooldown > 0}
                      className={`text-sm flex items-center whitespace-nowrap ${
                        resendCooldown > 0
                          ? 'text-gray-400 dark:text-slate-500 cursor-not-allowed'
                          : 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300'
                      }`}
                    >
                      {resetLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-1" />
                      )}
                      {resendCooldown > 0 ? `Повторить через ${resendCooldown}с` : 'Отправить повторно'}
                    </button>
                  </div>
                  {resetErrors.code && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {resetErrors.code}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={resetData.newPassword}
                    onChange={(e) => {
                      setResetData({ ...resetData, newPassword: e.target.value });
                      if (resetErrors.newPassword) {
                        setResetErrors({ ...resetErrors, newPassword: '' });
                      }
                    }}
                    className={`input ${resetErrors.newPassword ? 'border-red-500' : ''}`}
                    placeholder="Минимум 8 символов"
                  />
                  {resetErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {resetErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Подтвердите новый пароль
                  </label>
                  <input
                    type="password"
                    value={resetData.confirmPassword}
                    onChange={(e) => {
                      setResetData({ ...resetData, confirmPassword: e.target.value });
                      if (resetErrors.confirmPassword) {
                        setResetErrors({ ...resetErrors, confirmPassword: '' });
                      }
                    }}
                    className={`input ${resetErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Повторите новый пароль"
                  />
                  {resetErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {resetErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="btn btn-primary flex items-center"
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Восстановление...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Восстановить пароль
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Success Notification */}
            {showResetSuccess && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                      Пароль успешно восстановлен
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Ваш пароль был успешно изменен. Теперь вы можете войти в систему, используя новый пароль.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

