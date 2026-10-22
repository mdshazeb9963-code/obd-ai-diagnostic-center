package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.AiDiagnosticService;
import com.obdai.diagnostic.service.ScanService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/ai")
public class AssistantController {
    private final AiDiagnosticService ai;private final ScanService scans;
    public AssistantController(AiDiagnosticService ai,ScanService scans){this.ai=ai;this.scans=scans;}
    @PostMapping("/assistant")
    ApiModels.AssistantResponse ask(Authentication auth,@Valid @RequestBody ApiModels.AssistantRequest request){
        return ai.ask(request.message(),scans.latest((String)auth.getPrincipal(),5));
    }
}
