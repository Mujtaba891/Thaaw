import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { sanitizeNavigationUrl } from '../../browser/security/ipc-validator';
import { ProfileManager } from '../../browser/profiles/profile-manager';
import { AuthManager } from '../../browser/profiles/auth-manager';

describe('Browser Core Functionality — Search, Settings & Profile Isolation', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaaw-browser-core-test-'));
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Cleanup best effort
    }
  });

  describe('Search & URL Navigation (Dynamic Search Engines & Bangs)', () => {
    it('should navigate directly to valid URLs without searching', () => {
      expect(sanitizeNavigationUrl('https://example.com').sanitizedUrl).toBe('https://example.com/');
      expect(sanitizeNavigationUrl('http://localhost:3000').sanitizedUrl).toBe('http://localhost:3000/');
      expect(sanitizeNavigationUrl('github.com').sanitizedUrl).toBe('https://github.com');
    });

    it('should use DuckDuckGo when configured as default', () => {
      const result = sanitizeNavigationUrl('typescript tutorial', 'duckduckgo');
      expect(result.sanitizedUrl).toBe('https://duckduckgo.com/?q=typescript%20tutorial');
    });

    it('should use Google when configured as default', () => {
      const result = sanitizeNavigationUrl('electron devtools guide', 'google');
      expect(result.sanitizedUrl).toBe('https://www.google.com/search?q=electron%20devtools%20guide');
    });

    it('should use Bing when configured as default', () => {
      const result = sanitizeNavigationUrl('web development', 'bing');
      expect(result.sanitizedUrl).toBe('https://www.bing.com/search?q=web%20development');
    });

    it('should use Brave Search when configured as default', () => {
      const result = sanitizeNavigationUrl('privacy browser', 'brave');
      expect(result.sanitizedUrl).toBe('https://search.brave.com/search?q=privacy%20browser');
    });

    it('should allow bang shortcuts to override the default search engine', () => {
      // Even if default is google, !ddg routes to duckduckgo
      expect(sanitizeNavigationUrl('!ddg privacy tools', 'google').sanitizedUrl).toBe('https://duckduckgo.com/?q=privacy%20tools');
      // Even if default is duckduckgo, !g routes to google
      expect(sanitizeNavigationUrl('!g rust lang', 'duckduckgo').sanitizedUrl).toBe('https://www.google.com/search?q=rust%20lang');
      // !b routes to Brave
      expect(sanitizeNavigationUrl('!b zero knowledge', 'google').sanitizedUrl).toBe('https://search.brave.com/search?q=zero%20knowledge');
      // !yt routes to YouTube
      expect(sanitizeNavigationUrl('!yt lo fi hip hop', 'duckduckgo').sanitizedUrl).toBe('https://www.youtube.com/results?search_query=lo%20fi%20hip%20hop');
      // !gh routes to GitHub
      expect(sanitizeNavigationUrl('!gh electron', 'duckduckgo').sanitizedUrl).toBe('https://github.com/search?q=electron');
    });

    it('should preserve internal thaaw:// URLs', () => {
      expect(sanitizeNavigationUrl('thaaw://settings').sanitizedUrl).toBe('thaaw://settings');
      expect(sanitizeNavigationUrl('thaaw://history').sanitizedUrl).toBe('thaaw://history');
      expect(sanitizeNavigationUrl('thaaw://error?url=https://bad.com&code=-105').sanitizedUrl).toBe('thaaw://error?url=https://bad.com&code=-105');
    });
  });

  describe('Profile-Scoped Settings Persistence & Isolation', () => {
    it('should initialize and persist default settings for active profile', () => {
      const pm = new ProfileManager(tempDir);
      const settings = pm.getProfileSettings('default');
      expect(settings).toBeDefined();
      expect(settings.defaultSearchEngine).toBe('duckduckgo');
      expect(settings.theme).toBe('dark');
      expect(settings.tabStyle).toBe('rounded');

      // Verify file was written to disk
      const settingsFile = path.join(tempDir, 'default', 'settings.json');
      expect(fs.existsSync(settingsFile)).toBe(true);
    });

    it('should update and persist settings independently per profile', () => {
      const pm = new ProfileManager(tempDir);

      // Update default profile to google search and light theme
      pm.updateProfileSettings({ defaultSearchEngine: 'google', theme: 'light' }, 'default');

      // Update work profile to brave search and dark theme
      pm.updateProfileSettings({ defaultSearchEngine: 'brave', theme: 'dark', protectionLevel: 'strict' }, 'work');

      const defaultSettings = pm.getProfileSettings('default');
      const workSettings = pm.getProfileSettings('work');

      // Assert complete isolation between profiles
      expect(defaultSettings.defaultSearchEngine).toBe('google');
      expect(defaultSettings.theme).toBe('light');

      expect(workSettings.defaultSearchEngine).toBe('brave');
      expect(workSettings.theme).toBe('dark');
      expect(workSettings.protectionLevel).toBe('strict');

      // Re-instantiate ProfileManager from same disk path to verify persistence across restarts
      const pm2 = new ProfileManager(tempDir);
      const reloadedDefault = pm2.getProfileSettings('default');
      const reloadedWork = pm2.getProfileSettings('work');

      expect(reloadedDefault.defaultSearchEngine).toBe('google');
      expect(reloadedDefault.theme).toBe('light');
      expect(reloadedWork.defaultSearchEngine).toBe('brave');
      expect(reloadedWork.protectionLevel).toBe('strict');
    });
  });

  describe('Authentication & Profile Linkage', () => {
    it('should associate created user accounts with their specific profileId', () => {
      const authDir = path.join(tempDir, 'auth');
      const am = new AuthManager(authDir);

      const res = am.createAccount({
        email: 'developer@thaaw.dev',
        password: 'HardenedPassword123!',
        name: 'Lead Developer',
        profileId: 'developer'
      });

      expect(res.success).toBe(true);
      expect(res.account?.profileId).toBe('developer');

      // Create a second account for work
      const res2 = am.createAccount({
        email: 'analyst@thaaw.corp',
        password: 'CorporatePassword456!',
        name: 'Work User',
        profileId: 'work'
      });

      expect(res2.success).toBe(true);
      expect(res2.account?.profileId).toBe('work');

      // Verify setActiveAccountForProfile switches active session to the matching account
      am.setActiveAccountForProfile('developer');
      expect(am.getCurrentUser()?.email).toBe('developer@thaaw.dev');

      am.setActiveAccountForProfile('work');
      expect(am.getCurrentUser()?.email).toBe('analyst@thaaw.corp');
    });
  });
});
