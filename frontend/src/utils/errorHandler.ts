import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import type { ErrorResponse } from '../types';

/**
 * Извлекает понятное сообщение об ошибке из ответа API
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    
    // Проверяем стандартный формат ошибок от backend
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      // Стандартный формат ErrorResponse
      if (data.message) {
        return data.message;
      }
      if (data.error) {
        return data.error;
      }
      // Если есть validation errors, показываем первую ошибку
      if (data.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)[0];
        if (firstError) {
          return firstError;
        }
      }
    }
    
    // Обратная совместимость: старый формат ошибок
    if (data && typeof data === 'object') {
      if ('error' in data && typeof data.error === 'string') {
        return data.error;
      }
      if ('message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
    
    // Обработка HTTP статусов (fallback)
    switch (error.response?.status) {
      case 400:
        return 'Неверные данные запроса. Проверьте введенную информацию.';
      case 401:
        return 'Необходима авторизация. Пожалуйста, войдите в систему.';
      case 403:
        return 'Доступ запрещен. У вас нет прав для выполнения этого действия.';
      case 404:
        return 'Запрашиваемый ресурс не найден.';
      case 409:
        return 'Конфликт данных. Возможно, такая запись уже существует.';
      case 500:
        return 'Внутренняя ошибка сервера. Попробуйте позже.';
      case 503:
        return 'Сервис временно недоступен. Попробуйте позже.';
      default:
        if (error.response?.status) {
          return `Ошибка сервера (${error.response.status}). Попробуйте позже.`;
        }
    }
    
    // Ошибки сети
    if (error.code === 'ERR_NETWORK') {
      return 'Ошибка сети. Проверьте подключение к интернету.';
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'Превышено время ожидания. Попробуйте еще раз.';
    }
    
    return error.message || 'Произошла неизвестная ошибка.';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Произошла неизвестная ошибка.';
}

/**
 * Извлекает все validation errors из ответа API
 */
export function getValidationErrors(error: unknown): Record<string, string> | null {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorResponse | undefined;
    
    if (data && typeof data === 'object' && 'errors' in data && data.errors) {
      return data.errors;
    }
  }
  
  return null;
}

/**
 * Показывает toast с сообщением об ошибке
 */
export function showErrorToast(error: unknown, defaultMessage?: string): void {
  const message = getErrorMessage(error);
  toast.error(defaultMessage || message);
}

/**
 * Показывает toast с сообщением об успехе
 */
export function showSuccessToast(message: string): void {
  toast.success(message);
}

/**
 * Обработчик ошибок для async функций с автоматическим показом toast
 */
export async function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    showErrorToast(error, errorMessage);
    return null;
  }
}

/**
 * Проверяет, является ли ошибка ошибкой авторизации
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Проверяет, является ли ошибка ошибкой доступа
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Проверяет, является ли ошибка ошибкой сети
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === 'ERR_NETWORK' || !error.response;
  }
  return false;
}
