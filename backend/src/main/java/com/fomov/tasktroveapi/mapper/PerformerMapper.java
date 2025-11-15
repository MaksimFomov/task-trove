package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.model.Performer;
import com.fomov.tasktroveapi.dto.RegistrationAccDto;
import org.springframework.stereotype.Component;

@Component
public class PerformerMapper {
    public Performer toEntity(RegistrationAccDto dto) {
        Performer p = new Performer();
        p.setName(dto.getName());
        // email устанавливается в Account через RegistrationService
        p.setAge(dto.getAge() != null ? dto.getAge() : 0); // Обязательное поле
        p.setRating(0);
        return p;
    }

    public RegistrationAccDto toDto(Performer e) {
        RegistrationAccDto dto = new RegistrationAccDto();
        dto.setName(e.getName());
        // email получается из Account через метод getEmail()
        dto.setEmail(e.getEmail());
        dto.setAge(e.getAge());
        dto.setPasswordUser("");
        return dto;
    }
}
