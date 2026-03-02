package com.cinema.security;

import com.cinema.config.PermissionConstants;
import com.cinema.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@AllArgsConstructor
@Getter
public class UserPrincipal implements UserDetails {
    
    private Long id;
    private String email;
    private String password;
    private String fullName;
    private User.Role role;
    private Collection<? extends GrantedAuthority> authorities;
    
    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // Role authority (e.g. ROLE_ADMIN, ROLE_MANAGER)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // Permission authorities (e.g. MANAGE_MOVIES, VIEW_ANALYTICS)
        Set<String> permissions = PermissionConstants.getPermissions(user.getRole());
        permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));
        
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getFullName(),
                user.getRole(),
                authorities
        );
    }
    
    public Set<String> getPermissions() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .collect(Collectors.toSet());
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
}
