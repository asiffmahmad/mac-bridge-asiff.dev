package com.bridge.macbridge.service;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.URL;
import java.nio.file.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CloudflaredService {

    private static final Logger log = LoggerFactory.getLogger(CloudflaredService.class);

    private static final String CLOUDFLARED_URL_MACOS_ARM =
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz";
    private static final String CLOUDFLARED_URL_MACOS_AMD64 =
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz";
    private static final Pattern TUNNEL_URL_PATTERN =
            Pattern.compile("https://[a-zA-Z0-9-]+\\.trycloudflare\\.com");

    private final Path cloudflaredBin;
    private final AtomicReference<String> tunnelUrl = new AtomicReference<>(null);
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicBoolean downloading = new AtomicBoolean(false);
    private Process cloudflaredProcess;

    @Autowired
    private BridgeDiscoveryService discoveryService;

    public CloudflaredService() {
        String home = System.getProperty("user.home");
        this.cloudflaredBin = Paths.get(home, ".mac-bridge", "cloudflared");
    }

    /** Called at startup — ensures cloudflared is present and running. */
    public synchronized void ensureRunning() {
        if (running.get()) return;
        if (!Files.exists(cloudflaredBin)) {
            downloadCloudflared();
        }
        if (Files.exists(cloudflaredBin)) {
            startTunnel();
        }
    }

    /** Download the appropriate cloudflared binary for this Mac's architecture. */
    public synchronized void downloadCloudflared() {
        if (downloading.get()) return;
        downloading.set(true);
        log.info("[Cloudflared] Binary not found, downloading...");
        try {
            String arch = System.getProperty("os.arch", "x86_64");
            String downloadUrl = arch.contains("aarch64") || arch.contains("arm")
                    ? CLOUDFLARED_URL_MACOS_ARM
                    : CLOUDFLARED_URL_MACOS_AMD64;

            Files.createDirectories(cloudflaredBin.getParent());
            Path tgzPath = cloudflaredBin.getParent().resolve("cloudflared.tgz");
            URI uri = URI.create(downloadUrl);
            URL url = uri.toURL();
            try (InputStream in = url.openStream()) {
                Files.copy(in, tgzPath, StandardCopyOption.REPLACE_EXISTING);
            }
            
            // Extract tgz
            ProcessBuilder pb = new ProcessBuilder("tar", "-xzf", tgzPath.toString(), "-C", cloudflaredBin.getParent().toString());
            Process p = pb.start();
            p.waitFor();
            
            cloudflaredBin.toFile().setExecutable(true);
            Files.deleteIfExists(tgzPath);
            log.info("[Cloudflared] Downloaded successfully to {}", cloudflaredBin);
        } catch (Exception e) {
            log.error("[Cloudflared] Failed to download: {}", e.getMessage());
        } finally {
            downloading.set(false);
        }
    }

    /** Start the cloudflared tunnel process and extract the URL from logs. */
    public synchronized void startTunnel() {
        if (running.get()) return;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    cloudflaredBin.toString(),
                    "tunnel", "--url", "http://localhost:8080",
                    "--no-autoupdate"
            );
            pb.redirectErrorStream(true); // cloudflared logs to stderr, merge with stdout
            cloudflaredProcess = pb.start();
            running.set(true);
            tunnelUrl.set(null);

            // Parse URL in background thread
            Thread logReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(cloudflaredProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log.debug("[Cloudflared] {}", line);
                        Matcher m = TUNNEL_URL_PATTERN.matcher(line);
                        if (m.find()) {
                            String url = m.group();
                            if (tunnelUrl.compareAndSet(null, url) || !url.equals(tunnelUrl.get())) {
                                tunnelUrl.set(url);
                                log.info("[Cloudflared] Tunnel URL: {}", url);
                                // Notify discovery service of new URL
                                discoveryService.publishUrl(url);
                            }
                        }
                    }
                } catch (IOException e) {
                    log.warn("[Cloudflared] Log reader terminated: {}", e.getMessage());
                } finally {
                    running.set(false);
                    tunnelUrl.set(null);
                    log.warn("[Cloudflared] Process exited.");
                }
            }, "cloudflared-log-reader");
            logReader.setDaemon(true);
            logReader.start();
            log.info("[Cloudflared] Tunnel process started (PID: {})", cloudflaredProcess.pid());
        } catch (Exception e) {
            running.set(false);
            log.error("[Cloudflared] Failed to start: {}", e.getMessage());
        }
    }

    /** Health-check: restart tunnel if it has died. Runs every 30 seconds. */
    @Scheduled(fixedDelay = 30_000)
    public void watchdog() {
        if (!running.get()) {
            log.warn("[Cloudflared] Watchdog detected tunnel is down. Restarting...");
            cloudflaredProcess = null;
            startTunnel();
        }
    }

    /** Gracefully stop the tunnel. */
    public synchronized void stopTunnel() {
        if (cloudflaredProcess != null && cloudflaredProcess.isAlive()) {
            cloudflaredProcess.destroy();
            try {
                cloudflaredProcess.waitFor(5, TimeUnit.SECONDS);
            } catch (InterruptedException ignored) {}
        }
        running.set(false);
        tunnelUrl.set(null);
        log.info("[Cloudflared] Tunnel stopped.");
    }

    /** Kill existing tunnel and start a fresh one. */
    public synchronized void restartTunnel() {
        stopTunnel();
        try { Thread.sleep(1500); } catch (InterruptedException ignored) {}
        startTunnel();
    }

    public String getTunnelUrl() {
        return tunnelUrl.get();
    }

    public boolean isRunning() {
        return running.get();
    }

    public boolean isBinaryPresent() {
        return Files.exists(cloudflaredBin);
    }

    public boolean isDownloading() {
        return downloading.get();
    }

    @PreDestroy
    public void shutdown() {
        stopTunnel();
    }
}
