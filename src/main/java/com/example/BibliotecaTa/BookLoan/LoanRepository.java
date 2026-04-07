package com.example.BibliotecaTa.BookLoan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserId(Long userId);
    List<Loan> findByBookId(Long bookId);
    List<Loan> findByReturnDateIsNull();
    @Query("SELECT l FROM Loan l WHERE l.user.id = :userId AND l.book.id = :bookId AND l.approved = false AND l.returnDate IS NULL")
    Optional<Loan> findByUserIdAndBookIdAndApprovedTrueAndReturnedFalse(Long userId, Long bookId);
    int countActiveLoansByBookId(@Param("bookId") Long bookId);
    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, LoanStatus status);
    Optional<Loan> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, LoanStatus status);

    List<Loan> findByStatus(LoanStatus loanStatus);

    List<Loan> findByBookIdAndStatus(Long id, LoanStatus loanStatus);

    int countByBookIdAndStatusIn(Long bookId, List<LoanStatus> pending);

    int countByBookIdAndStatus(Long bookId, LoanStatus loanStatus);

    boolean existsByUserIdAndBookIdAndStatusIn(Long id, Long bookId, List<LoanStatus> reserved);
}
