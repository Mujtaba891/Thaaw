# Security Policy

## 1. Our Commitment

The THAAW project takes security issues seriously. We maintain a defense-in-depth, security-first stance. We welcome contributions and reports from independent cybersecurity researchers, developers, and users.

We commit to:
- Acknowledging received vulnerability reports within **48 hours**.
- Providing a preliminary assessment within **5 business days**.
- Keeping reporters updated as we validate, mitigate, and patch reported issues.
- Providing public attribution (unless anonymity is requested) once the patch is published.

---

## 2. Supported Versions

| Version | Supported |
| :--- | :---: |
| Latest Main / v1.0.x | :white_check_mark: |
| < 1.0.0 | :x: |

---

## 3. Reporting a Vulnerability

**DO NOT create public GitHub issues for security vulnerabilities or zero-day exploits.**

To report a vulnerability safely:
1. Use GitHub's private vulnerability reporting feature:
   - Navigate to the **Security** tab of the repository.
   - Click **Report a vulnerability**.
2. Or email our security response team:
   - **Email:** `security@thaaw-browser.org`
   - Please include detailed steps to reproduce, proof-of-concept (PoC) code if available, affected versions, and potential impact analysis.

---

## 4. Responsible Disclosure Timeline

1. **Private Report**: The report is filed privately with our team.
2. **Triaging**: We verify the issue, establish severity using CVSS v3.1, and assign an internal tracking ID.
3. **Patch Development**: A fix is authored and reviewed in a private security fork.
4. **Release & Advisory**: The patch is tagged and released. A public security advisory is published explaining the impact and crediting the reporter.

---

## 5. Scope & Severity

### In Scope:
- Sandbox escapes or bypasses of renderer process isolation.
- Vulnerabilities in IPC message validation or privilege escalation from renderer to browser process.
- Bypasses of the "Stop What Shouldn't Pass" tracker and ad blocking engine.
- Bypasses of the permission broker (e.g. accessing microphone or camera without user consent).
- Download security validation evasion.
- Address bar spoofing or SSL verification bypass.

### Out of Scope:
- Denial-of-Service attacks requiring root/physical access to the host machine.
- Social engineering attacks requiring voluntary user execution of unverified binaries outside the browser.
- Issues in third-party websites or services visited through the browser.
