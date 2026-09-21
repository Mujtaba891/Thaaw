# Contributing to THAAW

Thank you for your interest in contributing to **THAAW — Stop What Shouldn’t Pass**! We are building an open-source, security-first web browser and value community participation.

---

## Code of Conduct

All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat others with respect and professionalism.

---

## Development Workflow

### 1. Prerequisites
- Linux, macOS, or Windows WSL2 with modern Node.js (v20+) and npm (v10+).
- Git.

### 2. Fork & Clone
```bash
git clone https://github.com/your-username/thaaw.git
cd thaaw
npm install
```

### 3. Branching Strategy
- Branch from `main` with descriptive prefixes:
  - `feat/feature-name`
  - `fix/bug-description`
  - `sec/security-hardening`
  - `docs/documentation-update`

### 4. Coding Standards
- **TypeScript**: Strict mode enabled (`noImplicitAny`, `strictNullChecks`).
- **Process Boundaries**: Never import Node.js core modules (`fs`, `child_process`, `net`) into renderer code. Renderers must remain pure sandboxed web contexts.
- **IPC Safety**: All new IPC messages must be defined with explicit types and validated in `browser/security/ipc-validator.ts`.
- **Security-First**: Never disable certificate validation, never bypass sandbox flags, and never introduce unauthenticated external network telemetry.

### 5. Running Tests
Before opening a pull request, ensure all tests pass:
```bash
npm run lint
npm test
npm run test:security
```

---

## Pull Request Guidelines

1. Ensure your PR title follows Conventional Commits: `feat:`, `fix:`, `sec:`, `docs:`, `test:`.
2. Reference any related issue number in the PR description (e.g. `Fixes #42`).
3. If your change touches security-sensitive areas (permissions, sandbox flags, download handling, network filtering), include a **Security Assessment** section in your PR description.
4. Keep PRs small, focused, and reviewable.
