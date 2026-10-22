package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/v1/vehicles/{vehicleId}/maintenance")
public class MaintenanceController {
    private final MaintenanceService service;
    public MaintenanceController(MaintenanceService service){this.service=service;}
    @GetMapping List<ApiModels.MaintenanceDto> list(Authentication a,@PathVariable String vehicleId){return service.list((String)a.getPrincipal(),vehicleId);}
    @PostMapping ApiModels.MaintenanceDto create(Authentication a,@PathVariable String vehicleId,@Valid @RequestBody ApiModels.MaintenanceRequest request){return service.create((String)a.getPrincipal(),vehicleId,request);}
    @DeleteMapping("/{id}") void delete(Authentication a,@PathVariable String vehicleId,@PathVariable String id){service.delete((String)a.getPrincipal(),id);}
}
