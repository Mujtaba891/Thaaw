/**
 * THAAW Browser — Tracker & Content Blocker Tests
 * Verifies "Stop What Shouldn't Pass" request interceptor logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TrackerBlocker } from '../../browser/privacy/tracker-blocker';

describe('TrackerBlocker ("Stop What Shouldn\'t Pass")', () => {
  let blocker: TrackerBlocker;

  beforeEach(() => {
    blocker = new TrackerBlocker('balanced');
  });

  describe('Known Tracker Domain Interception', () => {
    it('should block requests to known tracker and ad tech domains', () => {
      const trackingUrls = [
        'https://google-analytics.com/analytics.js',
        'https://subdomain.doubleclick.net/ad.js',
        'https://connect.facebook.net/en_US/fbevents.js',
        'https://static.criteo.net/ld/publishertag.js',
        'https://cdn.segment.io/analytics.js/v1/xyz',
        'https://telemetry.microsoft.com/collect'
      ];

      for (const url of trackingUrls) {
        const res = blocker.shouldBlockRequest(url, 'https://example.com');
        expect(res.block).toBe(true);
        expect(res.reason).toBeDefined();
      }
    });

    it('should not block benign non-tracking third-party requests', () => {
      const benignUrls = [
        'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.js',
        'https://fonts.googleapis.com/css2?family=Inter',
        'https://images.unsplash.com/photo-1234',
        'https://api.github.com/repos/thaaw-browser/thaaw'
      ];

      for (const url of benignUrls) {
        const res = blocker.shouldBlockRequest(url, 'https://example.com');
        expect(res.block).toBe(false);
      }
    });

    it('should allow first-party requests even if hostname matches a tracking entity', () => {
      // When visiting doubleclick.net directly as first-party
      const res = blocker.shouldBlockRequest(
        'https://doubleclick.net/style.css',
        'https://doubleclick.net/'
      );
      expect(res.block).toBe(false);
    });
  });

  describe('Protection Levels', () => {
    it('should default to Balanced protection level', () => {
      expect(blocker.getProtectionLevel()).toBe('balanced');
    });

    it('should block intrusive URL patterns in Strict mode', () => {
      blocker.setProtectionLevel('strict');
      expect(blocker.getProtectionLevel()).toBe('strict');

      // Request to arbitrary domain with /tracking/ path
      const res = blocker.shouldBlockRequest(
        'https://news-site.org/assets/tracking/beacon.js',
        'https://news-site.org/news/123'
      );
      // Wait, news-site.org is first-party. Cross-origin request:
      const crossOriginRes = blocker.shouldBlockRequest(
        'https://third-party-cdn.com/tracking/user-activity',
        'https://example.com'
      );
      expect(crossOriginRes.block).toBe(true);
      expect(crossOriginRes.reason).toContain('Matched intrusive ad/telemetry pattern');
    });

    it('should allow benign paths in Balanced mode if domain is not on blocklist', () => {
      blocker.setProtectionLevel('balanced');
      const res = blocker.shouldBlockRequest(
        'https://third-party-cdn.com/tracking/doc.pdf',
        'https://example.com'
      );
      // In balanced mode, only domain list is checked
      expect(res.block).toBe(false);
    });
  });

  describe('Site Shield Override (Allowlist / Toggling)', () => {
    it('should allow all requests when shield is explicitly disabled for a domain', () => {
      const pageOrigin = 'https://broken-legacy-site.org';

      // Before toggle: should block tracker
      expect(blocker.shouldBlockRequest('https://google-analytics.com/ga.js', pageOrigin).block).toBe(true);

      // Disable shield for this origin
      const newStatus = blocker.toggleShield(pageOrigin);
      expect(newStatus).toBe(false);
      expect(blocker.isShieldActiveForDomain(pageOrigin)).toBe(false);

      // Now it should pass through
      expect(blocker.shouldBlockRequest('https://google-analytics.com/ga.js', pageOrigin).block).toBe(false);

      // Re-enable shield
      const reenabled = blocker.toggleShield(pageOrigin);
      expect(reenabled).toBe(true);
      expect(blocker.isShieldActiveForDomain(pageOrigin)).toBe(true);
      expect(blocker.shouldBlockRequest('https://google-analytics.com/ga.js', pageOrigin).block).toBe(true);
    });
  });

  describe('Statistics & Telemetry Aggregation', () => {
    it('should accurately count blocked threats per origin and globally', () => {
      const origin = 'https://news-portal.com';
      expect(blocker.getTotalBlockedCount()).toBe(0);

      blocker.shouldBlockRequest('https://google-analytics.com/r/collect', origin);
      blocker.shouldBlockRequest('https://connect.facebook.net/signals/config', origin);

      expect(blocker.getTotalBlockedCount()).toBe(2);

      const stats = blocker.getStatsForDomain(origin);
      expect(stats.trackersBlockedCount).toBe(2);
      expect(stats.domain).toBe('news-portal.com');
      expect(stats.isShieldActive).toBe(true);
      expect(stats.recentBlocks.length).toBe(2);
    });
  });
});
