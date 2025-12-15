export interface User {
  id: number;
  email?: string; // Заменено login на email
  role?: string;
  token?: string;
  // Deprecated: Use email instead
  login?: string;
}

export interface LoginRequest {
  login: string; // Оставляем для обратной совместимости, но это теперь email
  password: string;
}

export interface RegisterCustomerRequest {
  lastName: string;
  firstName: string;
  middleName?: string;
  email: string;
  passwordUser: string;
  phone?: string;
  description: string;
  scopeS: string;
}

export interface RegisterPerformerRequest {
  lastName: string;
  firstName: string;
  middleName?: string;
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
  status?: 'ACTIVE' | 'IN_PROCESS' | 'ON_CHECK' | 'ON_REVIEW' | 'DONE' | 'REJECTED';
  // Deprecated: Use status field instead
  isActived?: boolean;
  isInProcess?: boolean;
  isOnCheck?: boolean;
  isDone?: boolean;
  isOnReview?: boolean;
  isRejected?: boolean;
  isDeletedByCustomer?: boolean;
  publicationTime?: string;
  startTime?: string;
  endTime?: string;
  budget?: number;
  isSpecSent?: boolean;
  replyBind?: number;
  custOfOrder?: string;
  howReplies?: number;
  customerName?: string;
  performerName?: string;
  customerEmail?: string;
  performerEmail?: string;
  replies?: Reply[];
  hasReplied?: boolean;
}

export interface Reply {
  id: number;
  orderName: string;
  orderId: number;
  performerId: number;
  // Computed fields for frontend (based on Order.status and Order.performer_id)
  isDoneThisTask: boolean;
  isOnCustomer: boolean;
  donned: boolean;
  isApprovedByCustomer: boolean;
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
  lastMessageTime?: string;
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
  performerId?: number;
  customerId?: number;
  ownerType?: 'PERFORMER' | 'CUSTOMER';
  name?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  phone?: string;
  email?: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
  description?: string; // For Customer
  scopeS?: string; // For Customer
  status?: string;
  isActive?: boolean;
}

export interface UpdatePortfolioDto {
  lastName: string;
  firstName: string;
  middleName?: string;
  phone?: string;
  email: string;
  townCountry?: string;
  specializations?: string;
  employment?: string;
  experience?: string;
}

export interface CustomerPortfolio {
  id?: number;
  name?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  description?: string;
  scopeS?: string;
}

export interface UpdateCustomerPortfolioDto {
  lastName: string;
  firstName: string;
  middleName?: string;
  phone?: string;
  description?: string;
  scopeS: string;
}

export interface WorkExperience {
  id?: number;
  name: string;
  mark: number; // Changed from Mark to match backend (rate field with @JsonProperty("mark"))
  text?: string; // Changed from Text to match backend camelCase convention
  orderId?: number; // Changed from OrderId to match backend camelCase convention
  reviewerType?: 'CUSTOMER' | 'PERFORMER'; // Who left the review
  performerId: number;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  performerName?: string;
  performerEmail?: string;
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
  isActive?: boolean;
  id: number;
  email: string;
  role?: {
    id: number;
    name: string;
  };
  // Deprecated: Use email instead
  login?: string;
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

