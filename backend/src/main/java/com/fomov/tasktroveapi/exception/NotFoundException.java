package com.fomov.tasktroveapi.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String name, Object key) {
        super(String.format("%s (%s) not found", name, key));
    }
}

