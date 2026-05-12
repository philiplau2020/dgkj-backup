package com.dgkj.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.dgkj.server.mapper")
public class DgkjServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DgkjServerApplication.class, args);
    }
}
