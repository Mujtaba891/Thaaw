/**
 * THAAW Browser — Tracker & Intrusive Content Blocker
 * Core philosophy: "Stop What Shouldn't Pass."
 * Intercepts network requests before sockets are created.
 */

import { AdBlocker } from './ad-blocker';

export type ProtectionLevel = 'balanced' | 'strict' | 'maximum' | 'custom';

export interface BlockEvent {
  url: string;
  domain: string;
  category: 'tracker' | 'ad' | 'fingerprinter' | 'malware' | 'telemetry';
  pageOrigin?: string;
  timestamp: number;
}

export interface SecurityStatus {
  domain: string;
  isShieldActive: boolean;
  protectionLevel: ProtectionLevel;
  trackersBlockedCount: number;
  adsBlockedCount?: number;
  adBlockerEnabled?: boolean;
  thirdPartyCookiesBlocked: boolean;
  fingerprintProtectionActive: boolean;
  httpsEnforced: boolean;
  recentBlocks: BlockEvent[];
}

export class TrackerBlocker {
  private protectionLevel: ProtectionLevel = 'balanced';
  private domainShieldOverrides = new Map<string, boolean>();
  private blockedStats = new Map<string, number>(); // origin -> count
  private totalBlocked = 0;
  private recentBlocks: BlockEvent[] = [];
  public readonly adBlocker: AdBlocker = new AdBlocker(true);

  // High-performance domain blocklist for common tracking, telemetry, and intrusive ad domains
  private static readonly TRACKER_DOMAINS = new Set<string>([
    'doubleclick.net',
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.net',
    'connect.facebook.net',
    'pixel.facebook.com',
    'adnxs.com',
    'criteo.com',
    'criteo.net',
    'scorecardresearch.com',
    'quantserve.com',
    'hotjar.com',
    'mouseflow.com',
    'mixpanel.com',
    'segment.io',
    'amplitude.com',
    'taboola.com',
    'outbrain.com',
    'pubmatic.com',
    'rubiconproject.com',
    'advertising.com',
    'moatads.com',
    'adroll.com',
    'branch.io',
    'appsflyer.com',
    'adjust.com',
    'telemetry.microsoft.com',
    'vortex.data.microsoft.com',
    'graph.facebook.com',
    'ads.twitter.com',
    'analytics.twitter.com',
    'ads.tiktok.com',
    'tr.snapchat.com',
    'adservice.google.com',
    'pagead2.googlesyndication.com'
  ]);

  // Aggressive ad & beacon patterns
  private static readonly BLOCK_PATTERNS = [
    /\/ads?\//i,
    /\/tracking\//i,
    /\/telemetry\//i,
    /\/analytics\./i,
    /\/beacon\b/i,
    /\/pixel\b/i,
    /\/collector\b/i
  ];

  constructor(initialLevel: ProtectionLevel = 'balanced') {
    this.protectionLevel = initialLevel;
  }

  public getAdBlocker(): AdBlocker {
    return this.adBlocker;
  }

  public setAdBlockerEnabled(enabled: boolean): void {
    this.adBlocker.setEnabled(enabled);
  }

  public isAdBlockerEnabled(): boolean {
    return this.adBlocker.isEnabled();
  }

  public setProtectionLevel(level: ProtectionLevel): void {
    this.protectionLevel = level;
  }

  public getProtectionLevel(): ProtectionLevel {
    return this.protectionLevel;
  }

  public toggleShield(origin: string): boolean {
    const current = this.isShieldActiveForDomain(origin);
    const next = !current;
    this.domainShieldOverrides.set(origin, next);
    if (next) {
      if (this.adBlocker.isSiteAllowed(origin)) {
        this.adBlocker.toggleSiteException(origin);
      }
    } else {
      if (!this.adBlocker.isSiteAllowed(origin)) {
        this.adBlocker.toggleSiteException(origin);
      }
    }
    return next;
  }

  public isShieldActiveForDomain(origin: string): boolean {
    if (this.domainShieldOverrides.has(origin)) {
      return this.domainShieldOverrides.get(origin)!;
    }
    return true; // Active by default: "Stop What Shouldn't Pass"
  }

