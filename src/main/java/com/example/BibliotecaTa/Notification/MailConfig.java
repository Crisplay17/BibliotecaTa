package com.example.BibliotecaTa.Notification;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com"); // Serverul SMTP (pentru Gmail)
        mailSender.setPort(587); // Portul pentru Gmail
        mailSender.setUsername("wificristi103@gmail.com"); // Adresa de expediere
        mailSender.setPassword("jvmxwbqdwyhkmmlp"); // Parola

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true"); // Activează log-urile pentru debugging

        return mailSender;
    }
}

