package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DtcParser {
    private static final Pattern CODE=Pattern.compile("(?i)(?<![A-Z0-9])[PCBU][0-3][A-F0-9]{3}(?![A-Z0-9])");
    private static final Pattern VIN=Pattern.compile("(?i)(?<![A-Z0-9])[A-HJ-NPR-Z0-9]{17}(?![A-Z0-9])");
    private static final Pattern MILEAGE=Pattern.compile("(?i)(?:mileage|odometer|distance)\\s*[:=,]?\\s*(\\d{1,9})\\s*(mi|miles|km|kilometers)?");
    public record ParsedScan(List<String> codes,String vin,Long mileage,String format,String text) {}
    public ParsedScan parse(MultipartFile file){
        String name=Optional.ofNullable(file.getOriginalFilename()).orElse("scan.txt");
        String extension=name.lastIndexOf('.')<0?"":name.substring(name.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);
        if(file.isEmpty())throw ApiException.badRequest("The uploaded file is empty.");
        if(file.getSize()>20L*1024*1024)throw ApiException.badRequest("Upload exceeds the 20 MB limit.");
        try{
            String text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(file.getBytes())).toString();
            if(text.indexOf('\0')>=0)throw ApiException.badRequest("This file is binary and cannot be parsed as a scanner export.");
            long controls=text.chars().filter(c->Character.isISOControl(c)&&c!='\n'&&c!='\r'&&c!='\t'&&c!='\f').count();
            if(!text.isBlank()&&controls/(double)text.length()>0.01)throw ApiException.badRequest("This file does not look like a text-based scanner export.");
            LinkedHashSet<String> found=new LinkedHashSet<>();Matcher codes=CODE.matcher(text);
            while(codes.find())found.add(codes.group().toUpperCase(Locale.ROOT));
            Matcher vinMatcher=VIN.matcher(text);String vin=vinMatcher.find()?vinMatcher.group().toUpperCase(Locale.ROOT):null;
            Matcher miles=MILEAGE.matcher(text);Long mileage=miles.find()?toMiles(safeLong(miles.group(1)),miles.group(2)):null;
            String format=Set.of("txt","csv","json","xml","log").contains(extension)?extension:"unknown";
            return new ParsedScan(List.copyOf(found),vin,mileage,format,text);
        }catch(ApiException e){throw e;}catch(Exception e){throw ApiException.badRequest("The uploaded file could not be read as UTF-8 text.");}
    }
    private Long safeLong(String v){try{return Long.parseLong(v);}catch(NumberFormatException e){return null;}}
    private Long toMiles(Long value,String unit){return value==null?null:unit!=null&&unit.toLowerCase(Locale.ROOT).startsWith("k")?Math.round(value*0.621371):value;}
}
