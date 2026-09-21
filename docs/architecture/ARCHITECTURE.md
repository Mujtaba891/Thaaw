# THAAW Architecture Specification

> **“THAAW — Stop What Shouldn’t Pass.”**

THAAW is a modern, security-first, privacy-by-default web browser engineered on top of a hardened Chromium engine architecture. This document outlines the system architecture, process boundaries, security guarantees, IPC communication, permission brokers, and privacy subsystems.

---

## 1. System Overview

```text
                                  THAAW BROWSER
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
            BROWSER SHELL                             WEB PLATFORM
            (Privileged Host)                       (Sandboxed Content)
                    │                                       │
         ├── Window Management                   ├── Blink Rendering Engine
         ├── Tab Orchestration                   ├── V8 JavaScript Engine
         ├── Omnibox & URL Parser                ├── WebSockets & Fetch
         ├── Profile Subsystem                   └── WebPlatform APIs
         ├── Custom Protocol (thaaw://)                     │
         ├── Theme & Styling Engine                         │
         └── Extension Controller                           │
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                               SECURITY FOUNDATION
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
             PROCESS SANDBOX       IPC CONTRACTS       POLICY BROKERS
                    │                   │                   │
             ├── Strict Site      ├── Schema Validated  ├── Permissions (WHO/WHAT/WHY/WHEN)
             │   Isolation        ├── ContextBridge     ├── "Stop" Tracker Interceptor
             ├── Zero Node        ├── Capability Gated  ├── Anti-Fingerprint Normalizer
             │   in Renderer      └── Rate-Limited      ├── Download Risk Interceptor
             └── SECCOMP/Namespaces                     └── Safe Profile Storage
```

---

## 2. Process Security Model

THAAW implements a strict multi-process architecture based on the principle of **least privilege**:

### 2.1 Process Taxonomy
1. **Browser Main Process (`Privileged`)**:
   - Manages top-level application windows, UI chrome (tab strip, omnibox, security center).
   - Coordinates session lifecycle, profile storage, and persistence.
   - Enforces network policy via the `TrackerBlocker` and `DownloadManager`.
   - Brokering permissions and system interactions.
   - Operates with host OS privileges required for file I/O within the user's browser profile.

2. **Renderer Processes (`Sandboxed / Untrusted`)**:
   - Each web origin is strictly separated into its own sandboxed renderer process (Strict Site Isolation).
   - **Zero Node.js Integration**: Renderers have no native API access, cannot execute shell commands, and cannot read the local filesystem.
   - **OS Sandbox**: Enforced using Linux namespaces, SECCOMP-BPF filters, and restricted user privileges.
   - Memory and CPU limits are managed to prevent denial-of-service across tabs.

3. **Preload Script (`Restricted Bridge`)**:
   - Operates in an isolated execution world (`contextIsolation: true`).
   - Exposes a minimal, typed, read-only API through `contextBridge.exposeInMainWorld()`.
   - Never leaks direct IPC emitters or native objects to the web execution context.

4. **Network Service & Proxy Handler (`Hardened`)**:
   - All network traffic passes through an in-process WebRequest filter before sockets are touched.
   - Intercepts requests to block trackers, ads, malware domains, and insecure protocols.

---

## 3. Security Boundaries & Threat Boundaries

```text
[ Web Origin A (untrusted) ]      [ Web Origin B (untrusted) ]
            │                                  │
            ▼                                  ▼
[ Sandboxed Renderer A ]          [ Sandboxed Renderer B ]
  (SECCOMP, No Node, CSP)           (SECCOMP, No Node, CSP)
            │                                  │
            └───────────────┬──────────────────┘
                            │ (ContextBridge IPC / Strongly Typed)
                            ▼
               [ Privileged Browser Core ]
                ├── IPC Schema Validator
                ├── Permission Broker
                ├── Download Risk Engine
                └── Profile Storage Vault
                            │
                            ▼
                     [ Operating System ]
```

### 3.1 Boundary Rules:
1. **Untrusted Content Rule**: No string, URL, header, or payload from a web renderer is ever trusted without structural validation and sanitization.
2. **No Dynamic Code Execution**: `eval()` and new `Function()` are forbidden within privileged browser scripts via strict Content Security Policy (`CSP`).
3. **Privileged URL Protection**: The `thaaw://` internal scheme is registered with `standard: true, secure: true, supportFetchAPI: true`, and is accessible **only** from the browser's own UI chrome. Navigation from any external origin to `thaaw://` is automatically blocked.
4. **Certificate Validation Integrity**: THAAW strictly enforces TLS certificate validation using the Chromium/system root trust store. Disabling certificate verification is strictly forbidden by policy.

---

## 4. Privacy Architecture: "Stop What Shouldn’t Pass"

THAAW's privacy architecture operates directly at the network request and renderer execution layer.

