import { Order } from '../types';

export type OrderStatusType = 'ACTIVE' | 'IN_PROCESS' | 'ON_CHECK' | 'ON_REVIEW' | 'DONE' | 'REJECTED';

/**
 * Получает статус заказа из enum или вычисляет из deprecated boolean полей (для обратной совместимости)
 */
export function getOrderStatus(order: Order): OrderStatusType {
  // Используем новый enum статус, если он есть
  if (order.status) {
    return order.status as OrderStatusType;
  }
  
  // Обратная совместимость: вычисляем статус из boolean полей
  if (order.isOnReview) return 'ON_REVIEW';
  if (order.isRejected) return 'REJECTED';
  if (order.isDone) return 'DONE';
  if (order.isOnCheck) return 'ON_CHECK';
  if (order.isInProcess) return 'IN_PROCESS';
  if (order.isActived) return 'ACTIVE';
  
  return 'ACTIVE'; // По умолчанию
}

/**
 * Проверяет, активен ли заказ
 */
export function isOrderActive(order: Order): boolean {
  return getOrderStatus(order) === 'ACTIVE';
}

/**
 * Проверяет, завершен ли заказ
 */
export function isOrderDone(order: Order): boolean {
  return getOrderStatus(order) === 'DONE';
}

/**
 * Проверяет, на рассмотрении ли заказ
 */
export function isOrderOnReview(order: Order): boolean {
  return getOrderStatus(order) === 'ON_REVIEW';
}

/**
 * Проверяет, отклонен ли заказ
 */
export function isOrderRejected(order: Order): boolean {
  return getOrderStatus(order) === 'REJECTED';
}

/**
 * Проверяет, на проверке ли заказ
 */
export function isOrderOnCheck(order: Order): boolean {
  return getOrderStatus(order) === 'ON_CHECK';
}

/**
 * Проверяет, в процессе ли заказ
 */
export function isOrderInProcess(order: Order): boolean {
  return getOrderStatus(order) === 'IN_PROCESS';
}

