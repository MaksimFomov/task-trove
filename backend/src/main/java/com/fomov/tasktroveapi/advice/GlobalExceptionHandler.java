package com.fomov.tasktroveapi.advice;

import com.fomov.tasktroveapi.dto.ErrorResponse;
import com.fomov.tasktroveapi.exception.NotFoundException;
import com.fomov.tasktroveapi.exception.RepetitiveEmailException;
import com.fomov.tasktroveapi.exception.RoleAlreadyAssignedException;
import com.fomov.tasktroveapi.exception.YouAlreadyRepliedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        Map<String, String> errors = new HashMap<>();
        StringBuilder errorMessage = new StringBuilder("Validation failed: ");
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError
                    ? ((FieldError) error).getField()
                    : error.getObjectName();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
            errorMessage.append(fieldName).append(" - ").append(message).append("; ");
        });
        
        ErrorResponse errorResponse = ErrorResponse.withValidationErrors(
                errorMessage.toString().trim(),
                HttpStatus.BAD_REQUEST.value(),
                errors
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException ex) {
        logger.warn("Resource not found: {}", ex.getMessage());
        String message = messageSource.getMessage("error.notFound", null, ex.getMessage(), LocaleContextHolder.getLocale());
        ErrorResponse errorResponse = ErrorResponse.of(message, HttpStatus.NOT_FOUND.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(RepetitiveEmailException.class)
    public ResponseEntity<ErrorResponse> handleRepetitiveEmailException(RepetitiveEmailException ex) {
        logger.warn("Repetitive email attempt: {}", ex.getMessage());
        String message = messageSource.getMessage("registration.email.exists", null, ex.getMessage(), LocaleContextHolder.getLocale());
        ErrorResponse errorResponse = ErrorResponse.of(message, HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RoleAlreadyAssignedException.class)
    public ResponseEntity<ErrorResponse> handleRoleAlreadyAssignedException(RoleAlreadyAssignedException ex) {
        logger.warn("Role already assigned: {}", ex.getMessage());
        String message = messageSource.getMessage("user.role.alreadyAssigned", null, ex.getMessage(), LocaleContextHolder.getLocale());
        ErrorResponse errorResponse = ErrorResponse.of(message, HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(YouAlreadyRepliedException.class)
    public ResponseEntity<ErrorResponse> handleYouAlreadyRepliedException(YouAlreadyRepliedException ex) {
        logger.warn("Duplicate reply attempt: {}", ex.getMessage());
        String message = messageSource.getMessage("order.alreadyReplied", null, ex.getMessage(), LocaleContextHolder.getLocale());
        ErrorResponse errorResponse = ErrorResponse.of(message, HttpStatus.CONFLICT.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.warn("Illegal argument: {}", ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex) {
        logger.warn("Security exception: {}", ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(ex.getMessage(), HttpStatus.FORBIDDEN.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
        logger.warn("Illegal state: {}", ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        logger.error("Unexpected error occurred", ex);
        String message = messageSource.getMessage("error.serverError", null, "An internal server error occurred", LocaleContextHolder.getLocale());
        ErrorResponse errorResponse = ErrorResponse.of(
                message,
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        // В production не логируем детали ошибки в ответе клиенту
        // Детальное логирование настроено через Logger
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
