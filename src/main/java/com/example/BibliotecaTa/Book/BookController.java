package com.example.BibliotecaTa.Book;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/books")
public class BookController {

    @Autowired
    private BookService bookService;


    // Obține toate cărțile
    @GetMapping("/all")
    public ResponseEntity<List<Book>> getAllBooks() {
        try {
            // Simulează o întârziere de 2 secunde
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        return ResponseEntity.ok(bookService.getAllBooks());
    }

    // Adaugă o carte nouă
    @PostMapping("/add")
    public ResponseEntity<?> addBook(@RequestParam("file") MultipartFile file,
                                     @RequestParam("title") String title,
                                     @RequestParam("author") String author,
                                     @RequestParam("category") String category,
                                     @RequestParam("isbn") String isbn,
                                     @RequestParam("publicationDate") String publicationDate,
                                     @RequestParam("description") String description,
                                     @RequestParam("available") boolean available,
                                     @RequestParam("totalCopies") int totalCopies) {
        try {
            // Verificăm tipul fișierului
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/png") && !contentType.equals("image/jpeg"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Fișierul trebuie să fie de tip PNG sau JPEG.");
            }

            // Convertim data publicării într-un LocalDate
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate parsedDate = LocalDate.parse(publicationDate, formatter);

            // Convertim fișierul într-un tablou de byte
            byte[] coverImage = file.getBytes();

            // Obținem data curentă ca data adăugării
            LocalDate addedDate = LocalDate.now();

            // Creăm un obiect Book cu addedDate inclus
            Book book = new Book(title, author, category, isbn, parsedDate, description, available, totalCopies, coverImage, addedDate);

            // Salvăm cartea
            bookService.addBook(book);

            return ResponseEntity.status(HttpStatus.CREATED).body(book);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Eroare la procesarea fișierului.");
        } catch (DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Formatul datei nu este valid. Folosiți formatul YYYY-MM-DD.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Eroare internă la procesarea cererii.");
        }
    }

    @PutMapping(value = "/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Book> updateBookWithFile(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("category") String category,
            @RequestParam("isbn") String isbn,
            @RequestParam("publicationDate") String publicationDate,
            @RequestParam("description") String description,
            @RequestParam("available") boolean available,
            @RequestParam("totalCopies") int totalCopies
    ) throws IOException {

        // Parsezi data
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate parsedDate = LocalDate.parse(publicationDate, formatter);

        // Dacă există fișier, îl prelucrezi, altfel îl păstrezi pe cel vechi
        byte[] coverImage = null;
        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/png") && !contentType.equals("image/jpeg"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            coverImage = file.getBytes();
        }

        // Obține cartea existentă
        Book existingBook = bookService.getBookById(id);
        if (existingBook == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        // Actualizează câmpurile
        existingBook.setTitle(title);
        existingBook.setAuthor(author);
        existingBook.setCategory(category);
        existingBook.setIsbn(isbn);
        existingBook.setPublicationDate(parsedDate);
        existingBook.setDescription(description);
        existingBook.setAvailable(available);
        existingBook.setTotalCopies(totalCopies);

        if (coverImage != null) {
            existingBook.setCoverImage(coverImage);
        }

        Book updated = bookService.updateBook(id, existingBook);

        return ResponseEntity.ok(updated);
    }

    @GetMapping(value = "/image/{id}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getBookCoverImage(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        byte[] image = book.getCoverImage();

        if (image == null || image.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Imaginea nu există pentru această carte.");
        }

        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(image);
    }


    // Actualizează o carte existentă
    @PutMapping("/update/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody Book updatedBook) {
        return ResponseEntity.ok(bookService.updateBook(id, updatedBook));
    }

    // Șterge o carte
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok("Book deleted successfully");
    }

    // Caută cărți după titlu
    @GetMapping("/search/title")
    public ResponseEntity<List<Book>> searchBooksByTitle(@RequestParam String title) {
        return ResponseEntity.ok(bookService.searchBooksByTitle(title));
    }

    // Caută cărți după autor
    @GetMapping("/search/author")
    public ResponseEntity<List<Book>> searchBooksByAuthor(@RequestParam String author) {
        return ResponseEntity.ok(bookService.searchBooksByAuthor(author));
    }

    // Obține o carte după ID
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }
}
