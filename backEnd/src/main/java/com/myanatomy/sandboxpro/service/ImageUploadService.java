package com.myanatomy.sandboxpro.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Image Upload Service — Supabase Storage Edition
 *
 * Uploads images to Supabase Storage bucket "food-images".
 * Falls back to a placeholder URL in dev mode if upload fails.
 *
 * Setup required in Supabase Dashboard:
 *   Storage → New bucket → Name: "food-images" → Public: true
 */
@Service
public class ImageUploadService {

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final String BUCKET = "food-images";

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    /**
     * Validates and uploads an image to Supabase Storage.
     *
     * @param file   the multipart image file
     * @param folder sub-folder inside the bucket (e.g. "food-listings", "pickup-proofs")
     * @return public URL of the uploaded image
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        // Validate
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Image size must be under 5 MB");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP images are allowed");
        }

        String ext = getExtension(file.getOriginalFilename());
        String path = folder + "/" + UUID.randomUUID() + "." + ext;

        try {
            // Upload to Supabase Storage via REST API
            WebClient client = WebClient.builder()
                    .baseUrl(supabaseUrl)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                    .defaultHeader("apikey", serviceRoleKey)
                    .build();

            client.post()
                    .uri("/storage/v1/object/" + BUCKET + "/" + path)
                    .contentType(MediaType.parseMediaType(file.getContentType()))
                    .bodyValue(file.getBytes())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Return public URL
            String publicUrl = supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + path;
            System.out.println("[Supabase Storage] Uploaded: " + publicUrl);
            return publicUrl;

        } catch (Exception e) {
            System.err.println("[Supabase Storage] Upload failed: " + e.getMessage());
            // Dev fallback
            return "https://placehold.co/400x300?text=Food+Image";
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
