# THAAW Engineering Roadmap

This document outlines the engineering milestones for the THAAW browser project.
Status indicators:
- `[x]` Completed
- `[~]` In Progress / Experimental Foundation
- `[ ]` Planned for Future Milestones

---

## 1. Current Milestone: Linux Desktop Release Candidate (P0 & P1 Core)

### Core Architecture & Hardening
- [x] Hardened Electron/Chromium engine shell with Context Isolation and process sandboxing.
- [x] Multi-tab manager with sandboxed `WebContentsView`, active tab sync, and closed tab stack (`Ctrl+Shift+T`).
- [x] Omnibox with smart URL sanitization, domain detection, localhost/port routing, and search bang routing (`!g`, `!ddg`, `!b`, `!yt`, `!gh`, `!w`, `!sp`).
- [x] Built-in "Stop What Shouldn't Pass" tracker blocker engine with balanced/strict modes and per-site shields.
- [x] Full SVG iconography across all chrome and internal surfaces (zero emoji policy strictly enforced).

### Security & Privacy Subsystems
- [x] Centralized Permission Broker with 4-W prompt dialog (WHO / WHAT / WHY / WHEN) and persistent per-profile storage (`permissions.json`).
- [x] Download security inspection pipeline with risk categorization and explicit confirmation dialogs.
- [x] Cryptographic Password Vault: Native OS keyring integration with hardware-grade AES-256-GCM fallback and PBKDF2 (100,000 iterations) key derivation.
- [x] Ephemeral in-memory private browsing mode with tokenized session isolation and zero disk persistence.
- [x] Schema-versioned profile manager (`version: 2`) with automated migration, corruption recovery, and profile creation/duplication.

### Internal Pages & Browser UI
- [x] Shared design system across all internal pages (`newtab`, `settings`, `history`, `bookmarks`, `passwords`, `downloads`, `privacy`, `security`, `about`).
- [x] Global theme engine with 8 presets (4 dark: `midnight`, `deep-space`, `obsidian`, `eclipse`; 4 light: `white`, `frost`, `pearl`, `cloud`) and instant live synchronization.
- [x] 15 curated high-resolution desktop wallpapers with ultra-lightweight WebP thumbnails (under 10KB each) and lazy loading.
- [x] Bookmarks manager with folder hierarchies, search, Netscape HTML export, and Netscape HTML/JSON import.
- [x] Private local history manager with timeline grouping, keyword search, item deletion, and time-range clearing (last hour, 24 hours, 7 days, 4 weeks, all time).
- [x] Command Palette (`Ctrl+Shift+P`) with keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- [x] Search Tabs dialog (`Ctrl+Shift+A`) with keyboard navigation and active selection.
- [x] Site-aware Control Center sidebar with live origin permissions, tracker statistics, and developer tools.

### Testing & Verification
- [x] Zero-emoji automated verification test (`tests/unit/no-emojis.test.ts`).
- [x] Cryptographic password vault test suite (`tests/unit/password-manager.test.ts`).
- [x] Profile isolation and migration test suite (`tests/unit/profile-manager.test.ts`).
- [x] Permission manager persistence test suite (`tests/unit/permission-manager.test.ts`).
- [x] Hierarchical bookmarks and import/export test suite (`tests/unit/bookmark-manager.test.ts`).
- [x] History manager range clearing test suite (`tests/unit/history-manager.test.ts`).
- [x] IPC and URL sanitization fuzzing suite (`tests/security/ipc-fuzz.test.ts`).
- [x] Clean build pipeline (`tsc && npm run copy-assets`) and lint workflow (`tsc --noEmit`).

---

## 2. Next Milestone: Developer Ecosystem & Enhanced Web Protection

- [~] DNS-over-HTTPS (DoH) native resolver integration (Cloudflare / Quad9 / Custom DoH endpoint options in Settings).
- [~] Enhanced canvas and WebGL anti-fingerprinting noise injection (experimental foundation).
- [ ] Interactive certificate details inspector and TLS cipher suite viewer in Security Center.
- [ ] Manifest V3 WebExtension parsing foundation and strict capability gating.
- [ ] WebExtension permission auditing and management interface (`thaaw://extensions`).
- [ ] Distraction-free Reader Mode for long-form articles.

---

## 3. Future Milestone: Cross-Platform Support

1. **Windows**: Win32 installer, MSIX packaging, Windows Credential Manager integration.
2. **macOS**: Apple Silicon & Intel universal build, macOS Keychain Services integration, Gatekeeper notarization.
3. **Android**: Mobile Chromium content layer with THAAW privacy patches and touch UI.
