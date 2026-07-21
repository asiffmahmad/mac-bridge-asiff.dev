package com.bridge.macbridge;

import com.bridge.macbridge.service.CloudflaredService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MacBridgeApplication {

	public static void main(String[] args) {
		ApplicationContext ctx = SpringApplication.run(MacBridgeApplication.class, args);

		// Auto-start Cloudflare tunnel in background so startup is not blocked
		CloudflaredService cloudflaredService = ctx.getBean(CloudflaredService.class);
		Thread tunnelStarter = new Thread(() -> {
			try {
				// Short delay to let Spring fully initialize
				Thread.sleep(2000);
				cloudflaredService.ensureRunning();
			} catch (InterruptedException ignored) {}
		}, "tunnel-auto-start");
		tunnelStarter.setDaemon(true);
		tunnelStarter.start();
	}
}
