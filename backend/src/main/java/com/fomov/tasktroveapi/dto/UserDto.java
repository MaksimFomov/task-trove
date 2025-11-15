package com.fomov.tasktroveapi.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UserDto {
    
    private Integer id;
    private Integer age;
    private String name;
    private String email;
    private Set<String> roles;
}
