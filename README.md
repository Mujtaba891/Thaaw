# THAAW — Open-Source Security-First Web Browser

<p align="center">
  <img src="assets/logo/thaaw-logo.svg" alt="THAAW Logo" width="480"/>
</p>

<p align="center">
  <strong>Stop What Shouldn't Pass.</strong><br>
  A modern, high-performance open-source web browser built on a hardened Chromium engine architecture, engineered with security and privacy by default.
</p>

<p align="center">
  <a href="https://github.com/thaaw-browser/thaaw/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-BSD--3--Clause-blue.svg" alt="License"/></a>
  <a href="docs/security/THREAT_MODEL.md"><img src="https://img.shields.io/badge/security-hardened-00D1FF.svg" alt="Security"/></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-policy-10B981.svg" alt="Security Policy"/></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/engine-Chromium-informational.svg" alt="Engine"/></a>
</p>

---

## What is THAAW?

The word **THAAW** is a Kashmiri word associated with **"Stop."**

THAAW was built from the ground up to stop what shouldn't reach the user:
- Malicious Content & Unverified Executables
- Third-Party Trackers & Surveillance Telemetry
- Invasive Profiling & Cross-Site Beacons
- Unwanted Device Permissions & Unencrypted Connections
- Unnecessary Cloud Telemetry & Data Collection

Instead of claiming to be "100% unhackable", THAAW approaches browser safety through verifiable **defense-in-depth**, **strict process isolation**, and **honest transparency**.

---

## Core Product Philosophy

- **Security by Default**: Critical security mitigations (SECCOMP sandbox, Site Isolation, strict CSP, context isolation) are enabled out-of-the-box.
- **Privacy by Default**: Zero external telemetry, zero analytics, zero profiling beacons.
- **Least Privilege**: Renderers operate with zero Node.js capabilities and zero direct filesystem access.
- **Isolation**: Each web origin runs in an isolated sandboxed process with ephemeral memory tokens in private mode.
- **Transparency**: Clear, auditable security indicators displaying actual browser and connection state.
- **Customization Without Engine Hacking**: Full support for 8 global theme presets, 15 curated high-res desktop wallpapers, and custom search engines.
- **Upstream-Friendly**: Preserves Chromium web platform compatibility while hardening the shell.

---

## Key Features

- **Built-in "Stop What Shouldn't Pass" Protection**: Integrated network request filter blocking tracking domains and intrusive scripts before sockets open.
- **Security Center & Live Indicators**: Instant view of TLS verification, blocked trackers count, and active shield status directly from the omnibox.
- **Modern Multi-Tab Management**: Lightning-fast tab creation, switching, audio muting, pinned tabs, and closed tab restoration (`Ctrl+Shift+T`).
- **Privacy Omnibox**: Default private search with domain auto-detection, localhost/port routing, and search engine shortcuts (`!g`, `!ddg`, `!b`, `!yt`, `!gh`, `!w`, `!sp`).
- **4-W Permission Broker**: Centralized permission broker that clearly informs you (WHO / WHAT / WHY / WHEN) before granting access to camera, microphone, or location, with persistent per-profile storage.
- **Cryptographic Password Vault**: Native OS keyring integration with hardware-grade AES-256-GCM fallback and PBKDF2 (100,000 iterations) key derivation.
- **Hierarchical Bookmarks Manager**: Full folder hierarchy, fast keyword search, Netscape HTML export, and Netscape HTML/JSON import.
- **Private Browsing History**: Local timeline grouping, keyword search, item deletion, and time-range clearing.
- **Command Palette (`Ctrl+Shift+P`)**: Keyboard-driven browser command system with full keyboard navigation and live filtering.
- **Search Tabs Dialog (`Ctrl+Shift+A`)**: Instant tab search across titles and URLs with keyboard navigation.
- **Secure Internal Pages**:
  - `thaaw://newtab` — Start page with search, shortcuts, curated wallpapers, and live security overview
  - `thaaw://security` — THAAW Security Center
  - `thaaw://privacy` — Granular privacy configuration & protection tiers
  - `thaaw://settings` — Unified browser preferences and search engine management
  - `thaaw://bookmarks` — Bookmarks organizer with folder support and import/export
  - `thaaw://history` — Browsing history timeline with range clearing
  - `thaaw://passwords` — Cryptographically secured local credentials vault
  - `thaaw://downloads` — Safe download manager with risk inspection
  - `thaaw://about` — Version, engine details, and credits

---

## Quick Start (Linux)

### 1. Prerequisites
- Node.js 20+
- npm 10+
- Standard Linux desktop libraries (X11 / Wayland)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/thaaw-browser/thaaw.git
cd thaaw

# Install dependencies
npm install

# Build TypeScript and bundle assets
npm run build

# Run type checker / linter
npm run lint

# Run automated test suite
npm test

# Launch THAAW
npm start
```

---

## Architecture Overview

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
         └── Security Center                                │
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

For complete technical details, consult:
- [Architecture Specification](docs/architecture/ARCHITECTURE.md)
- [Threat Model & STRIDE Analysis](docs/security/THREAT_MODEL.md)
- [Linux Development Guide](docs/development/LINUX_SETUP.md)
- [Project Roadmap](ROADMAP.md)

---

## Open Source Governance

- [SECURITY.md](SECURITY.md) — Responsible vulnerability disclosure policy.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Guidelines for contributors and review standards.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- [LICENSE](LICENSE) — BSD 3-Clause License.

---

<p align="center">
  <sub>THAAW Browser Project — Built with security, privacy, and freedom in mind.</sub>
</p>
