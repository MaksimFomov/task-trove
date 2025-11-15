package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Customer;
import com.fomov.tasktroveapi.dto.RegistrationCustDto;
import org.springframework.stereotype.Component;

@Component
public class CustomerMapper {
    public Customer toEntity(RegistrationCustDto dto) {
        Customer c = new Customer();
        c.setName(dto.getName());
        // email устанавливается в Account через RegistrationService
        c.setAge(dto.getAge() != null ? dto.getAge() : 0); // Обязательное поле
        c.setDescription(dto.getDescription());
        c.setScopeS(dto.getScopeS());
        return c;
    }

    public RegistrationCustDto toDto(Customer e) {
        RegistrationCustDto dto = new RegistrationCustDto();
        dto.setName(e.getName());
        // email получается из Account через метод getEmail()
        dto.setEmail(e.getEmail());
        dto.setAge(e.getAge());
        dto.setDescription(e.getDescription());
        dto.setScopeS(e.getScopeS());
        dto.setPasswordUser("");
        return dto;
    }
}
