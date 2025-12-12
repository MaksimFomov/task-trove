import axios from 'axios';
import type {
  LoginRequest,
  RegisterCustomerRequest,
  RegisterPerformerRequest,
  Order,
  Reply,
  UpdateReplyDto,
  Chat,
  Message,
  Portfolio,
  UpdatePortfolioDto,
  WorkExperience,
  AddPerformerToOrderDto,
  ReadyOrderDto,
  Account,
  Notification,
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок авторизации
    if (error.response?.status === 401) {
      // Очищаем localStorage и позволяем ProtectedRoute самому обработать редирект
      // Это предотвращает полную перезагрузку страницы
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Используем событие для обновления store (избегаем циклических зависимостей)
      window.dispatchEvent(new Event('auth-logout'));
    }
    
    // Логируем ошибки в консоль для отладки
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  registerCustomer: (data: RegisterCustomerRequest) => api.post('/auth/register/customer', data),
  registerPerformer: (data: RegisterPerformerRequest) => api.post('/auth/register/perf', data),
  checkEmailExists: (email: string) => api.get('/auth/check-email', { params: { email } }),
  sendEmailVerification: (email: string) => api.post('/auth/send-verification', { email }),
  verifyEmailCode: (email: string, code: string) => api.post('/auth/verify-email', { email, code }),
  changePassword: (oldPassword: string, newPassword: string) => api.put('/auth/change-password', { oldPassword, newPassword }),
  forgotPassword: () => api.post('/auth/forgot-password'),
  resetPassword: (code: string, newPassword: string) => api.post('/auth/reset-password', { code, newPassword }),
  forgotPasswordPublic: (email: string) => api.post('/auth/forgot-password-public', { email }),
  resetPasswordPublic: (email: string, code: string, newPassword: string) => api.post('/auth/reset-password-public', { email, code, newPassword }),
};