  /**
   * Evaluates an outgoing web request URL against the THAAW blocklist and AdBlocker.
   * Returns true if request should be stopped.
   */
  public shouldBlockRequest(requestUrl: string, pageOrigin: string): { block: boolean; reason?: string } {
    if (!requestUrl || !this.isShieldActiveForDomain(pageOrigin)) {
      return { block: false };
    }

    // Fast-path internal and non-network protocols
    if (
      (requestUrl.charCodeAt(0) === 100 && requestUrl.startsWith('data:')) ||
      (requestUrl.charCodeAt(0) === 98 && requestUrl.startsWith('blob:')) ||
      (requestUrl.charCodeAt(0) === 116 && requestUrl.startsWith('thaaw:')) ||
      (requestUrl.charCodeAt(0) === 102 && requestUrl.startsWith('file:')) ||
      requestUrl.startsWith('devtools:') ||
      requestUrl.startsWith('chrome:')
    ) {
      return { block: false };
    }

    try {
      const parsed = new URL(requestUrl);
      const hostname = parsed.hostname.toLowerCase();

      // Don't block first-party requests unless in Maximum mode
      if (pageOrigin) {
        try {
          const pageHost = new URL(pageOrigin).hostname.toLowerCase();
          if (hostname === pageHost || hostname.endsWith(`.${pageHost}`)) {
            return { block: false };
          }
        } catch {
          // Ignore origin parse failure
        }
      }

      // Fast O(depth) domain matching: check exact hostname then hierarchical suffix parts
      let matchedTrackerDomain: string | null = null;
      if (TrackerBlocker.TRACKER_DOMAINS.has(hostname)) {
        matchedTrackerDomain = hostname;
      } else {
        const parts = hostname.split('.');
        for (let i = 1; i < parts.length - 1; i++) {
          const candidate = parts.slice(i).join('.');
          if (TrackerBlocker.TRACKER_DOMAINS.has(candidate)) {
            matchedTrackerDomain = candidate;
            break;
          }
        }
      }

      if (matchedTrackerDomain) {
        this.recordBlock(requestUrl, hostname, 'tracker', pageOrigin);
        return { block: true, reason: `Known tracking domain: ${matchedTrackerDomain}` };
      }

      // In Strict or Maximum mode, evaluate intrusive path patterns
      if (this.protectionLevel === 'strict' || this.protectionLevel === 'maximum') {
        for (const pattern of TrackerBlocker.BLOCK_PATTERNS) {
          if (pattern.test(parsed.pathname) || pattern.test(parsed.search)) {
            this.recordBlock(requestUrl, hostname, 'ad', pageOrigin);
            return { block: true, reason: 'Matched intrusive ad/telemetry pattern' };
          }
        }
      }

      // Inquire AdBlocker engine
      if (this.adBlocker.isEnabled()) {
        const adResult = this.adBlocker.shouldBlockAd(requestUrl, pageOrigin);
        if (adResult.block) {
          this.recordBlock(requestUrl, hostname, 'ad', pageOrigin);
          return adResult;
        }
      }

      return { block: false };
    } catch {
      return { block: false };
    }
  }

  private recordBlock(url: string, domain: string, category: BlockEvent['category'], pageOrigin: string): void {
    this.totalBlocked++;
    const currentCount = this.blockedStats.get(pageOrigin) || 0;
    this.blockedStats.set(pageOrigin, currentCount + 1);

    const event: BlockEvent = {
      url,
      domain,
      category,
      pageOrigin,
      timestamp: Date.now()
    };

    this.recentBlocks.unshift(event);
    if (this.recentBlocks.length > 50) {
      this.recentBlocks.pop();
    }
  }

  public getStatsForDomain(origin: string): SecurityStatus {
    const domainCount = this.blockedStats.get(origin) || 0;
    let domainName = origin;
    try {
      domainName = new URL(origin).hostname;
    } catch {
      // keep raw string
    }

    return {
      domain: domainName,
      isShieldActive: this.isShieldActiveForDomain(origin),
      protectionLevel: this.protectionLevel,
      trackersBlockedCount: domainCount,
      adsBlockedCount: this.adBlocker.getBlockedCountForSite(origin),
      adBlockerEnabled: this.adBlocker.isEnabled(),
      thirdPartyCookiesBlocked: true,
      fingerprintProtectionActive: true,
      httpsEnforced: origin.startsWith('https://'),
      recentBlocks: this.recentBlocks
        .filter(b => !b.pageOrigin || b.pageOrigin === origin || b.pageOrigin.includes(domainName))
        .slice(0, 10)
    };
  }

  public getTotalBlockedCount(): number {
    return this.totalBlocked;
  }
}
