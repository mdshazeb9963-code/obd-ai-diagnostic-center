package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.config.ObdProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
@Service
public class LocalFileStorageService {
    public record StoredFile(String fileName,byte[] bytes){}
    private final Path root;
    public LocalFileStorageService(ObdProperties properties){
        this.root=Path.of(properties.getStorage().getDirectory()).toAbsolutePath().normalize();
        try{Files.createDirectories(root);}catch(IOException e){throw new IllegalStateException("Upload storage directory could not be initialized.",e);}
    }
    public String store(MultipartFile file){
        String key=UUID.randomUUID()+".dat";Path target=resolve(key);
        try{Files.write(target,file.getBytes(),StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);return key;}
        catch(IOException e){throw ApiException.unavailable("The uploaded file could not be stored.");}
    }
    public byte[] read(String key){
        if(key==null)throw ApiException.notFound("Uploaded source file is unavailable.");
        try{return Files.readAllBytes(resolve(key));}catch(IOException e){throw ApiException.notFound("Uploaded source file is unavailable.");}
    }
    public void delete(String key){
        if(key==null)return;try{Files.deleteIfExists(resolve(key));}catch(IOException ignored){}
    }
    private Path resolve(String key){
        if(!key.matches("[a-f0-9-]{36}\\.dat"))throw ApiException.notFound("Uploaded source file is unavailable.");
        Path path=root.resolve(key).normalize();if(!path.startsWith(root))throw ApiException.notFound("Uploaded source file is unavailable.");return path;
    }
}
