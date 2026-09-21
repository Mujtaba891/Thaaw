/**
 * THAAW Browser — Centralized Permission Broker Tests
 * Verifies 4-W model (WHO, WHAT, WHY, WHEN) and origin grant persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionManager, PermissionType } from '../../browser/permissions/permission-manager';

describe('PermissionManager (4-W Capability Broker)', () => {
  let manager: PermissionManager;

  beforeEach(() => {
    manager = new PermissionManager();
  });

  describe('Descriptor Resolution', () => {
    it('should provide clear, non-deceptive descriptors for hardware capabilities', () => {
      const cameraDesc = PermissionManager.getPermissionDescriptor('media:camera');
      expect(cameraDesc.name).toBe('Camera');
      expect(cameraDesc.what).toContain('video camera stream');
      expect(cameraDesc.why).toContain('video calling');

      const locDesc = PermissionManager.getPermissionDescriptor('geolocation');
      expect(locDesc.name).toBe('Precise Location');
      expect(locDesc.what).toContain('geographical coordinates');
    });
  });

  describe('4-W Request Lifecycle', () => {
    it('should construct a comprehensive 4-W permission request structure', () => {
      const origin = 'https://meet.jit.si';
      let resolvedGranted: boolean | null = null;

      const req = manager.createRequest(origin, 'media:camera', (granted) => {
        resolvedGranted = granted;
      });

      expect(req.id).toMatch(/^perm_\d+_/);
      expect(req.origin).toBe(origin);
      expect(req.permission).toBe('media:camera');
      expect(req.details.who).toBe(origin);
      expect(req.details.what).toContain('video camera stream');
      expect(req.details.why).toBeDefined();
      expect(req.details.when).toBeDefined();
      expect(resolvedGranted).toBeNull();
    });

    it('should persist permission when user selects "allow"', () => {
      const origin = 'https://trusted-portal.com';
      let grantedResult: boolean | null = null;

      const req = manager.createRequest(origin, 'notifications', (granted) => {
        grantedResult = granted;
      });

      // User allows permanently
      const handled = manager.handleResponse(req.id, 'allow');
      expect(handled).toBe(true);
      expect(grantedResult).toBe(true);

      // Check stored state
      expect(manager.checkPermission(origin, 'notifications')).toBe('allow');
    });

    it('should NOT persist permission when user selects "allow-once"', () => {
      const origin = 'https://temp-meeting.com';
      let grantedResult: boolean | null = null;

      const req = manager.createRequest(origin, 'media:microphone', (granted) => {
        grantedResult = granted;
      });

      // User allows once
      manager.handleResponse(req.id, 'allow-once');
      expect(grantedResult).toBe(true);

      // Future check must prompt again
      expect(manager.checkPermission(origin, 'media:microphone')).toBe('prompt');
    });

    it('should persist denial when user selects "deny"', () => {
      const origin = 'https://untrusted-site.com';
      let grantedResult: boolean | null = null;

      const req = manager.createRequest(origin, 'geolocation', (granted) => {
        grantedResult = granted;
      });

      manager.handleResponse(req.id, 'deny');
      expect(grantedResult).toBe(false);

      // Subsequent checks return deny
      expect(manager.checkPermission(origin, 'geolocation')).toBe('deny');
    });
  });

  describe('Revocation & Isolation', () => {
    it('should allow revoking specific permissions for an origin', () => {
      const origin = 'https://conference.app';
      manager.createRequest(origin, 'media:camera', () => {});
      // Simulate stored permission
      const req = manager.createRequest(origin, 'media:camera', () => {});
      manager.handleResponse(req.id, 'allow');
      expect(manager.checkPermission(origin, 'media:camera')).toBe('allow');

      manager.revokePermission(origin, 'media:camera');
      expect(manager.checkPermission(origin, 'media:camera')).toBe('prompt');
    });

    it('should persist and reload permissions across restarts when storageFile is configured', () => {
      const tempStorage = `/tmp/thaaw-perm-test-${Date.now()}.json`;
      const p1 = new PermissionManager(tempStorage);
      const req = p1.createRequest('https://persisted-site.org', 'geolocation', () => {});
      p1.handleResponse(req.id, 'deny');
      expect(p1.checkPermission('https://persisted-site.org', 'geolocation')).toBe('deny');

      // Re-instantiate from same file
      const p2 = new PermissionManager(tempStorage);
      expect(p2.checkPermission('https://persisted-site.org', 'geolocation')).toBe('deny');
      expect(p2.checkPermission('https://other-site.org', 'geolocation')).toBe('prompt');

      try {
        if (require('fs').existsSync(tempStorage)) require('fs').unlinkSync(tempStorage);
      } catch {}
    });
  });
});
