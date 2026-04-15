package com.apluscafe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AplusCafeApplication {

    public static void main(String[] args) {
        SpringApplication.run(AplusCafeApplication.class, args);
    }
}
