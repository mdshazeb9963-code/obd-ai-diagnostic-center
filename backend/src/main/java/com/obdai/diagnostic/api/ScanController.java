package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.ScanService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
@RestController @RequestMapping("/api/v1/scans")
public class ScanController {
    private final ScanService scans;
    public ScanController(ScanService scans){this.scans=scans;}
    @PostMapping(value="/upload",consumes="multipart/form-data")
    ApiModels.ScanReportDto upload(Authentication auth,@RequestPart("file") MultipartFile file){return scans.upload((String)auth.getPrincipal(),file);}
}
