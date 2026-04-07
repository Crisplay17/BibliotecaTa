package com.example.BibliotecaTa.Notification;

import com.example.BibliotecaTa.BookLoan.Loan;
import com.example.BibliotecaTa.BookLoan.LoanRepository;
import com.example.BibliotecaTa.BookLoan.LoanStatus;
import com.example.BibliotecaTa.User.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    public JavaMailSender mailSender;

    @Autowired
    private LoanRepository loanRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Trimite o notificare pe email.
     *
     * @param toEmail Destinatarul emailului.
     * @param subject Subiectul emailului.
     * @param body    Conținutul emailului.
     */
    public void sendReminder(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Eroare la trimiterea emailului: " + e.getMessage());
        }
    }

    /**
     * Verifică împrumuturile întârziate și trimite notificări (Zilnic la ora 9).
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void sendUpcomingDueDateReminders() {
        List<Loan> activeLoans = loanRepository.findByStatus(LoanStatus.APPROVED);
        LocalDate today = LocalDate.now();

        for (Loan loan : activeLoans) {
            if (loan.getReturnDate() == null) continue;

            LocalDate dueDate = loan.getReturnDate().toLocalDate();
            long daysLeft = ChronoUnit.DAYS.between(today, dueDate);

            if (daysLeft == 3 || daysLeft == 2 || daysLeft == 1) {
                sendReminder(
                        loan.getUser().getEmail(),
                        "Atenție: cartea trebuie returnată în " + daysLeft + " zile!",
                        String.format("Bună %s,\n\nCartea '%s' trebuie returnată până pe %s.\nTe rugăm să respecți termenul pentru a evita penalizările.\n\nMulțumim!",
                                loan.getUser().getUsername(),
                                loan.getBook().getTitle(),
                                dueDate.toString())
                );
            } else if (daysLeft < 0) {
                // Dacă vrei să trimiți email și când a întârziat deja
                sendLoanStatusNotification(loan.getUser().getEmail(), loan.getBook().getTitle(), "OVERDUE");
            }
        }
    }

    /**
     * Metoda centralizată pentru notificări de status.
     * Acoperă toate scenariile (PENDING, APPROVED, DENIED, RETURNED, RESERVED, AVAILABLE_FOR_PICKUP, OVERDUE).
     */
    public void sendLoanStatusNotification(String userEmail, String bookTitle, String status) {
        String subject = "";
        String body = "";

        switch (status.toUpperCase()) {
            case "PENDING":
                subject = "Cererea ta de împrumut a fost trimisă";
                body = String.format("Bună ziua,\n\nCererea ta pentru cartea '%s' a fost înregistrată cu succes și este în așteptarea aprobării unui bibliotecar.\n\nMulțumim!", bookTitle);
                break;

            case "APPROVED":
                subject = "Împrumut activat / aprobat!";
                body = String.format("Bună ziua,\n\nÎmprumutul tău pentru cartea '%s' este acum activ. Te rugăm să verifici în contul tău data de returnare.\n\nLectură plăcută!", bookTitle);
                break;

            case "DENIED":
                subject = "Cererea ta de împrumut a fost respinsă";
                body = String.format("Bună ziua,\n\nNe pare rău, dar cererea ta pentru cartea '%s' a fost respinsă. Poți verifica detaliile în contul tău.\n\nMulțumim pentru înțelegere!", bookTitle);
                break;

            case "AVAILABLE_FOR_PICKUP":
                subject = "Cartea te așteaptă la bibliotecă!";
                body = String.format("Bună ziua,\n\nCartea '%s' este acum disponibilă și pregătită pentru tine. Te așteptăm la bibliotecă să o ridici în cel mai scurt timp.\n\nLectură plăcută!", bookTitle);
                break;

            case "RESERVED":
                subject = "Rezervarea ta a fost confirmată";
                body = String.format("Bună ziua,\n\nRezervarea ta pentru cartea '%s' a fost înregistrată cu succes. Te vom notifica imediat ce cartea va deveni disponibilă pentru ridicare.\n\nMulțumim!", bookTitle);
                break;

            case "RETURNED":
                subject = "Confirmare returnare carte";
                body = String.format("Bună ziua,\n\nÎți confirmăm că ai returnat cu succes cartea '%s'. Îți mulțumim!\n\nTe mai așteptăm pe la noi pentru noi lecturi!", bookTitle);
                break;

            case "OVERDUE":
                subject = "Atenție: Împrumut întârziat!";
                body = String.format("Bună ziua,\n\nTermenul de returnare pentru cartea '%s' a fost depășit! Te rugăm să o returnezi cât mai curând posibil la bibliotecă.\n\nMulțumim!", bookTitle);
                break;

            default:
                return; // Nu trimitem email dacă statusul este necunoscut
        }

        sendReminder(userEmail, subject, body);
    }

    // =========================================================================
    // METODE VECHI (Păstrate pentru compatibilitate cu LoanController)
    // Le poți șterge treptat dacă înlocuiești apelurile în controller cu
    // sendLoanStatusNotification(email, titlu, "PENDING") etc.
    // =========================================================================

    public void sendLoanRequestNotification(String userEmail, String bookTitle) {
        sendLoanStatusNotification(userEmail, bookTitle, "PENDING");
    }

    public void sendReserveNotification(String userEmail, String bookTitle) {
        sendLoanStatusNotification(userEmail, bookTitle, "RESERVED");
    }

    public void notifyLibrarianOfPendingUser(User user) {
        String subject = "Utilizator nou în așteptarea aprobării";
        String body = String.format(
                "Utilizatorul %s (%s) a confirmat adresa de email și așteaptă aprobare pentru activare.\n\nVerifică în dashboard-ul aplicației.",
                user.getUsername(), user.getEmail()
        );

        sendReminder(fromEmail, subject, body);
    }

    public void sendLibraryCardToUser(User user) {
        String subject = "Cont activat - Cardul tău de bibliotecă";
        String body = String.format(
                "Bună %s,\n\nContul tău a fost aprobat și activat! Poți începe să folosești serviciile Bibliotecii.\n\nNumărul tău de card: %s\n\nÎți mulțumim!",
                user.getUsername(), user.getLibraryCardNumber()
        );

        sendReminder(user.getEmail(), subject, body);
    }
}