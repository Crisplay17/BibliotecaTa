package com.example.BibliotecaTa.BookLoan;

import com.example.BibliotecaTa.Book.Book;
import com.example.BibliotecaTa.Book.BookRepository;
import com.example.BibliotecaTa.Notification.NotificationService;
import com.example.BibliotecaTa.Security.JwtTokenProvider;
import com.example.BibliotecaTa.User.User;
import com.example.BibliotecaTa.User.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

// Controller pentru gestionarea imprumuturilor
@RestController
@RequestMapping("/loans")
public class LoanController {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private LoanService loanService;
    @Autowired
    private LoanRepository loanRepository;
    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;
    @Autowired
    private BookRepository bookRepository;




    @PostMapping("/create")
    public ResponseEntity<Loan> createLoan(@RequestParam Long userId, @RequestParam Long bookId, @RequestParam int loanDuration) {
        // Creăm împrumutul cu loanDuration
        Loan loan = loanService.createLoan(userId, bookId, loanDuration);

        return ResponseEntity.ok(loan);
    }



    @GetMapping("")
    public ResponseEntity<List<Map<String, Object>>> getAllLoans(@RequestHeader("Authorization") String token) {
        String username = extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);

        if (user == null || !user.getRole().equals("BIBLIOTECAR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
        }

        List<Loan> loans = loanService.getAllLoans();

        List<Map<String, Object>> loanDetails = loans.stream()
                .map(loan -> {
                    Map<String, Object> loanInfo = new HashMap<>();
                    loanInfo.put("id", loan.getId());
                    loanInfo.put("loanDate", loan.getLoanDate());
                    loanInfo.put("returnDate", loan.getReturnDate());
                    loanInfo.put("loanDuration", loan.getLoanDuration());
                    loanInfo.put("status", loan.getStatus());
                    loanInfo.put("approved", loan.isApproved());

                    // Include detalii despre carte
                    Book book = loan.getBook();
                    Map<String, Object> bookInfo = new HashMap<>();
                    bookInfo.put("id", book.getId());
                    bookInfo.put("title", book.getTitle());
                    bookInfo.put("author", book.getAuthor());
                    bookInfo.put("coverImage", "http://localhost:8080/books/image/" + book.getId());
                    loanInfo.put("book", bookInfo);

                    // Include detalii despre utilizator
                    User loanUser = loan.getUser();
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", loanUser.getId());
                    userInfo.put("username", loanUser.getUsername());
                    userInfo.put("email", loanUser.getEmail());
                    userInfo.put("profileImage", "http://localhost:8080/users/getProfilePicture/" + loanUser.getId());
                    loanInfo.put("user", userInfo);

                    return loanInfo;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(loanDetails);
    }




    @PostMapping("/request")
    public synchronized ResponseEntity<Map<String, String>> requestLoan(
            @RequestBody Loan loanRequest,
            @RequestHeader("Authorization") String token) {

        String username = extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        Long bookId = loanRequest.getBook().getId();
        Optional<Book> bookOpt = bookRepository.findById(bookId);

        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Cartea nu a fost găsită."));
        }

        Book book = bookOpt.get();

        // Verifică disponibilitatea înainte de a face cererea
        if (book.getTotalCopies() == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Nu mai există exemplare disponibile pentru această carte."));
        }

        // Verifică dacă utilizatorul are deja un împrumut activ sau cerere PENDING pentru această carte
        boolean hasActiveLoan = loanRepository.existsByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.PENDING)
                || loanRepository.existsByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.APPROVED);

