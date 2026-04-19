package com.apluscafe.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean enabled = false;

    @PostConstruct
    public void init() {
        if (cloudName != null && !cloudName.isEmpty()
                && apiKey != null && !apiKey.isEmpty()
                && apiSecret != null && !apiSecret.isEmpty()) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            enabled = true;
            log.info("Cloudinary integration enabled");
        } else {
            log.info("Cloudinary not configured - using local file storage");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String uploadImage(MultipartFile file) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "aplus-cafe/menu",
                "resource_type", "image"
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Image uploaded to Cloudinary: {}", secureUrl);
        return secureUrl;
    }

    public void deleteImage(String publicId) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        log.info("Image deleted from Cloudinary: {}", publicId);
    }
}
