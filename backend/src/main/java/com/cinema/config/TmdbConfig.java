package com.cinema.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class TmdbConfig {

    @Value("${tmdb.api.url}")
    private String apiUrl;

    @Value("${tmdb.api.token}")
    private String apiToken;

    @Value("${tmdb.api.image-base-url}")
    private String imageBaseUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public String getApiToken() {
        return apiToken;
    }

    public String getImageBaseUrl() {
        return imageBaseUrl;
    }
}
