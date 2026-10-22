package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface NotificationRepository extends JpaRepository<Notification,String>{
    List<Notification> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Notification> findByIdAndUserId(String id,String userId);
}
