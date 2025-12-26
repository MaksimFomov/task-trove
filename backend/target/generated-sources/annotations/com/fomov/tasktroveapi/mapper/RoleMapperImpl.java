package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.RoleDto;
import com.fomov.tasktroveapi.model.Role;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-21T15:22:25+0300",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.44.0.v20251118-1623, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class RoleMapperImpl implements RoleMapper {

    @Override
    public RoleDto toDto(Role role) {
        if ( role == null ) {
            return null;
        }

        RoleDto roleDto = new RoleDto();

        roleDto.setDescription( role.getDescription() );
        roleDto.setId( role.getId() );
        roleDto.setName( role.getName() );

        return roleDto;
    }

    @Override
    public Role toEntity(RoleDto roleDto) {
        if ( roleDto == null ) {
            return null;
        }

        Role role = new Role();

        role.setDescription( roleDto.getDescription() );
        role.setId( roleDto.getId() );
        role.setName( roleDto.getName() );

        return role;
    }
}
