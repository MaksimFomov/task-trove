package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.model.ReviewerType;
import com.fomov.tasktroveapi.model.WorkExperience;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-21T15:22:25+0300",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.44.0.v20251118-1623, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class WorkExperienceMapperImpl implements WorkExperienceMapper {

    @Override
    public WorkExperienceDto toDto(WorkExperience workExperience) {
        if ( workExperience == null ) {
            return null;
        }

        WorkExperienceDto workExperienceDto = new WorkExperienceDto();

        workExperienceDto.setCreatedAt( workExperience.getCreatedAt() );
        workExperienceDto.setId( workExperience.getId() );
        workExperienceDto.setName( workExperience.getName() );
        workExperienceDto.setRate( workExperience.getRate() );
        workExperienceDto.setText( workExperience.getText() );
        workExperienceDto.setUpdatedAt( workExperience.getUpdatedAt() );

        workExperienceDto.setCustomerName( workExperience.getCustomer() != null ? workExperience.getCustomer().getFullName() : null );
        workExperienceDto.setCustomerEmail( workExperience.getCustomer() != null && workExperience.getCustomer().getAccount() != null ? workExperience.getCustomer().getAccount().getEmail() : null );
        workExperienceDto.setPerformerName( workExperience.getPerformer() != null ? workExperience.getPerformer().getFullName() : null );
        workExperienceDto.setPerformerEmail( workExperience.getPerformer() != null && workExperience.getPerformer().getAccount() != null ? workExperience.getPerformer().getAccount().getEmail() : null );
        workExperienceDto.setOrderId( workExperience.getOrder() != null ? workExperience.getOrder().getId() : null );
        workExperienceDto.setReviewerType( workExperience.getReviewerType() != null ? workExperience.getReviewerType().name() : null );

        return workExperienceDto;
    }

    @Override
    public WorkExperience toEntity(WorkExperienceDto dto) {
        if ( dto == null ) {
            return null;
        }

        WorkExperience workExperience = new WorkExperience();

        workExperience.setText( dto.getText() );
        workExperience.setName( dto.getName() );
        workExperience.setRate( dto.getRate() );

        workExperience.setReviewerType( dto.getReviewerType() != null && !dto.getReviewerType().isEmpty() ? ReviewerType.valueOf(dto.getReviewerType()) : null );

        return workExperience;
    }
}
