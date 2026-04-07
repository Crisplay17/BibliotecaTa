package com.example.BibliotecaTa.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Injectează PasswordEncoder prin constructor
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }


    @Override
    public UserDetails loadUserByUsername(String principal) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByUsername(principal);

        boolean searchedByLibraryCard = false;
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByLibraryCardNumber(principal);
            searchedByLibraryCard = true;
        }

        User user = userOptional.orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Dacă s-a folosit username, permită doar ADMIN sau BIBLIOTECAR
        if (!searchedByLibraryCard && !(user.getRole().equalsIgnoreCase("ADMIN") || user.getRole().equalsIgnoreCase("BIBLIOTECAR"))) {
            throw new UsernameNotFoundException("Autentificare permisă doar pentru admini și bibliotecari cu username.");
        }

        // Dacă s-a folosit libraryCardNumber, permită orice rol (inclusiv USER)

        return new org.springframework.security.core.userdetails.User(
                principal,
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }




    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User getUserByUsername(String principal) {
        Optional<User> userOpt = userRepository.findByUsername(principal);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByLibraryCardNumber(principal);
        }
        return userOpt.orElse(null);
    }



    public void updateProfilePicture(Long userId, MultipartFile file) throws IOException {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (!optionalUser.isPresent()) {
            throw new RuntimeException("Utilizatorul nu a fost găsit.");
        }
        User user = optionalUser.get();

        // Convertim fișierul într-un array de bytes
        byte[] imageBytes = file.getBytes();

        // Setăm imaginea în entitatea User
        user.setProfilePicture(imageBytes);

        // Salvăm utilizatorul cu noua poză de profil
        userRepository.save(user);
    }

    public boolean deleteProfilePicture(Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getProfilePicture() != null && user.getProfilePicture().length > 0) {
                // Șterge fișierul (poza de profil) - depinde de cum ai salvat imaginea (de exemplu, în filesystem sau în baza de date)
                user.setProfilePicture(null);  // Dacă imaginea este stocată direct în User entity
                userRepository.save(user);  // Salvează utilizatorul după modificare
                return true;
            }
        }
        return false;
    }


    public byte[] getProfilePictureById(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (!optionalUser.isPresent() || optionalUser.get().getProfilePicture() == null) {
            return null;  // Dacă nu există poză de profil, returnăm null
        }
        return optionalUser.get().getProfilePicture();  // Returnăm array-ul de bytes al pozei
    }



    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User confirmEmailToken(String token) {
        // Validare input
        if (token == null || token.trim().isEmpty()) {
            System.out.println("Token null sau vid");
            return null;
        }

        System.out.println("Verificare token de confirmare: " + token);

        Optional<User> userOptional = userRepository.findByEmailConfirmationToken(token);
        if (userOptional.isEmpty()) {
            System.out.println("Token nu a fost găsit în baza de date: " + token);
            return null;
        }

        User user = userOptional.get();
        System.out.println("Utilizator găsit: " + user.getUsername() + ", status actual: " + user.getStatus());

        // Verifică dacă emailul nu a fost deja confirmat
        if (user.getStatus() != UserStatus.PENDING_EMAIL_CONFIRMATION) {
            System.out.println("Emailul a fost deja confirmat pentru utilizatorul: " + user.getUsername());
            // Poți returna null sau să arunci o excepție customizată
            return null; // sau throw new IllegalStateException("Email already confirmed");
        }

        try {
            // Setează statusul la PENDING_APPROVAL după confirmare email
            user.setStatus(UserStatus.PENDING_APPROVAL);

            // Invalidează tokenul pentru securitate
            user.setEmailConfirmationToken(null);

            // Salvează modificările
            User savedUser = userRepository.save(user);
            System.out.println("Utilizator actualizat cu succes - nou status: " + savedUser.getStatus());

            return savedUser;

        } catch (Exception e) {
            System.err.println("Eroare la salvarea utilizatorului: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }



}
