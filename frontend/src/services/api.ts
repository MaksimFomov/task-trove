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
};

// Customer API
export const customerApi = {
  getOrders: (searchTerm?: string) => api.get<{ orders: Order[] }>('/customers', { params: { searchTerm } }),
  getOrder: (id: number) => api.get<Order>(`/customers/${id}`),
  getDoneOrders: () => api.get<{ orders: Order[] }>('/customers/done'),
  getChats: (tab?: string) => api.get<{ chats: Chat[] }>('/customers/chats', { params: { tab } }),
  getMessages: (chatId: number) => api.get<{ messages: Message[] }>('/customers/messages', { params: { chatId } }),
  addOrder: (data: Partial<Order>) => api.post('/customers/addorder', data),
  deleteOrder: (orderId: number) => api.post('/customers/deleteorder', null, { params: { orderId } }),
  permanentlyDeleteOrder: (orderId: number) => api.delete(`/customers/deleteorder/${orderId}`),
  activateOrder: (orderId: number) => api.post(`/customers/activateorder/${orderId}`),
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
  getPortfolio: (userId: number) => api.get<Portfolio>('/customers/portfolio', { params: { userId } }),
  getInfo: (userId: number) => api.get<Account>('/customers/info', { params: { userId } }),
  getPerformerDoneOrders: (performerId: number) => api.get<{ orders: Order[] }>(`/customers/performer/${performerId}/done-orders`),
  getPerformerReviews: (performerId: number) => api.get<{ reviews: WorkExperience[] }>(`/customers/performer/${performerId}/reviews`),
  refusePerformer: (orderId: number) => api.post(`/customers/refuse-performer/${orderId}`),
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
  addReply: (data: Partial<Reply>) => api.post<number>('/performers/addreply', data),
  updateTaskStatus: (data: UpdateReplyDto) => api.put('/performers/readytask', data),
  updatePortfolio: (data: UpdatePortfolioDto) => api.put('/performers/updateportfolio', data),
  deleteReply: (id: number) => api.delete(`/performers/deletereply/${id}`),
  deleteCompletedReply: (id: number) => api.delete(`/performers/deletecompleted/${id}`),
  refuseOrder: (orderId: number) => api.post(`/performers/refuse-order/${orderId}`),
  getPortfolio: () => api.get<Portfolio>('/performers/portfolio'),
  getInfo: () => api.get<Account>('/performers/info'),
  getMyReviews: () => api.get<{ reviews: WorkExperience[] }>('/performers/reviews'),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get<{ users: Account[] }>('/admin/getusers'),
  getInfo: (userId: number) => api.get<Account>('/admin/info', { params: { userId } }),
  getPortfolio: (userId: number) => api.get<Portfolio>('/admin/portfolio', { params: { userId } }),
  activate: (userId: number) => api.post<Portfolio>('/admin/activate', null, { params: { userId } }),
  disactivate: (userId: number) => api.post<Portfolio>('/admin/disactivate', null, { params: { userId } }),
  deleteComment: (id: number) => api.delete('/admin/deletecomment', { params: { id } }),
};

export default api;

