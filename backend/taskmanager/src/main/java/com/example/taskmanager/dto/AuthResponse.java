package com.example.taskmanager.dto;

public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        String username
) {
}
