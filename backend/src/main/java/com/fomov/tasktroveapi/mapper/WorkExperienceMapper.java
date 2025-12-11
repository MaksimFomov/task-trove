package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.model.WorkExperience;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkExperienceMapper {
    
    @Mapping(target = "customerName", expression = "java(workExperience.getCustomer() != null ? workExperience.getCustomer().getName() : null)")
    @Mapping(target = "performerName", expression = "java(workExperience.getPerformer() != null ? workExperience.getPerformer().getName() : null)")
    @Mapping(target = "orderId", ignore = true)
    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "performerId", ignore = true)
    WorkExperienceDto toDto(WorkExperience workExperience);
    
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "performer", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "text", source = "text")
    WorkExperience toEntity(WorkExperienceDto workExperienceDto);
}
