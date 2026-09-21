import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Site Control Center Modal Verification (Lock, Shield, Key)', () => {
  const indexPath = path.resolve(__dirname, '../../browser/ui/index.html');
  const rendererPath = path.resolve(__dirname, '../../browser/ui/renderer.ts');
  const stylesPath = path.resolve(__dirname, '../../browser/ui/styles.css');

  it('verifies index.html has the siteControlModal container and elements', () => {
    const html = fs.readFileSync(indexPath, 'utf8');

    // Modal container
    expect(html).toContain('id="siteControlModal"');

    // 3 Tab buttons
    expect(html).toContain('id="siteTabLockBtn"');
    expect(html).toContain('id="siteTabShieldBtn"');
    expect(html).toContain('id="siteTabKeyBtn"');

    // 3 Panels
    expect(html).toContain('id="sitePanelLock"');
    expect(html).toContain('id="sitePanelShield"');
    expect(html).toContain('id="sitePanelKey"');

    // URL bar icons: Lock, Shield, Key
    expect(html).toContain('id="securityIndicatorBtn"');
    expect(html).toContain('id="quickShieldBtn"');
    expect(html).toContain('id="passwordKeyBtn"');

    // Key button is not hidden by default
    expect(html).toMatch(/<button id="passwordKeyBtn" class="chrome-btn-sm password-key-btn"/);

    // Cryptographic Password Generator
    expect(html).toContain('id="siteGenResult"');
    expect(html).toContain('id="siteGenLengthSlider"');
    expect(html).toContain('id="siteGenRefreshBtn"');

    // Origin Permissions List
    expect(html).toContain('id="sitePermsList"');
    expect(html).toContain('data-perm="media:camera"');
    expect(html).toContain('data-perm="media:microphone"');
    expect(html).toContain('data-perm="geolocation"');
    expect(html).toContain('data-perm="notifications"');
    expect(html).toContain('data-perm="clipboard-read"');
  });

  it('verifies renderer.ts wires lock, shield, and key icons to openSiteControlModal without creating pages', () => {
    const code = fs.readFileSync(rendererPath, 'utf8');

    // Ensure securityIndicatorBtn opens modal with 'lock' and never creates thaaw://security
    expect(code).toContain("openSiteControlModal('lock')");
    expect(code).not.toMatch(/securityIndicatorBtn\.addEventListener\([^)]*window\.thaawAPI\.createTab\('thaaw:\/\/security'\)/);

    // Ensure quickShieldBtn opens modal with 'shield' and never creates thaaw://privacy
    expect(code).toContain("openSiteControlModal('shield')");
    expect(code).not.toMatch(/quickShieldBtn\.addEventListener\([^)]*window\.thaawAPI\.createTab\('thaaw:\/\/privacy'\)/);

    // Ensure passwordKeyBtn opens modal with 'key' and never creates thaaw://passwords
    expect(code).toContain("openSiteControlModal('key')");
    expect(code).not.toMatch(/passwordKeyBtn\?\.addEventListener\([^)]*window\.thaawAPI\.createTab\('thaaw:\/\/passwords'\)/);

    // Check modal registration in updateFlyoutState
    expect(code).toContain('siteControlModal');

    // Check tab switching implementation
    expect(code).toContain('switchSiteControlTab');
    expect(code).toContain('loadSiteSecurityData');
    expect(code).toContain('loadSiteShieldData');
    expect(code).toContain('loadSiteVaultData');
    expect(code).toContain('generateSecurePassword');
  });

  it('verifies styles.css contains styling for siteControlModal', () => {
    const css = fs.readFileSync(stylesPath, 'utf8');

    expect(css).toContain('.site-control-card');
    expect(css).toContain('.site-control-tabs');
    expect(css).toContain('.site-tab-btn');
    expect(css).toContain('.site-perms-list');
    expect(css).toContain('.perm-seg-btn');
    expect(css).toContain('.site-metrics-grid');
    expect(css).toContain('.site-generator-card');
  });
});
