package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;
    public NotificationController(NotificationService service){this.service=service;}
    @GetMapping List<ApiModels.NotificationDto> list(Authentication a){return service.list((String)a.getPrincipal());}
    @PostMapping("/{id}/read") ApiModels.NotificationDto read(Authentication a,@PathVariable String id){return service.read((String)a.getPrincipal(),id);}
    @DeleteMapping("/{id}") void delete(Authentication a,@PathVariable String id){service.delete((String)a.getPrincipal(),id);}
}
