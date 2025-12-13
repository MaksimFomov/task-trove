import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Eye, Search, ArrowUp, ArrowDown, User, Mail, Phone, MapPin, Briefcase, Clock, Award, Star, FileText, Building, Calendar, CheckCircle, XCircle, CheckSquare, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../../components/Modal';
import type { Order, Portfolio, WorkExperience } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { saveState, loadState } from '../../utils/stateStorage';

const PAGE_KEY = 'adminOrders';

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

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Инициализация состояния из URL параметров или localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    const urlSearch = searchParams.get('search');
    return urlSearch || loadState<string>(PAGE_KEY, 'searchTerm', '');
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const urlStatus = searchParams.get('status');
    return urlStatus || loadState<string>(PAGE_KEY, 'statusFilter', 'all');
  });
  const [sortBy, setSortBy] = useState<'status' | null>(() => {
    const urlSortBy = searchParams.get('sortBy') as 'status';
    return urlSortBy || loadState<'status' | null>(PAGE_KEY, 'sortBy', null);
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc';
    return urlSortOrder || loadState<'asc' | 'desc'>(PAGE_KEY, 'sortOrder', 'asc');
  });
  const [ordersTab, setOrdersTab] = useState<'all' | 'review'>(() => {
    const urlTab = searchParams.get('tab') as 'all' | 'review';
    return urlTab || loadState<'all' | 'review'>(PAGE_KEY, 'ordersTab', 'all');
  });
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUserViewModal, setShowUserViewModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [userDetails, setUserDetails] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'portfolio' | 'orders' | 'reviews'>(() => {
    return loadState<'portfolio' | 'orders' | 'reviews'>(PAGE_KEY, 'profileTab', 'portfolio');
  });
  const [performerId, setPerformerId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Сохранение вкладки профиля в модальном окне
  useEffect(() => {
    if (userDetails) {
      saveState(PAGE_KEY, 'profileTab', profileTab);
    }
  }, [profileTab, userDetails]);

  // Сохранение состояния в localStorage
  useEffect(() => {
    saveState(PAGE_KEY, 'searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveState(PAGE_KEY, 'statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortBy', sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveState(PAGE_KEY, 'sortOrder', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    saveState(PAGE_KEY, 'ordersTab', ordersTab);
  }, [ordersTab]);

  // Синхронизация с URL параметрами
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (ordersTab !== 'all') params.set('tab', ordersTab);
    setSearchParams(params, { replace: true });
  }, [searchTerm, statusFilter, sortBy, sortOrder, ordersTab, setSearchParams]);

  // Обновление вкладки
  const handleOrdersTabChange = (tab: 'all' | 'review') => {
    setOrdersTab(tab);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const response = await adminApi.getAllOrders();
      return response.data?.orders || [];
    },
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
  });

  const { data: reviewOrders, isLoading: isLoadingReview } = useQuery({
    queryKey: ['adminOrdersOnReview'],
    queryFn: async () => {
      const response = await adminApi.getOrdersOnReview();
      return response.data?.orders || [];
    },
    refetchInterval: 10000, // Автоматическое обновление каждые 10 секунд
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: number) => adminApi.deleteOrder(orderId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrdersOnReview'] });
      toast.success('Заказ удален успешно');
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
      setShowViewModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при удалении заказа');
    },
  });

  const approveOrderMutation = useMutation({
    mutationFn: (orderId: number) => adminApi.approveOrder(orderId),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrdersOnReview'] });
      toast.success('Заказ успешно одобрен');
      setShowViewModal(false);
      setShowApproveConfirm(false);
      setOrderToApprove(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при одобрении заказа');
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) => adminApi.rejectOrder(orderId, reason),
    onSuccess: () => {
      // Немедленное обновление всех связанных запросов
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrdersOnReview'] });
      toast.success('Заказ отклонен');
      setShowRejectModal(false);
      setOrderToReject(null);
      setRejectReason('');
      setShowViewModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка при отклонении заказа');
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleViewUser = async (userId: number, role: 'Customer' | 'Performer') => {
    try {
      const response = await adminApi.getUserDetails(userId);
      setUserDetails(response.data);
      setProfileTab('portfolio');
      
      // Если это исполнитель, получаем performerId из ответа
      if (response.data?.role?.name === 'Performer' && response.data?.performerId) {
        setPerformerId(response.data.performerId);
        setCustomerId(null);
      } else if (response.data?.role?.name === 'Customer' && response.data?.customerId) {
        setCustomerId(response.data.customerId);
        setPerformerId(null);
      } else {
        setPerformerId(null);
        setCustomerId(null);
      }
      
      setShowUserViewModal(true);
    } catch (error) {
      toast.error('Ошибка при загрузке данных пользователя');
    }
  };

  const handleDelete = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const handleApprove = (order: Order) => {
    setOrderToApprove(order);
    setShowApproveConfirm(true);
  };

  const confirmApprove = () => {
    if (orderToApprove) {
      approveOrderMutation.mutate(orderToApprove.id);
      setShowApproveConfirm(false);
      setOrderToApprove(null);
    }
  };

  const cancelApprove = () => {
    setShowApproveConfirm(false);
    setOrderToApprove(null);
  };

  const handleReject = (order: Order) => {
    setOrderToReject(order);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (orderToReject) {
      rejectOrderMutation.mutate({ 
        orderId: orderToReject.id, 
        reason: rejectReason.trim() || undefined 
      });
    }
  };

  // Загрузка портфолио для просмотра
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
    enabled: showUserViewModal && !!userDetails?.id && profileTab === 'portfolio' && 
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
    enabled: showUserViewModal && !!performerId && profileTab === 'orders' && userDetails?.role?.name === 'Performer',
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
    enabled: showUserViewModal && !!customerId && profileTab === 'orders' && userDetails?.role?.name === 'Customer',
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
    enabled: showUserViewModal && !!performerId && profileTab === 'reviews' && userDetails?.role?.name === 'Performer',
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
    enabled: showUserViewModal && !!customerId && profileTab === 'reviews' && userDetails?.role?.name === 'Customer',
  });

  // Выбираем источник данных в зависимости от вкладки
  const ordersDataSource = ordersTab === 'review' ? reviewOrders : data;
  const isLoadingOrders = ordersTab === 'review' ? isLoadingReview : isLoading;

  const filteredOrders = ordersDataSource?.filter((order) => {
    // Фильтр по поисковому запросу
    const matchesSearch = !searchTerm || (
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.performerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Для вкладки "На рассмотрении" показываем только заказы на рассмотрении
    if (ordersTab === 'review' && !order.isOnReview) {
      return false;
    }
    
    // Фильтр по статусу (для вкладки "Все заказы")
    let matchesStatus = true;
    if (statusFilter !== 'all' && ordersTab === 'all') {
      const status = getOrderStatus(order);
      matchesStatus = status.label.toLowerCase() === statusFilter.toLowerCase();
    }
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  // Функция для получения приоритета статуса (для сортировки)
  const getStatusPriority = (order: Order): number => {
    if (order.isOnReview) return 0; // На рассмотрении - самый высокий приоритет
    if (order.isRejected) return 0.5; // Отклонен
    if (order.isDone) return 1;
    if (order.isOnCheck) return 2;
    if (order.isInProcess) return 3;
    if (order.isActived) return 4;
    return 5; // Неактивен
  };
  
  // Сортировка
  const sortedOrders = sortBy === 'status' 
    ? [...filteredOrders].sort((a, b) => {
        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);
        return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      })
    : filteredOrders;
  
  const handleSort = (field: 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Функция для определения текущего статуса заказа (только один, наиболее приоритетный)
  const getOrderStatus = (order: Order) => {
    // Приоритет: На рассмотрении > Отклонен > Выполнен > На проверке > В процессе > Активен > Неактивен
    if (order.isOnReview) {
      return { label: 'На рассмотрении', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
    }
    if (order.isRejected) {
      return { label: 'Отклонен', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    if (order.isDone) {
      return { label: 'Выполнен', className: 'bg-purple-100 text-purple-800' };
    }
    if (order.isOnCheck) {
      return { label: 'На проверке', className: 'bg-yellow-100 text-yellow-800' };
    }
    if (order.isInProcess) {
      return { label: 'В процессе', className: 'bg-blue-100 text-blue-800' };
    }
    if (order.isActived) {
      return { label: 'Активен', className: 'bg-green-100 text-green-800' };
    }
    return { label: 'Неактивен', className: 'bg-gray-100 text-gray-800' };
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t('admin.orderManagement')}</h1>
      </div>

      {/* Вкладки */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleOrdersTabChange('all')}
          className={`px-4 py-2 font-medium text-sm ${
            ordersTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Все заказы
        </button>
        <button
          onClick={() => handleOrdersTabChange('review')}
          className={`px-4 py-2 font-medium text-sm relative ${
            ordersTab === 'review'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          На рассмотрении
          {reviewOrders && reviewOrders.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
              {reviewOrders.length}
            </span>
          )}
        </button>
      </div>

      <div className="card">
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('admin.searchOrders')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все статусы</option>
              <option value="На рассмотрении">На рассмотрении</option>
              <option value="Выполнен">Выполнен</option>
              <option value="На проверке">На проверке</option>
              <option value="В процессе">В процессе</option>
              <option value="Активен">Активен</option>
              <option value="Неактивен">Неактивен</option>
            </select>
          </div>
        </div>

        {isLoadingOrders ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-slate-400">{t('common.loading')}</p>
          </div>
        ) : sortedOrders && Array.isArray(sortedOrders) && sortedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Заказчик
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Исполнитель
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
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                      {order.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span>{order.customerName || '-'}</span>
                        {order.customerId && (
                          <button
                            onClick={() => handleViewUser(order.customerId!, 'Customer')}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            title="Просмотр профиля заказчика"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span>{order.performerName || '-'}</span>
                        {order.performerId && (
                          <button
                            onClick={() => handleViewUser(order.performerId!, 'Performer')}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            title="Просмотр профиля исполнителя"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = getOrderStatus(order);
                        return (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        title="Просмотр"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.isOnReview && (
                        <>
                          <button
                            onClick={() => handleApprove(order)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            title="Одобрить заказ"
                            disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(order)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400"
                            title="Отклонить заказ"
                            disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(order)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                        title="Удалить"
                        disabled={deleteOrderMutation.isPending || approveOrderMutation.isPending || rejectOrderMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              {searchTerm ? t('admin.ordersNotFound') : t('admin.noOrders')}
            </p>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      <Modal isOpen={showViewModal && !!selectedOrder} onClose={() => setShowViewModal(false)}>
        {selectedOrder && (
          <div className="card max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-slate-100">Детали заказа</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">ID</p>
                <p className="text-lg">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Название</p>
                <p className="text-lg">{selectedOrder.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Описание</p>
                <p className="text-lg whitespace-pre-wrap">{selectedOrder.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Область</p>
                <p className="text-lg">{selectedOrder.scope}</p>
              </div>
              {selectedOrder.stackS && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Стек технологий</p>
                  <p className="text-lg">{selectedOrder.stackS}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Заказчик</p>
                <p className="text-lg">{selectedOrder.customerName || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Исполнитель</p>
                <p className="text-lg">{selectedOrder.performerName || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Статус</p>
                {(() => {
                  const status = getOrderStatus(selectedOrder);
                  return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              {selectedOrder.publicationTime && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Дата публикации</p>
                  <p className="text-lg">{new Date(selectedOrder.publicationTime).toLocaleString('ru-RU')}</p>
                </div>
              )}
              {selectedOrder.startTime && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Дата начала</p>
                  <p className="text-lg">{new Date(selectedOrder.startTime).toLocaleString('ru-RU')}</p>
                </div>
              )}
              {selectedOrder.endTime && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Дата завершения</p>
                  <p className="text-lg">{new Date(selectedOrder.endTime).toLocaleString('ru-RU')}</p>
                </div>
              )}
              {selectedOrder.howReplies !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Количество откликов</p>
                  <p className="text-lg">{selectedOrder.howReplies}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              {selectedOrder.isOnReview && (
                <>
                  <button
                    onClick={() => handleApprove(selectedOrder)}
                    disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                    className="btn btn-primary flex items-center"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {approveOrderMutation.isPending ? 'Одобрение...' : 'Одобрить заказ'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedOrder)}
                    disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                    className="btn bg-orange-600 hover:bg-orange-700 text-white flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Отклонить заказ
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(selectedOrder)}
                className="btn btn-danger"
                disabled={deleteOrderMutation.isPending || approveOrderMutation.isPending || rejectOrderMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Удалить
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View User Modal with Tabs */}
      <Modal isOpen={showUserViewModal && !!userDetails} onClose={() => {
        setShowUserViewModal(false);
        setProfileTab('portfolio');
        setPerformerId(null);
        setCustomerId(null);
        setUserDetails(null);
      }}>
        {userDetails && (
          <div className="card max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-slate-100">
                {userDetails?.role?.name === 'Performer' ? 'Профиль исполнителя' : 
                 userDetails?.role?.name === 'Customer' ? 'Профиль заказчика' : 
                 'Информация о пользователе'}
              </h2>
              <button 
                onClick={() => {
                  setShowUserViewModal(false);
                  setProfileTab('portfolio');
                  setPerformerId(null);
                  setCustomerId(null);
                  setUserDetails(null);
                }} 
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Tabs - для исполнителей и заказчиков */}
            {(userDetails?.role?.name === 'Performer' || userDetails?.role?.name === 'Customer') && (
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
                          <div className="text-lg text-gray-600">{t('common.loading')}</div>
                        </div>
                      ) : portfolioData ? (
                        <div className="space-y-4">
                          {userDetails?.role?.name === 'Performer' ? (
                            <>
                              {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">ФИО</h3>
                                  <p className="text-gray-700 dark:text-slate-300">
                                    {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName)}
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
                              {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && (
                                <div>
                                  <h3 className="font-semibold mb-2 dark:text-slate-100">ФИО</h3>
                                  <p className="text-gray-700 dark:text-slate-300">
                                    {formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName)}
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
                          {((userDetails?.role?.name === 'Performer' && !formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && !portfolioData.email && !portfolioData.phone && !portfolioData.specializations && !portfolioData.experience && !portfolioData.employment && !portfolioData.townCountry) ||
                            (userDetails?.role?.name === 'Customer' && !formatFIO(portfolioData.lastName, portfolioData.firstName, portfolioData.middleName) && !portfolioData.email && !portfolioData.phone && !portfolioData.description && !portfolioData.scopeS)) && (
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
                      {userDetails?.role?.name === 'Performer' ? (
                        <>
                          {isLoadingDoneOrders ? (
                            <div className="text-center py-12">
                              <div className="text-lg text-gray-600">{t('common.loading')}</div>
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
                              <div className="text-lg text-gray-600">{t('common.loading')}</div>
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
                      {userDetails?.role?.name === 'Performer' ? (
                        <>
                          {isLoadingReviews ? (
                            <div className="text-center py-12">
                              <div className="text-lg text-gray-600">{t('common.loading')}</div>
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
                              <div className="text-lg text-gray-600">{t('common.loading')}</div>
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

      {/* Delete Order Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm && !!orderToDelete} onClose={cancelDelete}>
        {orderToDelete && (
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
                  Заказ будет удален без возможности восстановления. Все связанные данные (отклики, сообщения) также будут удалены.
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Заказ:</p>
                <p className="text-lg font-semibold dark:text-slate-100">{orderToDelete.title}</p>
              </div>
              
              <p className="text-gray-700 dark:text-slate-300">
                Вы уверены, что хотите удалить этот заказ?
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={cancelDelete}
                  disabled={deleteOrderMutation.isPending}
                  className="btn btn-secondary flex items-center flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteOrderMutation.isPending}
                  className="btn btn-danger flex items-center flex-1"
                >
                  {deleteOrderMutation.isPending ? (
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
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Order Confirmation Modal */}
      <Modal isOpen={showApproveConfirm && !!orderToApprove} onClose={cancelApprove}>
        {orderToApprove && (
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('admin.approveConfirm')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                  ✓ Одобрение заказа
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  После одобрения заказ станет активным и будет доступен для просмотра и откликов исполнителями.
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Заказ:</p>
                <p className="text-lg font-semibold dark:text-slate-100">{orderToApprove.title}</p>
              </div>
              
              <p className="text-gray-700 dark:text-slate-300">
                Вы уверены, что хотите одобрить этот заказ?
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={cancelApprove}
                  disabled={approveOrderMutation.isPending}
                  className="btn btn-secondary flex items-center flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={approveOrderMutation.isPending}
                  className="btn btn-primary flex items-center flex-1"
                >
                  {approveOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Одобрение...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Да, одобрить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Order Confirmation Modal */}
      <Modal isOpen={showRejectModal && !!orderToReject} onClose={() => {
        setShowRejectModal(false);
        setOrderToReject(null);
        setRejectReason('');
      }}>
        {orderToReject && (
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('admin.rejectConfirm')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-orange-800 dark:text-orange-200 font-semibold mb-2">
                  ⚠️ Внимание!
                </p>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  После отклонения заказ станет неактивным. Заказчик сможет отредактировать заказ и отправить его на повторное рассмотрение.
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Заказ:</p>
                <p className="text-lg font-semibold dark:text-slate-100">{orderToReject.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Причина отклонения (необязательно)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Укажите причину отклонения заказа..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              
              <p className="text-gray-700 dark:text-slate-300">
                Вы уверены, что хотите отклонить этот заказ?
              </p>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setOrderToReject(null);
                    setRejectReason('');
                  }}
                  disabled={rejectOrderMutation.isPending}
                  className="btn btn-secondary flex items-center flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmReject}
                  disabled={rejectOrderMutation.isPending}
                  className="btn bg-orange-600 hover:bg-orange-700 text-white flex items-center flex-1"
                >
                  {rejectOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отклонение...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Да, отклонить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
