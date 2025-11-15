package com.fomov.tasktroveapi.exception;

public class YouAlreadyRepliedException extends RuntimeException {
    public YouAlreadyRepliedException() {
        super("You already replied this");
    }

    public YouAlreadyRepliedException(String message) {
        super(message);
    }
}

