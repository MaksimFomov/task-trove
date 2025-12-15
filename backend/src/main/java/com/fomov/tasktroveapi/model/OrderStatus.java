package com.fomov.tasktroveapi.model;

public enum OrderStatus {
    ACTIVE,        // Заказ активен и доступен для откликов
    IN_PROCESS,    // Заказ в работе (назначен исполнитель)
    ON_CHECK,      // Заказ на проверке
    ON_REVIEW,     // Заказ на рассмотрении
    DONE,          // Заказ выполнен
    REJECTED       // Заказ отклонен
}

