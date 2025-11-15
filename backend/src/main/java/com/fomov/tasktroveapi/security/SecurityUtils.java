package com.fomov.tasktroveapi.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    /**
     * Получает ID текущего аутентифицированного пользователя из SecurityContext
     * @return ID пользователя или null, если пользователь не аутентифицирован
     */
    public static Integer getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Integer) {
            return (Integer) auth.getPrincipal();
        }
        return null;
    }

    /**
     * Получает роль текущего аутентифицированного пользователя
     * @return роль пользователя или null
     */
    public static String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
            String authority = auth.getAuthorities().iterator().next().getAuthority();
            // Убираем префикс "ROLE_" если он есть
            return authority.startsWith("ROLE_") ? authority.substring(5) : authority;
        }
        return null;
    }

    /**
     * Проверяет, аутентифицирован ли пользователь
     * @return true если пользователь аутентифицирован
     */
    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Integer;
    }
}

