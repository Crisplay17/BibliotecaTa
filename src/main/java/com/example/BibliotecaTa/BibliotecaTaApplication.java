package com.example.BibliotecaTa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class BibliotecaTaApplication {

	public static void main(String[] args) {
		SpringApplication.run(BibliotecaTaApplication.class, args);
	}

}
