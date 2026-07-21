package com.bridge.macbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class MacBridgeApplication {

	public static void main(String[] args) {
		SpringApplication.run(MacBridgeApplication.class, args);
	}

}
