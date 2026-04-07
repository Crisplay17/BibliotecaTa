package com.example.BibliotecaTa.Notification;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender javaMailSender;

    // Injectarea JavaMailSender
    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    // Metoda pentru trimiterea unui email
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage simpleMessage = new SimpleMailMessage();
        simpleMessage.setTo(to);
        simpleMessage.setSubject(subject);
        simpleMessage.setText(body);
        simpleMessage.setFrom("wificristi103@gmail.com"); // Adresa de expediere

        // Trimiterea email-ului
        javaMailSender.send(simpleMessage);
    }
}
