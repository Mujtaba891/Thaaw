/**
 * THAAW Browser — Download Security Subsystem Tests
 * Verifies local inspection of executable payloads, containers, and MIME mismatches.
 */

import { describe, it, expect } from 'vitest';
import { DownloadManager } from '../../browser/downloads/download-manager';

describe('DownloadManager (Local Threat Inspection)', () => {
  const downloadManager = new DownloadManager();

  describe('Executable & Script File Inspection', () => {
    it('should classify high-risk executables and scripts as dangerous and require confirmation', () => {
      const dangerousFiles = [
        'payload.sh',
        'installer.exe',
        'binary.bin',
        'package.deb',
        'app.AppImage',
        'script.ps1',
        'trojan.bat',
        'lib.elf',
        'driver.msi'
      ];

      for (const filename of dangerousFiles) {
        const result = downloadManager.inspectDownload(filename, 'application/octet-stream', 'https://secure.org');
        expect(result.riskLevel).toBe('dangerous');
        expect(result.requiresUserConfirmation).toBe(true);
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.reasons[0]).toContain('can run arbitrary code');
      }
    });
  });

  describe('Archive & Container Inspection', () => {
    it('should classify compressed archive formats as caution', () => {
      const archives = [
        'source.zip',
        'bundle.tar.gz',
        'release.7z',
        'disk.iso',
        'image.dmg'
      ];

      for (const filename of archives) {
        const result = downloadManager.inspectDownload(filename, 'application/zip', 'https://secure.org');
        expect(result.riskLevel).toBe('caution');
        expect(result.requiresUserConfirmation).toBe(false);
        expect(result.reasons[0]).toContain('may contain unverified contents');
      }
    });
  });

  describe('MIME Type Mismatch Detection', () => {
    it('should detect executable payloads disguised as benign media or documents', () => {
      // An executable served with image extension
      const result = downloadManager.inspectDownload(
        'innocent_photo.jpg',
        'application/x-msdos-program',
        'https://suspicious-server.com'
      );

      expect(result.riskLevel).toBe('dangerous');
      expect(result.requiresUserConfirmation).toBe(true);
      expect(result.reasons.some(r => r.includes('MIME type mismatch'))).toBe(true);
    });

    it('should detect shell scripts disguised under benign extensions', () => {
      const result = downloadManager.inspectDownload(
        'document.txt',
        'application/x-sh',
        'https://site.org'
      );

      expect(result.riskLevel).toBe('dangerous');
      expect(result.requiresUserConfirmation).toBe(true);
      expect(result.reasons.some(r => r.includes('MIME type mismatch'))).toBe(true);
    });
  });

  describe('Safe Downloads & Network Security', () => {
    it('should allow benign document and image downloads over HTTPS without blocking', () => {
      const safeFiles = [
        { file: 'paper.pdf', mime: 'application/pdf' },
        { file: 'photo.png', mime: 'image/png' },
        { file: 'data.csv', mime: 'text/csv' }
      ];

      for (const item of safeFiles) {
        const result = downloadManager.inspectDownload(item.file, item.mime, 'https://trusted.edu');
        expect(result.riskLevel).toBe('safe');
        expect(result.requiresUserConfirmation).toBe(false);
      }
    });

    it('should elevate risk level and warn when download originates from unencrypted HTTP', () => {
      const result = downloadManager.inspectDownload('manual.pdf', 'application/pdf', 'http://insecure-site.org');
      expect(result.riskLevel).toBe('caution');
      expect(result.requiresUserConfirmation).toBe(false);
      expect(result.reasons.some(r => r.includes('unencrypted connection (HTTP)'))).toBe(true);
    });
  });
});
