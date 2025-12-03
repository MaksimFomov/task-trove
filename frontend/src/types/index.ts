export interface User {
  id: number;
  login?: string;
  role?: string;
  token?: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterCustomerRequest {
  name: string;
  email: string;
  passwordUser: string;
  age: number;
  description: string;
  scopeS: string;
}

export interface RegisterPerformerRequest {
  name: string;
  email: string;
  passwordUser: string;
  age: number;
  phone?: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
}

export interface Order {
  id: number;
  title: string;
  description: string;
  scope: string;
  stackS?: string;
  customerId?: number;
  performerId?: number;
  isActived: boolean;
  isInProcess: boolean;
  isOnCheck: boolean;
  isDone: boolean;
  isDeletedByCustomer?: boolean;
  publicationTime?: string;
  startTime?: string;
  endTime?: string;
  documentName?: string;
  resultLink?: string;
  replyBind?: number;
  custOfOrder?: string;
  howReplies?: number;
  customerName?: string;
  performerName?: string;
  replies?: Reply[];
  hasReplied?: boolean;
}

export interface Reply {
  id: number;
  orderName: string;
  orderId: number;
  performerId: number;
  isDoneThisTask: boolean;
  isOnCustomer: boolean;
  donned: boolean;
  workBind?: number;
  orderNameByOrder?: string; // Alias for orderName, kept for backward compatibility
  orderDescription?: string;
  orderScope?: string;
  orderStackS?: string;
  orderPublicationTime?: string;
  orderHowReplies?: number;
  perfName?: string;
}

export interface UpdateReplyDto {
  id: number;
  isDoneThisTask?: boolean;
  isOnCustomer?: boolean;
  donned?: boolean;
}

export interface Chat {
  id: number;
  roomName: string;
  customerId: number;
  performerId: number;
  customerName?: string;
  performerName?: string;
  orderTitle?: string;
  unreadCount?: number;
  orderId?: number;
  orderIsDone?: boolean;
  orderPerformerId?: number;
  deletedByCustomer?: boolean;
  deletedByPerformer?: boolean;
}

export interface Message {
  id: number;
  chatId: number;
  authorUserId: number;
  content: string; // Primary field for message content
  text?: string; // Alias for content, kept for backward compatibility
  fromWho?: string;
  sender?: string; // Alias for fromWho
  sentAt?: string;
}

export interface Portfolio {
  id?: number;
  userId?: number;
  name?: string;
  phone?: string;
  email?: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
  status?: string;
}

export interface UpdatePortfolioDto {
  name: string;
  phone?: string;
  email: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
}

export interface WorkExperience {
  id?: number;
  name: string;
  mark: number; // Changed from Mark to match backend (rate field with @JsonProperty("mark"))
  text?: string; // Changed from Text to match backend camelCase convention
  orderId?: number; // Changed from OrderId to match backend camelCase convention
  performerId: number;
  customerId?: number;
  customerName?: string;
  performerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddPerformerToOrderDto {
  orderId: number;
  performerId: number;
  customerId?: number;
}

export interface ReadyOrderDto {
  orderId: number;
  isDone?: boolean;
  isOnCheck?: boolean;
  customerId?: number;
}

export interface Account {
  id: number;
  login: string;
  email?: string;
  role?: {
    id: number;
    name: string;
  };
}

// Standardized API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: boolean;
  error?: string;
  message: string;
  status: number;
  timestamp: string;
  errors?: Record<string, string>; // For validation errors
}

export interface Notification {
  id: number;
  accountId: number;
  userRole: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedOrderId?: number;
  relatedPerformerId?: number;
  relatedCustomerId?: number;
}

