package com.obdai.diagnostic.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.POST;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

class AiDiagnosticServiceTest {
    @Test void translatesOnlyTheSelectedCodeExplanationAndKeepsApiKeyServerSide() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ObdProperties properties = new ObdProperties();
        properties.getAi().setApiKey("server-test-key");
        properties.getAi().setBaseUrl("https://provider.example/v1");
        AiDiagnosticService service = new AiDiagnosticService(builder.build(), properties, new ObjectMapper());
        server.expect(requestTo("https://provider.example/v1/responses"))
            .andExpect(method(POST))
            .andExpect(header("Authorization", "Bearer server-test-key"))
            .andExpect(jsonPath("$.input", containsString("\"code\":\"C1241\"")))
            .andExpect(jsonPath("$.input", containsString("Weak battery")))
            .andExpect(jsonPath("$.input", not(containsString("full-report-vin"))))
            .andRespond(withSuccess("{\"output\":[{\"content\":[{\"type\":\"output_text\",\"text\":\"बैटरी का वोल्टेज सामान्य सीमा से बाहर है।\"}]}]}", MediaType.APPLICATION_JSON));

        ApiModels.SpeechTranslationResponse response = service.translateSpeech(new ApiModels.SpeechTranslationRequest(
            "hi", "C1241", "Low voltage", "Battery voltage is outside the expected range.",
            List.of("Weak battery", "Charging system fault"), "Test battery and charging voltage."));

        assertEquals("बैटरी का वोल्टेज सामान्य सीमा से बाहर है।", response.translation());
        server.verify();
    }
}
