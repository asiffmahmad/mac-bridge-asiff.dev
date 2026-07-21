package com.bridge.macbridge.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.UUID;

/**
 * Manages a unique, stable Bridge ID for this Mac and publishes the current
 * Cloudflare tunnel URL to ntfy.sh so the phone can auto-discover it.
 *
 * Discovery Flow:
 *   Mac boots → Bridge starts → Cloudflare tunnel URL obtained
 *   → POST to https://ntfy.sh/<bridge_id>
 *   Phone opens app → old URL fails → GET https://ntfy.sh/<bridge_id>/json?poll=1
 *   → extracts new tunnel URL → resumes session transparently.
 */
@Service
public class BridgeDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(BridgeDiscoveryService.class);
    private static final String NTFY_BASE = "https://ntfy.sh/";

    private final Path bridgeIdFile;
    private String bridgeId;
    private String lastPublishedUrl;

    public BridgeDiscoveryService() {
        this.bridgeIdFile = Paths.get(System.getProperty("user.home"), ".mac-bridge", "bridge_id");
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(bridgeIdFile.getParent());
            if (Files.exists(bridgeIdFile)) {
                bridgeId = Files.readString(bridgeIdFile).trim();
                // Validate format
                if (bridgeId.length() < 20) {
                    bridgeId = null;
                }
            }
            if (bridgeId == null) {
                // Generate a new 256-bit unique, unguessable ID, but keep it under 64 chars for ntfy.sh
                bridgeId = "mac-" + UUID.randomUUID().toString().replace("-", "");
                Files.writeString(bridgeIdFile, bridgeId);
                log.info("[Discovery] Generated new Bridge ID: {}", bridgeId);
            } else {
                log.info("[Discovery] Loaded existing Bridge ID: {}", bridgeId.substring(0, 10) + "...");
            }
        } catch (Exception e) {
            // Fallback in-memory ID
            bridgeId = "mac-" + UUID.randomUUID().toString().replace("-", "");
            log.error("[Discovery] Failed to persist bridge ID: {}", e.getMessage());
        }
    }

    /** Publish the current tunnel URL to ntfy.sh topic. */
    public void publishUrl(String tunnelUrl) {
        if (bridgeId == null || tunnelUrl == null) return;
        if (tunnelUrl.equals(lastPublishedUrl)) return; // No-op if unchanged

        try {
            String topic = NTFY_BASE + bridgeId;
            URI uri = URI.create(topic);
            URL url = uri.toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("Content-Type", "text/plain; charset=utf-8");
            conn.setRequestProperty("Title", "Mac Bridge Tunnel URL");
            conn.setRequestProperty("Priority", "urgent");
            conn.setRequestProperty("Tags", "computer,link");

            byte[] payload = tunnelUrl.getBytes(StandardCharsets.UTF_8);
            conn.setRequestProperty("Content-Length", String.valueOf(payload.length));

            try (OutputStream out = conn.getOutputStream()) {
                out.write(payload);
            }

            int code = conn.getResponseCode();
            if (code == 200) {
                lastPublishedUrl = tunnelUrl;
                log.info("[Discovery] Published tunnel URL to ntfy.sh: {}", tunnelUrl);
            } else {
                log.warn("[Discovery] ntfy.sh returned HTTP {}", code);
            }
            conn.disconnect();
        } catch (Exception e) {
            log.error("[Discovery] Failed to publish to ntfy.sh: {}", e.getMessage());
        }
    }

    /** Re-publish the current URL every 5 minutes so the phone always gets a fresh message. */
    @Scheduled(fixedDelay = 300_000)
    public void refreshPublication() {
        if (lastPublishedUrl != null) {
            String saved = lastPublishedUrl;
            lastPublishedUrl = null; // Force re-publish
            publishUrl(saved);
        }
    }

    public String getBridgeId() {
        return bridgeId;
    }
}
