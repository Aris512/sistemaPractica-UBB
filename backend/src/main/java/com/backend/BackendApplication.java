package com.backend;

import com.backend.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		DotenvLoader.load();
		SpringApplication.run(BackendApplication.class, args);
	}

}
