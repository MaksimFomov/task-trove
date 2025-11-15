package com.fomov.tasktroveapi.config;

import com.fomov.tasktroveapi.security.JwtTokenService;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);
    private final JwtTokenService jwtTokenService;

    public WebSocketAuthInterceptor(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authToken = accessor.getFirstNativeHeader("Authorization");
            
            if (authToken != null && authToken.startsWith("Bearer ")) {
                String token = authToken.substring(7);
                
                try {
                    Claims claims = jwtTokenService.parseToken(token);
                    Integer userId = claims.get("userId", Integer.class);
                    String role = claims.get("role", String.class);
                    
                    if (userId != null && role != null) {
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority(role))
                            );
                        
                        accessor.setUser(authentication);
                        accessor.getSessionAttributes().put("userId", userId);
                        accessor.getSessionAttributes().put("role", role);
                        
                        logger.info("WebSocket authenticated: userId={}, role={}", userId, role);
                    } else {
                        logger.warn("Invalid JWT claims: missing userId or role");
                        throw new IllegalArgumentException("Invalid token claims");
                    }
                } catch (Exception e) {
                    logger.error("WebSocket authentication failed: {}", e.getMessage());
                    throw new IllegalArgumentException("Invalid authentication token");
                }
            } else {
                logger.warn("WebSocket connection attempt without authentication token");
                throw new IllegalArgumentException("Authentication token required");
            }
        }
        
        return message;
    }
}
