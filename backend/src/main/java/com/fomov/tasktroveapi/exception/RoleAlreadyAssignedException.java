package com.fomov.tasktroveapi.exception;

public class RoleAlreadyAssignedException extends RuntimeException {
    public RoleAlreadyAssignedException() {
        super("The role has already been assigned. Please try other role");
    }

    public RoleAlreadyAssignedException(String role) {
        super(String.format("Role %s has already been assigned. Please try other role", role));
    }
}

