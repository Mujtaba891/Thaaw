# THAAW Repository Plan & Engineering Organization
> **Classification:** Public Open-Source Development Specification  
> **Philosophy:** Upstream-Friendly, Reproducible, Secure By Default

---

## 1. Directory Structure

The THAAW repository is organized into distinct functional layers adhering to least privilege and clear component boundaries:

```text
thaaw/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Pull Request validation (lint, build, unit & security tests)
│   │   └── security.yml              # Daily dependency review, npm audit, and secret scanning
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml            # Structured bug report template
│   │   └── feature_request.yml       # Feature suggestion template
│   └── pull_request_template.md      # PR guidelines and security-sensitive checklist
│
├── assets/
│   ├── branding/
│   │   └── branding-tokens.json      # Design system color tokens, typography, and UI radii
│   ├── icons/
│   │   ├── thaaw-icon.svg            # Scalable vector stop glyph / shield icon
│   │   └── thaaw-app-icon.png        # High-resolution desktop application icon
│   └── logo/
│       ├── thaaw-logo.svg            # Primary vector wordmark & shield logo
│       └── thaaw-logo-original.png   # Brand asset reference
│
├── browser/
│   ├── main/
│   │   ├── index.ts                  # Main process entry point, protocol handlers, window creation
│   │   ├── tab-manager.ts            # Sandboxed WebContentsView lifecycle & tab switching
│   │   └── preload.ts                # ContextBridge security barrier & typed IPC bridge
│   │
│   ├── security/
│   │   └── ipc-validator.ts          # IPC channel allowlist, URL sanitization, tab ID validation
│   │
│   ├── privacy/
│   │   └── tracker-blocker.ts        # "Stop What Shouldn't Pass" request interceptor & metrics
│   │
│   ├── permissions/
│   │   └── permission-manager.ts     # Centralized 4-W broker (WHO/WHAT/WHY/WHEN)
│   │
│   ├── downloads/
│   │   └── download-manager.ts       # Local file risk inspector & dangerous MIME detector
│   │
│   ├── profiles/
│   │   └── profile-manager.ts        # Partitioned storage & ephemeral private session vault
│   │
│   ├── ui/
│   │   ├── index.html                # Decoupled browser chrome host interface
│   │   ├── styles.css                # Dark-first glassmorphic CSS design system
│   │   └── renderer.ts               # UI chrome renderer controller & event handlers
│   │
│   └── internal-pages/
│       ├── newtab.html               # thaaw://newtab start page with DuckDuckGo search
│       ├── security.html             # thaaw://security active defense dashboard
│       ├── privacy.html              # thaaw://privacy protection tiers & fingerprint settings
│       ├── settings.html             # thaaw://settings preferences & storage purging
│       ├── about.html                # thaaw://about specifications & engine attribution
│       └── internal.css              # Shared stylesheet for internal thaaw:// schemes
│
├── docs/
│   ├── architecture/
│   │   └── ARCHITECTURE.md           # 7-pillar technical architecture document
│   ├── security/
│   │   └── THREAT_MODEL.md           # STRIDE threat model & trust boundary analysis
│   └── development/
│       ├── ROADMAP.md                # Multi-phase engineering roadmap
│       ├── LINUX_SETUP.md            # Linux developer setup and build instructions
│       └── REPOSITORY_PLAN.md        # This repository organization specification
│
├── tests/
│   └── unit/
│       ├── ipc-validator.test.ts     # URL sanitization and IPC validation tests
│       ├── tracker-blocker.test.ts   # Network request interception tests
│       ├── download-security.test.ts # Download risk and MIME mismatch tests
│       ├── permission-manager.test.ts# 4-W permission model tests
│       └── profile-manager.test.ts   # Profile partition and ephemeral storage tests
│
├── dist/                             # Compiled JavaScript & copied UI assets (git-ignored)
├── package.json                      # Build scripts, project metadata, and dependencies
├── tsconfig.json                     # Strict TypeScript compiler options
├── README.md                         # Public repository overview & quick start
├── SECURITY.md                       # Responsible vulnerability disclosure policy
├── CONTRIBUTING.md                   # Code standards, PR workflow, and testing requirements
├── CODE_OF_CONDUCT.md                # Contributor Covenant Code of Conduct
├── LICENSE                           # BSD-3-Clause Open-Source License
└── CHANGELOG.md                      # Release notes and version history
```

---

## 2. Build Pipeline

The build pipeline consists of two complementary phases:
1. **TypeScript Compilation (`tsc`)**:
   - Compiles TypeScript source files into modern CommonJS modules in `dist/`.
   - Runs with `strict: true`, `noImplicitAny: true`, and `skipLibCheck: true`.
2. **Asset Copying (`npm run copy-assets`)**:
   - Synchronously replicates `browser/ui/`, `browser/internal-pages/`, and `assets/` into `dist/`.
   - Guarantees runtime availability of HTML, CSS, SVG, and PNG assets when launching Electron.

```bash
# Complete build sequence
npm run build
```

---

## 3. Testing Strategy & Continuous Integration

### 3.1 Automated Test Execution
- **Unit & Security Tests**: Vitest suite targeting security validators, tracker blockers, download risk evaluators, permissions, and profile isolation.
  ```bash
  npm test
  npm run test:security
  ```
- **Type Checking**: Strict no-emit TypeScript verification.
  ```bash
  npm run lint
  ```

### 3.2 GitHub Actions Workflows
- **`ci.yml`**: Triggered on every pull request to `main`:
  1. Checkout code with full Git history.
  2. Setup Node.js (tested against Node.js 20 & 22).
  3. Install dependencies (`npm ci`).
  4. Run `npm run lint` (0 type errors required).
  5. Run `npm run build`.
  6. Run `npm test` and `npm run test:security`.
- **`security.yml`**: Nightly scheduled scan:
  1. Run `npm audit --audit-level=high`.
  2. Secret scanning for inadvertently committed API keys or credentials.
  3. Dependency review for upstream Chromium security updates.

---

## 4. Release Packaging Strategy

Official Linux binary packages (`AppImage`, `.deb`, `.rpm`) are generated on clean CI workers triggered by Git semantic version tags (`v*.*.*`):
1. Clean environment checkout.
2. Production build and asset bundling.
3. Cryptographic signing with private offline release key.
4. SHA-256 checksum generation (`SHA256SUMS.txt`).
5. Publication of binaries, checksums, and changelog to GitHub Releases.
