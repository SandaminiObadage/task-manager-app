package com.example.taskmanager.service;

import com.example.taskmanager.dto.AuthRequest;
import com.example.taskmanager.dto.AuthResponse;
import com.example.taskmanager.dto.RegisterRequest;
import com.example.taskmanager.exception.ResourceConflictException;
import com.example.taskmanager.model.AppUser;
import com.example.taskmanager.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final long tokenExpirationMs;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            @Value("${app.jwt.expiration-ms}") long tokenExpirationMs
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.tokenExpirationMs = tokenExpirationMs;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();

        if (appUserRepository.existsByUsername(normalizedUsername)) {
            throw new ResourceConflictException("Username already exists");
        }

        AppUser user = new AppUser();
        user.setUsername(normalizedUsername);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole("ROLE_USER");

        AppUser savedUser = appUserRepository.save(user);
        String token = jwtService.generateToken(savedUser);
        return new AuthResponse(token, "Bearer", tokenExpirationMs / 1000, savedUser.getUsername());
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedUsername, request.password())
        );

        AppUser user = (AppUser) authentication.getPrincipal();
        String token = jwtService.generateToken(user);

        return new AuthResponse(token, "Bearer", tokenExpirationMs / 1000, user.getUsername());
    }
}
