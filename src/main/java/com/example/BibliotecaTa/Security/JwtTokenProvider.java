package com.example.BibliotecaTa.Security;

import io.jsonwebtoken.io.DecodingException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Date;

@Component
public class JwtTokenProvider {

    private final UserDetailsService userDetailsService;  // Injectează serviciul de utilizator

    @Value("${jwt.secret}")
    private String jwtSecret; // Replace with a secure key
    private final long jwtExpirationInMs = 604800000; // 7 days

    public JwtTokenProvider(@Lazy UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    // Extrage token-ul din antetul Authorization
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Returnează token-ul fără "Bearer "
        }
        return null;
    }

    // Validarea token-ului
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            System.out.println("Token invalid: " + e.getMessage());
            return false;
        }
    }


    public Authentication getAuthentication(String token) {
        String username = getUsernameFromToken(token);
        System.out.println("Username extras din token: " + username);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (userDetails == null) {
            System.out.println("UserDetails nu a fost găsit pentru: " + username);
        }
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }


    // Extrage username-ul din token
    public String getUsernameFromToken(String token) {
        // Îndepărtăm "Bearer " dacă este prezent
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7); // elimină "Bearer "
        }

        // Înlăturăm orice spațiu sau caractere invalide din token
        token = token.replace(" ", "");

        try {
            // Verificăm dacă token-ul este valid, decodăm și extragem informațiile
            String username = Jwts.parser()
                    .setSigningKey(jwtSecret)  // Cheia de semnătura JWT
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();

            return username;
        } catch (DecodingException e) {
            // Gestionăm eroarea decodării JWT
            System.out.println("Eroare decodare JWT: " + e.getMessage());
            throw new RuntimeException("Token invalid sau corupt");
        } catch (Exception e) {
            // Gestionăm orice altă eroare
            System.out.println("Eroare: " + e.getMessage());
            throw new RuntimeException("Eroare necunoscută la procesarea token-ului");
        }
    }



    // Generarea token-ului
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }
}
