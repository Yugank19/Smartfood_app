package com.myanatomy.sandboxpro.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verify-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Firebase auth endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/firebase/verify-phone").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/firebase/login").permitAll()
                // Public food and analytics
                .requestMatchers(HttpMethod.GET, "/api/food/available").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/food/nearby").hasRole("NGO")
                .requestMatchers(HttpMethod.GET, "/api/analytics/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hello").permitAll()
                // WebSocket endpoint
                .requestMatchers("/ws/**").permitAll()
                // Profile - any authenticated user
                .requestMatchers("/api/profile/**").authenticated()
                // Ratings - NGO can submit, public can view
                .requestMatchers(HttpMethod.POST, "/api/ratings").hasRole("NGO")
                .requestMatchers(HttpMethod.GET, "/api/ratings/**").permitAll()
                // Donor-only endpoints
                .requestMatchers(HttpMethod.POST, "/api/food/list").hasRole("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/food/my-listings").hasRole("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/food/my-stats").hasRole("DONOR")
                .requestMatchers(HttpMethod.PATCH, "/api/food/*/cancel").hasRole("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/pickups/donor-active").hasRole("DONOR")
                .requestMatchers(HttpMethod.GET, "/api/pickups/donor-history").hasRole("DONOR")
                .requestMatchers(HttpMethod.PATCH, "/api/pickups/*/donor-confirm-delivery").hasRole("DONOR")
                // NGO-only endpoints
                .requestMatchers(HttpMethod.PATCH, "/api/food/*/claim").hasRole("NGO")
                // Volunteer-only endpoints
                .requestMatchers(HttpMethod.GET, "/api/pickups/available").hasRole("VOLUNTEER")
                .requestMatchers(HttpMethod.POST, "/api/pickups/*/accept").hasRole("VOLUNTEER")
                .requestMatchers(HttpMethod.GET, "/api/pickups/my-assignments").hasRole("VOLUNTEER")
                .requestMatchers(HttpMethod.PATCH, "/api/pickups/*/status").hasRole("VOLUNTEER")
                // NGO pickup endpoints
                .requestMatchers(HttpMethod.GET, "/api/pickups/my-requests").hasRole("NGO")
                .requestMatchers(HttpMethod.GET, "/api/pickups/my-active-requests").hasRole("NGO")
                .requestMatchers(HttpMethod.PATCH, "/api/pickups/*/reject").hasRole("NGO")
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Everything else requires authentication
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
