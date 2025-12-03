package com.fomov.tasktroveapi.mapper;

import com.fomov.tasktroveapi.dto.WorkExperienceDto;
import com.fomov.tasktroveapi.model.WorkExperience;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-12-03T21:46:30+0300",
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
        workExperienceDto.setCreatedAt( workExperience.getCreatedAt() );
        workExperienceDto.setUpdatedAt( workExperience.getUpdatedAt() );

        workExperienceDto.setCustomerName( workExperience.getCustomer() != null ? workExperience.getCustomer().getName() : null );
        workExperienceDto.setPerformerName( workExperience.getPerformer() != null ? workExperience.getPerformer().getName() : null );

        return workExperienceDto;
    }

    @Override
    public WorkExperience toEntity(WorkExperienceDto workExperienceDto) {
        if ( workExperienceDto == null ) {
            return null;
        }

        WorkExperience workExperience = new WorkExperience();

        workExperience.setName( workExperienceDto.getName() );
        workExperience.setRate( workExperienceDto.getRate() );

        return workExperience;
    }
}
