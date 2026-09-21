# Linux Development Setup Guide

This guide describes how to set up, build, test, and run the **THAAW** browser on a modern Linux distribution (Ubuntu/Debian, Fedora, Arch, or generic X11/Wayland desktop).

---

## 1. Prerequisites

Ensure you have the following packages installed on your Linux system:

### Ubuntu / Debian:
```bash
sudo apt update
sudo apt install -y nodejs npm git build-essential \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2
```

### Fedora:
```bash
sudo dnf install -y nodejs npm git make gcc gcc-c++ \
    nss atk at-spi2-atk cups-libs libdrm libXcomposite \
    libXdamage libXrandr mesa-libgbm alsa-lib
```

### Arch Linux:
```bash
sudo pacman -S nodejs npm git base-devel nss atk at-spi2-atk \
    libdrm libxcomposite libxdamage libxrandr mesa alsa-lib
```

---

## 2. Clone & Install Dependencies

```bash
git clone https://github.com/thaaw-browser/thaaw.git
cd thaaw
npm install
```

---

## 3. Building THAAW

To compile TypeScript source files into executable JavaScript:

```bash
npm run build
```

To run TypeScript in continuous watch mode during development:

```bash
npm run watch
```

---

## 4. Running the Browser

To launch the THAAW browser on your active graphical display:

```bash
npm start
```

### Running with Security Debug Flags
To inspect process separation, sandboxing, and IPC calls:

```bash
DEBUG=thaaw:* npm start
```

---

## 5. Running the Test Suite

THAAW maintains comprehensive unit, integration, and security test suites:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run security and IPC validation tests specifically
npm run test:security
```

---

## 6. Packaging for Linux Distribution

To create standalone Linux packages (`AppImage`, `.deb`, `.rpm`):

```bash
npm run package:linux
```
The output binaries will be placed in the `dist/` directory alongside their SHA-256 checksums.
