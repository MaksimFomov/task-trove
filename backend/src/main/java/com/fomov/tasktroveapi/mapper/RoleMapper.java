package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.RoleDto;
import com.fomov.tasktroveapi.model.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoleMapper {
    
    RoleDto toDto(Role role);
    
    Role toEntity(RoleDto roleDto);
}
