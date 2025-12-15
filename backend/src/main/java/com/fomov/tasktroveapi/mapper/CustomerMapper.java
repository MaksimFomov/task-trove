package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    public Customer toEntity(RegistrationCustDto dto) {
        Customer c = new Customer();
        // Устанавливаем ФИО
        c.setLastName(dto.getLastName());
        c.setFirstName(dto.getFirstName());
        c.setMiddleName(dto.getMiddleName());
        // phone, description, scopeS теперь хранятся в Portfolio, не в Customer
        return c;
    }

    public RegistrationCustDto toDto(Customer e) {
        RegistrationCustDto dto = new RegistrationCustDto();
        dto.setLastName(e.getLastName());
        dto.setFirstName(e.getFirstName());
        dto.setMiddleName(e.getMiddleName());
        // email получается из Account через метод getEmail()
        dto.setEmail(e.getEmail());
        // phone, description, scopeS теперь получаются из Portfolio, не из Customer
        dto.setPasswordUser("");
        return dto;
    }
}
