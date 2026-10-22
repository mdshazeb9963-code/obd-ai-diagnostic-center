package com.obdai.diagnostic.api;
import com.obdai.diagnostic.service.SubscriptionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {
    private final SubscriptionService subscriptions;
    public SubscriptionController(SubscriptionService subscriptions){this.subscriptions=subscriptions;}
    @GetMapping("/me") ApiModels.SubscriptionDto current(Authentication auth){return subscriptions.current((String)auth.getPrincipal());}
}
