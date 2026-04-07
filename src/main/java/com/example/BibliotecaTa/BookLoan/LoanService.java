package com.example.BibliotecaTa.BookLoan;

import com.example.BibliotecaTa.Book.Book;
import com.example.BibliotecaTa.Book.BookRepository;
import com.example.BibliotecaTa.Notification.NotificationService;
import com.example.BibliotecaTa.User.User;
import com.example.BibliotecaTa.User.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Creează un împrumut nou dacă utilizatorul și cartea există și nu are deja un împrumut activ.
     */
    public Loan createLoan(Long userId, Long bookId, int loanDuration) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilizatorul nu a fost găsit."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Cartea nu a fost găsită."));

        boolean hasActiveLoan = loanRepository
                .findByUserIdAndBookIdAndApprovedTrueAndReturnedFalse(userId, bookId)
                .isPresent();
        if (hasActiveLoan) {
            throw new RuntimeException("Ai deja un împrumut activ pentru această carte.");
        }

        if (book.getTotalCopies() <= 0) {
            throw new RuntimeException("Nu mai există exemplare disponibile pentru această carte.");
        }

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBook(book);
        loan.setLoanDate(LocalDateTime.now());
        loan.setLoanDuration(loanDuration);
        loan.setStatus(LoanStatus.PENDING);
        loan.setReturnDate(loan.calculateReturnDate(loanDuration)); // Data estimativă de returnare

        // Scădem o copie disponibilă când se face cererea
        book.setTotalCopies(book.getTotalCopies() - 1);
        updateBookAvailability(book);

        bookRepository.save(book);
        return loanRepository.save(loan);
    }


    /**
     * Returnează un împrumut (setează data returnării și actualizează stocul cărții).
     */
    public Loan returnLoan(Long loanId) {
        return loanRepository.findById(loanId).map(loan -> {
            loan.setReturnDate(LocalDateTime.now());
            loan.setStatus(LoanStatus.RETURNED);

            Book book = loan.getBook();
            // Adaugă înapoi exemplarul când se returnează fizic cartea
            book.setTotalCopies(book.getTotalCopies() + 1);
            updateBookAvailability(book);

            bookRepository.save(book);
            return loanRepository.save(loan);
        }).orElseThrow(() -> new RuntimeException("Împrumutul nu a fost găsit."));
    }

    public int countActiveLoansByBookId(Long bookId) {
        return loanRepository.countActiveLoansByBookId(bookId);
    }

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public List<Loan> getLoansByUser(Long userId) {
        return loanRepository.findByUserId(userId);
    }

    public List<Loan> getUnreturnedLoans() {
        return loanRepository.findByReturnDateIsNull();
    }

    /**
     * Trimite notificări pentru împrumuturile restante (expirate).
     */
    public void notifyOverdueLoans() {
        List<Loan> overdueLoans = loanRepository.findAll().stream()
                .filter(loan -> loan.getStatus() == LoanStatus.APPROVED)
                .filter(loan -> loan.getReturnDate() != null && loan.getReturnDate().isBefore(LocalDateTime.now()))
                .collect(Collectors.toList());

        for (Loan loan : overdueLoans) {
            User user = loan.getUser();
            Book book = loan.getBook();

            String subject = "Împrumut întârziat";
            String message = String.format("""
                Cartea "%s" trebuia returnată până la data de %s.
                Te rugăm să o returnezi cât mai curând posibil la bibliotecă.
                """, book.getTitle(), loan.getReturnDate().toLocalDate());

            notificationService.sendReminder(user.getEmail(), subject, message);
        }
    }

    /**
     * Rulează zilnic la ora 09:00 și trimite notificări pentru împrumuturile restante.
     */
    @Scheduled(cron = "0 16 23 * * ?")
    public void checkAndNotifyOverdueLoans() {
        notifyOverdueLoans();
    }

    public boolean hasActiveLoan(Long userId, Long bookId) {
        return loanRepository.findByUserIdAndBookIdAndApprovedTrueAndReturnedFalse(userId, bookId).isPresent();
    }

    @Scheduled(cron = "0 0 0 * * ?") // rulează la miezul nopții
    public void expireOldReservations() {
        LocalDateTime limit = LocalDateTime.now().minusDays(2);
        List<Loan> pickups = loanRepository.findByStatus(LoanStatus.AVAILABLE_FOR_PICKUP);

        for (Loan r : pickups) {
            if (r.getLoanDate().isBefore(limit)) {
                r.setStatus(LoanStatus.EXPIRED);
                loanRepository.save(r);

                notificationService.sendLoanStatusNotification(
                        r.getUser().getEmail(),
                        r.getBook().getTitle(),
                        "EXPIRED"
                );
            }
        }
    }

    /**
     * Actualizează câmpul available al unei cărți pe baza numărului de copii.
     */
    private void updateBookAvailability(Book book) {
        book.setAvailable(book.getTotalCopies() > 0);
    }
}
