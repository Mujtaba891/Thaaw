# Changelog

All notable changes to the THAAW Browser project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2026-09-10

### Added
- **Cryptographic Password Vault**: Integrated native OS keyring storage with AES-256-GCM hardware-grade fallback and PBKDF2 (100,000 iterations) profile key derivation.
- **Hierarchical Bookmarks Manager**: Full folder structure support, instant search, Netscape HTML export, and Netscape HTML/JSON import engine.
- **Private Browsing History**: Device-only timeline grouping, item deletion, and time-range clearing (last hour, 24 hours, 7 days, 4 weeks, all time).
- **Security Fuzzing Suite**: Automated fuzzing tests (`tests/security/ipc-fuzz.test.ts`) validating URL sanitization against dangerous schemes, control characters, prototype pollution, and path traversal.
- **Closed Tabs Stack**: Reopen recently closed tabs with `Ctrl+Shift+T` and tab context menu.
- **Enhanced Keyboard Navigation**: Full `ArrowUp`, `ArrowDown`, `Enter`, and `Escape` keyboard control for Command Palette (`Ctrl+Shift+P`) and Tab Search (`Ctrl+Shift+A`).
- **Global Theme Engine Presets**: 8 unified presets (4 dark, 4 light) synchronized across all chrome and internal pages.
- **Lightweight Wallpaper WebP Pipeline**: Batch-converted all 15 desktop wallpapers to optimized WebP thumbnails (under 10KB each), shrinking initial asset bundle from 18MB to 208KB.

### Fixed & Hardened
- **Profile Partition Isolation**: Fixed private profile partitions to guarantee strictly ephemeral in-memory isolation with zero disk storage leaks.
- **Settings Versioning & Migration**: Implemented schema version 2 with automated migration and graceful corrupt-file recovery.
- **Permissions Persistence**: Wired permission decisions to persistent per-profile storage (`permissions.json`).
- **Localhost & Dev URL Navigation**: Resolved WHATWG scheme parser issue for `localhost:PORT` and IP-based developer servers.
- **Dead Buttons Cleaned**: Removed unbundled placeholders (`new-tor-window`, `open-ai`, `open-wallet`) in favor of genuine Security and Privacy centers.
- **Passwords Interface**: Resolved JavaScript scoping bug in `passwords.html`, added real-time vault security indicator, and implemented credential editor modal.

---

## [1.0.0-alpha.1] - 2026-09-02

### Added
- **Hardened Engine Shell**: Chromium-based multi-process browser architecture with strict site isolation.
- **Brand Identity**: Kashmiri stop glyph and vector logos integrated into UI chrome, icons, and splash screens.
- **Privacy Engine**: Built-in "Stop What Shouldn't Pass" tracker and intrusive ad network blocker with real-time blocked counter.
- **Security Center**: Live security indicator with HTTPS verification, connection cipher details, and anti-fingerprint status.
- **Centralized Permission Broker**: Strict WHO / WHAT / WHY / WHEN permission prompt system for Camera, Microphone, Geolocation, Notifications, and Clipboard.
- **Download Security**: Extension and MIME-type risk analysis preventing silent drive-by binary downloads.
- **Multi-Tab Orchestration**: Dynamic tab creation, tab switching, and audio status indicators.
- **Privacy Omnibox**: Default private search powered by DuckDuckGo, smart URL parsing, and address bar commands.
- **Command Palette (`Ctrl+Shift+P` / `F1`)**: Keyboard navigation for browser actions.
- **Internal `thaaw://` Pages**:
  - `thaaw://newtab` (Privacy-first launchpad)
  - `thaaw://settings` (Browser configuration)
  - `thaaw://security` (Security Center)
  - `thaaw://privacy` (Privacy protection tiers)
  - `thaaw://about` (Version, engine specifications, license)
- **Security Documentation**:
  - `docs/architecture/ARCHITECTURE.md`
  - `docs/security/THREAT_MODEL.md`
  - `docs/development/ROADMAP.md`
  - `docs/development/LINUX_SETUP.md`
- **CI/CD Automation**: GitHub Actions for build verification, unit testing, and static security analysis.
