/**
 * THAAW Browser — Progressive Web App (PWA) Manager
 * Handles PWA registry, desktop shortcut installation, standalone app windows,
 * and lifecycle management with isolated partition support.
 */

import { BrowserWindow, app, session } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PwaManifest {
  id: string;
  name: string;
  shortName: string;
  description: string;
  startUrl: string;
  scope: string;
  iconUrl: string;
  themeColor: string;
  backgroundColor: string;
  origin: string;
  installedAt: number;
}

export class PwaManager {
  private pwaRegistryPath: string;
  private installedPwas = new Map<string, PwaManifest>();
  private openWindows = new Map<string, BrowserWindow>();

  constructor(customStorageDir?: string) {
    const baseDir = customStorageDir || (app ? app.getPath('userData') : path.join(os.tmpdir(), 'thaaw-pwa'));
    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    } catch {}
    this.pwaRegistryPath = path.join(baseDir, 'pwas.json');
    this.loadRegistry();
  }

  private loadRegistry(): void {
    try {
      if (fs.existsSync(this.pwaRegistryPath)) {
        const raw = fs.readFileSync(this.pwaRegistryPath, 'utf8');
        const data: PwaManifest[] = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.installedPwas.clear();
          data.forEach(pwa => {
            if (pwa && pwa.id) {
              this.installedPwas.set(pwa.id, pwa);
            }
          });
        }
      }
    } catch (err) {
      console.error('[THAAW PWA] Failed to load PWA registry:', err);
    }
  }

  private saveRegistry(): void {
    try {
      const data = Array.from(this.installedPwas.values());
      fs.writeFileSync(this.pwaRegistryPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW PWA] Failed to persist PWA registry:', err);
    }
  }

  public generatePwaId(origin: string, startUrl: string): string {
    const cleanOrigin = (origin || '').replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const cleanPath = (startUrl || '').replace(/^https?:\/\/[^/]+/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const base = `${cleanOrigin}${cleanPath ? '_' + cleanPath : ''}`;
    return `pwa_${base.slice(0, 48)}`;
  }

  public listPwas(): PwaManifest[] {
    return Array.from(this.installedPwas.values());
  }

  public getPwa(id: string): PwaManifest | undefined {
    return this.installedPwas.get(id);
  }

  public isPwaInstalled(originOrUrl: string): boolean {
    if (!originOrUrl) return false;
    const target = originOrUrl.toLowerCase();
    for (const pwa of this.installedPwas.values()) {
      if (
        pwa.origin.toLowerCase() === target ||
        pwa.startUrl.toLowerCase() === target ||
        (target.startsWith(pwa.origin.toLowerCase()) && pwa.origin.length > 8)
      ) {
        return true;
      }
    }
    return false;
  }

  public getInstalledPwaForUrl(url: string): PwaManifest | undefined {
    if (!url) return undefined;
    const target = url.toLowerCase();
    for (const pwa of this.installedPwas.values()) {
      if (
        target === pwa.startUrl.toLowerCase() ||
        (pwa.scope && target.startsWith(pwa.scope.toLowerCase())) ||
        target.startsWith(pwa.origin.toLowerCase())
      ) {
        return pwa;
      }
    }
    return undefined;
  }

  public async installPwa(
    manifest: Partial<PwaManifest> & { startUrl: string; origin: string }
  ): Promise<{ success: boolean; pwa?: PwaManifest; error?: string }> {
    if (!manifest.startUrl || !manifest.origin) {
      return { success: false, error: 'Start URL and origin are required to install PWA' };
    }

    const id = manifest.id || this.generatePwaId(manifest.origin, manifest.startUrl);
    const pwaRecord: PwaManifest = {
      id,
      name: manifest.name || manifest.shortName || 'Web Application',
      shortName: manifest.shortName || manifest.name || 'App',
      description: manifest.description || '',
      startUrl: manifest.startUrl,
      scope: manifest.scope || manifest.origin,
      iconUrl: manifest.iconUrl || `${manifest.origin}/favicon.ico`,
      themeColor: manifest.themeColor || '#0A0D14',
      backgroundColor: manifest.backgroundColor || '#0A0D14',
      origin: manifest.origin,
      installedAt: Date.now()
    };

    this.installedPwas.set(id, pwaRecord);
    this.saveRegistry();

    // Create desktop integration shortcut where supported
    this.createDesktopShortcut(pwaRecord);

    return { success: true, pwa: pwaRecord };
  }

  public async uninstallPwa(id: string): Promise<{ success: boolean }> {
    const existing = this.installedPwas.get(id);
    if (!existing) return { success: false };

    // Close active window if open
    const win = this.openWindows.get(id);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    this.openWindows.delete(id);

    // Remove desktop shortcut if created
    this.removeDesktopShortcut(existing);

    this.installedPwas.delete(id);
    this.saveRegistry();
    return { success: true };
  }

  public openPwaWindow(id: string, partition: string = 'persist:thaaw_profile_default'): BrowserWindow | null {
    const pwa = this.installedPwas.get(id);
    if (!pwa) return null;

    // Bring existing window to focus if already running
    const existingWin = this.openWindows.get(id);
    if (existingWin && !existingWin.isDestroyed()) {
      existingWin.focus();
      return existingWin;
    }

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 640,
      minHeight: 480,
      title: pwa.name,
      backgroundColor: pwa.themeColor || pwa.backgroundColor || '#0A0D14',
      autoHideMenuBar: true,
      webPreferences: {
        partition,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });

    win.loadURL(pwa.startUrl).catch(err => {
      console.warn(`[THAAW PWA] Error loading ${pwa.startUrl}:`, err);
    });

    win.on('closed', () => {
      this.openWindows.delete(id);
    });

    this.openWindows.set(id, win);
    return win;
  }

  private createDesktopShortcut(pwa: PwaManifest): void {
    try {
      if (process.platform === 'linux') {
        const homeDir = os.homedir();
        const appsDir = path.join(homeDir, '.local', 'share', 'applications');
        if (fs.existsSync(appsDir)) {
          const desktopFile = path.join(appsDir, `thaaw-${pwa.id}.desktop`);
          const execPath = process.execPath;
          const desktopContent = [
            '[Desktop Entry]',
            'Version=1.0',
            'Type=Application',
            `Name=${pwa.name}`,
            `Comment=${pwa.description || pwa.name}`,
            `Exec=${execPath} --app=${pwa.startUrl}`,
            'Terminal=false',
            'Categories=Network;WebBrowser;',
            'StartupWMClass=thaaw-browser'
          ].join('\n');
          fs.writeFileSync(desktopFile, desktopContent, { encoding: 'utf8', mode: 0o755 });
        }
      }
    } catch (err) {
      console.warn('[THAAW PWA] Non-fatal shortcut creation error:', err);
    }
  }

  private removeDesktopShortcut(pwa: PwaManifest): void {
    try {
      if (process.platform === 'linux') {
        const desktopFile = path.join(os.homedir(), '.local', 'share', 'applications', `thaaw-${pwa.id}.desktop`);
        if (fs.existsSync(desktopFile)) {
          fs.unlinkSync(desktopFile);
        }
      }
    } catch {}
  }
}
