package com.obdai.diagnostic.api;

import com.obdai.diagnostic.service.AiDiagnosticService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class SpeechTranslationController {
    private final AiDiagnosticService ai;

    public SpeechTranslationController(AiDiagnosticService ai) {
        this.ai = ai;
    }

    @PostMapping("/speech-translation")
    ApiModels.SpeechTranslationResponse translate(@Valid @RequestBody ApiModels.SpeechTranslationRequest request) {
        return ai.translateSpeech(request);
    }
}
