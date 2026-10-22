package com.obdai.diagnostic.api;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    public ApiException(HttpStatus status,String message){super(message);this.status=status;}
    public HttpStatus getStatus(){return status;}
    public static ApiException badRequest(String m){return new ApiException(HttpStatus.BAD_REQUEST,m);}
    public static ApiException unauthorized(){return new ApiException(HttpStatus.UNAUTHORIZED,"Authentication required or session expired.");}
    public static ApiException notFound(String m){return new ApiException(HttpStatus.NOT_FOUND,m);}
    public static ApiException conflict(String m){return new ApiException(HttpStatus.CONFLICT,m);}
    public static ApiException tooMany(String m){return new ApiException(HttpStatus.TOO_MANY_REQUESTS,m);}
    public static ApiException unavailable(String m){return new ApiException(HttpStatus.SERVICE_UNAVAILABLE,m);}
}
