# THAAW Browser — Codebase Context & Architecture

> **Quick Reference for AI Agents & Developers**  
> Load this file to immediately understand the entire THAAW browser architecture, directory layout, IPC contracts, and design principles without having to re-scan the entire codebase.

---

## 1. Project Overview & Philosophy

**THAAW** ("Stop What Shouldn't Pass") is a security-hardened, privacy-by-default Chromium desktop browser built on Electron 34, Node 22, and TypeScript.
- **Security-First Architecture**: Strict site isolation, zero-Node renderer context (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), and origin-isolated partitions (`persist:thaaw_profile_<id>`).
- **Zero-Emoji Mandate**: 100% SVG iconography across all chrome and internal pages. No unicode emoji characters are permitted anywhere in code or UI (strictly verified by automated tests).
- **Hardened Downloads**: Never automatically launch or reveal downloads in file managers without explicit user action.
- **Hardware-Accelerated & Low-Latency Media**: Hardened Linux audio/video decoding flags to eliminate buffer underruns, popping, and video cracking.

---

## 2. Directory Layout

```
/home/mujtaba/Desktop/Thaaw/
├── browser/
│   ├── main/                       # Electron Main Process (Node.js runtime)
│   │   ├── index.ts                # Application lifecycle, Chromium flags, protocol handlers, IPC handlers
│   │   ├── tab-manager.ts          # WebContentsView orchestration, tab state, background throttling, context menus
│   │   ├── preload.ts              # Renderer bridge (contextBridge.exposeInMainWorld 'thaawAPI')
│   │   ├── context-menu-preload.ts # Lightweight preload for custom context menu window
│   │   ├── history-manager.ts      # Profile-scoped browsing history (disk-persisted JSON, search, deduplication)
│   │   ├── bookmark-manager.ts     # Profile-scoped bookmark tree & tags (disk-persisted JSON)
│   │   ├── password-manager.ts     # Profile-scoped AES-256 encrypted credential vault
│   │   └── news-provider.ts        # RSS / news aggregator for internal new tab
│   ├── ui/                         # Browser Chrome UI (HTML/CSS/TS)
│   │   ├── index.html              # Main browser chrome window (tabs, toolbar, omnibox, popovers, modals)
│   │   ├── renderer.ts             # Browser chrome UI controller (interacts exclusively via window.thaawAPI)
│   │   ├── styles.css              # Custom glassmorphic styles, themes, and animations
│   │   ├── context-menu.html       # Native-style custom floating context menu
│   │   └── theme/
│   │       └── tokens.css          # Design system variables (colors, elevations, radiuses, dark/light modes)
│   ├── internal-pages/             # Internal pages served securely under thaaw://
│   │   ├── newtab.html             # High-speed dashboard (widgets, news feed, top sites, quick search)
│   │   ├── settings.html           # Full settings center with hash routing (#extensions, #privacy, #security, etc.)
│   │   ├── downloads.html          # Full-page download manager
│   │   ├── history.html            # Searchable browsing history
│   │   ├── bookmarks.html          # Bookmark organizer
│   │   ├── passwords.html          # Credential vault
│   │   ├── security.html           # Security shields & tracker statistics
│   │   ├── privacy.html            # Privacy configuration
│   │   ├── about.html              # About THAAW & engine version info
│   │   ├── error.html              # Custom Chromium load error page
│   │   ├── internal.css            # Stylesheet for internal pages
│   │   ├── icons.js                # SVG icon registry for internal pages
│   │   └── favicon-resolver.js     # Client-side favicon helper
│   ├── privacy/                    # Privacy & Ad Blocking Subsystem
│   │   ├── ad-blocker.ts           # Native ad blocker engine (150+ ad domains, YouTube ad rules, cosmetic CSS)
│   │   └── tracker-blocker.ts      # Network request interception, tracker blocking levels (Strict/Balanced/Standard)
│   ├── security/                   # Security Validator Layer
│   │   └── ipc-validator.ts        # Scheme gating, URL sanitization, search engine bang parser, IPC channel gating
│   ├── profiles/                   # Multi-Profile & Session Isolation
│   │   ├── profile-manager.ts      # Profile partitions, per-profile storage directories, custom avatars
│   │   └── auth-manager.ts         # Optional local authentication & profile accounts
│   ├── permissions/                # Site Permission Manager
│   │   └── permission-manager.ts   # Persistent origin permissions (geolocation, camera, microphone, notifications)
│   └── downloads/                  # Download Manager Subsystem
│       └── download-manager.ts     # Sandboxed download tracking, security warnings, pause/resume/cancel
├── tests/                          # Automated Vitest Test Suite
│   ├── unit/                       # Unit tests for all core subsystems
│   │   ├── ad-blocker.test.ts      # Native AdBlocker domain matching, cosmetic CSS, stats, and toggle tests
│   │   ├── no-emojis.test.ts       # Zero-Emoji rule enforcement test
│   │   ├── ipc-validator.test.ts   # URL sanitization and IPC security tests
│   │   └── ...                     # Comprehensive coverage for downloads, tabs, history, passwords
└── package.json                    # Project configuration, scripts, dependencies
```

