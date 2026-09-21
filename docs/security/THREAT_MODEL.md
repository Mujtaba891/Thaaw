# THAAW Threat Model

> **Status:** Active / Living Document  
> **Classification:** Public Open-Source Security Specification  
> **Philosophy:** Defense-in-Depth, Least Privilege, No Unsubstantiated Claims

---

## 1. Security Claim & Posture

THAAW does **not** claim to be “100% secure” or “completely unhackable.” No modern web browser can truthfully make such a claim. Instead, THAAW operates under an engineering-backed **defense-in-depth**, **least privilege**, and **auditable isolation** philosophy.

Security claims are substantiated by:
- Multi-process sandboxing with strict site isolation.
- Context isolation with zero native Node.js capability exposed to renderers.
- In-process WebRequest filter checking tracker, ad, and malware patterns prior to socket allocation.
- Explicit origin-bound permission gates (WHO, WHAT, WHY, WHEN).
- Local-first inspection of downloads and content without external telemetry leakage.

---

## 2. Assets to Protect

| Asset | Description | Primary Exposure Vector | Protection Mechanism |
| :--- | :--- | :--- | :--- |
| **Local File System** | User documents, executables, OS files | Malicious renderer compromise, drive-by download | Sandboxing (SECCOMP), DownloadManager confirmation |
| **Session Credentials & Cookies** | Auth cookies, session tokens, local storage | XSS, Cross-site tracking, compromised renderer | Site Isolation, SameSite cookie policies, encrypted storage |
| **User Privacy & Identity** | Browsing history, IP, device hardware fingerprint | Fingerprinting scripts, tracking beacons | Normalization engine, tracker blocker, referrer stripping |
| **Hardware Devices** | Camera, microphone, location, USB, Bluetooth | Malicious API calls by web pages | Centralized PermissionBroker with origin verification |
| **Browser Integrity** | Browser process memory, IPC endpoints, updates | Buffer overflows, IPC spoofing, supply-chain attacks | Strict IPC schema validation, signed releases, memory-safe code |

---

## 3. Adversary Profiles

1. **Malicious Web Origin**:
   - Capabilities: Host malicious JavaScript/Wasm, drive-by downloads, phishing sites, clickjacking, fingerprinting scripts.
   - Goals: Steal user data, track user across domains, trick user into executing binaries, exhaust CPU/memory.
2. **Network Man-in-the-Middle (MitM)**:
   - Capabilities: Intercept or alter plaintext network traffic, spoof DNS responses, present invalid SSL certificates.
   - Goals: Eavesdrop on sensitive data, inject tracking scripts, redirect to hostile portals.
3. **Malicious Extension / Addon**:
   - Capabilities: Attempt to abuse browser APIs, intercept all page interactions, access local storage.
   - Goals: Exfiltrate credentials, monitor browsing behavior.
4. **Compromised Renderer (0-Day / V8 Escape Attempt)**:
   - Capabilities: Arbitrary memory execution within the renderer sandbox.
   - Goals: Escape to the browser process or host OS, bypass sandbox restrictions.

---

## 4. Trust Boundaries & STRIDE Analysis

```text
[ Web Origins (Untrusted) ]
          │  Boundary 1: Network / Content Boundary
          ▼
[ Sandboxed Renderer (Low Trust) ]
          │  Boundary 2: IPC / Process Boundary
          ▼
[ Browser Main Process (High Trust) ]
          │  Boundary 3: OS / Storage Boundary
          ▼
[ Host Operating System ]
```

### STRIDE Assessment

| Threat Category | Potential Attack Vector | THAAW Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Attacker spoofs address bar URL or SSL lock | Main process controls address bar entirely; origin derived strictly from validated navigation state. |
| **Tampering** | Web content attempts to tamper with privileged browser UI | Strict `contextIsolation`, `nodeIntegration: false`, UI rendered in a separate privileged window with strict CSP. |
| **Repudiation** | Denying permission grant or malicious download initiation | Structured, immutable user confirmation logs within local profile storage. |
| **Information Disclosure** | Canvas/Audio fingerprinting, tracking cookies, cross-origin referrers | Anti-fingerprint noise generator, tracker blocking trie, referrer truncation to origin. |
| **Denial of Service** | Infinite loops, memory bombs in JavaScript | Process isolation per tab; hung renderers can be terminated independently without crashing the browser shell. |
| **Elevation of Privilege** | Renderer attempts to call privileged main process methods | IPC validator enforces strict schema, rejects unknown channels, verifies origin sender ID on every call. |

---

## 5. Explicit Non-Goals & Residual Risks

- **Kernel-Level Exploitation**: If the host OS kernel is compromised or an unpatched kernel exploit escapes the Linux SECCOMP sandbox, the browser cannot guarantee system integrity.
- **Physical Device Access**: If an attacker has physical unlocked access to the user's desktop, data in memory is subject to extraction.
- **Voluntary User Execution of External Binaries**: If a user downloads an executable file, bypasses all warnings, and executes it outside THAAW in their shell, the browser cannot protect external processes.
- **Perfect Anonymity**: THAAW provides strong anti-tracking and anti-fingerprinting, but is not a Tor network replacement and does not route traffic through onion relays.
