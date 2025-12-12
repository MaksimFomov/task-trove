package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.model.ReviewerType;
import com.fomov.tasktroveapi.model.WorkExperience;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, imports = ReviewerType.class)
public interface WorkExperienceMapper {
    
    @Mapping(target = "customerName", expression = "java(workExperience.getCustomer() != null ? workExperience.getCustomer().getFullName() : null)")
    @Mapping(target = "customerEmail", expression = "java(workExperience.getCustomer() != null && workExperience.getCustomer().getAccount() != null ? workExperience.getCustomer().getAccount().getEmail() : null)")
    @Mapping(target = "performerName", expression = "java(workExperience.getPerformer() != null ? workExperience.getPerformer().getFullName() : null)")
    @Mapping(target = "performerEmail", expression = "java(workExperience.getPerformer() != null && workExperience.getPerformer().getAccount() != null ? workExperience.getPerformer().getAccount().getEmail() : null)")
    @Mapping(target = "orderId", expression = "java(workExperience.getOrder() != null ? workExperience.getOrder().getId() : null)")
    @Mapping(target = "reviewerType", expression = "java(workExperience.getReviewerType() != null ? workExperience.getReviewerType().name() : null)")
    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "performerId", ignore = true)
    WorkExperienceDto toDto(WorkExperience workExperience);
    
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "performer", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "reviewerType", expression = "java(dto.getReviewerType() != null && !dto.getReviewerType().isEmpty() ? ReviewerType.valueOf(dto.getReviewerType()) : null)")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "text", source = "text")
    WorkExperience toEntity(WorkExperienceDto dto);
}
