package com.obdai.diagnostic.api;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log=LoggerFactory.getLogger(GlobalExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiModels.ApiError> api(ApiException e){return ResponseEntity.status(e.getStatus()).body(new ApiModels.ApiError(e.getMessage(),Instant.now()));}
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiModels.ApiError> invalid(MethodArgumentNotValidException e){
        FieldError f=e.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String message=f==null?"Request validation failed.":f.getField()+": "+(f.getDefaultMessage()==null?"invalid value":f.getDefaultMessage());
        return ResponseEntity.badRequest().body(new ApiModels.ApiError(message,Instant.now()));
    }
    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiModels.ApiError> violation(ConstraintViolationException e){return ResponseEntity.badRequest().body(new ApiModels.ApiError("Request validation failed.",Instant.now()));}
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiModels.ApiError> upload(){return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(new ApiModels.ApiError("Upload exceeds the 20 MB limit.",Instant.now()));}
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiModels.ApiError> conflict(){return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiModels.ApiError("That record conflicts with existing account data.",Instant.now()));}
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiModels.ApiError> unexpected(Exception e,HttpServletRequest request){
        log.error("Unhandled API exception for {} {}: {}",request.getMethod(),request.getRequestURI(),e.toString(),e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiModels.ApiError("The request could not be completed.",Instant.now()));
    }
}