---

## 3. Core Subsystems & Mechanisms

### 3.1 Custom Protocol: `thaaw://`
- Registered in `browser/main/index.ts` with privileges: `standard`, `secure`, `supportFetchAPI`, `corsEnabled`.
- Valid internal routes (supports both hostname `thaaw://settings` and subpath `thaaw://newtab/settings.html` resolution):
  - `thaaw://newtab` -> `browser/internal-pages/newtab.html`
  - `thaaw://settings` -> `browser/internal-pages/settings.html` (supports hash routing, e.g. `#extensions`)
  - `thaaw://extensions` -> maps to `browser/internal-pages/settings.html#extensions`
  - `thaaw://downloads` -> `browser/internal-pages/downloads.html`
  - `thaaw://history` -> `browser/internal-pages/history.html`
  - `thaaw://bookmarks` -> `browser/internal-pages/bookmarks.html`
  - `thaaw://passwords` -> `browser/internal-pages/passwords.html`
  - `thaaw://security` -> `browser/internal-pages/security.html`
  - `thaaw://privacy` -> `browser/internal-pages/privacy.html`
  - `thaaw://about` -> `browser/internal-pages/about.html`
  - `thaaw://error?code=...` -> `browser/internal-pages/error.html`
  - `thaaw://assets/...` -> `assets/...`

### 3.2 IPC Validation & Channel Contracts
All IPC channels between renderer and main process are strictly declared and verified in `browser/security/ipc-validator.ts`.
- Navigation URLs are sanitized via `sanitizeNavigationUrl()`:
  - Dangerous script execution schemes (`javascript:`, `data:`, `vbscript:`) and sensitive system files (`/etc/passwd`, `/etc/shadow`, `C:/Windows/System32/cmd.exe`) are strictly rejected.
  - Safe local file URLs (`file:///home/...`, `file:///path/to/page.html`) are fully supported for offline viewing and testing.
  - Search engine shortcuts (`!g`, `!ddg`, `!yt`, `!gh`, `!b`, `!w`, `!sp`) expand automatically.
  - Plain search queries automatically route to the user's selected search engine (DuckDuckGo, Google, Bing, Brave, or Custom `%s`).
  - Local addresses (`localhost`, `127.0.0.1`, dev ports) are safely preserved without searching.
- Custom Form & HTML Elements Design System:
  - Custom styling across `internal.css`, `styles.css`, and injected for `file://` pages in `preload.ts` for `<select>`, `<progress>`, `<input type="range">`, `<input type="checkbox">`, `<input type="radio">`, `<meter>`, `<details>`, `<summary>`, and `::-webkit-scrollbar`.
- Validated IPC channels:
  - `tab:*` (`create`, `close`, `switch`, `navigate`, `reload`, `stop`, `back`, `forward`, `mute`, `duplicate`, `pin`, `search`, `reopen-closed`)
  - `security:*` (`get-status`, `toggle-shield`, `set-protection-level`)
  - `adblock:*` (`get-status`, `toggle`, `toggle-site`)
  - `downloads:*` (`get-recent`, `get-all`, `pause`, `resume`, `cancel`, `open-file`, `open-folder`, `clear-completed`)
  - `profiles:*`, `bookmarks:*`, `history:*`, `passwords:*`, `settings:*`, `theme:*`, `news:*`, `auth:*`, `window:*`.

### 3.3 Ad Blocking & Privacy Engine
- Network request blocking handled via `session.webRequest.onBeforeRequest`:
  - `TrackerBlocker` + `AdBlocker` inspect request URLs against 150+ advertising, tracking, telemetry, and popup domains.
  - Per-site toggling and global toggle support.
- Cosmetic Filtering:
  - `AdBlocker.COSMETIC_FILTERS_CSS` injected into untrusted web pages on `dom-ready`.
  - YouTube in-stream video ad auto-skipper in `browser/main/preload.ts` checks for `.ytp-ad-skip-button` and fast-forwards ads.

### 3.4 Media & Audio Latency Architecture
- Audio cracking on Linux is resolved via:
  - `--audio-buffer-size=2048`
  - `--disable-features=AutofillServerCommunication,AudioServiceSandbox`
- Video decoding acceleration:
  - `--enable-accelerated-video-decode`, `--enable-accelerated-mjpeg-decode`, `VaapiVideoDecodeLinuxGL`
- Background Throttling:
  - Active tab and any background tab playing audio (`media-started-playing`) explicitly have `setBackgroundThrottling(false)` applied in `TabManager`.

---

## 4. Key Developer Commands

- **Run Dev Server / Browser**: `npm start`
- **Run Unit Tests**: `npm test`
- **Run Security Verification**: `npm run test:security`
- **Enforce Zero-Emoji Rule**: `npx vitest run tests/unit/no-emojis.test.ts`
- **Production Bundle**: `npm run build`
