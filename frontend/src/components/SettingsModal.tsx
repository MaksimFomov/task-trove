import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Lock, Moon, Sun, Globe, Mail, Loader2, AlertCircle, CheckCircle, RotateCcw, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { authApi } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'theme' | 'language' | 'support'>('password');
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowPasswordReset(false);
      setCodeSent(false);
      setResetData({ code: '', newPassword: '', confirmPassword: '' });
      setResetErrors({});
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setResendCooldown(0);
      setShowResetSuccess(false);
    }
  }, [isOpen]);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
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

  // Support state
  const [supportData, setSupportData] = useState({
    subject: '',
    message: '',
  });
  const [supportErrors, setSupportErrors] = useState<Record<string, string>>({});

  // Theme state - синхронизируем с текущим состоянием DOM и localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Проверяем текущее состояние DOM
    const hasDarkClass = document.documentElement.classList.contains('dark');
    const saved = localStorage.getItem('theme');
    
    // Приоритет: DOM > localStorage > default
    if (hasDarkClass) {
      return 'dark';
    }
    if (saved === 'dark' || saved === 'light') {
      return saved as 'light' | 'dark';
    }
    return 'light';
  });

  // Language state
  const [language, setLanguage] = useState<'ru' | 'en'>(() => {
    const saved = localStorage.getItem('language');
    return (saved as 'ru' | 'en') || 'ru';
  });

  // Apply theme
  const applyTheme = (newTheme: 'light' | 'dark') => {
    try {
      // Сохраняем в localStorage первым делом
      localStorage.setItem('theme', newTheme);
      
      // Применяем класс напрямую к documentElement
      const htmlElement = document.documentElement;
      if (newTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      
      // Обновляем состояние после применения
      setTheme(newTheme);
      
      // Проверяем, что класс применился
      const isApplied = newTheme === 'dark' 
        ? htmlElement.classList.contains('dark')
        : !htmlElement.classList.contains('dark');
      
      if (isApplied) {
        toast.success(newTheme === 'dark' ? 'Темная тема включена' : 'Светлая тема включена');
      } else {
        toast.error('Не удалось применить тему. Попробуйте обновить страницу.');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Ошибка при смене темы');
    }
  };

  // Apply language
  const applyLanguage = (newLanguage: 'ru' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    toast.success(newLanguage === 'ru' ? 'Язык изменен на русский' : 'Language changed to English');
  };

  // Синхронизируем состояние темы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      // Проверяем текущее состояние DOM
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const savedTheme = localStorage.getItem('theme') || 'light';
      
      // Определяем актуальную тему
      const currentTheme = hasDarkClass ? 'dark' : (savedTheme === 'dark' ? 'dark' : 'light');
      
      // Синхронизируем состояние только если отличается
      if (theme !== currentTheme) {
        setTheme(currentTheme);
      }
    }
  }, [isOpen]); // Убрали theme из зависимостей, чтобы избежать бесконечного цикла

  const changePasswordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) => {
      return authApi.changePassword(data.oldPassword, data.newPassword);
    },
    onSuccess: () => {
      toast.success('Пароль успешно изменен');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Ошибка при изменении пароля';
      toast.error(errorMessage);
      
      // Если ошибка связана со старым паролем, показываем ошибку в поле
      if (errorMessage.includes('текущий пароль') || errorMessage.includes('Неверный текущий пароль')) {
        setPasswordErrors({ ...passwordErrors, oldPassword: errorMessage });
      }
    },
  });

  const sendResetCodeMutation = useMutation({
    mutationFn: () => {
      return authApi.forgotPassword();
    },
    onSuccess: () => {
      toast.success('Код восстановления отправлен на вашу почту');
      setCodeSent(true);
      setResetLoading(false);
      // Устанавливаем таймер на 60 секунд
      setResendCooldown(60);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Ошибка при отправке кода';
      toast.error(errorMessage);
      setResetLoading(false);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { code: string; newPassword: string }) => {
      return authApi.resetPassword(data.code, data.newPassword);
    },
    onSuccess: () => {
      setShowResetSuccess(true);
      // Закрываем форму через 3 секунды после показа уведомления
      setTimeout(() => {
        setShowPasswordReset(false);
        setCodeSent(false);
        setResetData({ code: '', newPassword: '', confirmPassword: '' });
        setResetErrors({});
        setResendCooldown(0);
        setShowResetSuccess(false);
      }, 3000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Ошибка при восстановлении пароля';
      toast.error(errorMessage);
      
      // Если ошибка связана с кодом, показываем ошибку в поле кода
      if (errorMessage.includes('код') || errorMessage.includes('Код') || errorMessage.includes('code')) {
        setResetErrors({ ...resetErrors, code: errorMessage });
      }
    },
  });

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.oldPassword.trim()) {
      errors.oldPassword = 'Введите текущий пароль';
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'Введите новый пароль';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Подтвердите новый пароль';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      errors.newPassword = 'Новый пароль должен отличаться от текущего';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword()) {
      changePasswordMutation.mutate({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
    }
  };

  const handleSendResetCode = async () => {
    setResetLoading(true);
    setResetErrors({});
    sendResetCodeMutation.mutate();
  };

  const handleResendResetCode = () => {
    if (resendCooldown > 0) {
      return;
    }
    setResetData({ ...resetData, code: '' });
    setResetLoading(true);
    setResetErrors({ ...resetErrors, code: '' });
    sendResetCodeMutation.mutate();
  };

  // Таймер обратного отсчета для повторной отправки кода
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateResetPassword()) {
      resetPasswordMutation.mutate({
        code: resetData.code.trim(),
        newPassword: resetData.newPassword,
      });
    }
  };

  const validateSupport = (): boolean => {
    const errors: Record<string, string> = {};

    if (!supportData.subject.trim()) {
      errors.subject = 'Введите тему обращения';
    }

    if (!supportData.message.trim()) {
      errors.message = 'Введите текст обращения';
    } else if (supportData.message.trim().length < 10) {
      errors.message = 'Текст обращения должен содержать минимум 10 символов';
    }

    setSupportErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSupport()) {
      // Здесь можно добавить отправку на бэкенд или открыть почтовый клиент
      const mailtoLink = `mailto:support@tasktrove.com?subject=${encodeURIComponent(supportData.subject)}&body=${encodeURIComponent(supportData.message)}`;
      window.open(mailtoLink);
      toast.success('Открыт почтовый клиент для отправки обращения');
      setSupportData({ subject: '', message: '' });
      setSupportErrors({});
    }
  };

  const tabs = [
    { id: 'password' as const, label: 'Пароль', icon: Lock },
    { id: 'theme' as const, label: 'Тема', icon: theme === 'dark' ? Moon : Sun },
    { id: 'language' as const, label: 'Язык', icon: Globe },
    { id: 'support' as const, label: 'Поддержка', icon: Mail },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnBackdropClick={false}>
      <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Настройки</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Password Tab */}
          {activeTab === 'password' && !showPasswordReset && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, oldPassword: e.target.value });
                    if (passwordErrors.oldPassword) {
                      setPasswordErrors({ ...passwordErrors, oldPassword: '' });
                    }
                  }}
                  className={`input ${passwordErrors.oldPassword ? 'border-red-500' : ''}`}
                  placeholder="Введите текущий пароль"
                />
                {passwordErrors.oldPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {passwordErrors.oldPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value });
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: '' });
                    }
                  }}
                  className={`input ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Минимум 8 символов"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                    }
                  }}
                  className={`input ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Повторите новый пароль"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Забыл пароль?
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="btn btn-primary flex items-center"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Изменение...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Изменить пароль
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Password Reset Tab */}
          {activeTab === 'password' && showPasswordReset && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Восстановление пароля</h3>
                <button
                  onClick={() => {
                    setShowPasswordReset(false);
                    setCodeSent(false);
                    setResetData({ code: '', newPassword: '', confirmPassword: '' });
                    setResetErrors({});
                    setResendCooldown(0);
                  }}
                  className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  Назад к смене пароля
                </button>
              </div>

              {/* Step 1: Send Code */}
              {!codeSent && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Код восстановления будет отправлен на email адрес, привязанный к вашему аккаунту.
                    </p>
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
                      <p className="mt-1 text-sm text-red-600 flex items-center">
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
                      <p className="mt-1 text-sm text-red-600 flex items-center">
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
                      <p className="mt-1 text-sm text-red-600 flex items-center">
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

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Выберите тему оформления приложения
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    applyTheme('light');
                  }}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-slate-100">Светлая тема</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">Классическое светлое оформление</div>
                    </div>
                  </div>
                  {theme === 'light' && <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    applyTheme('dark');
                  }}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Moon className="w-5 h-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-slate-100">Темная тема</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">Удобная для работы в темное время</div>
                    </div>
                  </div>
                  {theme === 'dark' && <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Выберите язык интерфейса
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => applyLanguage('ru')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    language === 'ru'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇷🇺</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-slate-100">Русский</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">Русский язык интерфейса</div>
                    </div>
                  </div>
                  {language === 'ru' && <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                </button>

                <button
                  onClick={() => applyLanguage('en')}
                  className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                    language === 'en'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇬🇧</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-slate-100">English</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">English interface language</div>
                    </div>
                  </div>
                  {language === 'en' && <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Тема обращения
                </label>
                <input
                  type="text"
                  value={supportData.subject}
                  onChange={(e) => {
                    setSupportData({ ...supportData, subject: e.target.value });
                    if (supportErrors.subject) {
                      setSupportErrors({ ...supportErrors, subject: '' });
                    }
                  }}
                  className={`input ${supportErrors.subject ? 'border-red-500' : ''}`}
                  placeholder="Например: Проблема с регистрацией"
                />
                {supportErrors.subject && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {supportErrors.subject}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Текст обращения
                </label>
                <textarea
                  value={supportData.message}
                  onChange={(e) => {
                    setSupportData({ ...supportData, message: e.target.value });
                    if (supportErrors.message) {
                      setSupportErrors({ ...supportErrors, message: '' });
                    }
                  }}
                  className={`input ${supportErrors.message ? 'border-red-500' : ''}`}
                  rows={6}
                  placeholder="Опишите вашу проблему или вопрос..."
                />
                {supportErrors.message && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {supportErrors.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Примечание:</strong> При нажатии кнопки "Отправить" откроется ваш почтовый клиент
                  с заполненным письмом на адрес поддержки.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Отправить
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
