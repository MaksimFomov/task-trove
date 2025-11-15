package com.fomov.tasktroveapi.exception;

public class RepetitiveEmailException extends RuntimeException {
    public RepetitiveEmailException() {
        super("This email is already in use. Please try other address");
    }

    public RepetitiveEmailException(String email) {
        super(String.format("Email %s is already in use. Please try other address", email));
    }
}

