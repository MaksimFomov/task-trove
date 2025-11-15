package com.fomov.tasktroveapi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * Стандартный формат ответа API для ошибок
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private boolean success;
    private String error;
    private String message;
    private int status;
    private String timestamp;
    private Map<String, String> errors;

    public ErrorResponse() {
        this.success = false;
        this.timestamp = Instant.now().toString();
    }

    public ErrorResponse(String error, String message, int status) {
        this.success = false;
        this.error = error;
        this.message = message;
        this.status = status;
        this.timestamp = Instant.now().toString();
    }

    public ErrorResponse(String error, String message, int status, Map<String, String> errors) {
        this.success = false;
        this.error = error;
        this.message = message;
        this.status = status;
        this.errors = errors;
        this.timestamp = Instant.now().toString();
    }

    public static ErrorResponse of(String error, String message, int status) {
        return new ErrorResponse(error, message, status);
    }

    public static ErrorResponse of(String message, int status) {
        return new ErrorResponse(null, message, status);
    }

    public static ErrorResponse withValidationErrors(String message, int status, Map<String, String> errors) {
        return new ErrorResponse(null, message, status, errors);
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
}
