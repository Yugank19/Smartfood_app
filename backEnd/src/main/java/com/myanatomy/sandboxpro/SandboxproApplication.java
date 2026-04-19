package com.myanatomy.sandboxpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SandboxproApplication {

	public static void main(String[] args) {
		SpringApplication.run(SandboxproApplication.class, args);
	}

}
