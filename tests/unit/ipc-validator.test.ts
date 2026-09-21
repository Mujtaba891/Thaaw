/**
 * THAAW Browser — IPC & Navigation Security Tests
 * Verifies strict input sanitization, scheme gating, and IPC authorization.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeNavigationUrl,
  validateIpcChannel,
  validateTabId
} from '../../browser/security/ipc-validator';

describe('IPC & Navigation Security Validator', () => {
  describe('sanitizeNavigationUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      const res = sanitizeNavigationUrl('https://example.com/path?query=1');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe('https://example.com/path?query=1');
    });

    it('should allow valid HTTP URLs', () => {
      const res = sanitizeNavigationUrl('http://example.org');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe('http://example.org/');
    });

    it('should reject non-string inputs', () => {
      expect(sanitizeNavigationUrl(null).isValid).toBe(false);
      expect(sanitizeNavigationUrl(undefined).isValid).toBe(false);
      expect(sanitizeNavigationUrl(12345).isValid).toBe(false);
      expect(sanitizeNavigationUrl({}).isValid).toBe(false);
    });

    it('should reject empty or whitespace-only input', () => {
      expect(sanitizeNavigationUrl('').isValid).toBe(false);
      expect(sanitizeNavigationUrl('   ').isValid).toBe(false);
    });

    it('should strictly reject dangerous execution schemes', () => {
      const dangerous = [
        'javascript:alert(1)',
        'JAVASCRIPT:console.log(document.cookie)',
        'data:text/html,<script>evil()</script>',
        'vbscript:MsgBox("Hacked")',
        'file:///etc/passwd',
        'FILE:///C:/Windows/System32/cmd.exe'
      ];

      for (const scheme of dangerous) {
        const res = sanitizeNavigationUrl(scheme);
        expect(res.isValid).toBe(false);
        expect(res.error).toBe('Forbidden URI scheme');
      }
    });

    it('should validate and normalize internal thaaw:// schemes', () => {
      const allowedPages = ['newtab', 'settings', 'security', 'privacy', 'about', 'downloads', 'history', 'bookmarks'];
      for (const page of allowedPages) {
        const res = sanitizeNavigationUrl(`thaaw://${page}`);
        expect(res.isValid).toBe(true);
        expect(res.sanitizedUrl).toBe(`thaaw://${page}`);
      }

      // Unknown internal page falls back safely to newtab
      const fallback = sanitizeNavigationUrl('thaaw://nonexistent-page');
      expect(fallback.isValid).toBe(true);
      expect(fallback.sanitizedUrl).toBe('thaaw://newtab');
    });

    it('should automatically prepend https:// to domain names without protocol', () => {
      const res1 = sanitizeNavigationUrl('duckduckgo.com');
      expect(res1.isValid).toBe(true);
      expect(res1.sanitizedUrl).toBe('https://duckduckgo.com');

      const res2 = sanitizeNavigationUrl('sub.domain.co.uk');
      expect(res2.isValid).toBe(true);
      expect(res2.sanitizedUrl).toBe('https://sub.domain.co.uk');
    });

    it('should route general search terms to private DuckDuckGo search', () => {
      const res = sanitizeNavigationUrl('cybersecurity defense in depth');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe('https://duckduckgo.com/?q=cybersecurity%20defense%20in%20depth');
    });

    it('should correctly handle localhost and local development ports without searching', () => {
      expect(sanitizeNavigationUrl('localhost').sanitizedUrl).toBe('http://localhost');
      expect(sanitizeNavigationUrl('localhost:3000').sanitizedUrl).toBe('http://localhost:3000');
      expect(sanitizeNavigationUrl('127.0.0.1:8080').sanitizedUrl).toBe('http://127.0.0.1:8080');
    });

    it('should expand custom search engine %s templates', () => {
      const res = sanitizeNavigationUrl('open source ai', 'custom', 'https://kagi.com/search?q=%s');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe('https://kagi.com/search?q=open%20source%20ai');
    });
  });

  describe('validateIpcChannel', () => {
    it('should allow legitimate browser UI IPC channels', () => {
      const validChannels = [
        'tab:create',
        'tab:close',
        'tab:switch',
        'tab:navigate',
        'tab:reload',
        'tab:back',
        'tab:forward',
        'tab:reopen-closed',
        'security:get-status',
        'security:toggle-shield',
        'security:set-protection-level',
        'permission:respond',
        'download:respond',
        'palette:action',
        'tab:mute',
        'tab:duplicate',
        'tab:pin',
        'tab:search',
        'settings:get',
        'settings:update',
        'data:clear',
        'passwords:update',
        'passwords:get-security-status',
        'history:clear-range',
        'bookmarks:import',
        'window:minimize',
        'window:maximize',
        'window:close'
      ];

      for (const ch of validChannels) {
        expect(validateIpcChannel(ch)).toBe(true);
      }
    });

    it('should reject unauthorized or injected IPC channels', () => {
      const unauthorized = [
        'fs:read',
        'electron:ipc',
        'process:exit',
        'shell:openPath',
        'eval',
        '__proto__',
        'tab:destroyAll'
      ];

      for (const ch of unauthorized) {
        expect(validateIpcChannel(ch)).toBe(false);
      }
    });
  });

  describe('validateTabId', () => {
    it('should accept non-negative integer IDs', () => {
      expect(validateTabId(0)).toEqual({ isValid: true, sanitizedId: 0 });
      expect(validateTabId(1)).toEqual({ isValid: true, sanitizedId: 1 });
      expect(validateTabId(42)).toEqual({ isValid: true, sanitizedId: 42 });
    });

    it('should reject non-integers, negative numbers, and invalid types', () => {
      expect(validateTabId(-1).isValid).toBe(false);
      expect(validateTabId(3.14).isValid).toBe(false);
      expect(validateTabId('1').isValid).toBe(false);
      expect(validateTabId(NaN).isValid).toBe(false);
      expect(validateTabId(Infinity).isValid).toBe(false);
      expect(validateTabId(null).isValid).toBe(false);
      expect(validateTabId(undefined).isValid).toBe(false);
      expect(validateTabId({}).isValid).toBe(false);
    });
  });
});
