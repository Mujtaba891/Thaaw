/**
 * THAAW Browser — Progressive Web App (PWA) Manager Tests
 * Verifies PWA installation, normalization, storage persistence,
 * desktop shortcut handling, and uninstallation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { PwaManager } from '../../browser/main/pwa-manager';

describe('PwaManager Subsystem', () => {
  const testStorageDir = path.join(os.tmpdir(), 'thaaw-pwa-tests-' + Date.now());
  let pwaManager: PwaManager;

  beforeEach(() => {
    try {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    } catch {}
    pwaManager = new PwaManager(testStorageDir);
  });

  describe('ID Generation & Validation', () => {
    it('generates consistent, sanitized PWA IDs from origin and start URL', () => {
      const id1 = pwaManager.generatePwaId('https://twitter.com', 'https://twitter.com/home');
      const id2 = pwaManager.generatePwaId('https://twitter.com', 'https://twitter.com/home');
      expect(id1).toBe(id2);
      expect(id1.startsWith('pwa_twitter.com')).toBe(true);
      expect(id1).not.toContain('//');
      expect(id1).not.toContain(':');
    });

    it('rejects PWA installation when startUrl or origin is missing', async () => {
      const res = await pwaManager.installPwa({
        name: 'Incomplete PWA',
        startUrl: '',
        origin: ''
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('PWA Installation & Persistence', () => {
    it('installs a valid PWA and normalizes manifest properties', async () => {
      const res = await pwaManager.installPwa({
        name: 'Thaaw Portal',
        shortName: 'Portal',
        description: 'Secure browsing companion portal',
        startUrl: 'https://portal.thaaw.org/app',
        origin: 'https://portal.thaaw.org',
        iconUrl: 'https://portal.thaaw.org/icons/icon-512.png',
        themeColor: '#0A0D14',
        backgroundColor: '#0A0D14'
      });

      expect(res.success).toBe(true);
      expect(res.pwa).toBeDefined();
      expect(res.pwa?.name).toBe('Thaaw Portal');
      expect(res.pwa?.shortName).toBe('Portal');
      expect(res.pwa?.startUrl).toBe('https://portal.thaaw.org/app');
      expect(res.pwa?.origin).toBe('https://portal.thaaw.org');
      expect(res.pwa?.installedAt).toBeGreaterThan(0);

      // Verify listing
      const list = pwaManager.listPwas();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(res.pwa?.id);
    });

    it('persists installed PWAs to storage across manager re-instantiations', async () => {
      await pwaManager.installPwa({
        name: 'GitHub Web',
        shortName: 'GitHub',
        description: 'Where the world builds software',
        startUrl: 'https://github.com',
        origin: 'https://github.com',
        iconUrl: 'https://github.githubassets.com/favicons/favicon.svg'
      });

      // Instantiate a new PwaManager pointing to the exact same storage directory
      const secondManager = new PwaManager(testStorageDir);
      const list = secondManager.listPwas();

      expect(list.length).toBe(1);
      expect(list[0].name).toBe('GitHub Web');
      expect(list[0].origin).toBe('https://github.com');
    });

    it('correctly detects if a PWA is installed for an origin or URL', async () => {
      const res = await pwaManager.installPwa({
        name: 'Spotify Web Player',
        shortName: 'Spotify',
        startUrl: 'https://open.spotify.com/',
        origin: 'https://open.spotify.com',
        iconUrl: 'https://open.spotifycdn.com/cdn/images/favicon.ico'
      });

      expect(pwaManager.isPwaInstalled('https://open.spotify.com')).toBe(true);
      expect(pwaManager.isPwaInstalled('https://open.spotify.com/search')).toBe(true);
      expect(pwaManager.isPwaInstalled('https://music.apple.com')).toBe(false);

      const pwaRecord = pwaManager.getInstalledPwaForUrl('https://open.spotify.com/playlist/123');
      expect(pwaRecord).toBeDefined();
      expect(pwaRecord?.id).toBe(res.pwa?.id);
    });
  });

  describe('Uninstallation', () => {
    it('uninstalls an installed PWA and removes it from the registry', async () => {
      const installRes = await pwaManager.installPwa({
        name: 'Discord Web',
        shortName: 'Discord',
        startUrl: 'https://discord.com/app',
        origin: 'https://discord.com'
      });

      const pwaId = installRes.pwa!.id;
      expect(pwaManager.getPwa(pwaId)).toBeDefined();

      const uninstallRes = await pwaManager.uninstallPwa(pwaId);
      expect(uninstallRes.success).toBe(true);
      expect(pwaManager.getPwa(pwaId)).toBeUndefined();
      expect(pwaManager.isPwaInstalled('https://discord.com')).toBe(false);

      // Verify persistence after deletion
      const thirdManager = new PwaManager(testStorageDir);
      expect(thirdManager.listPwas().length).toBe(0);
    });
  });
});
