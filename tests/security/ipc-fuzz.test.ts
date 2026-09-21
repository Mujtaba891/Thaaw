import { describe, it, expect } from 'vitest';
import {
  sanitizeNavigationUrl,
  validateIpcMessage,
  validatePermissionResponse,
  validateDownloadResponse,
  validateCustomSearchTemplate
} from '../../browser/security/ipc-validator';

describe('Security Fuzzing & Input Robustness', () => {
  describe('Navigation URL Sanitization Fuzzing', () => {
    const DANGEROUS_SCHEMES = [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(document.domain)',
      'Java\nScript:alert(1)',
      'java\tscript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'blob:https://malicious.org/uuid',
      'file:///etc/passwd',
      'file:///C:/Windows/System32/cmd.exe',
      'chrome://settings',
      'chrome-extension://malicious-id/manifest.json',
      'view-source:javascript:alert(1)'
    ];

    DANGEROUS_SCHEMES.forEach((payload) => {
      it(`blocks dangerous or unallowed scheme: ${payload.slice(0, 30)}...`, () => {
        const res = sanitizeNavigationUrl(payload);
        // Dangerous schemes must either be treated as search query or rejected from raw protocol execution
        if (res.isValid) {
          expect(res.sanitizedUrl).not.toMatch(/^(javascript|vbscript|data|blob|file|chrome):/i);
        }
      });
    });

    it('allows legitimate view-source on https URLs but strictly blocks nested dangerous schemes', () => {
      const legit = sanitizeNavigationUrl('view-source:https://example.com');
      expect(legit.isValid).toBe(true);
      expect(legit.sanitizedUrl).toBe('view-source:https://example.com/');

      const evil = sanitizeNavigationUrl('view-source:javascript:alert(1)');
      expect(evil.isValid).toBe(false);
    });

    const CONTROL_CHARACTERS = [
      'https://example.com\x00/admin',
      'https://example.com\r\nSet-Cookie:admin=true',
      'https://example.com/\u202Eevil.exe', // RTL Override
      'https://\uFEFFexample.com', // Zero Width No-Break Space
      'https://example.com\t/path'
    ];

    CONTROL_CHARACTERS.forEach((payload, index) => {
      it(`safely sanitizes control character payload #${index + 1}`, () => {
        const res = sanitizeNavigationUrl(payload);
        expect(res.sanitizedUrl).not.toContain('\x00');
        expect(res.sanitizedUrl).not.toContain('\r');
        expect(res.sanitizedUrl).not.toContain('\n');
      });
    });

    it('survives extremely long input (10,000+ chars) without catastrophic ReDoS or crash', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(12000);
      const start = Date.now();
      const res = sanitizeNavigationUrl(longUrl);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Must resolve in under 100ms
      expect(res.sanitizedUrl.length).toBeLessThanOrEqual(4096);
    });

    it('rejects path traversal attacks on internal protocols', () => {
      const res1 = sanitizeNavigationUrl('thaaw://../../etc/passwd');
      expect(res1.sanitizedUrl).toBe('thaaw://newtab');

      const res2 = sanitizeNavigationUrl('thaaw://..%2f..%2fetc%2fshadow');
      expect(res2.sanitizedUrl).toBe('thaaw://newtab');
    });
  });

  describe('IPC Message Channel & Payload Fuzzing', () => {
    const UNAUTHORIZED_CHANNELS = [
      'shell:exec',
      'system:run',
      'eval',
      '__proto__',
      'constructor',
      'child_process:exec',
      'fs:unlink',
      'app:quit-force',
      'devtools:execute',
      'browser:native-hook'
    ];

    UNAUTHORIZED_CHANNELS.forEach((channel) => {
      it(`rejects unauthorized IPC channel: ${channel}`, () => {
        const res = validateIpcMessage(channel, {});
        expect(res.isValid).toBe(false);
        expect(res.error).toContain('Unauthorized or unknown IPC channel');
      });
    });

    it('handles prototype pollution payloads safely', () => {
      const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}, "constructor": {"prototype": {"polluted": true}}}');
      const res = validateIpcMessage('settings:update', maliciousPayload);
      expect(res.isValid).toBe(true);
      expect((Object.prototype as any).isAdmin).toBeUndefined();
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('validates permission response payloads strictly', () => {
      expect(validatePermissionResponse({ requestId: '', decision: 'allow' })).toBe(false);
      expect(validatePermissionResponse({ requestId: 'req_1', decision: 'super-admin' as any })).toBe(false);
      expect(validatePermissionResponse(null as any)).toBe(false);
      expect(validatePermissionResponse(undefined as any)).toBe(false);
      expect(validatePermissionResponse({ requestId: 'req_123', decision: 'allow' })).toBe(true);
      expect(validatePermissionResponse({ requestId: 'req_123', decision: 'allow-once' })).toBe(true);
      expect(validatePermissionResponse({ requestId: 'req_123', decision: 'deny' })).toBe(true);
    });

    it('validates download response payloads strictly', () => {
      expect(validateDownloadResponse({ downloadId: '', accept: true })).toBe(false);
      expect(validateDownloadResponse({ downloadId: 'dl_1', accept: 'yes' as any })).toBe(false);
      expect(validateDownloadResponse(null as any)).toBe(false);
      expect(validateDownloadResponse({ downloadId: 'dl_123', accept: true })).toBe(true);
      expect(validateDownloadResponse({ downloadId: 'dl_123', accept: false })).toBe(true);
    });
  });

  describe('Custom Search Template Fuzzing', () => {
    it('validates legitimate %s search engine URL templates', () => {
      expect(validateCustomSearchTemplate('https://kagi.com/search?q=%s').isValid).toBe(true);
      expect(validateCustomSearchTemplate('https://searx.be/search?q=%s').isValid).toBe(true);
    });

    it('rejects custom search templates without %s placeholder', () => {
      const res = validateCustomSearchTemplate('https://example.com/search?q=static');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('%s');
    });

    it('rejects non-http/https custom search templates', () => {
      const res1 = validateCustomSearchTemplate('javascript:window.open("%s")');
      expect(res1.isValid).toBe(false);

      const res2 = validateCustomSearchTemplate('file:///search?q=%s');
      expect(res2.isValid).toBe(false);
    });
  });
});
