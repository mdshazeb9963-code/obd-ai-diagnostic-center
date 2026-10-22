package com.obdai.diagnostic.config;
import com.obdai.diagnostic.domain.Subscription;
import com.obdai.diagnostic.domain.UserAccount;
import com.obdai.diagnostic.repo.SubscriptionRepository;
import com.obdai.diagnostic.repo.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
public class AdminBootstrap implements ApplicationRunner {
    private final UserAccountRepository users;private final SubscriptionRepository subscriptions;private final PasswordEncoder encoder;
    @Value("${ADMIN_EMAIL:}") private String adminEmail;
    @Value("${ADMIN_PASSWORD:}") private String adminPassword;
    public AdminBootstrap(UserAccountRepository users,SubscriptionRepository subscriptions,PasswordEncoder encoder){
        this.users=users;this.subscriptions=subscriptions;this.encoder=encoder;
    }
    @Override @Transactional
    public void run(ApplicationArguments args){
        if(adminEmail==null||adminEmail.isBlank())return;
        if(adminPassword==null||adminPassword.length()<12)throw new IllegalStateException("ADMIN_PASSWORD must be at least 12 characters when ADMIN_EMAIL is set.");
        String normalized=adminEmail.trim().toLowerCase();
        UserAccount account=users.findByEmailIgnoreCase(normalized).orElseGet(()->{
            UserAccount created=new UserAccount();created.setEmail(normalized);created.setDisplayName("Administrator");
            created.setPasswordHash(encoder.encode(adminPassword));return users.save(created);
        });
        account.setRole("ADMIN");users.save(account);
        if(subscriptions.findByUserId(account.getId()).isEmpty())subscriptions.save(new Subscription(account.getId()));
    }
}
