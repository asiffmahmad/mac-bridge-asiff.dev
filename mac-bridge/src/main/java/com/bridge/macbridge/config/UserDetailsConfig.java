package com.bridge.macbridge.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Configuration
public class UserDetailsConfig {

    @Value("${bridge.users.file:#{systemProperties['user.home']}/.mac-bridge/users.json}")
    private String usersFilePath;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        Path path = Paths.get(usersFilePath);
        Map<String, String> usersMap = new HashMap<>();

        try {
            if (Files.exists(path)) {
                usersMap = objectMapper.readValue(path.toFile(), new TypeReference<Map<String, String>>() {});
            } else {
                // Generate a random password for admin on first run
                String envPassword = System.getenv("BRIDGE_ADMIN_PASSWORD");
                String rawPassword = envPassword != null && !envPassword.isBlank() ? envPassword : UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                
                usersMap.put("admin", passwordEncoder.encode(rawPassword));
                
                Files.createDirectories(path.getParent());
                objectMapper.writeValue(path.toFile(), usersMap);
                
                System.out.println("=========================================================");
                System.out.println("[Mac Bridge] Initial Setup Complete");
                System.out.println("[Mac Bridge] Default User: admin");
                System.out.println("[Mac Bridge] Default Password: " + rawPassword);
                System.out.println("=========================================================");
            }
        } catch (IOException e) {
            System.err.println("[Mac Bridge] Error loading users file: " + e.getMessage());
            // Fallback for MVP if file fails
            usersMap.put("admin", passwordEncoder.encode("admin"));
        }

        // We use InMemoryUserDetailsManager loaded with our map for simplicity
        InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
        for (Map.Entry<String, String> entry : usersMap.entrySet()) {
            UserDetails user = User.builder()
                .username(entry.getKey())
                .password(entry.getValue())
                .roles("ADMIN")
                .build();
            manager.createUser(user);
        }

        return manager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
