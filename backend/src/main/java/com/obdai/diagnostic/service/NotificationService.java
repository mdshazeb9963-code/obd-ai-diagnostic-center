package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiException;
import com.obdai.diagnostic.api.ApiModels;
import com.obdai.diagnostic.domain.Notification;
import com.obdai.diagnostic.repo.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
@Service
public class NotificationService {
    private final NotificationRepository repository;
    public NotificationService(NotificationRepository repository){this.repository=repository;}
    public void create(String user,String category,String title,String body){repository.save(new Notification(user,category,title,body));}
    public List<ApiModels.NotificationDto> list(String user){return repository.findAllByUserIdOrderByCreatedAtDesc(user).stream().map(this::dto).toList();}
    @Transactional public ApiModels.NotificationDto read(String user,String id){Notification n=repository.findByIdAndUserId(id,user).orElseThrow(()->ApiException.notFound("Notification not found."));n.setReadAt(Instant.now());return dto(n);}
    @Transactional public void delete(String user,String id){Notification n=repository.findByIdAndUserId(id,user).orElseThrow(()->ApiException.notFound("Notification not found."));repository.delete(n);}
    private ApiModels.NotificationDto dto(Notification n){return new ApiModels.NotificationDto(n.getId(),n.getCategory(),n.getTitle(),n.getBody(),n.getReadAt(),n.getCreatedAt());}
}
