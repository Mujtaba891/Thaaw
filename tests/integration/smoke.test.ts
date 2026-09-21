/**
 * THAAW Browser — Smoke & Integration Integrity Tests
 * Verifies component linking, internal pages structure, and asset bundling.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TrackerBlocker } from '../../browser/privacy/tracker-blocker';
import { PermissionManager } from '../../browser/permissions/permission-manager';
import { DownloadManager } from '../../browser/downloads/download-manager';
import { ProfileManager } from '../../browser/profiles/profile-manager';
import { sanitizeNavigationUrl, validateIpcChannel, validateTabId } from '../../browser/security/ipc-validator';

describe('THAAW Integration & Smoke Integrity Suite', () => {
  describe('Subsystem Instantiation', () => {
    it('should initialize all core security subsystems cleanly', () => {
      const trackerBlocker = new TrackerBlocker('balanced');
      const permissionManager = new PermissionManager();
      const downloadManager = new DownloadManager();
      const testProfileDir = '/tmp/test-thaaw-smoke-profiles';
      try { fs.rmSync(testProfileDir, { recursive: true, force: true }); } catch {}
      const profileManager = new ProfileManager(testProfileDir);

      expect(trackerBlocker.getProtectionLevel()).toBe('balanced');
      expect(permissionManager.checkPermission('https://example.com', 'media:camera')).toBe('prompt');
      expect(downloadManager.inspectDownload('test.pdf').riskLevel).toBe('safe');
      expect(profileManager.getActiveProfile().id).toBe('default');
    });
  });

  describe('Internal Pages Availability & Structure', () => {
    const internalPagesDir = path.join(__dirname, '..', '..', 'browser', 'internal-pages');
    const requiredPages = [
      'newtab.html',
      'security.html',
      'privacy.html',
      'settings.html',
      'about.html',
      'downloads.html',
      'history.html',
      'bookmarks.html',
      'icons.js',
      'internal.css'
    ];

    for (const page of requiredPages) {
      it(`should contain valid internal page: ${page}`, () => {
        const filePath = path.join(internalPagesDir, page);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(50);
        if (page.endsWith('.html')) {
          expect(content).toContain('THAAW');
        }
      });
    }
  });

  describe('Brand Assets & Vector Icons', () => {
    const assetsDir = path.join(__dirname, '..', '..', 'assets');

    it('should contain valid brand design tokens', () => {
      const tokensPath = path.join(assetsDir, 'branding', 'branding-tokens.json');
      expect(fs.existsSync(tokensPath)).toBe(true);
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      expect(tokens.name).toContain('THAAW');
      expect(tokens.tagline).toBe("Stop What Shouldn't Pass");
      expect(tokens.colors.background.primary).toBe('#07111F');
      expect(tokens.colors.accent.primaryBlue).toBe('#3B82F6');
      expect(tokens.colors.accent.secondaryOrange).toBe('#F97316');
    });

    it('should contain vector logo and icon', () => {
      const logoSvg = path.join(assetsDir, 'logo', 'thaaw-logo.svg');
      const iconSvg = path.join(assetsDir, 'icons', 'thaaw-icon.svg');
      expect(fs.existsSync(logoSvg)).toBe(true);
      expect(fs.existsSync(iconSvg)).toBe(true);

      const logoContent = fs.readFileSync(logoSvg, 'utf8');
      const iconContent = fs.readFileSync(iconSvg, 'utf8');
      expect(logoContent).toContain('<svg');
      expect(iconContent).toContain('<svg');
    });
  });

  describe('Dist Bundle Verification', () => {
    it('should ensure compiled dist bundle contains all required runtime assets', () => {
      const distDir = path.join(__dirname, '..', '..', 'dist');
      expect(fs.existsSync(path.join(distDir, 'browser', 'main', 'index.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'browser', 'ui', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'browser', 'ui', 'renderer.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'browser', 'internal-pages', 'newtab.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'assets', 'icons', 'thaaw-icon.svg'))).toBe(true);
    });
  });
});
