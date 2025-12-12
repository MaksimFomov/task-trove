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
        // email устанавливается в Account через RegistrationService
        c.setPhone(dto.getPhone());
        c.setDescription(dto.getDescription());
        c.setScopeS(dto.getScopeS());
        return c;
    }

    public RegistrationCustDto toDto(Customer e) {
        RegistrationCustDto dto = new RegistrationCustDto();
        dto.setLastName(e.getLastName());
        dto.setFirstName(e.getFirstName());
        dto.setMiddleName(e.getMiddleName());
        // email получается из Account через метод getEmail()
        dto.setEmail(e.getEmail());
        dto.setPhone(e.getPhone());
        dto.setDescription(e.getDescription());
        dto.setScopeS(e.getScopeS());
        dto.setPasswordUser("");
        return dto;
    }
}
