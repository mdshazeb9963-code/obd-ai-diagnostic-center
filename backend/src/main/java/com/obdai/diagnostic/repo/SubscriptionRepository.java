package com.obdai.diagnostic.repo;
import com.obdai.diagnostic.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SubscriptionRepository extends JpaRepository<Subscription,String> {
    Optional<Subscription> findByUserId(String userId);
}
