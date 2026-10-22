package com.obdai.diagnostic.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.time.Instant;
import java.util.List;
import java.util.Map;
@Service
public class AiDiagnosticService {
    private final RestClient client;private final ObdProperties properties;
    public AiDiagnosticService(RestClient client,ObdProperties properties){this.client=client;this.properties=properties;}
    public boolean isConfigured(){return properties.getAi().getApiKey()!=null&&!properties.getAi().getApiKey().isBlank();}
    public ApiModels.AssistantResponse ask(String message,List<ApiModels.ScanReportDto> reports){
        if(!isConfigured())throw ApiException.unavailable("AI analysis is not configured. Set OPENAI_API_KEY to enable the assistant.");
        String context=reports.stream().limit(5).map(r->"Report "+r.fileName()+": "+r.diagnostics().stream().map(d->d.code()+" — "+d.title()+"; verified description: "+d.description()+"; source: "+d.source()+"; severity: "+d.severity()).toList()).reduce("",(a,b)->a+b+"\n");
        String instructions="You are an automotive diagnostic information assistant. Use only the scan facts included in the supplied context. Clearly distinguish verified code data from inference. Never invent codes, causes, costs, safety ratings, or completed repairs. If context does not answer the question, say what is missing and advise consulting the vehicle service information or a qualified technician. Do not claim remote diagnosis is certain. Keep the response clear and concise.";
        JsonNode response;
        try{
            response=client.post().uri(properties.getAi().getBaseUrl().replaceAll("/+$","")+"/responses")
                .header("Authorization","Bearer "+properties.getAi().getApiKey())
                .body(Map.of("model",properties.getAi().getModel(),"instructions",instructions,
                    "input","Saved scan context:\n"+context+"\nUser question:\n"+message))
                .retrieve().body(JsonNode.class);
        }catch(Exception e){throw ApiException.unavailable("The AI provider could not complete this request. Try again later.");}
        String answer=extractText(response);
        if(answer.isBlank())throw ApiException.unavailable("The AI provider returned no response text.");
        return new ApiModels.AssistantResponse(answer,properties.getAi().getModel(),Instant.now());
    }
    public String explain(List<ApiModels.DiagnosticFinding> findings){
        if(!isConfigured()||findings.isEmpty())return null;
        String facts=findings.stream().map(f->f.code()+": "+f.title()+". "+f.description()+". Source: "+f.source()+". Severity: "+f.severity()+".").reduce((a,b)->a+"\n"+b).orElse("");
        try{
            JsonNode response=client.post().uri(properties.getAi().getBaseUrl().replaceAll("/+$","")+"/responses")
                .header("Authorization","Bearer "+properties.getAi().getApiKey())
                .body(Map.of("model",properties.getAi().getModel(),
                    "instructions","Explain the supplied verified scan facts in plain language and concise mechanic language. Do not add causes, repair steps, costs, or safety conclusions absent from the supplied facts. Explicitly say when a code is unresolved. This is informational, not a diagnosis.",
                    "input",facts))
                .retrieve().body(JsonNode.class);
            String answer=extractText(response);return answer.isBlank()?null:answer;
        }catch(Exception ignored){return null;}
    }
    private String extractText(JsonNode response){
        if(response==null)return "";
        StringBuilder out=new StringBuilder();
        for(JsonNode item:response.path("output"))for(JsonNode part:item.path("content")){
            if("output_text".equals(part.path("type").asText())){if(!out.isEmpty())out.append("\n");out.append(part.path("text").asText(""));}}
        return out.toString().trim();
    }
}
