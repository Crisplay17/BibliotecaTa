package com.example.BibliotecaTa.User;

import com.example.BibliotecaTa.Book.Book;
import com.example.BibliotecaTa.Book.BookRepository;
import com.example.BibliotecaTa.Notification.EmailService;
import com.example.BibliotecaTa.Notification.NotificationService;
import com.example.BibliotecaTa.Security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final PasswordEncoder passwordEncoder;
    private NotificationService notificationService;

    public UserController(AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          EmailService emailService,
                          UserRepository userRepository, BookRepository bookRepository, NotificationService notificationService, UserService userService, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.notificationService = notificationService;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists.");
        }

//        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email already in use.");
//        }

        // Setări implicite
        user.setRole(user.getRole() == null ? Role.USER.name() : user.getRole());
        user.setEnabled(true);
        user.setStatus(UserStatus.PENDING_EMAIL_CONFIRMATION);

        // Generează un token random pentru confirmare email
        String confirmationToken = java.util.UUID.randomUUID().toString();
        user.setEmailConfirmationToken(confirmationToken);

        userService.registerUser(user);

        // Trimite email cu link de confirmare
        String confirmLink = "http://localhost:3000/confirm-email?token=" + confirmationToken;
        emailService.sendEmail(user.getEmail(), "Confirmă-ți emailul", "Te rugăm să confirmi adresa apăsând pe link: " + confirmLink);

        return ResponseEntity.ok("Cont creat. Verifică emailul pentru a confirma adresa.");
    }



    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Determină care câmp a fost completat (prioritate: username)
            String principal;
            Optional<User> userOptional = Optional.empty();

            if (loginRequest.getUsername() != null && !loginRequest.getUsername().isBlank()) {
                principal = loginRequest.getUsername();
                userOptional = userRepository.findByUsername(principal);
            } else if (loginRequest.getLibraryCardNumber() != null && !loginRequest.getLibraryCardNumber().isBlank()) {
                principal = loginRequest.getLibraryCardNumber();
                userOptional = userRepository.findByLibraryCardNumber(principal);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Trebuie să introduci un username sau un cod de bibliotecă.");
            }

            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Utilizator inexistent.");
            }

            // După ce ai obținut user-ul:
            User user = userOptional.get();

            // Verificăm dacă s-a folosit username
            boolean usedUsername = loginRequest.getUsername() != null && !loginRequest.getUsername().isBlank();

            // Dacă s-a folosit username, doar ADMIN și BIBLIOTECAR pot continua
            if (usedUsername &&
                    !(user.getRole().equalsIgnoreCase("ADMIN") || user.getRole().equalsIgnoreCase("BIBLIOTECAR"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Autentificare nepermisă cu username.");
            }

            // Aici facem autentificarea (doar dacă trece de verificarea de rol mai sus)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(principal, loginRequest.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Verifică statusul contului
            if (user.getStatus() == UserStatus.PENDING_EMAIL_CONFIRMATION) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Confirmă-ți emailul înainte de a te autentifica.");
            }
            if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Contul tău este în așteptare pentru aprobare.");
            }
            if (user.getStatus() == UserStatus.REJECTED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Contul tău a fost respins.");
            }

            String token = jwtTokenProvider.generateToken(authentication);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Autentificare eșuată");
        }
    }







    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilizator neautentificat.");
        }

        String principal = authentication.getName(); // poate fi username sau libraryCardNumber

        Optional<User> userOptional = userRepository.findByLibraryCardNumber(principal);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByUsername(principal)
                    .filter(user -> user.getRole().equals("ADMIN") || user.getRole().equals("BIBLIOTECAR"));
        }

        User user = userOptional.orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        if (user.getProfilePicture() != null && user.getProfilePicture().length > 0) {
            user.setProfilePictureUrl("http://localhost:8080/users/getProfilePicture/" + user.getId());
        }

        return ResponseEntity.ok(user);
    }




    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        request.getSession().invalidate();
        return ResponseEntity.ok("Deconectare reușită");
    }

    @PostMapping("/updateProfilePicture/{userId}")
    public ResponseEntity<String> updateProfilePicture(@PathVariable Long userId, @RequestParam("file") MultipartFile file) {
        // Verifică dacă fișierul este o imagine validă
        if (file.isEmpty() || !file.getContentType().startsWith("image/")) {
            return ResponseEntity.badRequest().body("Fișierul trebuie să fie o imagine.");
        }

        try {
            // Simulează o întârziere de 2 secunde
            Thread.sleep(2000);

            userService.updateProfilePicture(userId, file);
            return ResponseEntity.ok("Poza de profil a fost actualizată cu succes.");
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Eroare la salvarea imaginii.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Eroare internă.");
        }
    }

    // Endpoint pentru obținerea imaginii de profil
    @GetMapping("/getProfilePicture/{userId}")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable Long userId) {
        byte[] image = userService.getProfilePictureById(userId);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(image);
    }

    @DeleteMapping("/deleteProfilePicture/{userId}")
    public ResponseEntity<Void> deleteProfilePicture(@PathVariable Long userId) {
        try {
            // Simulează o întârziere de 2 secunde
            Thread.sleep(2000);

            boolean deleted = userService.deleteProfilePicture(userId);
            if (deleted) {
                return ResponseEntity.noContent().build(); // Status 204 - Poza a fost ștearsă cu succes
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // Status 500 - Eroare la ștergere
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilizator neautentificat.");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        // Verifică dacă utilizatorul are rolul de bibliotecar
        if (!user.getRole().equalsIgnoreCase("BIBLIOTECAR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nu ai permisiunea de a accesa această pagină.");
        }

        // În acest punct, utilizatorul are rolul de bibliotecar și poate accesa dashboard-ul

        // Exemplu de date de returnat (dacă vrei să returnezi o listă de cărți)
        List<Book> books = bookRepository.findAll();  // presupunând că ai un repository pentru cărți

        // Creăm un obiect JSON care va conține datele relevante
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Acces la dashboard permis pentru bibliotecar.");
        response.put("books", books);  // înlocuiește cu lista reală de cărți

        return ResponseEntity.ok(response);
    }



    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }


    @GetMapping("/me/theme")
    public ResponseEntity<Map<String, String>> getUserThemePreference() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        String themePreference = user.getThemePreference() != null ? user.getThemePreference() : "light";

        Map<String, String> response = new HashMap<>();
        response.put("themePreference", themePreference);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/theme")
    public ResponseEntity<?> updateUserThemePreference(@RequestBody Map<String, String> body) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        String newTheme = body.get("themePreference");
        if (!"light".equalsIgnoreCase(newTheme) && !"dark".equalsIgnoreCase(newTheme)) {
            return ResponseEntity.badRequest().body("Valoarea pentru themePreference trebuie să fie 'light' sau 'dark'.");
        }

        user.setThemePreference(newTheme.toLowerCase());
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }


    @GetMapping("/pending-approval")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<List<User>> getUsersPendingApproval() {
        List<User> usersPending = userRepository.findByStatus(UserStatus.PENDING_APPROVAL);
        return ResponseEntity.ok(usersPending);
    }

    @GetMapping("/confirm-email")
    public ResponseEntity<Map<String, Object>> confirmEmail(@RequestParam String token) {
        Map<String, Object> response = new HashMap<>();

        // Caută utilizatorul după token
        Optional<User> userOptional = userRepository.findByEmailConfirmationToken(token);

        if (userOptional.isEmpty()) {
            response.put("success", false);
            response.put("message", "Token invalid sau expirat.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        User user = userOptional.get();

        // Verifică dacă emailul a fost deja confirmat
        if (user.getStatus() == UserStatus.PENDING_APPROVAL || user.getStatus() == UserStatus.ACTIVE) {
            response.put("success", true);
            response.put("message", "Email deja confirmat! Așteaptă aprobarea bibliotecarului.");
            return ResponseEntity.ok(response);
        }

        // Confirmă emailul doar dacă statusul este PENDING_EMAIL_CONFIRMATION
        if (user.getStatus() == UserStatus.PENDING_EMAIL_CONFIRMATION) {
            user.setStatus(UserStatus.PENDING_APPROVAL);
            user.setEmailConfirmed(true);
            // NU șterge token-ul încă - îl vei șterge când contul e aprobat
            // user.setEmailConfirmationToken(null);
            userRepository.save(user);

            // Trimite notificare către bibliotecar
            notificationService.notifyLibrarianOfPendingUser(user);
        }

        response.put("success", true);
        response.put("message", "Email confirmat cu succes! Așteaptă aprobarea bibliotecarului.");
        return ResponseEntity.ok(response);
    }


    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<String> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            return ResponseEntity.badRequest().body("Utilizatorul nu este în așteptare pentru aprobare.");
        }

        user.setStatus(UserStatus.ACTIVE);
        // Acum șterge token-ul după aprobare
        user.setEmailConfirmationToken(null);
        userRepository.save(user);

        // Trimite email cu cardul bibliotecii
        notificationService.sendLibraryCardToUser(user);

        return ResponseEntity.ok("Utilizator aprobat și notificat.");
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<String> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilizatorul nu a fost găsit."));

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            return ResponseEntity.badRequest().body("Utilizatorul nu este în așteptare pentru aprobare.");
        }

        user.setStatus(UserStatus.REJECTED);
        user.setEmailConfirmationToken(null);
        userRepository.save(user);

        // Notifică utilizatorul că a fost refuzat
        emailService.sendEmail(
                user.getEmail(),
                "Cererea ta a fost respinsă",
                "Ne pare rău, dar cererea ta de acces la platformă a fost respinsă. Pentru detalii, contactează biblioteca."
        );

        return ResponseEntity.ok("Utilizator respins și notificat.");
    }


    // ==========================================
    // ACTUALIZARE PAROLĂ
    // ==========================================
    @PutMapping("/change-password/{id}")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwords) {
        // 1. Obține utilizatorul autentificat curent
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Trebuie să fii autentificat.");
        }

        // 2. Găsește utilizatorul în baza de date
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilizatorul nu a fost găsit.");
        }

        User user = userOptional.get();

        // 3. Măsură de securitate: Asigură-te că userul conectat își schimbă propria parolă
        // (Asta previne un user să schimbe parola altui user modificând ID-ul în URL)
        String currentPrincipalName = authentication.getName();
        if (!user.getUsername().equals(currentPrincipalName) && !user.getLibraryCardNumber().equals(currentPrincipalName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nu ai permisiunea să schimbi această parolă.");
        }

        // 4. Extrage parolele din body-ul cererii (JSON)
        String oldPassword = passwords.get("oldPassword");
        String newPassword = passwords.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Parola veche și parola nouă sunt obligatorii.");
        }

        // 5. Verifică dacă parola veche este corectă
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parola curentă este incorectă!");
        }

        // 6. Setează și criptează noua parolă
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok("Parola a fost schimbată cu succes.");
    }


    // ==========================================
    // ACTUALIZARE DATE PERSONALE (Securizat)
    // ==========================================
    @PutMapping("/update/{id}")
    public ResponseEntity<String> updatePersonalInfo(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Trebuie să fii autentificat.");
        }

        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilizatorul nu a fost găsit.");
        }

        User user = userOptional.get();

        String currentPrincipalName = authentication.getName();
        if (!user.getUsername().equals(currentPrincipalName) && !user.getLibraryCardNumber().equals(currentPrincipalName)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nu ai permisiunea să modifici acest profil.");
        }

        // --- SCUT DE SECURITATE: Verificarea parolei curente ---
        String currentPassword = updates.get("currentPassword");
        if (currentPassword == null || currentPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Parola curentă este obligatorie pentru a face modificări.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Parola curentă este incorectă! Modificările au fost blocate.");
        }
        // --------------------------------------------------------

        String newUsername = updates.get("username");
        String newEmail = updates.get("email");

        // Validare: Verifică dacă noul username este deja luat de ALT utilizator
        if (newUsername != null && !newUsername.equals(user.getUsername())) {
            if (userRepository.findByUsername(newUsername).isPresent()) {
                return ResponseEntity.badRequest().body("Acest nume de utilizator este deja folosit.");
            }
            user.setUsername(newUsername);
        }

        // Validare simplă și actualizare email
        if (newEmail != null && !newEmail.isBlank()) {
            user.setEmail(newEmail);
        }

        userRepository.save(user);

        return ResponseEntity.ok("Datele au fost actualizate cu succes.");
    }
    // ==========================================
    // 1. SOLICITARE RESETARE PAROLĂ (Generare Token + Email)
    // ==========================================
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // Best practice de securitate: Nu confirmăm dacă emailul există sau nu hackerilor.
            return ResponseEntity.ok("Dacă adresa de email există în sistemul nostru, vei primi un link de resetare.");
        }

        User user = userOptional.get();

        // Generare token unic securizat
        String token = java.util.UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1)); // Expiră într-o oră
        userRepository.save(user);

        // Trimitere email
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        emailService.sendEmail(
                user.getEmail(),
                "Resetare Parolă - Biblioteca Ta",
                "Salut,\n\nAi solicitat resetarea parolei.\nAccesează acest link pentru a seta o parolă nouă (link-ul expiră într-o oră):\n" + resetLink + "\n\nDacă nu ai solicitat tu asta, ignoră acest mesaj."
        );

        return ResponseEntity.ok("Dacă adresa de email există în sistemul nostru, vei primi un link de resetare.");
    }

    // ==========================================
    // 2. SETARE PAROLĂ NOUĂ (Validare Token + Salvare DB)
    // ==========================================
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Date incomplete.");
        }

        Optional<User> userOptional = userRepository.findByResetPasswordToken(token);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token-ul este invalid sau nu există.");
        }

        User user = userOptional.get();

        // Verificăm dacă token-ul a expirat
        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Token-ul a expirat. Te rugăm să soliciți o nouă resetare.");
        }

        // Setăm noua parolă (criptată) și ștergem token-ul
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok("Parola a fost resetată cu succes!");
    }
}




