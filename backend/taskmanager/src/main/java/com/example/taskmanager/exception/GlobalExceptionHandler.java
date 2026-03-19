package com.example.taskmanager.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("requestId={} path={} method={} status=404 message={}",
            requestId,
            request.getRequestURI(),
            request.getMethod(),
            ex.getMessage());

        ApiError apiError = new ApiError(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI(),
            requestId,
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiError);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(error.getField(), error.getDefaultMessage());
        }

        String requestId = resolveRequestId(request);
        log.warn("requestId={} path={} method={} status=400 validationErrors={}",
                requestId,
                request.getRequestURI(),
                request.getMethod(),
                validationErrors);

        ApiError apiError = new ApiError(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed",
                request.getRequestURI(),
                requestId,
                validationErrors
        );
        return ResponseEntity.badRequest().body(apiError);
    }

        @ExceptionHandler(ResourceConflictException.class)
        public ResponseEntity<ApiError> handleConflict(ResourceConflictException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("requestId={} path={} method={} status=409 message={}",
            requestId,
            request.getRequestURI(),
            request.getMethod(),
            ex.getMessage());

        ApiError apiError = new ApiError(
            LocalDateTime.now(),
            HttpStatus.CONFLICT.value(),
            HttpStatus.CONFLICT.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI(),
            requestId,
            Map.of()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiError);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.warn("requestId={} path={} method={} status=401 message={}",
            requestId,
            request.getRequestURI(),
            request.getMethod(),
            ex.getMessage());

        ApiError apiError = new ApiError(
            LocalDateTime.now(),
            HttpStatus.UNAUTHORIZED.value(),
            HttpStatus.UNAUTHORIZED.getReasonPhrase(),
            "Invalid username or password",
            request.getRequestURI(),
            requestId,
            Map.of()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(apiError);
        }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        String requestId = resolveRequestId(request);
        log.error("requestId={} path={} method={} status=500 message={} ",
                requestId,
                request.getRequestURI(),
                request.getMethod(),
                ex.getMessage(),
                ex);

        ApiError apiError = new ApiError(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "An unexpected error occurred",
                request.getRequestURI(),
                requestId,
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(apiError);
    }

    private String resolveRequestId(HttpServletRequest request) {
        Object requestIdAttr = request.getAttribute("requestId");
        if (requestIdAttr instanceof String requestId && !requestId.isBlank()) {
            return requestId;
        }

        String requestId = request.getHeader(REQUEST_ID_HEADER);
        return requestId != null && !requestId.isBlank() ? requestId : "n/a";
    }
}
