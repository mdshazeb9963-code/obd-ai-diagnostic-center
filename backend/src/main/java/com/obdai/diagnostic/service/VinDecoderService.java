package com.obdai.diagnostic.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.config.ObdProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.regex.Pattern;
@Service
public class VinDecoderService {
    private static final Pattern VIN=Pattern.compile("^[A-HJ-NPR-Z0-9]{17}$");
    private final RestClient client;private final ObdProperties properties;
    public VinDecoderService(RestClient client,ObdProperties properties){this.client=client;this.properties=properties;}
    public ApiModels.VinDecode decode(String value){
        String vin=value.toUpperCase(Locale.ROOT);
        if(!VIN.matcher(vin).matches())throw ApiException.badRequest("Enter a valid 17-character VIN.");
        try{
            JsonNode root=client.get().uri(properties.getVin().getBaseUrl()+"/vehicles/DecodeVinValuesExtended/{vin}?format=json",vin).retrieve().body(JsonNode.class);
            JsonNode result=root==null?null:root.path("Results").path(0);
            if(result==null||result.isMissingNode())throw ApiException.unavailable("VIN decoder returned no vehicle record.");
            return new ApiModels.VinDecode(vin,text(result,"Make"),text(result,"Model"),integer(result,"ModelYear"),
                first(text(result,"EngineModel"),engineDescription(text(result,"DisplacementL"),text(result,"EngineCylinders"))),
                text(result,"TransmissionStyle"),text(result,"FuelTypePrimary"),text(result,"PlantCountry"),decimal(text(result,"DisplacementL")));
        }catch(ApiException e){throw e;}catch(Exception e){throw ApiException.unavailable("The VIN decoder is temporarily unavailable. Try again shortly.");}
    }
    private String text(JsonNode n,String key){String v=n.path(key).asText("").trim();return v.isBlank()||v.equalsIgnoreCase("Not Applicable")?"":v;}
    private Integer integer(JsonNode n,String key){try{return Integer.parseInt(text(n,key));}catch(Exception e){return null;}}
    private BigDecimal decimal(String v){try{return v.isBlank()?null:new BigDecimal(v);}catch(Exception e){return null;}}
    private String first(String a,String b){return a.isBlank()?b:a;}
    private String engineDescription(String displacement,String cylinders){
        if(displacement.isBlank()&&cylinders.isBlank())return "";
        return (displacement.isBlank()?"":displacement+" L")+(cylinders.isBlank()?"":" "+cylinders+" cyl");
    }
}