// Customer API
export const customerApi = {
  getOrders: (searchTerm?: string) => api.get<{ orders: Order[] }>('/customers', { params: { searchTerm } }),
  getOrder: (id: number) => api.get<Order>(`/customers/${id}`),
  getDoneOrders: () => api.get<{ orders: Order[] }>('/customers/done'),
  getChats: (tab?: string) => api.get<{ chats: Chat[] }>('/customers/chats', { params: { tab } }),
  getMessages: (chatId: number) => api.get<{ messages: Message[] }>('/customers/messages', { params: { chatId } }),
  markChatAsRead: (chatId: number) => api.put(`/customers/chats/${chatId}/read`),
  addOrder: (data: Partial<Order>) => api.post('/customers/addorder', data),
  updateOrder: (orderId: number, data: Partial<Order>) => api.put(`/customers/orders/${orderId}`, data),
  deleteOrder: (orderId: number) => api.post('/customers/deleteorder', null, { params: { orderId } }),
  permanentlyDeleteOrder: (orderId: number) => api.delete(`/customers/deleteorder/${orderId}`),
  addPerformerToOrder: (data: AddPerformerToOrderDto) => api.post('/customers/addperformertoorder', data),
  updateTaskStatus: (data: ReadyOrderDto) => api.put('/customers/readytask', data),
  addReview: (data: WorkExperience) => api.post('/customers/addreview', data),
  sendEmail: (data: {
    orderId?: number;
    performerId?: number;
    text?: string;
    document?: File;
    isCorrection?: boolean;
  }) => {
    const formData = new FormData();
    if (data.orderId) formData.append('orderId', data.orderId.toString());
    if (data.performerId) formData.append('performerId', data.performerId.toString());
    if (data.text) formData.append('text', data.text);
    if (data.document) formData.append('document', data.document);
    if (data.isCorrection !== undefined) formData.append('isCorrection', data.isCorrection.toString());
    return api.post('/customers/sendemail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPortfolio: () => api.get<CustomerPortfolio>('/customers/portfolio'),
  updatePortfolio: (data: UpdateCustomerPortfolioDto) => api.put('/customers/portfolio', data),
  getMyReviews: () => api.get<{ reviews: WorkExperience[] }>('/customers/reviews'),
  getInfo: (userId: number) => api.get<Account>('/customers/info', { params: { userId } }),
  getPerformerDoneOrders: (performerId: number) => api.get<{ orders: Order[] }>(`/customers/performer/${performerId}/done-orders`),
  getPerformerReviews: (performerId: number) => api.get<{ reviews: WorkExperience[] }>(`/customers/performer/${performerId}/reviews`),
  getPerformerPortfolio: (performerId: number) => api.get<Portfolio>(`/customers/performer/${performerId}/portfolio`),
  refusePerformer: (orderId: number) => api.post(`/customers/refuse-performer/${orderId}`),
  deleteChat: (chatId: number) => api.delete(`/customers/chats/${chatId}`),
};

// Performer API
export const performerApi = {
  getOrders: (params?: {
    searchTerm?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<{ orders: Order[] }>('/performers/orders', { params }),
  getMyActiveOrders: (searchTerm?: string) => api.get<{ orders: Order[] }>('/performers/my-orders', { params: { searchTerm } }),
  getOrder: (id: number) => api.get<Order>(`/performers/orders/${id}`),
  getReplies: (tab?: string) => api.get<{ reply: Reply[] }>('/performers/replies', { params: { tab } }),
  getChats: (tab?: string) => api.get<{ chats: Chat[] }>('/performers/chats', { params: { tab } }),
  getMessages: (chatId: number) => api.get<{ messages: Message[] }>('/performers/messages', { params: { chatId } }),
  markChatAsRead: (chatId: number) => api.put(`/performers/chats/${chatId}/read`),
  addReply: (data: Partial<Reply>) => api.post<number>('/performers/addreply', data),
  updateTaskStatus: (data: UpdateReplyDto) => api.put('/performers/readytask', data),
  updatePortfolio: (data: UpdatePortfolioDto) => api.put('/performers/updateportfolio', data),
  deleteReply: (id: number) => api.delete(`/performers/deletereply/${id}`),
  deleteCompletedReply: (id: number) => api.delete(`/performers/deletecompleted/${id}`),
  refuseOrder: (orderId: number) => api.post(`/performers/refuse-order/${orderId}`),
  getPortfolio: () => api.get<Portfolio>('/performers/portfolio'),
  getInfo: () => api.get<Account>('/performers/info'),
  getCustomerInfo: (customerId: number) => api.get<Account>(`/performers/customer/${customerId}/info`),
  getCustomerPortfolio: (customerId: number) => api.get<CustomerPortfolio>(`/performers/customer/${customerId}/portfolio`),
  getCustomerDoneOrders: (customerId: number) => api.get<{ orders: Order[] }>(`/performers/customer/${customerId}/done-orders`),
  getCustomerReviews: (customerId: number) => api.get<{ reviews: WorkExperience[] }>(`/performers/customer/${customerId}/reviews`),
  getMyReviews: () => api.get<{ reviews: WorkExperience[] }>('/performers/reviews'),
  addReview: (data: WorkExperience) => api.post('/performers/addreview', data),
  deleteChat: (chatId: number) => api.delete(`/performers/chats/${chatId}`),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get<{ users: Account[] }>('/admin/getusers'),
  getInfo: (userId: number) => api.get<Account>('/admin/info', { params: { userId } }),
  getPortfolio: (userId: number) => api.get<Portfolio>('/admin/portfolio', { params: { userId } }),
  activate: (userId: number) => api.post<Portfolio>('/admin/activate', null, { params: { userId } }),
  disactivate: (userId: number) => api.post<Portfolio>('/admin/disactivate', null, { params: { userId } }),
  deleteComment: (id: number) => api.delete('/admin/deletecomment', { params: { id } }),
  // User management
  getUserDetails: (userId: number) => api.get<any>(`/admin/users/${userId}`),
  createCustomer: (data: RegisterCustomerRequest) => api.post('/admin/users/create-customer', data),
  createPerformer: (data: RegisterPerformerRequest) => api.post('/admin/users/create-performer', data),
  createAdministrator: (data: { login: string; password: string; name: string }) => api.post('/admin/users/create-administrator', data),
  updateUser: (userId: number, data: any) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: number) => api.delete(`/admin/users/${userId}`),
  // Orders management
  getAllOrders: () => api.get<{ orders: Order[] }>('/admin/orders'),
  getOrdersOnReview: () => api.get<{ orders: Order[] }>('/admin/orders/review'),
  getOrder: (orderId: number) => api.get<Order>(`/admin/orders/${orderId}`),
  approveOrder: (orderId: number) => api.post<{ success: boolean; message: string }>(`/admin/orders/${orderId}/approve`),
  rejectOrder: (orderId: number, reason?: string) => api.post<{ success: boolean; message: string }>(`/admin/orders/${orderId}/reject`, reason ? { reason } : {}),
  deleteOrder: (orderId: number) => api.delete(`/admin/orders/${orderId}`),
  // Statistics
  getStatistics: () => api.get<any>('/admin/statistics'),
  // Super admin check
  isSuperAdmin: () => api.get<{ isSuperAdmin: boolean }>('/admin/is-super-admin'),
  // Customer data for admin
  getCustomerPortfolio: (customerId: number) => api.get<CustomerPortfolio>(`/admin/customer/${customerId}/portfolio`),
  getCustomerDoneOrders: (customerId: number) => api.get<{ orders: Order[] }>(`/admin/customer/${customerId}/done-orders`),
  getCustomerReviews: (customerId: number) => api.get<{ reviews: WorkExperience[] }>(`/admin/customer/${customerId}/reviews`),
  // Performer data for admin
  getPerformerDoneOrders: (performerId: number) => api.get<{ orders: Order[] }>(`/admin/performer/${performerId}/done-orders`),
  getPerformerReviews: (performerId: number) => api.get<{ reviews: WorkExperience[] }>(`/admin/performer/${performerId}/reviews`),
};

// Notifications API
export const notificationApi = {
  getAll: () => api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
  getUnread: () => api.get<{ notifications: Notification[] }>('/notifications/unread'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteAll: () => api.delete('/notifications/all'),
};

export default api;

