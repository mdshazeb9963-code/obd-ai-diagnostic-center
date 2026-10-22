package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.VehicleService;
import com.obdai.diagnostic.service.VinDecoderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/v1/vehicles")
public class VehicleController {
    private final VehicleService vehicles;private final VinDecoderService decoder;
    public VehicleController(VehicleService vehicles,VinDecoderService decoder){this.vehicles=vehicles;this.decoder=decoder;}
    @GetMapping List<ApiModels.VehicleDto> list(Authentication auth){return vehicles.list((String)auth.getPrincipal());}
    @PostMapping ApiModels.VehicleDto create(Authentication auth,@Valid @RequestBody ApiModels.VehicleRequest request){return vehicles.create((String)auth.getPrincipal(),request);}
    @PutMapping("/{id}") ApiModels.VehicleDto update(Authentication auth,@PathVariable String id,@Valid @RequestBody ApiModels.VehicleRequest request){return vehicles.update((String)auth.getPrincipal(),id,request);}
    @DeleteMapping("/{id}") void delete(Authentication auth,@PathVariable String id){vehicles.delete((String)auth.getPrincipal(),id);}
    @GetMapping("/decode-vin/{vin}") ApiModels.VinDecode decode(@PathVariable String vin){return decoder.decode(vin);}
}
