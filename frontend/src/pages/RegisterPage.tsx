import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { UserPlus, Mail, Lock, User, Calendar, MapPin, Briefcase, Loader2, Phone, FileText, Building, Clock, Award, AlertCircle, CheckCircle, Send, RotateCcw } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

type RegisterType = 'customer' | 'performer';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [type, setType] = useState<RegisterType>('customer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Список специализаций для исполнителей (только разработка ПО)
  const SPECIALIZATIONS = [
    'Frontend разработка',
    'Backend разработка',
    'Full-stack разработка',
    'Мобильная разработка (iOS)',
    'Мобильная разработка (Android)',
    'Мобильная разработка (React Native)',
    'Мобильная разработка (Flutter)',
    'Python разработка',
    'Java разработка',
    'JavaScript/TypeScript разработка',
    'C++ разработка',
    'C# разработка',
    'Go разработка',
    'Rust разработка',
    'PHP разработка',
    'Ruby разработка',
    'Тестирование ПО (QA)',
    'Автоматизированное тестирование',
    'DevOps',
    'Системное администрирование',
    'Базы данных (SQL/NoSQL)',
    'Микросервисы и архитектура',
    'API разработка',
    'Разработка игр',
    'Machine Learning / AI',
    'Blockchain разработка',
    'Cloud разработка (AWS/Azure/GCP)',
    'Кибербезопасность',
    'Embedded разработка',
    'Другое'
  ];

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

  // Customer fields
  const [customerData, setCustomerData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    passwordUser: '',
    confirmPassword: '',
    phone: '',
    description: '',
    scopeS: '',
  });

  // Performer fields
  const [performerData, setPerformerData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    passwordUser: '',
    confirmPassword: '',
    age: '',
    phone: '',
    townCountry: '',
    specializations: '',
    employment: '',
    experience: '',
  });

  // Selected specializations for performer
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  
  // Selected business areas for customer
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);

  // Handle specialization selection
  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedSpecializations, specialization];
    } else {
      newSelected = selectedSpecializations.filter(s => s !== specialization);
    }
    
    setSelectedSpecializations(newSelected);
    // Update performerData with comma-separated string
    setPerformerData({ 
      ...performerData, 
      specializations: newSelected.join(', ') 
    });
    
    // Clear error if at least one specialization is selected
    if (newSelected.length > 0 && performerErrors.specializations) {
      setPerformerErrors({ ...performerErrors, specializations: '' });
    }
  };

  // Handle business area selection
  const handleBusinessAreaChange = (area: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedBusinessAreas, area];
    } else {
      newSelected = selectedBusinessAreas.filter(a => a !== area);
    }
    
    setSelectedBusinessAreas(newSelected);
    // Update customerData with comma-separated string
    setCustomerData({ 
      ...customerData, 
      scopeS: newSelected.join(', ') 
    });
    
    // Clear error if at least one area is selected
    if (newSelected.length > 0 && customerErrors.scopeS) {
      setCustomerErrors({ ...customerErrors, scopeS: '' });
    }
  };

  // Email verification functions
  const handleSendVerification = async (email: string, type: 'customer' | 'performer') => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErrorToast('Введите корректный email адрес');
      return;
    }

    // Проверяем, не занят ли email
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      const errorMsg = t('register.emailExists');
      if (type === 'customer') {
        setCustomerErrors({ ...customerErrors, email: errorMsg });
      } else {
        setPerformerErrors({ ...performerErrors, email: errorMsg });
      }
      showErrorToast(errorMsg);
      return;
    }

    // Отправляем код подтверждения
    setEmailVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], loading: true }
    }));
    // Очищаем ошибки кода при отправке нового кода
    setVerificationErrors(prev => ({ ...prev, [type]: '' }));
    setVerificationCodes(prev => ({ ...prev, [type]: '' }));

    try {
      await authApi.sendEmailVerification(email);
      setEmailVerificationState(prev => ({
        ...prev,
        [type]: { step: 'code', email, loading: false }
      }));
      showSuccessToast(t('register.codeSent'));
    } catch (error) {
      setEmailVerificationState(prev => ({
        ...prev,
        [type]: { ...prev[type], loading: false }
      }));
      showErrorToast(error, 'Не удалось отправить код подтверждения');
    }
  };

  const handleVerifyCode = async (type: 'customer' | 'performer') => {
    const code = verificationCodes[type];
    const email = emailVerificationState[type].email;

    if (!code.trim()) {
      showErrorToast('Введите код подтверждения');
      return;
    }

    setEmailVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], loading: true }
    }));

    try {
      await authApi.verifyEmailCode(email, code);
      setEmailVerificationState(prev => ({
        ...prev,
        [type]: { step: 'verified', email, loading: false }
      }));
      
      // Очищаем ошибки кода после успешного подтверждения
      setVerificationErrors(prev => ({
        ...prev,
        [type]: ''
      }));
      
      // Очищаем ошибку email после успешного подтверждения
      if (type === 'customer') {
        setCustomerErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.email === 'Подтвердите email адрес' && customerData.email === email) {
            delete newErrors.email;
          }
          return newErrors;
        });
      } else {
        setPerformerErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.email === 'Подтвердите email адрес' && performerData.email === email) {
            delete newErrors.email;
          }
          return newErrors;
        });
      }
      
      showSuccessToast(t('register.emailVerified'));
    } catch (error: any) {
      setEmailVerificationState(prev => ({
        ...prev,
        [type]: { ...prev[type], loading: false }
      }));
      
      // Устанавливаем понятное сообщение об ошибке кода
      const errorMessage = error.response?.data?.error || 'Неверный код подтверждения';
      if (errorMessage.includes('код') || errorMessage.includes('Код') || errorMessage.includes('code') || 
          errorMessage.includes('подтвержден') || errorMessage.includes('истек')) {
        setVerificationErrors(prev => ({
          ...prev,
          [type]: 'Неправильный код подтверждения'
        }));
        showErrorToast('Неправильный код подтверждения');
      } else {
        setVerificationErrors(prev => ({
          ...prev,
          [type]: errorMessage
        }));
        showErrorToast(error, errorMessage);
      }
    }
  };

  const handleResendCode = async (type: 'customer' | 'performer') => {
    const email = emailVerificationState[type].email;
    await handleSendVerification(email, type);
  };

  // Validation errors
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});
  const [performerErrors, setPerformerErrors] = useState<Record<string, string>>({});
  
  // Email checking state
  const [checkedEmails, setCheckedEmails] = useState<Record<string, boolean>>({});
  
  // Email verification state
  const [emailVerificationState, setEmailVerificationState] = useState<{
    customer: { step: 'input' | 'code' | 'verified', email: string, loading: boolean },
    performer: { step: 'input' | 'code' | 'verified', email: string, loading: boolean }
  }>({
    customer: { step: 'input', email: '', loading: false },
    performer: { step: 'input', email: '', loading: false }
  });
  
  const [verificationCodes, setVerificationCodes] = useState<{
    customer: string,
    performer: string
  }>({
    customer: '',
    performer: ''
  });
  
  // Ошибки кодов подтверждения
  const [verificationErrors, setVerificationErrors] = useState<{
    customer: string,
    performer: string
  }>({
    customer: '',
    performer: ''
  });

  // Email checking function
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return false;
    }

    // Если уже проверяли этот email, возвращаем кешированный результат
    if (checkedEmails.hasOwnProperty(email)) {
      return checkedEmails[email];
    }

    try {
      const response = await authApi.checkEmailExists(email);
      const exists = response.data?.exists || false;
      
      // Кешируем результат
      setCheckedEmails(prev => ({ ...prev, [email]: exists }));
      return exists;
    } catch (error) {
      console.error('Error checking email:', error);
      // В случае ошибки API считаем, что email не существует
      return false;
    }
  };

  // Debounced email check
  const debouncedEmailCheck = async (email: string, setErrors: Function, errors: Record<string, string>) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    const exists = await checkEmailExists(email);
    if (exists) {
      setErrors({ ...errors, email: 'Пользователь с таким email уже зарегистрирован' });
    } else {
      // Убираем ошибку, если email свободен
      const newErrors = { ...errors };
      if (newErrors.email === 'Пользователь с таким email уже зарегистрирован') {
        delete newErrors.email;
        setErrors(newErrors);
      }
    }
  };

  // Email checking effects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerData.email && customerData.email !== '') {
        debouncedEmailCheck(customerData.email, setCustomerErrors, customerErrors);
      }
    }, 1000); // Проверяем через 1 секунду после остановки ввода

    return () => clearTimeout(timer);
  }, [customerData.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (performerData.email && performerData.email !== '') {
        debouncedEmailCheck(performerData.email, setPerformerErrors, performerErrors);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [performerData.email]);

  // Validation functions
  const validateCustomerData = () => {
    const errors: Record<string, string> = {};

    if (!customerData.lastName.trim()) {
      errors.lastName = t('validationMessages.lastNameRequired');
    } else if (customerData.lastName.trim().length < 2) {
      errors.lastName = t('validationMessages.lastNameMinLength');
    }

    if (!customerData.firstName.trim()) {
      errors.firstName = t('validationMessages.firstNameRequired');
    } else if (customerData.firstName.trim().length < 2) {
      errors.firstName = t('validationMessages.firstNameMinLength');
    }

    if (customerData.middleName && customerData.middleName.trim().length > 0 && customerData.middleName.trim().length < 2) {
      errors.middleName = t('validationMessages.middleNameMinLength');
    }

    if (!customerData.email.trim()) {
      errors.email = t('validationMessages.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      errors.email = t('validationMessages.emailInvalid');
    } else if (checkedEmails[customerData.email] === true) {
      errors.email = t('register.emailExists');
    } else if (emailVerificationState.customer.step !== 'verified' || emailVerificationState.customer.email !== customerData.email) {
      errors.email = t('validationMessages.emailNotVerified');
    }

    if (!customerData.passwordUser) {
      errors.passwordUser = t('validationMessages.passwordRequired');
    } else if (customerData.passwordUser.length < 8) {
      errors.passwordUser = t('auth.passwordMinLength');
    }

    if (!customerData.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (customerData.passwordUser !== customerData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    if (customerData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(customerData.phone)) {
      errors.phone = t('validationMessages.phoneInvalid');
    }

    if (customerData.description.trim() && customerData.description.trim().length < 10) {
      errors.description = t('validationMessages.descriptionMinLength');
    }

    if (!customerData.scopeS.trim()) {
      errors.scopeS = t('validationMessages.scopeRequired');
    }

    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePerformerData = () => {
    const errors: Record<string, string> = {};

    if (!performerData.lastName.trim()) {
      errors.lastName = 'Фамилия обязательна для заполнения';
    } else if (performerData.lastName.trim().length < 2) {
      errors.lastName = 'Фамилия должна содержать минимум 2 символа';
    }

    if (!performerData.firstName.trim()) {
      errors.firstName = 'Имя обязательно для заполнения';
    } else if (performerData.firstName.trim().length < 2) {
      errors.firstName = 'Имя должно содержать минимум 2 символа';
    }

    if (performerData.middleName && performerData.middleName.trim().length > 0 && performerData.middleName.trim().length < 2) {
      errors.middleName = t('validationMessages.middleNameMinLength');
    }

    if (!performerData.email.trim()) {
      errors.email = t('validationMessages.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(performerData.email)) {
      errors.email = t('validationMessages.emailInvalid');
    } else if (checkedEmails[performerData.email] === true) {
      errors.email = t('register.emailExists');
    } else if (emailVerificationState.performer.step !== 'verified' || emailVerificationState.performer.email !== performerData.email) {
      errors.email = t('validationMessages.emailNotVerified');
    }

    if (!performerData.passwordUser) {
      errors.passwordUser = 'Пароль обязателен для заполнения';
    } else if (performerData.passwordUser.length < 8) {
      errors.passwordUser = 'Пароль должен содержать минимум 8 символов';
    }

    if (!performerData.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (performerData.passwordUser !== performerData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    const age = parseInt(performerData.age);
    if (!performerData.age) {
      errors.age = t('validationMessages.ageRequired');
    } else if (isNaN(age) || age < 18 || age > 120) {
      errors.age = t('validationMessages.ageRange');
    }

    if (performerData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(performerData.phone)) {
      errors.phone = t('validationMessages.phoneInvalid');
    }

    if (!performerData.specializations || performerData.specializations.trim() === '') {
      errors.specializations = t('validationMessages.specializationsRequired');
    }

    setPerformerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем email перед валидацией, если он еще не проверен
    if (customerData.email && checkedEmails[customerData.email] === undefined) {
      const emailExists = await checkEmailExists(customerData.email);
      if (emailExists) {
        setCustomerErrors({ ...customerErrors, email: t('register.emailExists') });
        showErrorToast(t('register.emailExists'));
        return;
      }
    }
    
    if (!validateCustomerData()) {
      showErrorToast(t('register.fixErrors'));
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.registerCustomer({
        lastName: customerData.lastName,
        firstName: customerData.firstName,
        middleName: customerData.middleName || undefined,
        email: customerData.email,
        passwordUser: customerData.passwordUser,
        phone: customerData.phone || undefined,
        description: customerData.description,
        scopeS: customerData.scopeS,
      });
      const { token, role, id, email: userEmail } = response.data;
      
      setAuth({ id, email: userEmail, role, token }, token);
      showSuccessToast(t('auth.registrationSuccess'));
      navigate('/customer/orders');
    } catch (error) {
      showErrorToast(error, 'Ошибка регистрации. Возможно, такой email уже используется.');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем email перед валидацией, если он еще не проверен
    if (performerData.email && checkedEmails[performerData.email] === undefined) {
      const emailExists = await checkEmailExists(performerData.email);
      if (emailExists) {
        setPerformerErrors({ ...performerErrors, email: t('register.emailExists') });
        showErrorToast(t('register.emailExists'));
        return;
      }
    }
    
    if (!validatePerformerData()) {
      showErrorToast(t('register.fixErrors'));
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.registerPerformer({
        lastName: performerData.lastName,
        firstName: performerData.firstName,
        middleName: performerData.middleName || undefined,
        email: performerData.email,
        passwordUser: performerData.passwordUser,
        age: parseInt(performerData.age),
        phone: performerData.phone || undefined,
        townCountry: performerData.townCountry || undefined,
        specializations: performerData.specializations || undefined,
        employment: performerData.employment || undefined,
        experience: performerData.experience || undefined,
      });
      const { token, role, id, email: userEmail } = response.data;
      
      setAuth({ id, email: userEmail, role, token }, token);
      
      // После успешной регистрации переносим данные в портфолио
      try {
        // Небольшая задержка, чтобы убедиться, что токен установлен
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { performerApi } = await import('../services/api');
        await performerApi.updatePortfolio({
          name: performerData.name,
          email: performerData.email,
          phone: performerData.phone || '',
          townCountry: performerData.townCountry || '',
          specializations: performerData.specializations || '',
          employment: performerData.employment || '',
          experience: performerData.experience || '',
        });
        showSuccessToast(t('register.dataTransferred'));
      } catch (portfolioError) {
        // Если не удалось обновить портфолио, все равно показываем успех регистрации
        console.warn('Не удалось автоматически обновить портфолио:', portfolioError);
        showSuccessToast(t('register.fillPortfolioLater'));
      }
      
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
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{t('register.title')}</h2>
        </div>

        {/* Type selector */}
        <div className="card mb-6">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setType('customer');
                setCustomerErrors({});
                setPerformerErrors({});
                setSelectedBusinessAreas([]);
                setSelectedSpecializations([]);
                setEmailVerificationState({
                  customer: { step: 'input', email: '', loading: false },
                  performer: { step: 'input', email: '', loading: false }
                });
                setVerificationCodes({ customer: '', performer: '' });
              }}
              className={`flex-1 btn ${type === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('roles.customer')}
            </button>
            <button
              type="button"
              onClick={() => {
                setType('performer');
                setCustomerErrors({});
                setPerformerErrors({});
                setSelectedBusinessAreas([]);
                setSelectedSpecializations([]);
                setEmailVerificationState({
                  customer: { step: 'input', email: '', loading: false },
                  performer: { step: 'input', email: '', loading: false }
                });
                setVerificationCodes({ customer: '', performer: '' });
              }}
              className={`flex-1 btn ${type === 'performer' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('roles.performer')}
            </button>
          </div>
        </div>

        {/* Customer form */}
        {type === 'customer' && (
          <div className="card">
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="text-red-500">*</span> — обязательные поля для заполнения
              </p>
            </div>
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('register.lastName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerData.lastName}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, lastName: e.target.value });
                    if (customerErrors.lastName) {
                      setCustomerErrors({ ...customerErrors, lastName: '' });
                    }
                  }}
                  className={`input ${customerErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={t('register.enterLastName')}
                />
                {customerErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('register.firstName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerData.firstName}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, firstName: e.target.value });
                    if (customerErrors.firstName) {
                      setCustomerErrors({ ...customerErrors, firstName: '' });
                    }
                  }}
                  className={`input ${customerErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={t('register.enterFirstName')}
                />
                {customerErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('register.middleName')}
                </label>
                <input
                  type="text"
                  value={customerData.middleName}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, middleName: e.target.value });
                    if (customerErrors.middleName) {
                      setCustomerErrors({ ...customerErrors, middleName: '' });
                    }
                  }}
                  className={`input ${customerErrors.middleName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={t('register.enterMiddleName')}
                />
                {customerErrors.middleName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.middleName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) => {
                        setCustomerData({ ...customerData, email: e.target.value });
                        if (customerErrors.email) {
                          setCustomerErrors({ ...customerErrors, email: '' });
                        }
                        // Сбрасываем состояние подтверждения при изменении email
                        if (e.target.value !== emailVerificationState.customer.email) {
                          setEmailVerificationState(prev => ({
                            ...prev,
                            customer: { step: 'input', email: '', loading: false }
                          }));
                        }
                        // Очищаем кеш для нового email
                        if (checkedEmails[e.target.value] !== undefined) {
                          const newChecked = { ...checkedEmails };
                          delete newChecked[e.target.value];
                          setCheckedEmails(newChecked);
                        }
                      }}
                      className={`input pr-10 ${customerErrors.email ? 'border-red-500 focus:border-red-500' : emailVerificationState.customer.step === 'verified' ? 'border-green-500' : ''}`}
                      placeholder="example@email.com"
                      disabled={emailVerificationState.customer.step === 'verified'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {emailVerificationState.customer.step === 'verified' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Кнопка подтверждения или поле ввода кода */}
                  {emailVerificationState.customer.step === 'input' && customerData.email && (
                    <button
                      type="button"
                      onClick={() => handleSendVerification(customerData.email, 'customer')}
                      disabled={emailVerificationState.customer.loading || !customerData.email}
                      className="btn btn-secondary flex items-center"
                    >
                      {emailVerificationState.customer.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Подтвердить email
                        </>
                      )}
                    </button>
                  )}

                  {emailVerificationState.customer.step === 'code' && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={verificationCodes.customer}
                          onChange={(e) => {
                            setVerificationCodes({ ...verificationCodes, customer: e.target.value });
                            if (verificationErrors.customer) {
                              setVerificationErrors(prev => ({ ...prev, customer: '' }));
                            }
                          }}
                          placeholder={t('register.enterVerificationCode')}
                          className={`input flex-1 ${verificationErrors.customer ? 'border-red-500' : ''}`}
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyCode('customer')}
                          disabled={emailVerificationState.customer.loading || !verificationCodes.customer.trim()}
                          className="btn btn-primary flex items-center"
                        >
                          {emailVerificationState.customer.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t('common.confirm')
                          )}
                        </button>
                      </div>
                      {verificationErrors.customer && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {verificationErrors.customer}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResendCode('customer')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {t('register.resendCode')}
                      </button>
                    </div>
                  )}
                </div>

                {customerErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.email}
                  </p>
                )}
                {emailVerificationState.customer.step === 'verified' && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('register.emailVerified')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={customerData.passwordUser}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, passwordUser: e.target.value });
                    if (customerErrors.passwordUser) {
                      setCustomerErrors({ ...customerErrors, passwordUser: '' });
                    }
                    // Очищаем ошибку подтверждения пароля при изменении пароля
                    if (customerErrors.confirmPassword && customerData.confirmPassword) {
                      if (e.target.value === customerData.confirmPassword) {
                        setCustomerErrors({ ...customerErrors, confirmPassword: '' });
                      }
                    }
                  }}
                  className={`input ${customerErrors.passwordUser ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={t('auth.passwordMinLength')}
                />
                {customerErrors.passwordUser && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.passwordUser}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Подтверждение пароля <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={customerData.confirmPassword}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, confirmPassword: e.target.value });
                    if (customerErrors.confirmPassword) {
                      setCustomerErrors({ ...customerErrors, confirmPassword: '' });
                    }
                  }}
                  className={`input ${customerErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Повторите пароль"
                />
                {customerErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.confirmPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, phone: e.target.value });
                    if (customerErrors.phone) {
                      setCustomerErrors({ ...customerErrors, phone: '' });
                    }
                  }}
                  className={`input ${customerErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="+375291234567"
                />
                {customerErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  {t('register.description')}
                </label>
                <textarea
                  value={customerData.description}
                  onChange={(e) => {
                    setCustomerData({ ...customerData, description: e.target.value });
                    if (customerErrors.description) {
                      setCustomerErrors({ ...customerErrors, description: '' });
                    }
                  }}
                  className={`input ${customerErrors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                  rows={3}
                  placeholder={t('register.enterDescription')}
                />
                {customerErrors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  {t('register.scope')} <span className="text-red-500">*</span>
                </label>
                <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${customerErrors.scopeS ? 'border-red-500' : 'border-gray-300'}`}>
                  <p className="text-sm text-gray-600 mb-3">{t('register.selectScope')}</p>
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
                      <strong>{t('register.selected')}:</strong> {selectedBusinessAreas.join(', ')}
                    </p>
                  </div>
                )}
                {customerErrors.scopeS && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {customerErrors.scopeS}
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('register.registering')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Зарегистрироваться
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Performer form */}
        {type === 'performer' && (
          <div className="card">
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="text-red-500">*</span> — обязательные поля для заполнения
              </p>
            </div>
            <form onSubmit={handlePerformerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Фамилия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={performerData.lastName}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, lastName: e.target.value });
                    if (performerErrors.lastName) {
                      setPerformerErrors({ ...performerErrors, lastName: '' });
                    }
                  }}
                  className={`input ${performerErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Введите вашу фамилию"
                />
                {performerErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.lastName}
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
                  value={performerData.firstName}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, firstName: e.target.value });
                    if (performerErrors.firstName) {
                      setPerformerErrors({ ...performerErrors, firstName: '' });
                    }
                  }}
                  className={`input ${performerErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Введите ваше имя"
                />
                {performerErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.firstName}
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
                  value={performerData.middleName}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, middleName: e.target.value });
                    if (performerErrors.middleName) {
                      setPerformerErrors({ ...performerErrors, middleName: '' });
                    }
                  }}
                  className={`input ${performerErrors.middleName ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Введите ваше отчество"
                />
                {performerErrors.middleName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.middleName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={performerData.email}
                      onChange={(e) => {
                        setPerformerData({ ...performerData, email: e.target.value });
                        if (performerErrors.email) {
                          setPerformerErrors({ ...performerErrors, email: '' });
                        }
                        // Сбрасываем состояние подтверждения при изменении email
                        if (e.target.value !== emailVerificationState.performer.email) {
                          setEmailVerificationState(prev => ({
                            ...prev,
                            performer: { step: 'input', email: '', loading: false }
                          }));
                        }
                        // Очищаем кеш для нового email
                        if (checkedEmails[e.target.value] !== undefined) {
                          const newChecked = { ...checkedEmails };
                          delete newChecked[e.target.value];
                          setCheckedEmails(newChecked);
                        }
                      }}
                      className={`input pr-10 ${performerErrors.email ? 'border-red-500 focus:border-red-500' : emailVerificationState.performer.step === 'verified' ? 'border-green-500' : ''}`}
                      placeholder="example@email.com"
                      disabled={emailVerificationState.performer.step === 'verified'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {emailVerificationState.performer.step === 'verified' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Кнопка подтверждения или поле ввода кода */}
                  {emailVerificationState.performer.step === 'input' && performerData.email && (
                    <button
                      type="button"
                      onClick={() => handleSendVerification(performerData.email, 'performer')}
                      disabled={emailVerificationState.performer.loading || !performerData.email}
                      className="btn btn-secondary flex items-center"
                    >
                      {emailVerificationState.performer.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Подтвердить email
                        </>
                      )}
                    </button>
                  )}

                  {emailVerificationState.performer.step === 'code' && (
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={verificationCodes.performer}
                          onChange={(e) => {
                            setVerificationCodes({ ...verificationCodes, performer: e.target.value });
                            if (verificationErrors.performer) {
                              setVerificationErrors(prev => ({ ...prev, performer: '' }));
                            }
                          }}
                          placeholder={t('register.enterVerificationCode')}
                          className={`input flex-1 ${verificationErrors.performer ? 'border-red-500' : ''}`}
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyCode('performer')}
                          disabled={emailVerificationState.performer.loading || !verificationCodes.performer.trim()}
                          className="btn btn-primary flex items-center"
                        >
                          {emailVerificationState.performer.loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t('common.confirm')
                          )}
                        </button>
                      </div>
                      {verificationErrors.performer && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {verificationErrors.performer}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResendCode('performer')}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {t('register.resendCode')}
                      </button>
                    </div>
                  )}
                </div>

                {performerErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.email}
                  </p>
                )}
                {emailVerificationState.performer.step === 'verified' && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t('register.emailVerified')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={performerData.passwordUser}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, passwordUser: e.target.value });
                    if (performerErrors.passwordUser) {
                      setPerformerErrors({ ...performerErrors, passwordUser: '' });
                    }
                    // Очищаем ошибку подтверждения пароля при изменении пароля
                    if (performerErrors.confirmPassword && performerData.confirmPassword) {
                      if (e.target.value === performerData.confirmPassword) {
                        setPerformerErrors({ ...performerErrors, confirmPassword: '' });
                      }
                    }
                  }}
                  className={`input ${performerErrors.passwordUser ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder={t('auth.passwordMinLength')}
                />
                {performerErrors.passwordUser && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.passwordUser}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Подтверждение пароля <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={performerData.confirmPassword}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, confirmPassword: e.target.value });
                    if (performerErrors.confirmPassword) {
                      setPerformerErrors({ ...performerErrors, confirmPassword: '' });
                    }
                  }}
                  className={`input ${performerErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="Повторите пароль"
                />
                {performerErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.confirmPassword}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {t('register.age')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={120}
                  value={performerData.age}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, age: e.target.value });
                    if (performerErrors.age) {
                      setPerformerErrors({ ...performerErrors, age: '' });
                    }
                  }}
                  className={`input ${performerErrors.age ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="18-120 лет"
                />
                {performerErrors.age && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.age}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t('register.phone')}
                </label>
                <input
                  type="tel"
                  value={performerData.phone}
                  onChange={(e) => {
                    setPerformerData({ ...performerData, phone: e.target.value });
                    if (performerErrors.phone) {
                      setPerformerErrors({ ...performerErrors, phone: '' });
                    }
                  }}
                  className={`input ${performerErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="+375 (29) 123-45-67"
                />
                {performerErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {t('register.townCountry')}
                </label>
                <input
                  type="text"
                  value={performerData.townCountry}
                  onChange={(e) => setPerformerData({ ...performerData, townCountry: e.target.value })}
                  className="input"
                  placeholder="Минск, Беларусь"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  {t('register.selectSpecializations')} <span className="text-red-500">*</span>
                </label>
                <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${performerErrors.specializations ? 'border-red-500' : 'border-gray-300'}`}>
                  <p className="text-sm text-gray-600 mb-3">{t('register.selectSpecializations')}:</p>
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
                {performerErrors.specializations && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {performerErrors.specializations}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Занятость
                </label>
                <select
                  value={performerData.employment}
                  onChange={(e) => setPerformerData({ ...performerData, employment: e.target.value })}
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
                  {t('register.experience')}
                </label>
                <textarea
                  value={performerData.experience}
                  onChange={(e) => setPerformerData({ ...performerData, experience: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Опишите ваш опыт работы, навыки и достижения"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full btn btn-primary flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('register.registering')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Зарегистрироваться
                  </>
                )}
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
