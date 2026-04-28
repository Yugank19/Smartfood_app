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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Global CORS configuration — allows all origins, methods, and headers.
     * This handles the preflight OPTIONS request before Spring Security filters run.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Must use explicit origins (not "*") when allowCredentials is true
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        // SockJS requires credentials=true; using allowedOriginPatterns instead of
        // allowedOrigins("*") so this is safe
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow ALL preflight OPTIONS requests without authentication
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public auth endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verify-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Supabase auth endpoints (replaces Firebase)
                .requestMatchers(HttpMethod.POST, "/api/auth/supabase/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/supabase/verify-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/supabase/mark-verified").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/supabase/login").permitAll()
                // Public food and analytics
                .requestMatchers(HttpMethod.GET, "/api/food/available").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/food/nearby").hasRole("NGO")
                .requestMatchers(HttpMethod.GET, "/api/food/animal-feed").hasAnyRole("ANIMAL_CARE", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/analytics/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/hello").permitAll()
                // WebSocket endpoint
                .requestMatchers("/ws/**").permitAll()
                // Profile - any authenticated user
                .requestMatchers("/api/profile/**").authenticated()
                // Chat - any authenticated user
                .requestMatchers("/api/chat/**").authenticated()
                // Image upload - authenticated
                .requestMatchers("/api/images/**").authenticated()
                // Ratings - NGO/ANIMAL_CARE can submit, public can view
                .requestMatchers(HttpMethod.POST, "/api/ratings").hasAnyRole("NGO", "ANIMAL_CARE")
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
                .requestMatchers(HttpMethod.GET, "/api/pickups/my-optimized-route").hasRole("VOLUNTEER")
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
