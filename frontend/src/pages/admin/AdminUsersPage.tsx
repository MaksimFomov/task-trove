import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, customerApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Edit, Trash2, Briefcase, Award, Star, AlertCircle, AlertTriangle, Phone, MapPin, Clock, FileText, Building, User, Mail, Calendar, Plus, Loader2, Save, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../../components/Modal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Account, Portfolio, Order, WorkExperience } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { saveState, loadState } from '../../utils/stateStorage';

const PAGE_KEY = 'adminUsers';

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

interface UserFormData {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  name?: string; // Для обратной совместимости с администраторами
  email: string;
  password: string;
  role: 'Customer' | 'Performer' | 'Administrator' | 'SuperAdministrator';
  age?: number;
  description?: string;
  scopeS?: string;
  phone?: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
}

const getRoleLabel = (role: string, t: any) => {
  switch (role) {
    case 'Customer':
      return t('roles.customer');
    case 'Performer':
      return t('roles.performer');
    case 'Administrator':
      return t('roles.administrator');
    case 'SuperAdministrator':
      return t('roles.superAdministrator');
    default:
      return role;
  }
};

const formatFIO = (lastName?: string, firstName?: string, middleName?: string) => {
  const parts = [];
  if (lastName) parts.push(lastName);
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  return parts.length > 0 ? parts.join(' ') : null;
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Инициализация состояния из URL параметров или localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlSearch = searchParams.get('search');
    return urlSearch || loadState<string>(PAGE_KEY, 'searchTerm', '');
  });
  const [roleFilter, setRoleFilter] = useState<string>(() => {
    const urlRole = searchParams.get('role');
    return urlRole || loadState<string>(PAGE_KEY, 'roleFilter', 'all');
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const urlStatus = searchParams.get('status');
    return urlStatus || loadState<string>(PAGE_KEY, 'statusFilter', 'all');
  });
  const [sortBy, setSortBy] = useState<'role' | 'status' | null>(() => {
    const urlSortBy = searchParams.get('sortBy') as 'role' | 'status';
    return urlSortBy || loadState<'role' | 'status' | null>(PAGE_KEY, 'sortBy', null);
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
    return urlSortOrder || loadState<'asc' | 'desc'>(PAGE_KEY, 'sortOrder', 'asc');
  });

  // Синхронизация с URL параметрами
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    setSearchParams(params, { replace: true });
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder, setSearchParams]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userToActivate, setUserToActivate] = useState<{ id: number; name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<Account | null>(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', login: '', password: '', confirmPassword: '' });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'portfolio' | 'orders' | 'reviews'>(() => {
    return loadState<'portfolio' | 'orders' | 'reviews'>(PAGE_KEY, 'profileTab', 'portfolio');
  });
  const [performerId, setPerformerId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Сохранение состояния в localStorage
  useEffect(() => {
    saveState(PAGE_KEY, 'searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveState(PAGE_KEY, 'roleFilter', roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    saveState(PAGE_KEY, 'statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortOrder', sortOrder);
  }, [sortOrder]);

  // Сохранение вкладки профиля в модальном окне
  useEffect(() => {
    if (userDetails) {
      saveState(PAGE_KEY, 'profileTab', profileTab);
    }
  }, [profileTab, userDetails]);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'Customer',
  });
  
  // Selected specializations for performer
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  
  // Selected business areas for customer
  const [selectedBusinessAreas, setSelectedBusinessAreas] = useState<string[]>([]);
  
  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Проверка, является ли текущий пользователь суперадмином
  const { data: superAdminData } = useQuery({
    queryKey: ['isSuperAdmin'],
    queryFn: async () => {
      try {
        const response = await adminApi.isSuperAdmin();
        return response.data;
      } catch (error) {
        return { isSuperAdmin: false };
      }
    },
  });

  useEffect(() => {
    if (superAdminData) {
      setIsSuperAdmin(superAdminData.isSuperAdmin || false);
    } else {
      // Проверяем по роли напрямую, если API недоступен
      setIsSuperAdmin(user?.role === 'SuperAdministrator');
    }
  }, [superAdminData, user]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await adminApi.getUsers();
      const users = response.data?.users || [];
      // Если текущий пользователь не суперадмин, скрываем суперадминов из списка
      const currentUserIsSuperAdmin = user?.role === 'SuperAdministrator';
      if (!currentUserIsSuperAdmin) {
        return users.filter((user: Account) => user.role?.name !== 'SuperAdministrator');
      }
      return users;
    },
    refetchInterval: 15000, // Автоматическое обновление каждые 15 секунд
  });

  const activateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.activate(userId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Пользователь активирован');
      setShowActivateConfirm(false);
      setUserToActivate(null);
    },
  });

  const disactivateMutation = useMutation({
    mutationFn: (userId: number) => adminApi.disactivate(userId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Пользователь деактивирован');
      setShowDeactivateConfirm(false);
      setUserToActivate(null);
    },
  });

  const handleActivate = (user: Account) => {
    setUserToActivate({ id: user.id, name: user.login || user.email || 'Пользователь' });
    setShowActivateConfirm(true);
  };

  const handleDeactivate = (user: Account) => {
    setUserToActivate({ id: user.id, name: user.login || user.email || 'Пользователь' });
    setShowDeactivateConfirm(true);
  };

  const handleConfirmActivate = () => {
    if (userToActivate) {
      activateMutation.mutate(userToActivate.id);
    }
  };

  const handleConfirmDeactivate = () => {
    if (userToActivate) {
      disactivateMutation.mutate(userToActivate.id);
    }
  };

  const handleCancelActivate = () => {
    setShowActivateConfirm(false);
    setUserToActivate(null);
  };

  const handleCancelDeactivate = () => {
    setShowDeactivateConfirm(false);
    setUserToActivate(null);
  };


  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) => adminApi.updateUser(userId, data),
    onSuccess: async (_, variables) => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      
      // Если модальное окно просмотра открыто, обновляем данные пользователя
      if (showViewModal && userDetails && userDetails.id === variables.userId) {
        try {
          const response = await adminApi.getUserDetails(variables.userId);
          setUserDetails(response.data);
        } catch (error) {
          console.error('Ошибка при обновлении данных пользователя:', error);
        }
      }
      
      toast.success('Пользователь обновлен успешно');
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при обновлении пользователя');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminApi.deleteUser(userId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Пользователь удален успешно');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при удалении пользователя');
    },
  });

  const handleViewUser = async (user: Account) => {
    try {
      const response = await adminApi.getUserDetails(user.id);
      setUserDetails(response.data);
      setProfileTab('portfolio');
      
      // Если это исполнитель, получаем performerId из ответа
      if (user.role?.name === 'Performer' && response.data?.performerId) {
        setPerformerId(response.data.performerId);
        setCustomerId(null);
      } else if (user.role?.name === 'Customer' && response.data?.customerId) {
        setCustomerId(response.data.customerId);
        setPerformerId(null);
      } else {
        setPerformerId(null);
        setCustomerId(null);
      }
      
      setShowViewModal(true);
    } catch (error) {
      toast.error('Ошибка при загрузке данных пользователя');
    }
  };

  // Загрузка портфолио для просмотра (исполнитель)
  const { data: portfolioData, isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['adminUserPortfolio', userDetails?.id, userDetails?.role?.name, performerId, customerId],
    queryFn: async () => {
      if (!userDetails?.id) return null;
      try {
        if (userDetails?.role?.name === 'Performer' && performerId) {
          // Для исполнителя используем performerId, а не accountId
          const response = await adminApi.getPortfolio(performerId);
          // getPortfolio возвращает массив, берем первый элемент
          const portfolios = Array.isArray(response.data) ? response.data : [response.data];
          return portfolios.length > 0 ? portfolios[0] : null;
        } else if (userDetails?.role?.name === 'Customer' && customerId) {
          const response = await adminApi.getCustomerPortfolio(customerId);
        return response.data;
        }
        return null;
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return null;
      }
    },
    enabled: showViewModal && !!userDetails && profileTab === 'portfolio' && 
             ((userDetails?.role?.name === 'Performer' && !!performerId) || 
              (userDetails?.role?.name === 'Customer' && !!customerId)),
  });

  // Загрузка выполненных заказов для исполнителя
  const { data: doneOrdersData, isLoading: isLoadingDoneOrders } = useQuery({
    queryKey: ['adminPerformerDoneOrders', performerId],
    queryFn: async () => {
      if (!performerId) return { orders: [] };
      try {
        const response = await adminApi.getPerformerDoneOrders(performerId);
        return response.data;
      } catch (error) {
        console.error('Error fetching performer done orders:', error);
        return { orders: [] };
      }
    },
    enabled: showViewModal && !!performerId && profileTab === 'orders' && userDetails?.role?.name === 'Performer',
  });

  // Загрузка выполненных заказов для заказчика
  const { data: customerDoneOrdersData, isLoading: isLoadingCustomerDoneOrders } = useQuery({
    queryKey: ['adminCustomerDoneOrders', customerId],
    queryFn: async () => {
      if (!customerId) return { orders: [] };
      try {
        const response = await adminApi.getCustomerDoneOrders(customerId);
        return response.data;
      } catch (error) {
        return { orders: [] };
      }
    },
    enabled: showViewModal && !!customerId && profileTab === 'orders' && userDetails?.role?.name === 'Customer',
  });

  // Загрузка отзывов для исполнителя
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['adminPerformerReviews', performerId],
    queryFn: async () => {
      if (!performerId) return { reviews: [] };
      try {
        const response = await adminApi.getPerformerReviews(performerId);
        return response.data;
      } catch (error) {
        console.error('Error fetching performer reviews:', error);
        return { reviews: [] };
      }
    },
    enabled: showViewModal && !!performerId && profileTab === 'reviews' && userDetails?.role?.name === 'Performer',
  });

  // Загрузка отзывов для заказчика
  const { data: customerReviewsData, isLoading: isLoadingCustomerReviews } = useQuery({
    queryKey: ['adminCustomerReviews', customerId],
    queryFn: async () => {
      if (!customerId) return { reviews: [] };
      try {
        const response = await adminApi.getCustomerReviews(customerId);
        return response.data;
      } catch (error) {
        return { reviews: [] };
      }
    },
    enabled: showViewModal && !!customerId && profileTab === 'reviews' && userDetails?.role?.name === 'Customer',
  });

  // Handle specialization selection for performer
  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedSpecializations, specialization];
    } else {
      newSelected = selectedSpecializations.filter(s => s !== specialization);
    }
    
    setSelectedSpecializations(newSelected);
    setFormData({ 
      ...formData, 
      specializations: newSelected.join(', ') 
    });
    
    if (newSelected.length > 0 && formErrors.specializations) {
      setFormErrors({ ...formErrors, specializations: '' });
    }
  };

  // Handle business area selection for customer
  const handleBusinessAreaChange = (area: string, checked: boolean) => {
    let newSelected: string[];
    if (checked) {
      newSelected = [...selectedBusinessAreas, area];
    } else {
      newSelected = selectedBusinessAreas.filter(a => a !== area);
    }
    
    setSelectedBusinessAreas(newSelected);
    setFormData({ 
      ...formData, 
      scopeS: newSelected.join(', ') 
    });
    
    if (newSelected.length > 0 && formErrors.scopeS) {
      setFormErrors({ ...formErrors, scopeS: '' });
    }
  };

  // Validation function
  const validateFormData = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.role === 'Customer' || formData.role === 'Performer') {
      // ФИО валидация для заказчиков и исполнителей
      if (!formData.lastName || formData.lastName.trim() === '') {
        newErrors.lastName = 'Фамилия обязательна для заполнения';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'Фамилия должна содержать минимум 2 символа';
      }

      if (!formData.firstName || formData.firstName.trim() === '') {
        newErrors.firstName = 'Имя обязательно для заполнения';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'Имя должно содержать минимум 2 символа';
      }

      if (formData.middleName && formData.middleName.trim().length > 0 && formData.middleName.trim().length < 2) {
        newErrors.middleName = 'Отчество должно содержать минимум 2 символа';
      }
    } else if (formData.role === 'Administrator' || formData.role === 'SuperAdministrator') {
      // Имя для администраторов
      if (!formData.name || formData.name.trim() === '') {
        newErrors.name = 'Имя обязательно для заполнения';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Имя должно содержать минимум 2 символа';
      }
    }

    if (formData.role === 'Administrator' || formData.role === 'SuperAdministrator') {
      // Для администраторов проверяем логин
      if (!formData.email || formData.email.trim() === '') {
        newErrors.email = 'Логин обязателен для заполнения';
      } else if (formData.email.trim().length < 3) {
        newErrors.email = 'Логин должен содержать минимум 3 символа';
      }
    } else {
      // Для остальных проверяем email
      if (!formData.email || formData.email.trim() === '') {
        newErrors.email = 'Email обязателен для заполнения';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Введите корректный email адрес';
      }
    }


    if (formData.role === 'Performer') {
      if (!formData.age) {
        newErrors.age = 'Возраст обязателен для заполнения';
      } else if (formData.age < 18 || formData.age > 120) {
        newErrors.age = 'Возраст должен быть от 18 до 120 лет';
      }
    }

    if (formData.role === 'Customer') {
      // Phone validation (optional)
      if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Введите корректный номер телефона';
      }
      if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 10) {
        newErrors.description = 'Описание должно содержать минимум 10 символов';
      }
      if (!formData.scopeS || formData.scopeS.trim() === '' || selectedBusinessAreas.length === 0) {
        newErrors.scopeS = 'Выберите хотя бы одну область деятельности';
      }
    }

    if (formData.role === 'Performer') {
      if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Введите корректный номер телефона';
      }
      if (!formData.specializations || formData.specializations.trim() === '' || selectedSpecializations.length === 0) {
        newErrors.specializations = 'Выберите хотя бы одну специализацию';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = async (user: Account) => {
    try {
      const response = await adminApi.getUserDetails(user.id);
      setUserDetails(response.data);
      setSelectedUser(user);
      
      const role = response.data.role?.name || 'Customer';
      
      // Инициализируем выбранные значения
      if (role === 'Performer' && response.data.specializations) {
        const specializationsStr = response.data.specializations || '';
        const specializationsArray = specializationsStr 
          ? specializationsStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];
        setSelectedSpecializations(specializationsArray);
      } else {
        setSelectedSpecializations([]);
      }
      
      if (role === 'Customer' && response.data.scopeS) {
        const scopeSStr = response.data.scopeS || '';
        const businessAreasArray = scopeSStr 
          ? scopeSStr.split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];
        setSelectedBusinessAreas(businessAreasArray);
      } else {
        setSelectedBusinessAreas([]);
      }
      
      setFormData({
        lastName: (role === 'Customer' || role === 'Performer') ? (response.data.lastName || '') : undefined,
        firstName: (role === 'Customer' || role === 'Performer') ? (response.data.firstName || '') : undefined,
        middleName: (role === 'Customer' || role === 'Performer') ? (response.data.middleName || '') : undefined,
        name: (role === 'Administrator' || role === 'SuperAdministrator') ? (response.data.name || '') : undefined,
        email: (role === 'Administrator' || role === 'SuperAdministrator') ? (response.data.login || '') : (response.data.email || ''),
        password: '',
        role: (role === 'SuperAdministrator' ? 'SuperAdministrator' : role) as 'Customer' | 'Performer' | 'Administrator' | 'SuperAdministrator',
        age: (role === 'Performer' ? response.data.age : undefined),
        description: response.data.description,
        scopeS: response.data.scopeS || '',
        phone: (role === 'Customer' ? response.data.phone : (role === 'Performer' ? response.data.phone : undefined)) || '',
        townCountry: response.data.townCountry || '',
        specializations: response.data.specializations || '',
        employment: response.data.employment || '',
        experience: response.data.experience || '',
      });
      setFormErrors({});
      setShowEditModal(true);
    } catch (error) {
      toast.error('Ошибка при загрузке данных пользователя');
    }
  };

  const handleDelete = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFormData()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    // Показываем модальное окно подтверждения
    setShowUpdateConfirm(true);
  };

  const handleConfirmUpdate = () => {
    if (showEditModal && selectedUser) {
      const updateData: any = {};
      
      // Для администраторов используем name и login
      if (formData.role === 'Administrator' || formData.role === 'SuperAdministrator') {
        updateData.name = formData.name;
        updateData.login = formData.email.trim();
      } else {
        // Для заказчиков и исполнителей используем ФИО
        updateData.lastName = formData.lastName;
        updateData.firstName = formData.firstName;
        updateData.middleName = formData.middleName || undefined;
        updateData.email = formData.email;
      }
      
      // Пароль и роль не изменяются
      
      // Добавляем поля в зависимости от роли
      if (formData.role === 'Customer') {
        updateData.phone = formData.phone;
        updateData.description = formData.description;
        updateData.scopeS = formData.scopeS;
      } else if (formData.role === 'Performer') {
        updateData.age = formData.age;
        updateData.phone = formData.phone;
        updateData.townCountry = formData.townCountry;
        updateData.specializations = formData.specializations;
        updateData.employment = formData.employment;
        updateData.experience = formData.experience;
      }
      
      updateUserMutation.mutate({ userId: selectedUser.id, data: updateData });
      setShowUpdateConfirm(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateConfirm(false);
  };

  // Mutation для создания администратора
  const createAdminMutation = useMutation({
    mutationFn: (data: { login: string; password: string; name: string }) => {
      return adminApi.createAdministrator(data);
    },
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Администратор создан');
      setShowCreateAdminModal(false);
      setAdminFormData({ name: '', login: '', password: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при создании администратора');
    },
  });

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.name || !adminFormData.login || !adminFormData.password || !adminFormData.confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }
    if (adminFormData.login.trim().length < 3) {
      toast.error('Логин должен содержать минимум 3 символа');
      return;
    }
    if (adminFormData.password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (adminFormData.password !== adminFormData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    createAdminMutation.mutate({
      name: adminFormData.name,
      login: adminFormData.login.trim(),
      password: adminFormData.password,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Ошибка при загрузке данных: {String(error)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('admin.userManagement')}</h1>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('admin.createAdministrator')}
          </button>
        )}
      </div>

      <div className="card">
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('admin.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все роли</option>
              <option value="Customer">Заказчик</option>
              <option value="Performer">Исполнитель</option>
              <option value="Administrator">Администратор</option>
              {isSuperAdmin && <option value="SuperAdministrator">Суперадминистратор</option>}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активен</option>
              <option value="inactive">Заблокирован</option>
            </select>
          </div>
        </div>
        
        {(() => {
          // Фильтруем данные: скрываем SuperAdministrator от обычных админов и применяем поиск и фильтры
          const filteredUsers = data?.filter(user => {
            // Фильтр по SuperAdministrator
            if (user.role?.name === 'SuperAdministrator' && !isSuperAdmin) {
              return false;
            }
            
            // Фильтр по роли
            if (roleFilter !== 'all' && user.role?.name !== roleFilter) {
              return false;
            }
            
            // Фильтр по статусу
            if (statusFilter !== 'all') {
              if (statusFilter === 'active' && !user.isActive) {
                return false;
              }
              if (statusFilter === 'inactive' && user.isActive) {
                return false;
              }
            }
            
            // Фильтр по поисковому запросу
            if (searchTerm) {
              const searchLower = searchTerm.toLowerCase();
              return (
                user.login?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.role?.name?.toLowerCase().includes(searchLower) ||
                user.id?.toString().includes(searchTerm)
              );
            }
            
            return true;
          }) || [];
          
          // Сортировка
          const sortedUsers = [...filteredUsers].sort((a, b) => {
            if (!sortBy) return 0;
            
            if (sortBy === 'role') {
              const roleA = getRoleLabel(a.role?.name || 'USER', t);
              const roleB = getRoleLabel(b.role?.name || 'USER', t);
              if (sortOrder === 'asc') {
                return roleA.localeCompare(roleB, 'ru');
              } else {
                return roleB.localeCompare(roleA, 'ru');
              }
            }
            
            if (sortBy === 'status') {
              const statusA = a.isActive ? 1 : 0;
              const statusB = b.isActive ? 1 : 0;
              if (sortOrder === 'asc') {
                return statusA - statusB;
              } else {
                return statusB - statusA;
              }
            }
            
            return 0;
          });
          
          const handleSort = (field: 'role' | 'status') => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field);
              setSortOrder('asc');
            }
          };
          
          return sortedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Логин
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Роль</span>
                      {sortBy === 'role' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Статус</span>
                      {sortBy === 'status' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                  {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-100">
                      {user.login || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      {(user.role?.name === 'Administrator' || user.role?.name === 'SuperAdministrator') ? '-' : (user.email || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                        {getRoleLabel(user.role?.name || 'USER', t)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {user.isActive !== false ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Показываем кнопки редактирования/удаления только если:
                          - это не администратор (обычный или суперадмин), ИЛИ
                          - текущий пользователь - суперадмин */}
                      {((user.role?.name !== 'Administrator' && user.role?.name !== 'SuperAdministrator') || isSuperAdmin) && (
                        <>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                        </>
                      )}
                      {/* Кнопка активации/деактивации для всех пользователей (кроме администраторов, если текущий пользователь не суперадмин) */}
                      {((user.role?.name !== 'Administrator' && user.role?.name !== 'SuperAdministrator') || isSuperAdmin) && (
                        <>
                          {user.isActive !== false ? (
                          <button
                              onClick={() => handleDeactivate(user)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            title="Деактивировать"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400"
                              title="Активировать"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              {searchTerm ? t('admin.usersNotFound') : t('admin.noUsers')}
            </p>
          </div>
        );
        })()}
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => {
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ name: '', email: '', password: '', role: 'Customer' });
        setSelectedSpecializations([]);
        setSelectedBusinessAreas([]);
        setFormErrors({});
      }}>
        <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold dark:text-slate-100">Редактировать пользователя</h2>
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                setFormData({ name: '', email: '', password: '', role: 'Customer' });
                setSelectedSpecializations([]);
                setSelectedBusinessAreas([]);
                setFormErrors({});
              }}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              <span className="text-red-500">*</span> — обязательные поля для заполнения
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Роль
              </label>
              <input
                type="text"
                value={getRoleLabel(formData.role, t)}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 bg-gray-100 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Роль нельзя изменить</p>
            </div>
            {(formData.role === 'Customer' || formData.role === 'Performer') ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Фамилия <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      if (formErrors.lastName) {
                        setFormErrors({ ...formErrors, lastName: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                      formErrors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                required
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.lastName}
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
                    value={formData.firstName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (formErrors.firstName) {
                        setFormErrors({ ...formErrors, firstName: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                      formErrors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                required
              />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.firstName}
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
                      if (formErrors.middleName) {
                        setFormErrors({ ...formErrors, middleName: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                      formErrors.middleName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.middleName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.middleName}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                    formErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}
            {(formData.role === 'Administrator' || formData.role === 'SuperAdministrator') ? (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Логин <span className="text-red-500">*</span>
              </label>
              <input
                  type="text"
                value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                    formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  minLength={3}
                required
              />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.email}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Минимум 3 символа</p>
            </div>
            ) : (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-red-500">*</span>
              </label>
              <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                    formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.email}
                  </p>
                )}
            </div>
            )}
            {formData.role === 'Performer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Возраст <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, age: parseInt(e.target.value) || undefined });
                    if (formErrors.age) {
                      setFormErrors({ ...formErrors, age: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                    formErrors.age ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  min={18}
                  max={120}
                  required
                />
                {formErrors.age && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.age}
                  </p>
                )}
              </div>
            )}
            {formData.role === 'Customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (formErrors.phone) {
                      setFormErrors({ ...formErrors, phone: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                    formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="+375291234567"
                />
                  {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.phone}
                  </p>
                )}
              </div>
            )}
            {formData.role === 'Customer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Описание
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description) {
                        setFormErrors({ ...formErrors, description: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                      formErrors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    rows={5}
                    placeholder="Расскажите о себе и своих потребностях (необязательно, но если заполняете - минимум 10 символов)"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Области деятельности <span className="text-red-500">*</span>
                  </label>
                  <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                    formErrors.scopeS ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Выберите одну или несколько областей деятельности:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {BUSINESS_AREAS.map((area) => (
                        <label key={area} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
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
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Выбрано:</strong> {selectedBusinessAreas.join(', ')}
                      </p>
                    </div>
                  )}
                  {formErrors.scopeS && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.scopeS}
                    </p>
                  )}
                </div>
              </>
            )}
            {formData.role === 'Performer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (formErrors.phone) {
                        setFormErrors({ ...formErrors, phone: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:text-slate-100 ${
                      formErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="+375 (29) 123-45-67"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.phone}
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
                    value={formData.townCountry || ''}
                    onChange={(e) => setFormData({ ...formData, townCountry: e.target.value })}
                    placeholder="Минск, Беларусь"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Специализации <span className="text-red-500">*</span>
                  </label>
                  <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
                    formErrors.specializations ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Выберите одну или несколько специализаций:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SPECIALIZATIONS.map((spec) => (
                        <label key={spec} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
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
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Выбрано:</strong> {selectedSpecializations.join(', ')}
                      </p>
                    </div>
                  )}
                  {formErrors.specializations && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.specializations}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Занятость
                  </label>
                  <select
                    value={formData.employment || ''}
                    onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100"
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
                    value={formData.experience || ''}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100"
                    rows={5}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setFormData({ name: '', email: '', password: '', role: 'Customer' });
                  setSelectedSpecializations([]);
                  setSelectedBusinessAreas([]);
                  setFormErrors({});
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={updateUserMutation.isPending}>
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* View User Modal with Tabs */}
      <Modal isOpen={showViewModal && !!userDetails} onClose={() => {
        setShowViewModal(false);
        setProfileTab('portfolio');
        setPerformerId(null);
      }}>
        {userDetails && (
          <div className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-slate-100">
                {userDetails.role?.name === 'Performer' ? 'Профиль исполнителя' : 
                 userDetails.role?.name === 'Customer' ? 'Профиль заказчика' : 
                 userDetails.role?.name === 'Administrator' || userDetails.role?.name === 'SuperAdministrator' ? 'Профиль администратора' :
                 'Информация о пользователе'}
              </h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setProfileTab('portfolio');
                  setPerformerId(null);
                  setCustomerId(null);
                }} 
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Информация об администраторе */}
            {(userDetails.role?.name === 'Administrator' || userDetails.role?.name === 'SuperAdministrator') && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 dark:text-slate-100">Имя</h3>
                  <p className="text-gray-700 dark:text-slate-300">{userDetails.name || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 dark:text-slate-100">Логин</h3>
                  <p className="text-gray-700 dark:text-slate-300">{userDetails.login || '-'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 dark:text-slate-100">Роль</h3>
                  <p className="text-gray-700 dark:text-slate-300">{getRoleLabel(userDetails.role?.name || '', t)}</p>
                </div>
                  </div>
                )}

            {/* Tabs - для исполнителей и заказчиков */}
            {(userDetails.role?.name === 'Performer' || userDetails.role?.name === 'Customer') && (
              <>
                <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setProfileTab('portfolio')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      profileTab === 'portfolio'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Портфолио
                  </button>
                  <button
                    onClick={() => setProfileTab('orders')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      profileTab === 'orders'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Выполненные заказы
                  </button>
                  <button
                    onClick={() => setProfileTab('reviews')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      profileTab === 'reviews'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
                    }`}
                  >
                    <Award className="w-4 h-4 inline mr-2" />
                    Отзывы
                  </button>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {profileTab === 'portfolio' && (
                    <div>
                      {isLoadingPortfolio ? (
                        <div className="text-center py-12">
                          <div className="text-lg text-gray-600">Загрузка портфолио...</div>
                        </div>
                      ) : portfolioData ? (
                        <div className="space-y-4">
                          {userDetails.role?.name === 'Performer' ? (
                            <>
                          {(formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) || portfolioData.name) && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">ФИО</h3>
                              <p className="text-gray-700 dark:text-slate-300">
                                {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) || portfolioData.name}
                              </p>
                            </div>
                          )}
                          {portfolioData.email && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Email</h3>
                              <p className="text-gray-700 dark:text-slate-300">{portfolioData.email}</p>
                            </div>
                          )}
                          {portfolioData.phone && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Телефон</h3>
                              <p className="text-gray-700 dark:text-slate-300">{portfolioData.phone}</p>
                            </div>
                          )}
                          {portfolioData.specializations && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Специализации</h3>
                              <p className="text-gray-700 dark:text-slate-300">{portfolioData.specializations}</p>
                            </div>
                          )}
                          {portfolioData.experience && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Опыт</h3>
                                  <p className="text-gray-700 dark:text-slate-300">{portfolioData.experience}</p>
                            </div>
                          )}
                          {portfolioData.employment && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Занятость</h3>
                              <p className="text-gray-700 dark:text-slate-300">{portfolioData.employment}</p>
                            </div>
                          )}
                          {portfolioData.townCountry && (
                            <div>
                              <h3 className="font-semibold mb-2 dark:text-slate-100">Местоположение</h3>
                              <p className="text-gray-700 dark:text-slate-300">{portfolioData.townCountry}</p>
                            </div>
                          )}
                            </>
                          ) : (
                            <>
                              {(formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) || portfolioData.name) && (
                            <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">ФИО</h3>
                                  <p className="text-gray-700 dark:text-slate-300">
                                    {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) || portfolioData.name}
                                  </p>
                                </div>
                              )}
                              {portfolioData.email && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">Email</h3>
                                  <p className="text-gray-700 dark:text-slate-300">{portfolioData.email}</p>
                                </div>
                              )}
                              {portfolioData.phone && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">Телефон</h3>
                                  <p className="text-gray-700 dark:text-slate-300">{portfolioData.phone}</p>
                                </div>
                              )}
                              {portfolioData.description && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">Описание</h3>
                                  <p className="text-gray-700 dark:text-slate-300">{portfolioData.description}</p>
                                </div>
                              )}
                              {portfolioData.scopeS && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">Область</h3>
                                  <p className="text-gray-700 dark:text-slate-300">{portfolioData.scopeS}</p>
                                </div>
                              )}
                            </>
                          )}
                          {((userDetails.role?.name === 'Performer' && !formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && !portfolioData.name && !portfolioData.email && !portfolioData.phone && !portfolioData.specializations && !portfolioData.experience && !portfolioData.employment && !portfolioData.townCountry) ||
                            (userDetails.role?.name === 'Customer' && !formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && !portfolioData.name && !portfolioData.email && !portfolioData.phone && !portfolioData.description && !portfolioData.scopeS)) && (
                            <div className="text-center py-12">
                              <p className="text-gray-500 dark:text-slate-400">Портфолио не заполнено</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500 dark:text-slate-400">Портфолио не найдено</p>
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'orders' && (
                    <div>
                      {userDetails.role?.name === 'Performer' ? (
                        <>
                      {isLoadingDoneOrders ? (
                        <div className="text-center py-12">
                          <div className="text-lg text-gray-600">Загрузка заказов...</div>
                        </div>
                      ) : doneOrdersData?.orders && doneOrdersData.orders.length > 0 ? (
                        <div className="space-y-4">
                          {doneOrdersData.orders.map((order: Order) => (
                            <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">{order.title}</h3>
                              {order.customerName && (
                                <div className="mb-2">
                                  <p className="font-medium text-gray-900 dark:text-slate-100">{order.customerName}</p>
                                  {order.customerEmail && (
                                    <p className="text-sm text-gray-600 dark:text-slate-400">{order.customerEmail}</p>
                                  )}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-slate-400">
                                {order.scope && <span>Область: {order.scope}</span>}
                                {order.stackS && <span>• Технологии: {order.stackS}</span>}
                                {order.endTime && (
                                  <span>
                                    • Завершен: {format(new Date(order.endTime), 'd MMMM yyyy', { locale: ru })}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500 dark:text-slate-400">Выполненных заказов не найдено</p>
                        </div>
                      )}
                        </>
                      ) : (
                        <>
                          {isLoadingCustomerDoneOrders ? (
                            <div className="text-center py-12">
                              <div className="text-lg text-gray-600">Загрузка заказов...</div>
                            </div>
                          ) : customerDoneOrdersData?.orders && customerDoneOrdersData.orders.length > 0 ? (
                            <div className="space-y-4">
                              {customerDoneOrdersData.orders.map((order: Order) => (
                                <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                  <h3 className="font-semibold text-lg mb-2 dark:text-slate-100">{order.title}</h3>
                                  {order.performerName && (
                                    <div className="mb-2">
                                      <p className="font-medium text-gray-900 dark:text-slate-100">{order.performerName}</p>
                                      {order.performerEmail && (
                                        <p className="text-sm text-gray-600 dark:text-slate-400">{order.performerEmail}</p>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-slate-400">
                                    {order.scope && <span>Область: {order.scope}</span>}
                                    {order.stackS && <span>• Технологии: {order.stackS}</span>}
                                    {order.endTime && (
                                      <span>
                                        • Завершен: {format(new Date(order.endTime), 'd MMMM yyyy', { locale: ru })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-gray-500 dark:text-slate-400">Выполненных заказов не найдено</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {profileTab === 'reviews' && (
                    <div>
                      {userDetails.role?.name === 'Performer' ? (
                        <>
                      {isLoadingReviews ? (
                        <div className="text-center py-12">
                          <div className="text-lg text-gray-600">Загрузка отзывов...</div>
                        </div>
                      ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviewsData.reviews.map((review: WorkExperience) => (
                            <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold dark:text-slate-100">
                                    {review.text || 'Отзыв без текста'}
                                  </h3>
                                </div>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (review.mark || 0)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300 dark:text-slate-600'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-2 font-semibold dark:text-slate-100">{review.mark}</span>
                                </div>
                              </div>
                                  {review.reviewerType === 'CUSTOMER' && review.customerName && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{review.customerName}</p>
                                      {review.customerEmail && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{review.customerEmail}</p>
                                      )}
                                    </div>
                                  )}
                                  {review.reviewerType === 'PERFORMER' && review.performerName && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{review.performerName}</p>
                                      {review.performerEmail && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{review.performerEmail}</p>
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
                          <p className="text-gray-500 dark:text-slate-400">Отзывов не найдено</p>
                        </div>
                      )}
                        </>
                      ) : (
                        <>
                          {isLoadingCustomerReviews ? (
                            <div className="text-center py-12">
                              <div className="text-lg text-gray-600">Загрузка отзывов...</div>
                    </div>
                          ) : customerReviewsData?.reviews && customerReviewsData.reviews.length > 0 ? (
                            <div className="space-y-4">
                              {customerReviewsData.reviews.map((review: WorkExperience) => (
                                <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold dark:text-slate-100">
                                        {review.text || 'Отзыв без текста'}
                                      </h3>
                                    </div>
                                    <div className="flex items-center">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < (review.mark || 0)
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300 dark:text-slate-600'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-2 font-semibold dark:text-slate-100">{review.mark}</span>
                                    </div>
                                  </div>
                                  {review.reviewerType === 'PERFORMER' && review.performerName && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{review.performerName}</p>
                                      {review.performerEmail && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{review.performerEmail}</p>
                                      )}
                                    </div>
                                  )}
                                  {review.reviewerType === 'CUSTOMER' && review.customerName && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{review.customerName}</p>
                                      {review.customerEmail && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{review.customerEmail}</p>
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
                              <p className="text-gray-500 dark:text-slate-400">Отзывов не найдено</p>
                            </div>
                          )}
              </>
            )}
              </div>
                  )}
                </div>
              </>
            )}

              </div>
            )}
      </Modal>

      {/* Create Administrator Modal */}
      <Modal isOpen={showCreateAdminModal} onClose={() => {
        setShowCreateAdminModal(false);
        setAdminFormData({ name: '', login: '', password: '', confirmPassword: '' });
      }}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold dark:text-slate-100">{t('admin.createAdministrator')}</h2>
            <button
              onClick={() => {
                setShowCreateAdminModal(false);
                setAdminFormData({ name: '', login: '', password: '', confirmPassword: '' });
              }}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Логин <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={adminFormData.login}
                onChange={(e) => setAdminFormData({ ...adminFormData, login: e.target.value })}
                className="input"
                minLength={3}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Минимум 3 символа</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Пароль <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                className="input"
                minLength={8}
                required
              />
              <p className="mt-1 text-xs text-gray-500">Минимум 8 символов</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Повторите пароль <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminFormData.confirmPassword}
                onChange={(e) => setAdminFormData({ ...adminFormData, confirmPassword: e.target.value })}
                className="input"
                minLength={8}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateAdminModal(false);
                  setAdminFormData({ name: '', login: '', password: '', confirmPassword: '' });
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={createAdminMutation.isPending}>
                {createAdminMutation.isPending ? t('common.loading') : t('common.create')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal isOpen={showDeleteConfirm} onClose={handleCancelDelete}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('admin.deleteConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Пользователь будет удален без возможности восстановления. Все связанные данные также будут удалены.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите удалить этого пользователя?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmDelete}
                disabled={deleteUserMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Да, удалить
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleteUserMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения обновления */}
      <Modal isOpen={showUpdateConfirm} onClose={handleCancelUpdate}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('admin.updateConfirm')}</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите обновить данные пользователя? Все изменения будут сохранены.
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmUpdate}
                disabled={updateUserMutation.isPending}
                className="btn btn-primary flex items-center flex-1"
              >
                {updateUserMutation.isPending ? (
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
                disabled={updateUserMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения активации */}
      <Modal isOpen={showActivateConfirm} onClose={handleCancelActivate}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение активации</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                ✓ Активация аккаунта
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Пользователь сможет войти в систему и использовать все функции платформы.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите активировать аккаунт пользователя <strong>{userToActivate?.name}</strong>?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmActivate}
                disabled={activateMutation.isPending}
                className="btn btn-primary flex items-center flex-1"
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Активация...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Да, активировать
                  </>
                )}
              </button>
              <button
                onClick={handleCancelActivate}
                disabled={activateMutation.isPending}
                className="btn btn-secondary flex-1"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения деактивации */}
      <Modal isOpen={showDeactivateConfirm} onClose={handleCancelDeactivate}>
        <div className="card max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Подтверждение деактивации</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ Внимание!
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Пользователь не сможет войти в систему до тех пор, пока аккаунт не будет активирован снова.
              </p>
            </div>
            
            <p className="text-gray-700 dark:text-slate-300">
              Вы уверены, что хотите деактивировать аккаунт пользователя <strong>{userToActivate?.name}</strong>?
            </p>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleConfirmDeactivate}
                disabled={disactivateMutation.isPending}
                className="btn btn-danger flex items-center flex-1"
              >
                {disactivateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Деактивация...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Да, деактивировать
                  </>
                )}
              </button>
              <button
                onClick={handleCancelDeactivate}
                disabled={disactivateMutation.isPending}
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
