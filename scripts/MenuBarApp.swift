#!/usr/bin/env swift
//
// MacBridgeMenuBar.swift
// A lightweight Menu Bar app for Mac Bridge.
// Compile with: swiftc MacBridgeMenuBar.swift -o MacBridgeMenuBar
// Or use build-dmg.sh which handles compilation.
//

import AppKit
import Foundation

class AppDelegate: NSObject, NSApplicationDelegate {

    var statusItem: NSStatusItem!
    var tunnelUrl: String = "Starting..."
    var bridgeRunning: Bool = false
    var tunnelRunning: Bool = false
    var timer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        statusItem.button?.title = "🌉"
        statusItem.button?.action = #selector(showMenu)
        statusItem.button?.target = self

        pollStatus()
        timer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            self?.pollStatus()
        }
    }

    func pollStatus() {
        guard let url = URL(string: "http://localhost:8080/api/tunnel/status") else { return }
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 5)
        URLSession.shared.dataTask(with: req) { [weak self] data, response, error in
            guard let self = self, let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else {
                DispatchQueue.main.async { self?.markOffline() }
                return
            }
            DispatchQueue.main.async {
                self.bridgeRunning = true
                self.tunnelRunning = json["running"] as? Bool ?? false
                self.tunnelUrl = json["tunnelUrl"] as? String ?? "Starting..."
                self.updateIcon()
            }
        }.resume()
    }

    func markOffline() {
        bridgeRunning = false
        tunnelRunning = false
        tunnelUrl = "Offline"
        updateIcon()
    }

    func updateIcon() {
        if !bridgeRunning {
            statusItem.button?.title = "🔴 Bridge"
        } else if !tunnelRunning {
            statusItem.button?.title = "🟡 Bridge"
        } else {
            statusItem.button?.title = "🟢 Bridge"
        }
    }

    @objc func showMenu() {
        let menu = NSMenu()

        let statusLabel = NSMenuItem(title: bridgeRunning ? "✅ Bridge: Online" : "🔴 Bridge: Offline", action: nil, keyEquivalent: "")
        statusLabel.isEnabled = false
        menu.addItem(statusLabel)

        let tunnelLabel = NSMenuItem(title: tunnelRunning ? "🔗 Tunnel: Active" : "❌ Tunnel: Offline", action: nil, keyEquivalent: "")
        tunnelLabel.isEnabled = false
        menu.addItem(tunnelLabel)

        let urlItem = NSMenuItem(title: tunnelUrl.count > 40 ? String(tunnelUrl.prefix(40)) + "..." : tunnelUrl, action: nil, keyEquivalent: "")
        urlItem.isEnabled = false
        menu.addItem(urlItem)

        menu.addItem(NSMenuItem.separator())

        let copyItem = NSMenuItem(title: "📋 Copy Tunnel URL", action: #selector(copyTunnelUrl), keyEquivalent: "c")
        copyItem.target = self
        menu.addItem(copyItem)

        let restartTunnel = NSMenuItem(title: "🔄 Restart Tunnel", action: #selector(restartTunnel), keyEquivalent: "")
        restartTunnel.target = self
        menu.addItem(restartTunnel)

        menu.addItem(NSMenuItem.separator())

        let openWeb = NSMenuItem(title: "🌐 Open mac-bridge.asiff.dev", action: #selector(openWebApp), keyEquivalent: "")
        openWeb.target = self
        menu.addItem(openWeb)

        menu.addItem(NSMenuItem.separator())

        let quit = NSMenuItem(title: "Quit Mac Bridge Menu Bar", action: #selector(quitApp), keyEquivalent: "q")
        quit.target = self
        menu.addItem(quit)

        statusItem.menu = menu
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }

    @objc func copyTunnelUrl() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(tunnelUrl, forType: .string)
    }

    @objc func restartTunnel() {
        guard let url = URL(string: "http://localhost:8080/api/tunnel/restart") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        // NOTE: Needs a valid JWT for authorized endpoints; for now sends unauthenticated
        // (frontend handles auth — this is a local-only admin action)
        URLSession.shared.dataTask(with: req) { [weak self] _, _, _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                self?.pollStatus()
            }
        }.resume()
    }

    @objc func openWebApp() {
        NSWorkspace.shared.open(URL(string: "https://mac-bridge.asiff.dev")!)
    }

    @objc func quitApp() {
        timer?.invalidate()
        NSApplication.shared.terminate(nil)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory) // No dock icon, runs purely in menu bar
app.run()
