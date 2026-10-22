package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.PdfReportService;
import com.obdai.diagnostic.service.ScanService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.List;
@RestController @RequestMapping("/api/v1/reports")
public class ReportController {
    private final ScanService scans;private final PdfReportService pdf;
    public ReportController(ScanService scans,PdfReportService pdf){this.scans=scans;this.pdf=pdf;}
    @GetMapping List<ApiModels.ScanReportDto> list(Authentication auth,@RequestParam(defaultValue="100") int limit){return scans.list((String)auth.getPrincipal(),limit);}
    @GetMapping("/{id}") ApiModels.ScanReportDto get(Authentication auth,@PathVariable String id){return scans.get((String)auth.getPrincipal(),id);}
    @DeleteMapping("/{id}") void delete(Authentication auth,@PathVariable String id){scans.delete((String)auth.getPrincipal(),id);}
    @GetMapping("/{id}/source")
    ResponseEntity<byte[]> source(Authentication auth,@PathVariable String id){
        var source=scans.downloadSource((String)auth.getPrincipal(),id);
        String safe=source.fileName().replaceAll("[\\\\\"\\r\\n]","_");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+safe+"\"").body(source.bytes());
    }
    @GetMapping(value="/{id}/pdf",produces="application/pdf")
    ResponseEntity<ByteArrayResource> pdf(Authentication auth,@PathVariable String id){
        var report=scans.get((String)auth.getPrincipal(),id);byte[] bytes=pdf.render(report);
        String filename="obd-diagnostic-"+report.id()+".pdf";
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\""+filename+"\"")
            .contentLength(bytes.length).body(new ByteArrayResource(bytes));
    }
}