        if (hasActiveLoan) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Ai deja un împrumut activ pentru această carte."));
        }

        // Creează împrumutul prin LoanService (care scade totalCopies)
        Loan loan = loanService.createLoan(user.getId(), bookId, loanRequest.getLoanDuration());

        // Trimite notificare bibliotecar
        notificationService.sendLoanRequestNotification(user.getEmail(), book.getTitle());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Cererea de împrumut a fost trimisă.");
        return ResponseEntity.ok(response);
    }









    @PostMapping("/approve/{loanId}")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<?> approveLoan(@PathVariable Long loanId) {
        Optional<Loan> loanOptional = loanRepository.findById(loanId);

        if (!loanOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Împrumutul nu a fost găsit.");
        }

        Loan loan = loanOptional.get();

        if (loan.getStatus().equals(LoanStatus.APPROVED)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Împrumutul a fost deja aprobat.");
        }

        if (loan.getStatus().equals(LoanStatus.DENIED)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Împrumutul a fost deja refuzat.");
        }

        if (loan.getStatus().equals(LoanStatus.PENDING)) {
            loan.setStatus(LoanStatus.APPROVED);
            loan.setApproved(true);

            // --- AICI ESTE MODIFICAREA ---
            // 1. Resetăm data de început a împrumutului la momentul exact al aprobării
            loan.setLoanDate(LocalDateTime.now());

            // 2. Acum calculăm data de returnare pornind de la momentul aprobării
            LocalDateTime returnDate = loan.getLoanDate().plusDays(loan.getLoanDuration());
            loan.setReturnDate(returnDate);
            // -----------------------------

            loanRepository.save(loan);

            notificationService.sendLoanStatusNotification(
                    loan.getUser().getEmail(),
                    loan.getBook().getTitle(),
                    loan.getStatus().name()
            );

            // Returnează Loan-ul actualizat ca JSON
            return ResponseEntity.ok(loan);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Împrumutul nu poate fi aprobat în acest moment.");
        }
    }




    @DeleteMapping("/deny/{loanId}")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<?> denyLoan(@PathVariable Long loanId) {
        Optional<Loan> loanOptional = loanRepository.findById(loanId);

        if (loanOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Împrumutul nu a fost găsit.");
        }

        Loan loan = loanOptional.get();

        notificationService.sendLoanStatusNotification(
                loan.getUser().getEmail(),
                loan.getBook().getTitle(),
                "DENIED"
        );

        if (loan.getStatus().equals(LoanStatus.PENDING)) {
            Book book = loan.getBook();

            // ✅ DOAR adaugă înapoi exemplarul în totalCopies
            // (pentru că a fost deja scăzut când s-a făcut cererea)
            book.setTotalCopies(book.getTotalCopies() + 1);
            book.setAvailable(book.getTotalCopies() > 0);
            bookRepository.save(book);

            // Șterge împrumutul din baza de date
            loanRepository.deleteById(loanId);

            return ResponseEntity.ok("Împrumutul a fost refuzat și șters din baza de date.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Împrumutul nu poate fi refuzat deoarece nu este în status PENDING.");
        }
    }



    public String extractUsernameFromToken(String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                return jwtTokenProvider.getUsernameFromToken(token.substring(7));
            }
            return null;
        } catch (Exception e) {
            // Loghează eroarea
            return null;
        }
    }



    @GetMapping("/status/{bookId}")
    public ResponseEntity<Map<String, String>> getLoanStatus(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bookId) {
        try {
            String username = extractUsernameFromToken(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("status", "UNAUTHORIZED"));
            }

            User user = userService.getUserByUsername(username);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("status", "NOT_FOUND"));
            }

            // Verifică PENDING
            if (loanRepository.findByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.PENDING).isPresent()) {
                return ResponseEntity.ok(Collections.singletonMap("status", "PENDING"));
            }

            // Verifică APPROVED sau OVERDUE
            Optional<Loan> approvedLoan = loanRepository.findByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.APPROVED);
            if (approvedLoan.isPresent()) {
                Loan loan = approvedLoan.get();
                if (loan.getReturnDate() != null && loan.getReturnDate().isBefore(LocalDateTime.now())) {
                    return ResponseEntity.ok(Collections.singletonMap("status", "OVERDUE"));
                }
                return ResponseEntity.ok(Collections.singletonMap("status", "APPROVED"));
            }

            // Verifică RESERVED ✅
            if (loanRepository.findByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.RESERVED).isPresent()) {
                return ResponseEntity.ok(Collections.singletonMap("status", "RESERVED"));
            }
            // Verifică AVAILABLE_FOR_PICKUP ✅
            if (loanRepository.findByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.AVAILABLE_FOR_PICKUP).isPresent()) {
                return ResponseEntity.ok(Collections.singletonMap("status", "AVAILABLE_FOR_PICKUP"));
            }

            // Verifică DENIED
            if (loanRepository.findByUserIdAndBookIdAndStatus(user.getId(), bookId, LoanStatus.DENIED).isPresent()) {
                return ResponseEntity.ok(Collections.singletonMap("status", "DENIED"));
            }

            return ResponseEntity.ok(Collections.singletonMap("status", "NONE"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("status", "ERROR"));
        }
    }





    @GetMapping("/check")
    public ResponseEntity<Boolean> checkActiveLoan(
            @RequestParam Long bookId,
            @RequestHeader("Authorization") String token) {

        String username = jwtTokenProvider.getUsernameFromToken(token);  // Extrage username-ul din token
        User user = userService.getUserByUsername(username);  // Găsește utilizatorul pe baza username-ului

        boolean hasActiveLoan = loanService.hasActiveLoan(user.getId(), bookId);

        return ResponseEntity.ok(hasActiveLoan);  // Returnăm direct boolean-ul
    }




    // Endpoint pentru returnare imprumut
    @PostMapping("/return/{loanId}")
    public ResponseEntity<Loan> returnLoan(@PathVariable Long loanId) {
        Loan returnedLoan = loanService.returnLoan(loanId); // Adaugă înapoi în totalCopies

        // 1. --- TRIMITE EMAIL DE CONFIRMARE RETURNARE UTILIZATORULUI CURENT ---
        notificationService.sendLoanStatusNotification(
                returnedLoan.getUser().getEmail(),
                returnedLoan.getBook().getTitle(),
                "RETURNED"
        );

        // 2. Verifică dacă există rezervări pentru carte
        List<Loan> reservations = loanRepository.findByBookIdAndStatus(returnedLoan.getBook().getId(), LoanStatus.RESERVED);

        if (!reservations.isEmpty()) {
            // Ia prima rezervare (FIFO)
            Loan reservation = reservations.get(0);
            reservation.setStatus(LoanStatus.AVAILABLE_FOR_PICKUP);
            loanRepository.save(reservation);

            // Trimite notificare următorului utilizator că poate ridica cartea
            notificationService.sendLoanStatusNotification(
                    reservation.getUser().getEmail(),
                    reservation.getBook().getTitle(),
                    "AVAILABLE_FOR_PICKUP"
            );
        }

        return ResponseEntity.ok(returnedLoan);
    }


    // Endpoint pentru listarea imprumuturilor unui utilizator specific
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Loan>> getLoansByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(loanService.getLoansByUser(userId));
    }

    // Endpoint pentru listarea imprumuturilor nepredate
    @GetMapping("/unreturned")
    public ResponseEntity<List<Loan>> getUnreturnedLoans() {
        return ResponseEntity.ok(loanService.getUnreturnedLoans());
    }


    @PostMapping("/notify-overdue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> notifyOverdueLoans() {
        loanService.notifyOverdueLoans();
        return ResponseEntity.ok("Overdue loan notifications sent");
    }


    @PostMapping("/reserve/{id}")
    public synchronized ResponseEntity<Map<String, String>> requestReservation(
            @RequestBody Loan reservationRequest,
            @RequestHeader("Authorization") String token) {

        String username = extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        Long bookId = reservationRequest.getBook().getId();
        Optional<Book> bookOpt = bookRepository.findById(bookId);

        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Cartea nu a fost găsită."));
        }

        Book book = bookOpt.get();

        // Pentru rezervări, verifică dacă mai sunt exemplare disponibile
        if (book.getTotalCopies() > 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Cartea este disponibilă. Poți face un împrumut."));
        }

        // ✅ VERIFICĂ TOATE STATUSURILE ACTIVE (împrumuturi + rezervări)
        boolean hasActiveRequest = loanRepository.existsByUserIdAndBookIdAndStatusIn(
                user.getId(),
                bookId,
                List.of(LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.RESERVED, LoanStatus.AVAILABLE_FOR_PICKUP)
        );

        if (hasActiveRequest) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Ai deja o cerere activă (împrumut sau rezervare) pentru această carte."));
        }

        // Creează rezervarea (nu se scade din totalCopies pentru rezervări)
        Loan reservation = new Loan();
        reservation.setStatus(LoanStatus.RESERVED);
        reservation.setLoanDuration(0);
        reservation.setUser(user);
        reservation.setBook(book);
        reservation.setLoanDate(LocalDateTime.now());

        loanRepository.save(reservation);

        // Trimite notificare
        notificationService.sendReserveNotification(user.getEmail(), book.getTitle());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Rezervarea a fost creată cu succes.");
        return ResponseEntity.ok(response);
    }





    @PostMapping("/pickup/{reservationId}")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<?> confirmPickup(@PathVariable Long reservationId) {
        Optional<Loan> reservationOpt = loanRepository.findById(reservationId);

        if (reservationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rezervarea nu a fost găsită.");
        }

        Loan reservation = reservationOpt.get();

        if (!reservation.getStatus().equals(LoanStatus.AVAILABLE_FOR_PICKUP)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Rezervarea nu este disponibilă pentru ridicare.");
        }

        // Marchează ca împrumut activ
        reservation.setStatus(LoanStatus.APPROVED);
        reservation.setApproved(true);
        reservation.setLoanDate(LocalDateTime.now());
        reservation.setLoanDuration(14); // ex: 2 săptămâni default
        reservation.setReturnDate(reservation.getLoanDate().plusDays(reservation.getLoanDuration()));

        loanRepository.save(reservation);

        notificationService.sendLoanStatusNotification(
                reservation.getUser().getEmail(),
                reservation.getBook().getTitle(),
                "APPROVED"
        );

        return ResponseEntity.ok(reservation);
    }

    @DeleteMapping("/reservation/{reservationId}")
    public ResponseEntity<?> cancelReservation(@PathVariable Long reservationId,
                                               @RequestHeader("Authorization") String token) {
        String username = extractUsernameFromToken(token);
        User user = userService.getUserByUsername(username);

        Optional<Loan> reservationOpt = loanRepository.findById(reservationId);

        if (reservationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rezervarea nu a fost găsită.");
        }

        Loan reservation = reservationOpt.get();

        if (!reservation.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Nu poți anula rezervarea altui utilizator.");
        }

        if (!(reservation.getStatus().equals(LoanStatus.RESERVED) ||
                reservation.getStatus().equals(LoanStatus.AVAILABLE_FOR_PICKUP))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Rezervarea nu poate fi anulată acum.");
        }

        loanRepository.delete(reservation);

        return ResponseEntity.ok("Rezervarea a fost anulată cu succes.");
    }

    @PostMapping("/mark-available/{reservationId}")
    @PreAuthorize("hasRole('BIBLIOTECAR')")
    public ResponseEntity<?> markAvailableForPickup(@PathVariable Long reservationId) {
        Optional<Loan> reservationOpt = loanRepository.findById(reservationId);

        if (reservationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Rezervarea nu a fost găsită.");
        }

        Loan reservation = reservationOpt.get();

        if (!reservation.getStatus().equals(LoanStatus.RESERVED)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Doar rezervările pot fi marcate ca disponibile pentru ridicare.");
        }

        // schimbăm statusul
        reservation.setStatus(LoanStatus.AVAILABLE_FOR_PICKUP);
        loanRepository.save(reservation);

        // trimitem notificare
        notificationService.sendLoanStatusNotification(
                reservation.getUser().getEmail(),
                reservation.getBook().getTitle(),
                "AVAILABLE_FOR_PICKUP"
        );

        return ResponseEntity.ok(reservation);
    }



}

