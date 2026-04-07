package com.example.BibliotecaTa.Book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContainingIgnoreCase(String title);
    List<Book> findByAuthorContainingIgnoreCase(String author);
    // Adaugă această metodă pentru a obține toate cărțile
    List<Book> findAll();
    Optional<Book> findById(Long id); // Aceasta este deja disponibilă prin JpaRepository
}