### 4.1 Network Layer Protection
- **Tracker & Ad Blocking**: Before any HTTP/HTTPS socket is opened, every request URL is evaluated against curated rule sets (EasyList, EasyPrivacy, Peter Lowe's Blocklist, and THAAW Custom Malware Rules).
- **Referrer Truncation**: Cross-origin referrers are stripped to the origin only (`strict-origin-when-cross-origin` enforced).
- **Bounce Tracking Prevention**: Query parameters commonly used for tracking (such as `gclid`, `fbclid`, `utm_*`, `mc_eid`) are automatically scrubbed upon navigation.

### 4.2 Protection Levels
| Protection Level | Tracker Blocking | Third-Party Cookies | Anti-Fingerprinting | Script Hardening |
| :--- | :---: | :---: | :---: | :---: |
| **Balanced** (Default) | Block Known Trackers | Block Cross-Site | Standard Normalization | Safe Web Compatibility |
| **Strict** | Block All Trackers & Ads | Block All Third-Party | Enhanced Canvas/Audio Masking | Block Known Fingerprinters |
| **Maximum** | Aggressive Blocking | Complete Isolation | Uniform System Spoofing | Disallow JIT / WebAssembly if requested |
| **Custom** | User-Configured | User-Configured | User-Configured | User-Configured |

### 4.3 Anti-Fingerprinting Normalization
Instead of pseudo-randomizing browser values (which creates a unique meta-fingerprint), THAAW normalizes values towards common standard buckets:
- Standardized `User-Agent` string per platform release.
- Screen resolution reported to web content matches the viewport or standard 1080p bucket.
- Canvas readback normalization: Adds imperceptible microscopic noise to `toDataURL` / `getImageData` to prevent unique hardware hash extraction without breaking visual rendering.
- WebGL vendor/renderer spoofed to generic driver strings.

---

## 5. Centralized Permission Architecture

All security-sensitive device capabilities (Camera, Microphone, Geolocation, Notifications, Clipboard, External Devices) must be brokered through the `PermissionManager`.

### 5.1 The 4-W Permission Model
Whenever an origin requests an entitlement, the browser presents an explanatory prompt answering:
- **WHO**: The validated origin (e.g., `https://meet.jit.si`).
- **WHAT**: The specific capability requested (e.g., *Camera & Audio Input*).
- **WHY**: The browser context or declared purpose.
- **WHEN**: Scope of grant (*Allow Once*, *Allow Always for this site*, or *Deny*).

Permissions are partitioned per profile and can be revoked at any time via `thaaw://settings` or the Address Bar Lock Icon.

---

## 6. Download Security Subsystem

Downloads are treated as untrusted binaries entering the host system.
1. **Extension Analysis**: Executables (`.exe`, `.sh`, `.bin`, `.elf`, `.deb`, `.rpm`, `.appimage`, `.bat`) trigger an explicit high-risk confirmation modal.
2. **MIME-Extension Consistency Check**: Detects spoofed files (e.g., an executable sent with `image/jpeg` MIME type).
3. **Quarantine Staging**: Files are held in temporary staging until the user explicitly confirms download intention.
4. **Local Inspection**: Verification is performed locally without uploading file hashes or metadata to external servers, preserving user privacy.

---

## 7. Profile & Storage Isolation

Profiles represent completely separated user environments:
- **Default Profile**: Standard browsing with user-selected privacy tier.
- **Private Profile**: Ephemeral in-memory storage; history, cookies, session storage, and cache are destroyed immediately upon window closure.
- **Work / Custom Profiles**: Dedicated storage directories (`~/.config/thaaw/profiles/<id>`) ensuring complete state and cookie isolation between personal and professional browsing.

---

## 8. UI & Interaction Architecture

THAAW decouples browser chrome interface rendering from web content execution:
1. **Chrome Host Window**:
   - The outer shell (`browser/ui/index.html`) renders the Tab Strip, Omnibox, Security Indicators, and System Modals.
   - Operates with `contextIsolation: true` and communicates exclusively through `window.thaawAPI` exposed via `ContextBridge`.
   - Never shares DOM nodes, styles, or JavaScript references with web content renderers.
2. **Web Content Views (`WebContentsView`)**:
   - Each browser tab is backed by an independent sandboxed `WebContentsView` positioned below the chrome header (height: 80px).
   - Switching tabs detaches the inactive `WebContentsView` from the native `contentView` hierarchy and attaches the active view, minimizing compositor and GPU load.
   - Renderer crashes or hangs in a tab are contained (`render-process-gone` event) without crashing the browser shell or other tabs.
3. **Omnibox & Command Palette**:
   - The address bar features a strict URL sanitization pipeline rejecting execution schemes (`javascript:`, `data:`, `file:`) and intelligently routes queries to privacy-preserving DuckDuckGo or direct HTTPS.
   - The Command Palette (`Ctrl+Shift+P`) offers instant keyboard control over security toggles, navigation, and settings without granting elevated capabilities.

---

## 9. Extension Architecture

THAAW adheres to the WebExtension standard with strict security boundaries:
1. **Manifest V3 Alignment**:
   - Extensions must declare explicit, granular permissions (`tabs`, `storage`, `declarativeNetRequest`) in their `manifest.json`.
   - Extensions do **not** gain native operating system access, shell execution, or unrestricted file I/O.
2. **Isolated Extension Runtimes**:
   - Background service workers and content scripts execute in isolated worlds, separate from both the privileged browser chrome and web origin DOMs.
   - Extension IPC calls are brokered through an Extension Permission Gate that enforces least privilege and audits capability usage.
3. **Auditability**:
   - Users can review installed extensions, their active entitlements, and real-time network interception behavior from `thaaw://settings`.

---

## 10. Secure Update Architecture

Browser updates must never become an avenue for compromise:
1. **Cryptographic Signing**:
   - Official releases and update packages are signed using Ed25519 / RSA-4096 release signing keys.
   - The browser process validates the cryptographic signature against the embedded public key before staging any update.
2. **Hash Integrity Verification**:
   - Every update payload is matched against SHA-256 checksums published over HTTPS with TLS certificate pinning.
3. **Rollback & Downgrade Prevention**:
   - The update broker strictly enforces monotonically increasing semantic versions, rejecting downgrade packages.
4. **Atomic Staging**:
   - Updates are staged in an isolated temporary location and verified completely before being swapped into place upon restart.

---

## 11. Theme & Customization Framework

THAAW separates aesthetics from browser engine code:
- Themes are declared as declarative JSON manifests specifying color tokens, font selections, and UI radii.
- The UI layer reads CSS custom properties generated from theme tokens (`assets/branding/branding-tokens.json`).
- Themes do not have access to JavaScript execution or native APIs.

