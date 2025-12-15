package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.model.ReviewerType;
import com.fomov.tasktroveapi.model.WorkExperience;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-15T20:06:13+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 25 (Homebrew)"
)
@Component
public class WorkExperienceMapperImpl implements WorkExperienceMapper {

    @Override
    public WorkExperienceDto toDto(WorkExperience workExperience) {
        if ( workExperience == null ) {
            return null;
        }

        WorkExperienceDto workExperienceDto = new WorkExperienceDto();

        workExperienceDto.setId( workExperience.getId() );
        workExperienceDto.setName( workExperience.getName() );
        workExperienceDto.setRate( workExperience.getRate() );
        workExperienceDto.setText( workExperience.getText() );
        workExperienceDto.setCreatedAt( workExperience.getCreatedAt() );
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
