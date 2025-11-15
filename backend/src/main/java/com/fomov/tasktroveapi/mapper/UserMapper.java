package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.UserDto;
import com.fomov.tasktroveapi.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {
    
    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user))")
    UserDto toDto(User user);
    
    @Mapping(target = "roles", ignore = true)
    User toEntity(UserDto userDto);
    
    default Set<String> mapRolesToStrings(User user) {
        if (user == null || user.getRoles() == null) {
            return null;
        }
        return user.getRoles().stream()
                .map(userRole -> userRole.getRole().getName())
                .collect(Collectors.toSet());
    }
}
