package com.example.BibliotecaTa.BookLoan;

import com.example.BibliotecaTa.Book.Book;
import com.example.BibliotecaTa.User.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Book book;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")  // Formatare pentru serializare corectă
    private LocalDateTime loanDate;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime returnDate;

    @Column(nullable = false)
    private boolean approved = false;  // Valoare implicită false

    @Column(nullable = false)
    private int loanDuration = 1;   // Durata împrumutului (în zile)

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private LoanStatus status;

    // Constructori
    public Loan() {}

    public Loan(User user, Book book, LocalDateTime loanDate, int loanDuration) {
        this.user = user;
        this.book = book;
        this.loanDate = loanDate;
        this.loanDuration = loanDuration;
        this.returnDate = calculateReturnDate(loanDuration);
    }

    public LocalDateTime calculateReturnDate(int loanDuration) {
        LocalDateTime actualLoanDate = (this.loanDate != null) ? this.loanDate : LocalDateTime.now(); // Folosește data curentă dacă loanDate este null
        return actualLoanDate.plusDays(loanDuration); // Calculează returnDate pe baza datei împrumutului
    }

    // Getters si setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public LocalDateTime getLoanDate() {
        return loanDate;
    }

    public void setLoanDate(LocalDateTime loanDate) {
        this.loanDate = loanDate;
    }

    public LocalDateTime getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDateTime returnDate) {
        this.returnDate = returnDate;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public int getLoanDuration() {
        return loanDuration;
    }

    public void setLoanDuration(int loanDuration) {
        if (loanDuration < 0) {
            throw new IllegalArgumentException("Loan duration must be 0 or more days.");
        }
        if (this.status != LoanStatus.RESERVED && loanDuration < 1) {
            throw new IllegalArgumentException("Loan duration must be at least 1 day for active loans.");
        }
        this.loanDuration = loanDuration;
        this.returnDate = calculateReturnDate(this.loanDuration);
    }


    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;

        if (status == LoanStatus.APPROVED) {
            if (this.loanDate == null) {
                this.loanDate = LocalDateTime.now();
            }
            this.returnDate = calculateReturnDate(this.loanDuration);
            this.approved = true;
        } else if (status == LoanStatus.DENIED) {
            this.approved = false;
            this.loanDate = null;
            this.returnDate = null;
        }
    }
}
