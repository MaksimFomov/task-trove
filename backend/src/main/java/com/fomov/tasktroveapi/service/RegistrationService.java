package com.fomov.tasktroveapi.service;

import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import com.fomov.tasktroveapi.model.*;

public interface RegistrationService {
    /**
     * Регистрирует нового Customer
     * @param dto данные для регистрации
     * @return созданный Customer
     */
    Customer registerCustomer(RegistrationCustDto dto);
    
    /**
     * Регистрирует нового Performer
     * @param dto данные для регистрации
     * @return созданный Performer
     */
    Performer registerPerformer(RegistrationAccDto dto);
    
    /**
     * Проверяет, существует ли email в системе
     * @param email email для проверки
     * @return true если email уже существует
     */
    boolean emailExists(String email);
}

