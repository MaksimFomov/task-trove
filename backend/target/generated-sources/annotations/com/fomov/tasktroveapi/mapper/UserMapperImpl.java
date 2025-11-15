package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.UserDto;
import com.fomov.tasktroveapi.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-11-15T19:31:29+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 25 (Homebrew)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDto toDto(User user) {
        if ( user == null ) {
            return null;
        }

        UserDto userDto = new UserDto();

        userDto.setId( user.getId() );
        userDto.setAge( user.getAge() );
        userDto.setName( user.getName() );
        userDto.setEmail( user.getEmail() );

        userDto.setRoles( mapRolesToStrings(user) );

        return userDto;
    }

    @Override
    public User toEntity(UserDto userDto) {
        if ( userDto == null ) {
            return null;
        }

        User user = new User();

        user.setId( userDto.getId() );
        user.setAge( userDto.getAge() );
        user.setName( userDto.getName() );
        user.setEmail( userDto.getEmail() );

        return user;
    }
}
