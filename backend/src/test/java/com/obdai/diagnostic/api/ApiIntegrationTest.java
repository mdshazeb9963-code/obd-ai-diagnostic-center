package com.obdai.diagnostic.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import java.nio.charset.StandardCharsets;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties={
    "spring.datasource.url=jdbc:h2:mem:obdtest;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "obd.security.jwt-secret=dGVzdC1vbmUtdGltZS1zb3VyY2Uta2V5LWZvci1tb2NrLXRlc3RzIQ==",
    "obd.storage.directory=target/test-uploads",
    "obd.limits.free-scans-per-month=1"
})
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean StringRedisTemplate redis;

    @Test void accountScopedGarageScansPdfAndRefreshWorkEndToEnd() throws Exception {
        String firstToken=register("first@example.test","First Driver");
        mvc.perform(get("/api/v1/vehicles").header("Authorization","Bearer "+firstToken))
            .andExpect(status().isOk()).andExpect(content().json("[]"));

        JsonNode vehicle=mapper.readTree(mvc.perform(post("/api/v1/vehicles")
            .header("Authorization","Bearer "+firstToken).contentType(MediaType.APPLICATION_JSON)
            .content("{\"nickname\":\"Daily\",\"make\":\"Honda\",\"model\":\"Civic\",\"year\":2020}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String vehicleId=vehicle.path("id").asText();
        assertFalse(vehicleId.isBlank());

        String secondToken=register("second@example.test","Second Driver");
        mvc.perform(get("/api/v1/vehicles/"+vehicleId+"/maintenance").header("Authorization","Bearer "+secondToken))
            .andExpect(status().isNotFound());
        mvc.perform(put("/api/v1/vehicles/"+vehicleId).header("Authorization","Bearer "+secondToken)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"Taken\",\"year\":2020}"))
            .andExpect(status().isNotFound());

        MockMultipartFile file=new MockMultipartFile("file","scanner.custom","application/octet-stream",
            "mileage 125000 mi; P0300 P1FFF C0123 B2101 U3000"
                .getBytes(StandardCharsets.UTF_8));
        JsonNode report=mapper.readTree(mvc.perform(multipart("/api/v1/scans/upload").file(file)
            .header("Authorization","Bearer "+firstToken)).andExpect(status().isOk())
            .andExpect(jsonPath("$.diagnostics.length()").value(5))
            .andExpect(jsonPath("$.sourceFormat").value("unknown"))
            .andExpect(jsonPath("$.diagnostics[0].severity").value("UNKNOWN"))
            .andReturn().getResponse().getContentAsString());
        String reportId=report.path("id").asText();
        assertFalse(reportId.isBlank());
        mvc.perform(get("/api/v1/reports/"+reportId+"/source").header("Authorization","Bearer "+firstToken))
            .andExpect(status().isOk()).andExpect(header().string("Content-Disposition","attachment; filename=\"scanner.custom\""));
        MvcResult pdf=mvc.perform(get("/api/v1/reports/"+reportId+"/pdf").header("Authorization","Bearer "+firstToken))
            .andExpect(status().isOk()).andExpect(content().contentType("application/pdf")).andReturn();
        assertTrue(new String(pdf.getResponse().getContentAsByteArray(),StandardCharsets.ISO_8859_1).startsWith("%PDF-"));
        mvc.perform(get("/api/v1/reports/"+reportId).header("Authorization","Bearer "+secondToken))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/notifications").header("Authorization","Bearer "+firstToken))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        mvc.perform(multipart("/api/v1/scans/upload").file(new MockMultipartFile("file","second.log","text/plain","P0400".getBytes(StandardCharsets.UTF_8)))
            .header("Authorization","Bearer "+firstToken)).andExpect(status().isTooManyRequests());

        String refreshCookie=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"first@example.test\",\"password\":\"CorrectHorseBattery12\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getHeader("Set-Cookie");
        assertNotNull(refreshCookie);
        String raw=refreshCookie.substring("obd_refresh=".length(),refreshCookie.indexOf(';'));
        MvcResult rotated=mvc.perform(post("/api/v1/auth/refresh").cookie(new jakarta.servlet.http.Cookie("obd_refresh",raw)).header("Origin","http://localhost:5173"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty()).andReturn();
        mvc.perform(post("/api/v1/auth/refresh").cookie(new jakarta.servlet.http.Cookie("obd_refresh",raw)).header("Origin","http://localhost:5173"))
            .andExpect(status().isUnauthorized());
        String rotatedCookie=rotated.getResponse().getHeader("Set-Cookie");
        assertNotNull(rotatedCookie);
        String rotatedRaw=rotatedCookie.substring("obd_refresh=".length(),rotatedCookie.indexOf(';'));
        mvc.perform(post("/api/v1/auth/refresh").cookie(new jakarta.servlet.http.Cookie("obd_refresh",rotatedRaw)))
            .andExpect(status().isForbidden());
    }

    @Test void speechTranslationIsPublicButValidatesInputAndRequiresServerSideProviderKey() throws Exception {
        mvc.perform(post("/api/v1/ai/speech-translation").contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"hi\",\"code\":\"C1241\",\"title\":\"Low voltage\",\"description\":\"Battery voltage is outside range.\",\"causes\":[\"Weak battery\"],\"nextStep\":\"Test the battery.\"}"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("OPENAI_API_KEY")));
        mvc.perform(post("/api/v1/ai/speech-translation").contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"xx\",\"code\":\"C1241\",\"title\":\"Low voltage\",\"description\":\"Battery voltage is outside range.\"}"))
            .andExpect(status().isBadRequest());
    }

    private String register(String email,String name)throws Exception{
        MvcResult result=mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(java.util.Map.of("displayName",name,"email",email,"password","CorrectHorseBattery12"))))
            .andExpect(status().isOk()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).path("accessToken").asText();
    }
}
