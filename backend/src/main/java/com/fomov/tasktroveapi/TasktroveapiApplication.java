package com.fomov.tasktroveapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TasktroveapiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TasktroveapiApplication.class, args);
	}

}
