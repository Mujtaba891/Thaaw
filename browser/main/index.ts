/**
 * THAAW Browser — Main Process
 * "THAAW — Stop What Shouldn't Pass."
 * Security-first, privacy-by-default Chromium architecture.
 */

import { app, BrowserWindow, protocol, session, ipcMain, net, Menu, MenuItem, clipboard, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { TabManager } from './tab-manager';
import { TrackerBlocker, ProtectionLevel } from '../privacy/tracker-blocker';
import { PermissionManager, PermissionType, PermissionDecision } from '../permissions/permission-manager';
import { DownloadManager } from '../downloads/download-manager';
import { ProfileManager, ProfileSettings } from '../profiles/profile-manager';
import { AuthManager } from '../profiles/auth-manager';
import { HistoryManager } from './history-manager';
import { BookmarkManager } from './bookmark-manager';
import { PasswordManager } from './password-manager';
import { NewsProvider } from './news-provider';
import { PwaManager } from './pwa-manager';
import { sanitizeNavigationUrl, validateTabId } from '../security/ipc-validator';

// Startup timing benchmark
const startupStartTime = Date.now();

// 1. Enforce hardened Chromium security & performance flags before app ready
app.commandLine.appendSwitch('enable-strict-site-isolation');
// Disable AudioServiceSandbox on Linux to allow real-time thread scheduling with PipeWire/PulseAudio (eliminates audio cracking)
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication,AudioServiceSandbox');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

// Audio latency & buffer fix for Linux PulseAudio/PipeWire and Bluetooth sinks (prevents buffer underruns)
app.commandLine.appendSwitch('audio-buffer-size', '2048');

// High-performance hardware video acceleration & rasterization switches
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');

// Ultra-fast networking & instantaneous cache loading
// (Avoid forced enable-quic: UDP 443 drops cause a 1.5 - 3.0s fallback delay)
app.commandLine.appendSwitch('enable-tcp-fastopen');
app.commandLine.appendSwitch('enable-async-dns');
app.commandLine.appendSwitch('disk-cache-size', '1073741824'); // 1 GB disk cache for instant reloads
app.commandLine.appendSwitch('media-cache-size', '536870912'); // 512 MB media cache

// Enable high performance Chromium features in a single call
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoDecodeLinuxGL,CanvasOopRasterization,ParallelDownloading,NetworkServiceInProcess,BackForwardCache,AsyncDns');

// Prevent backgrounding / throttling of active media views and compositor stalls
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Register custom privileged scheme for internal pages
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'thaaw',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

let mainWindow: BrowserWindow | null = null;
let pickerWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
const profileManager = new ProfileManager();
const trackerBlocker = new TrackerBlocker('balanced');
const permissionManager = new PermissionManager(path.join(profileManager.getProfileDir(), 'permissions.json'));
const downloadManager = new DownloadManager();
const authManager = new AuthManager();
const pwaManager = new PwaManager();

// Profile-scoped storage managers
let activeHistoryManager = new HistoryManager(path.join(profileManager.getProfileDir(), 'history.json'));
let activeBookmarkManager = new BookmarkManager(path.join(profileManager.getProfileDir(), 'bookmarks.json'));
let activePasswordManager = new PasswordManager(path.join(profileManager.getProfileDir(), 'vault.json'));
const newsProvider = new NewsProvider();

// High-speed in-memory cache for resolved protocol files to eliminate repeated disk I/O
const protocolPathCache = new Map<string, string>();

export function handleThaawProtocol(request: GlobalRequest): Promise<Response> | Response {
  try {
    const cachedPath = protocolPathCache.get(request.url);
    if (cachedPath && fs.existsSync(cachedPath)) {
      return net.fetch(pathToFileURL(cachedPath).toString());
    }

    const url = new URL(request.url);
    const subpath = url.pathname.replace(/^\/+/, '');

    // 1. Check for assets (logos, icons, wallpapers, favicons)
    if (url.hostname === 'assets' || subpath.startsWith('assets/') || subpath.includes('/assets/')) {
      let assetRel = '';
      if (url.hostname === 'assets') {
        assetRel = subpath;
      } else {
        const idx = subpath.indexOf('assets/');
        assetRel = subpath.substring(idx + 7);
      }

      const candidate1 = path.join(__dirname, '..', '..', 'assets', assetRel);
      const candidate2 = path.join(__dirname, '..', '..', '..', 'assets', assetRel);
      const candidate3 = path.join(app.getAppPath(), 'assets', assetRel);
      const candidate4 = path.join(app.getAppPath(), 'dist', 'assets', assetRel);
      const candidates = [candidate1, candidate2, candidate3, candidate4];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          protocolPathCache.set(request.url, c);
          return net.fetch(pathToFileURL(c).toString());
        }
      }
    }

    // 2. Check for subresources (scripts, css)
    if (subpath.endsWith('tokens.css')) {
      const p = path.join(__dirname, '..', 'ui', 'theme', 'tokens.css');
      if (fs.existsSync(p)) {
        protocolPathCache.set(request.url, p);
        return net.fetch(pathToFileURL(p).toString());
      }
    } else if (subpath.endsWith('icons.js')) {
      const p = path.join(__dirname, '..', 'internal-pages', 'icons.js');
      if (fs.existsSync(p)) {
        protocolPathCache.set(request.url, p);
        return net.fetch(pathToFileURL(p).toString());
      }
    } else if (subpath.endsWith('favicon-resolver.js')) {
      const p = path.join(__dirname, '..', 'internal-pages', 'favicon-resolver.js');
      if (fs.existsSync(p)) {
        protocolPathCache.set(request.url, p);
        return net.fetch(pathToFileURL(p).toString());
      }
    } else if (subpath.endsWith('.css')) {
      const p = path.join(__dirname, '..', 'internal-pages', 'internal.css');
      if (fs.existsSync(p)) {
        protocolPathCache.set(request.url, p);
        return net.fetch(pathToFileURL(p).toString());
      }
    }

    // 3. Check for internal page HTML
    const validPages = ['newtab', 'settings', 'security', 'privacy', 'about', 'downloads', 'history', 'bookmarks', 'passwords', 'error'];
    const subpage = subpath.split('/')[0]?.replace(/\.html$/, '');
    const hostPage = (url.hostname || '').replace(/\.html$/, '');

    let pageName = '';
    if (validPages.includes(subpage)) {
      pageName = subpage;
    } else if (validPages.includes(hostPage)) {
      pageName = hostPage;
    } else {
      pageName = 'newtab';
    }
    if (validPages.includes(pageName)) {
      const candidate1 = path.join(__dirname, '..', 'internal-pages', `${pageName}.html`);
      const candidate2 = path.join(app.getAppPath(), 'browser', 'internal-pages', `${pageName}.html`);
      const candidate3 = path.join(app.getAppPath(), 'dist', 'browser', 'internal-pages', `${pageName}.html`);
      for (const c of [candidate1, candidate2, candidate3]) {
        if (fs.existsSync(c)) {
          protocolPathCache.set(request.url, c);
          return net.fetch(pathToFileURL(c).toString());
        }
      }
    }

    return new Response('Page not found', { status: 404 });
  } catch (err) {
    console.error('[THAAW] Protocol error:', err);
    return new Response('Internal error', { status: 500 });
  }
}

function setupProtocolHandlers(): void {
  if (!session.defaultSession.protocol.isProtocolHandled('thaaw')) {
    session.defaultSession.protocol.handle('thaaw', handleThaawProtocol);
  }
}

const configuredSessions = new WeakSet<Electron.Session>();

export const STANDARD_CHROME_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

let securityStatusBroadcastTimer: NodeJS.Timeout | null = null;
let pendingSecurityOrigin = '';

function broadcastSecurityStatusDebounced(origin: string): void {
  pendingSecurityOrigin = origin;
  if (!securityStatusBroadcastTimer) {
    securityStatusBroadcastTimer = setTimeout(() => {
      securityStatusBroadcastTimer = null;
      if (mainWindow && !mainWindow.isDestroyed() && pendingSecurityOrigin) {
        const stats = trackerBlocker.getStatsForDomain(pendingSecurityOrigin);
        mainWindow.webContents.send('browser:security-status-updated', stats);
      }
    }, 200);
  }
}

export function configureSessionSecurity(targetSession: Electron.Session): void {
  if (!targetSession.protocol.isProtocolHandled('thaaw')) {
    targetSession.protocol.handle('thaaw', handleThaawProtocol);
  }

  // Set standard modern Chrome User-Agent to eliminate anti-bot/Cloudflare delays
  try {
    targetSession.setUserAgent(STANDARD_CHROME_USER_AGENT);
  } catch {}

  if (configuredSessions.has(targetSession)) return;
  configuredSessions.add(targetSession);

  // Intercept all outgoing requests before sockets are created
  targetSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    // Fast-path internal, data, blob, and local resources without blocking
    if (
      (url.charCodeAt(0) === 116 && url.startsWith('thaaw:')) ||
      (url.charCodeAt(0) === 100 && url.startsWith('data:')) ||
      (url.charCodeAt(0) === 98 && url.startsWith('blob:')) ||
      (url.charCodeAt(0) === 102 && url.startsWith('file:')) ||
      url.startsWith('devtools:') ||
      url.startsWith('chrome:')
    ) {
      return callback({ cancel: false });
    }

    const initiator = (details as unknown as { initiator?: string }).initiator;
    const origin = details.referrer || initiator || '';
    const decision = trackerBlocker.shouldBlockRequest(url, origin);

    if (decision.block) {
      // "Stop What Shouldn't Pass"
      callback({ cancel: true });
      if (mainWindow && !mainWindow.isDestroyed()) {
        broadcastSecurityStatusDebounced(origin);
      }
      return;
    }

    callback({ cancel: false });
  });

  // Strip cross-origin referrers to origin only (optimized: zero cloning unless Referer & initiator exist)
  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const referer = details.requestHeaders?.['Referer'];
    const initiator = (details as unknown as { initiator?: string }).initiator;
    if (!referer || !initiator) {
      return callback({ requestHeaders: details.requestHeaders });
    }
    try {
      const refUrl = new URL(referer);
      const initUrl = new URL(initiator);
      if (refUrl.hostname !== initUrl.hostname) {
        const headers = { ...details.requestHeaders, Referer: `${refUrl.protocol}//${refUrl.hostname}/` };
        return callback({ requestHeaders: headers });
      }
    } catch {
      // Leave unchanged if malformed
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  // Permission request broker
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    let origin = webContents.getURL();
    try {
      const parsed = new URL(details.requestingUrl || webContents.getURL());
      origin = parsed.origin;
    } catch {
      origin = details.requestingUrl || webContents.getURL();
    }
    const permType = permission as PermissionType;
    const existing = permissionManager.checkPermission(origin, permType);

    if (existing === 'allow') {
      callback(true);
      return;
    }
    if (existing === 'deny') {
      callback(false);
      return;
    }

    // Prompt user via 4-W modal in chrome UI
    const request = permissionManager.createRequest(origin, permType, (granted) => {
      callback(granted);
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:permission-requested', request);
    } else {
      callback(false);
    }
  });

  // Download security & lifecycle broker (Never auto-open file manager!)
  targetSession.on('will-download', (_event, item, webContents) => {
    const filename = item.getFilename();
    const mimeType = item.getMimeType();
    const origin = item.getURL();
    const totalBytes = item.getTotalBytes();

    // Determine target save path in user's Downloads directory and eliminate native OS GTK save dialog
    const downloadsDir = app.getPath('downloads');
    const safeFilename = (filename || 'download').replace(/[/\\?%*:|"<>]/g, '_');
    let targetPath = path.join(downloadsDir, safeFilename);

    // Deduplicate filename if already exists in Downloads directory
    if (fs.existsSync(targetPath)) {
      const parsed = path.parse(safeFilename);
      let counter = 1;
      while (fs.existsSync(path.join(downloadsDir, `${parsed.name} (${counter})${parsed.ext}`))) {
        counter++;
      }
      targetPath = path.join(downloadsDir, `${parsed.name} (${counter})${parsed.ext}`);
    }

    // Explicitly set save path to prevent Chromium from opening native OS "Save As" / GTK file chooser
    item.setSavePath(targetPath);

    // Register active download with DownloadManager immediately
    const record = downloadManager.registerDownload(item, path.basename(targetPath), totalBytes, targetPath, origin, mimeType);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:download-started', record);
    }

    const inspection = downloadManager.inspectDownload(filename, mimeType, origin);

    if (inspection.requiresUserConfirmation) {
      item.pause();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser:download-prompt', {
          downloadId: record.id,
          inspection
        });

        ipcMain.once(`download:decision:${record.id}`, (_evt, accept: boolean) => {
          if (accept) {
            item.resume();
          } else {
            downloadManager.cancelDownload(record.id);
            item.cancel();
          }
        });
      } else {
        downloadManager.cancelDownload(record.id);
        item.cancel();
      }
    }

    item.on('updated', (_evt, state) => {
      if (state === 'interrupted') {
        const failed = downloadManager.failDownload(record.id, 'Download interrupted');
        if (mainWindow && !mainWindow.isDestroyed() && failed) {
          mainWindow.webContents.send('browser:download-failed', failed);
        }
      } else if (state === 'progressing') {
        const updated = downloadManager.updateProgress(record.id, item.getReceivedBytes(), item.getTotalBytes());
        if (mainWindow && !mainWindow.isDestroyed() && updated) {
          mainWindow.webContents.send('browser:download-progress', updated);
        }
      }
    });

    item.on('done', (_evt, state) => {
      if (state === 'completed') {
        const completed = downloadManager.completeDownload(record.id, item.getSavePath());
        if (mainWindow && !mainWindow.isDestroyed() && completed) {
          mainWindow.webContents.send('browser:download-completed', completed);
        }
        // Requirement 3: Never automatically launch the OS file manager or Downloads folder!
      } else if (state === 'cancelled') {
        const cancelled = downloadManager.cancelDownload(record.id);
        if (mainWindow && !mainWindow.isDestroyed() && cancelled) {
          mainWindow.webContents.send('browser:download-cancelled', cancelled);
        }
      } else {
        const failed = downloadManager.failDownload(record.id, 'Download failed');
        if (mainWindow && !mainWindow.isDestroyed() && failed) {
          mainWindow.webContents.send('browser:download-failed', failed);
        }
      }
    });
  });
}

function applyActiveProfile(profileId: string, resetTabs: boolean = false): boolean {
  const success = profileManager.setActiveProfile(profileId);
  if (!success) return false;

  const active = profileManager.getActiveProfile();
  const profDir = profileManager.getProfileDir(active.id);

  // Configure session security and thaaw protocol handler for active profile partition
  const partition = profileManager.getPartitionName(active.id);
  const targetSession = session.fromPartition(partition);
  configureSessionSecurity(targetSession);

  // Switch storage managers to the profile's directory
  activeHistoryManager = new HistoryManager(path.join(profDir, 'history.json'));
  activeBookmarkManager = new BookmarkManager(path.join(profDir, 'bookmarks.json'));
  activePasswordManager = new PasswordManager(path.join(profDir, 'vault.json'));
  permissionManager.setStorageFile(path.join(profDir, 'permissions.json'));

  if (tabManager) {
    tabManager.setHistoryManager(activeHistoryManager);
  }

  // Also sync authManager active user to this profile if an account matches
  authManager.setActiveAccountForProfile(active.id);
  const currentUser = authManager.getCurrentUser();

  // Load and apply profile-specific settings
  const settings = profileManager.getProfileSettings(active.id);
  if (tabManager) {
    tabManager.setDefaultSearchEngine(settings.defaultSearchEngine || 'duckduckgo');
    if (resetTabs) {
      tabManager.closeAllTabsAndOpenNew('thaaw://newtab');
    }
  }

  if (settings.protectionLevel) {
    trackerBlocker.setProtectionLevel(settings.protectionLevel as ProtectionLevel);
  }

  // Broadcast to mainWindow and tabs
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('browser:profile-changed', active);
    mainWindow.webContents.send('browser:auth-changed', currentUser);
    mainWindow.webContents.send('browser:theme-updated', { theme: settings.theme, preset: settings.themePreset });
    mainWindow.webContents.send('browser:wallpaper-updated', settings.wallpaper || 'default');
    mainWindow.webContents.send('browser:engine-updated', {
      engine: settings.defaultSearchEngine,
      label: settings.defaultSearchEngine === 'duckduckgo' ? 'DDG' :
             settings.defaultSearchEngine === 'google' ? 'Google' :
             settings.defaultSearchEngine === 'bing' ? 'Bing' : 'Brave'
    });
  }
  tabManager?.broadcast('browser:profile-changed', active);
  tabManager?.broadcast('browser:auth-changed', currentUser);
  tabManager?.broadcast('browser:theme-updated', { theme: settings.theme, preset: settings.themePreset });
  tabManager?.broadcast('browser:wallpaper-updated', settings.wallpaper || 'default');

  return true;
}

function setupIpcHandlers(): void {
  ipcMain.on('tab:create', (_event, url?: string) => {
    if (tabManager) {
      tabManager.createTab(url || 'thaaw://newtab');
    }
  });

  ipcMain.on('tab:close', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.closeTab(sanitizedId);
    }
  });

  ipcMain.on('tab:switch', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.switchTab(sanitizedId);
    }
  });

  ipcMain.on('tab:navigate', (_event, inputUrl: string) => {
    if (tabManager) {
      tabManager.navigateActiveTab(inputUrl);
    }
  });

  ipcMain.on('tab:reload', () => {
    if (tabManager) tabManager.reloadActiveTab();
  });

  ipcMain.on('tab:stop', () => {
    if (tabManager) tabManager.stopActiveTab();
  });

  ipcMain.on('tab:back', () => {
    if (tabManager) tabManager.goBackActiveTab();
  });

  ipcMain.on('tab:forward', () => {
    if (tabManager) tabManager.goForwardActiveTab();
  });

  ipcMain.on('sidebar:resize', (_event, width: number) => {
    if (tabManager) tabManager.setSidebarOffset(width);
  });

  ipcMain.on('tab:sleep', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.sleepTab(sanitizedId);
    }
  });

  ipcMain.on('tab:wake', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.wakeTab(sanitizedId);
    }
  });

  ipcMain.handle('browser:set-minimal-mode', (_event, enabled: boolean) => {
    if (tabManager) {
      tabManager.setMinimalMode(!!enabled);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:minimal-mode-changed', !!enabled);
    }
    return { success: true, minimalMode: !!enabled };
  });

  ipcMain.on('chrome:set-height', (_event, height: number) => {
    if (tabManager && typeof height === 'number' && height > 0) {
      tabManager.setChromeHeight(height);
    }
  });

  // Global Theme Management (Profile-Scoped)
  ipcMain.handle('theme:get', () => {
    const s = profileManager.getProfileSettings();
    return {
      theme: s.theme,
      preset: s.themePreset || (s.theme === 'light' ? 'white' : 'midnight')
    };
  });

  ipcMain.handle('theme:set', (_event, { theme, preset }: { theme: string; preset?: string }) => {
    const themePreset = preset || (theme === 'light' ? 'white' : 'midnight');

    // Automatically switch wallpaper to match the theme
    const currentSettings = profileManager.getProfileSettings();
    let newWallpaper = currentSettings.wallpaper;
    const isCurrentLightWp = Boolean(newWallpaper && (newWallpaper.startsWith('light') || newWallpaper.includes('light/')));
    if (!newWallpaper || newWallpaper === 'default' || (theme === 'light' && !isCurrentLightWp) || (theme === 'dark' && isCurrentLightWp)) {
      newWallpaper = theme === 'light' ? 'light-13' : 'thaaw-midnight-mountains';
    }

    const updated = profileManager.updateProfileSettings({ theme, themePreset, wallpaper: newWallpaper });
    const update = { theme: updated.theme, preset: updated.themePreset };

    // Synchronize Chromium native theme appearance so web content respects prefers-color-scheme
    if (theme === 'light') {
      nativeTheme.themeSource = 'light';
    } else if (theme === 'dark') {
      nativeTheme.themeSource = 'dark';
    } else {
      nativeTheme.themeSource = 'system';
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:theme-updated', update);
      mainWindow.webContents.send('browser:wallpaper-updated', newWallpaper);
    }
    tabManager?.broadcast('browser:theme-updated', update);
    tabManager?.broadcast('browser:wallpaper-updated', newWallpaper);
    return { success: true, ...update, wallpaper: newWallpaper };
  });

  // Global Wallpaper Management (Profile-Scoped)
  ipcMain.handle('wallpaper:get', () => {
    const s = profileManager.getProfileSettings();
    return s.wallpaper || 'default';
  });

  ipcMain.handle('wallpaper:save-from-url', (_event, imageUrl: string) => {
    if (!imageUrl) return { success: false };
    const updated = profileManager.updateProfileSettings({ wallpaper: imageUrl });
    const wp = updated.wallpaper || imageUrl;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:wallpaper-updated', wp);
    }
    tabManager?.broadcast('browser:wallpaper-updated', wp);
    return { success: true, wallpaper: wp };
  });

  ipcMain.on('browser:request-view-image-fullscreen', (_event, imageUrl: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:view-image-fullscreen', imageUrl);
    }
  });

  ipcMain.handle('wallpaper:set', (_event, wallpaper: string) => {
    const updated = profileManager.updateProfileSettings({ wallpaper });
    const wp = updated.wallpaper || 'default';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:wallpaper-updated', wp);
    }
    tabManager?.broadcast('browser:wallpaper-updated', wp);
    return { success: true, wallpaper: wp };
  });

  // History IPC (Scoped to active profile)
  ipcMain.handle('history:get', (_event, query?: string) => activeHistoryManager.getEntries(query));
  ipcMain.handle('history:delete', (_event, id: string) => activeHistoryManager.deleteItem(id));
  ipcMain.handle('history:clear', () => {
    activeHistoryManager.clearAll();
    return { success: true };
  });
  ipcMain.handle('history:clear-range', (_event, sinceTimestamp: number) => {
    if (typeof sinceTimestamp !== 'number' || isNaN(sinceTimestamp)) {
      return { success: false, removedCount: 0 };
    }
    const removedCount = activeHistoryManager.clearRange(sinceTimestamp);
    return { success: true, removedCount };
  });
  ipcMain.handle('history:get-searches', (_event, limit?: number) => activeHistoryManager.getRecentSearches(limit));
  ipcMain.handle('history:add-search', (_event, query: string) => activeHistoryManager.addSearchQuery(query));
  ipcMain.handle('history:delete-search', (_event, query: string) => activeHistoryManager.deleteSearchQuery(query));
  ipcMain.handle('history:clear-searches', () => {
    activeHistoryManager.clearSearchHistory();
    return { success: true };
  });

  // Omnibox Autocomplete IPC
  ipcMain.handle('omnibox:autocomplete', async (_event, query: string) => {
    if (!query || typeof query !== 'string') return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const sanitize = (val: string) => (val || '').replace(/[<>]/g, '').trim();

    const suggestions: Array<{
      type: 'bookmark' | 'history' | 'tab' | 'search';
      title: string;
      url: string;
      snippet?: string;
      score: number;
    }> = [];

    // 1. Search open tabs
    if (tabManager) {
      const openTabs = tabManager.searchTabs(q);
      for (const tab of openTabs) {
        const title = sanitize(tab.title || tab.url);
        const url = sanitize(tab.url);
        suggestions.push({
          type: 'tab',
          title,
          url,
          snippet: 'Switch to tab',
          score: (url.toLowerCase().startsWith(q) || title.toLowerCase().startsWith(q)) ? 100 : 70
        });
      }
    }

    // 2. Search Bookmarks
    const bookmarks = activeBookmarkManager.getBookmarks(q);
    for (const b of bookmarks) {
      if (!b.isFolder && b.url) {
        const url = sanitize(b.url);
        if (!suggestions.some(s => s.url === url)) {
          const title = sanitize(b.title || b.url);
          const isExact = url.toLowerCase().includes(q) && (url.toLowerCase().startsWith('http://' + q) || url.toLowerCase().startsWith('https://' + q) || url.toLowerCase().startsWith(q));
          suggestions.push({
            type: 'bookmark',
            title,
            url,
            snippet: 'Bookmark',
            score: isExact ? 95 : 65
          });
        }
      }
    }

    // 3. Search History
    const historyItems = activeHistoryManager.getEntries(q);
    for (const h of historyItems) {
      if (h.url) {
        const url = sanitize(h.url);
        if (!suggestions.some(s => s.url === url)) {
          const title = sanitize(h.title || h.url);
          let score = 50;
          try {
            const parsed = new URL(url);
            if (parsed.hostname.toLowerCase().startsWith(q)) score = 90;
            else if (parsed.hostname.toLowerCase().includes(q)) score = 75;
          } catch {}
          suggestions.push({
            type: 'history',
            title,
            url,
            snippet: 'Visited',
            score
          });
        }
      }
    }

    // 4. Search Queries
    const searches = activeHistoryManager.getRecentSearches(10);
    for (const s of searches) {
      if (typeof s === 'string' && s.toLowerCase().includes(q)) {
        const title = sanitize(s);
        if (!suggestions.some(item => item.title.toLowerCase() === title.toLowerCase())) {
          suggestions.push({
            type: 'search',
            title,
            url: s,
            snippet: 'Search History',
            score: title.toLowerCase().startsWith(q) ? 60 : 40
          });
        }
      }
    }

    // Sort descending by score, capped at 8 results
    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, 8).map(({ type, title, url, snippet }) => ({ type, title, url, snippet }));
  });

  // Bookmarks IPC (Scoped to active profile)
  ipcMain.handle('bookmarks:get', (_event, query?: string) => activeBookmarkManager.getBookmarks(query));
  ipcMain.handle('bookmarks:add', (_event, { title, url, parentId, isFolder }) =>
    activeBookmarkManager.addBookmark(title, url, parentId, isFolder)
  );
  ipcMain.handle('bookmarks:update', (_event, { id, patch }) => activeBookmarkManager.updateBookmark(id, patch));
  ipcMain.handle('bookmarks:delete', (_event, id: string) => activeBookmarkManager.deleteBookmark(id));
  ipcMain.handle('bookmarks:toggle', (_event, { title, url }) => activeBookmarkManager.toggleUrlBookmark(title, url));
  ipcMain.handle('bookmarks:import', (_event, { content, format }: { content: string; format?: 'json' | 'html' }) => {
    if (!content) return { imported: 0, errors: 1 };
    return activeBookmarkManager.importBookmarks(content, format);
  });

  // Bookmarks Bar Toggle IPC
  ipcMain.handle('browser:toggle-bookmarks-bar', (_event, show: boolean) => {
    const isShown = Boolean(show);
    const activeProf = profileManager.getActiveProfile();
    profileManager.updateProfileSettings({ showBookmarksBar: isShown }, activeProf.id);
    const height = isShown ? 118 : 84;
    if (tabManager) {
      tabManager.setChromeHeight(height);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:bookmarks-bar-toggled', isShown);
    }
    return { success: true, showBookmarksBar: isShown, chromeHeight: height };
  });

  // Passwords Vault IPC (Scoped to active profile)
  ipcMain.handle('passwords:get', (_event, query?: string) => activePasswordManager.getCredentialList(query));
  ipcMain.handle('passwords:save', (_event, { website, username, password }) =>
    activePasswordManager.saveCredential(website, username, password)
  );
  ipcMain.handle('passwords:update', (_event, item: { id: string; website?: string; username?: string; password?: string }) => {
    if (!item || !item.id) return { success: false, error: 'Missing credential ID' };
    return activePasswordManager.updateCredential(item.id, item);
  });
  ipcMain.handle('passwords:reveal', (_event, id: string) => activePasswordManager.revealPassword(id));
  ipcMain.handle('passwords:delete', (_event, id: string) => activePasswordManager.deleteCredential(id));
  ipcMain.handle('passwords:get-security-status', () => activePasswordManager.getVaultSecurityStatus());
  ipcMain.handle('passwords:import-csv', (_event, csvContent: string) => {
    try {
      const res = activePasswordManager.importCsv(csvContent);
      return { success: true, ...res };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to import CSV', imported: 0, errors: 1, skipped: 0 };
    }
  });
  ipcMain.handle('passwords:export-csv', () => {
    try {
      const csv = activePasswordManager.exportCsv();
      return { success: true, csv };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to export CSV' };
    }
  });
  ipcMain.handle('passwords:get-matching', (_event, originOrUrl: string) => activePasswordManager.getMatchingCredentials(originOrUrl));
  ipcMain.handle('autofill:query-accounts', (_event, originOrUrl: string) => {
    try {
      const matching = activePasswordManager.getMatchingCredentials(originOrUrl);
      return matching.map(m => ({ website: m.website, username: m.username }));
    } catch {
      return [];
    }
  });
  ipcMain.handle('autofill:request-fill', (_event, { origin, username }: { origin: string; username: string }) => {
    try {
      const matching = activePasswordManager.getMatchingCredentials(origin);
      const cred = matching.find(m => m.username.toLowerCase() === (username || '').toLowerCase());
      if (!cred) return null;
      const rev = activePasswordManager.revealPassword(cred.id);
      if (rev.success && rev.password) {
        return { username: cred.username, password: rev.password };
      }
      return null;
    } catch {
      return null;
    }
  });
  ipcMain.handle('tab:autofill-active', (_event, cred: { username: string; password: string }) => {
    try {
      const activeWebContents = tabManager?.getActiveTabWebContents();
      if (activeWebContents && !activeWebContents.isDestroyed()) {
        activeWebContents.send('autofill:do-fill', cred);
        return { success: true };
      }
      return { success: false, error: 'No active tab view' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
  ipcMain.handle('passwords:save-or-update', (_event, item: { website: string; username: string; password: string; id?: string }) => {
    if (item.id) {
      return activePasswordManager.updateCredential(item.id, item);
    }
    const matching = activePasswordManager.getMatchingCredentials(item.website);
    const existing = matching.find(m => m.username.toLowerCase() === item.username.toLowerCase());
    if (existing) {
      return activePasswordManager.updateCredential(existing.id, { password: item.password });
    }
    return activePasswordManager.saveCredential(item.website, item.username, item.password);
  });

  ipcMain.on('password:prompt-response', (_event, { decision, data }: { decision: 'save' | 'update' | 'dismiss'; data: any }) => {
    if (decision === 'save' && data?.website && data?.username && data?.password) {
      activePasswordManager.saveCredential(data.website, data.username, data.password);
    } else if (decision === 'update' && data?.id && data?.password) {
      activePasswordManager.updateCredential(data.id, { password: data.password });
    }
  });

  ipcMain.on('autofill:form-submitted', (_event, { origin, username, password }: { origin: string; username: string; password: string }) => {
    if (!origin || !password) return;
    const cleanOrigin = activePasswordManager.normalizeDomain(origin);
    const matching = activePasswordManager.getMatchingCredentials(origin);
    const existing = matching.find(m => m.username.toLowerCase() === (username || '').toLowerCase());
    if (!existing) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser:password-prompt', {
          mode: 'save',
          origin: cleanOrigin || origin,
          username,
          password
        });
      }
    } else {
      const revealed = activePasswordManager.revealPassword(existing.id);
      if (revealed.success && revealed.password && revealed.password !== password) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('browser:password-prompt', {
            mode: 'update',
            origin: cleanOrigin || origin,
            username: existing.username,
            password,
            id: existing.id
          });
        }
      }
    }
  });

  ipcMain.on('autofill:password-fields-detected', (_event, data: { hasPasswordFields: boolean; origin?: string }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:password-fields-detected', data);
    }
  });

  // Authentication & Accounts IPC
  ipcMain.handle('auth:create-account', (_event, params) => {
    let profileId = params.profileId;
    if (!profileId) {
      const newProf = profileManager.createProfile(params.displayName || params.email.split('@')[0], 'user', '#3B82F6');
      profileId = newProf.id;
    }
    const res = authManager.createAccount({ ...params, profileId });
    if (res.success && res.account) {
      applyActiveProfile(res.account.profileId, false);
    }
    return res;
  });

  ipcMain.handle('auth:sign-in', (_event, params) => {
    const res = authManager.signIn(params);
    if (res.success && res.account?.profileId) {
      applyActiveProfile(res.account.profileId, true);
    }
    return res;
  });

  ipcMain.handle('auth:sign-out', () => {
    const res = authManager.signOut();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browser:auth-changed', null);
    }
    tabManager?.broadcast('browser:auth-changed', null);
    return res;
  });

  ipcMain.handle('auth:get-current-user', () => authManager.getCurrentUser());
  ipcMain.handle('auth:update-profile', (_event, params) => {
    const res = authManager.updateProfile(params);
    if (res.success && res.account) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser:auth-changed', res.account);
      }
      tabManager?.broadcast('browser:auth-changed', res.account);
    }
    return res;
  });
  ipcMain.handle('auth:list-accounts', () => authManager.listAccounts());

  // Developer Tools IPC
  ipcMain.on('devtools:toggle', () => {
    tabManager?.toggleDevToolsActiveTab();
  });
  ipcMain.on('devtools:inspect', (_event, { x, y }: { x?: number; y?: number } = {}) => {
    tabManager?.inspectElementActiveTab(x, y);
  });

  // Tab Strip Context Menu IPC
  ipcMain.on('tab:context-menu', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.showTabContextMenu(sanitizedId);
    }
  });

  // News Provider & Reader IPC
  ipcMain.handle('news:get', async (_event, category?: string, page?: number, view?: string) =>
    newsProvider.getNews(category, page, 8, view)
  );
  ipcMain.handle('news:get-rss-feeds', () => newsProvider.getCustomRssFeeds());
  ipcMain.handle('news:add-rss-feed', async (_event, { url, name, category }) =>
    newsProvider.validateAndAddRssFeed(url, name, category)
  );
  ipcMain.handle('news:delete-rss-feed', (_event, id: string) => newsProvider.deleteCustomRssFeed(id));
  ipcMain.handle('news:get-follow-state', () => newsProvider.getFollowState());
  ipcMain.handle('news:toggle-follow-publisher', (_event, publisher: string) =>
    newsProvider.toggleFollowPublisher(publisher)
  );
  ipcMain.handle('news:toggle-follow-channel', (_event, channel: string) =>
    newsProvider.toggleFollowChannel(channel)
  );
  ipcMain.handle('news:hide-publisher', (_event, publisher: string) => {
    newsProvider.hidePublisher(publisher);
    return { success: true };
  });
  ipcMain.handle('news:hide-topic', (_event, topic: string) => {
    newsProvider.hideTopic(topic);
    return { success: true };
  });

  ipcMain.handle('security:get-status', () => {
    const active = tabManager?.getActiveTabInfo();
    const origin = active?.url || 'thaaw://newtab';
    return trackerBlocker.getStatsForDomain(origin);
  });

  ipcMain.handle('security:toggle-shield', () => {
    const active = tabManager?.getActiveTabInfo();
    const origin = active?.url || '';
    const newStatus = trackerBlocker.toggleShield(origin);
    return { isShieldActive: newStatus };
  });

  ipcMain.handle('security:set-protection-level', (_event, level: ProtectionLevel) => {
    trackerBlocker.setProtectionLevel(level);
    return { level: trackerBlocker.getProtectionLevel() };
  });

  ipcMain.handle('adblock:get-status', () => {
    const active = tabManager?.getActiveTabInfo();
    const origin = active?.url || '';
    return {
      enabled: trackerBlocker.adBlocker.isEnabled(),
      siteBlockedCount: origin ? trackerBlocker.adBlocker.getBlockedCountForSite(origin) : 0,
      totalBlockedCount: trackerBlocker.adBlocker.getTotalBlockedCount(),
      siteEnabled: origin ? trackerBlocker.adBlocker.isShieldActive(origin) : true,
    };
  });

  ipcMain.handle('adblock:toggle', (_event, enabled?: boolean) => {
    const newState = enabled !== undefined ? enabled : !trackerBlocker.adBlocker.isEnabled();
    trackerBlocker.adBlocker.setEnabled(newState);
    return { enabled: newState };
  });

  ipcMain.handle('adblock:toggle-site', (_event, hostname?: string) => {
    const active = tabManager?.getActiveTabInfo();
    let target = hostname || '';
    if (!target && active?.url) {
      try {
        target = new URL(active.url).hostname;
      } catch {
        target = '';
      }
    }
    if (!target) return { siteEnabled: true };
    const siteEnabled = trackerBlocker.adBlocker.toggleSiteException(target);
    return { siteEnabled, hostname: target };
  });

  ipcMain.on('permission:respond', (_event, { requestId, decision }: { requestId: string; decision: PermissionDecision }) => {
    permissionManager.handleResponse(requestId, decision);
  });

  ipcMain.on('download:respond', (_event, { downloadId, accept }: { downloadId: string; accept: boolean }) => {
    ipcMain.emit(`download:decision:${downloadId}`, null, accept);
  });

  // Downloads Subsystem API Handlers
  ipcMain.handle('downloads:get-recent', () => downloadManager.getRecentDownloads(5));
  ipcMain.handle('downloads:get-all', () => downloadManager.getAllDownloads());
  ipcMain.handle('downloads:pause', (_event, id: string) => downloadManager.pauseDownload(id));
  ipcMain.handle('downloads:resume', (_event, id: string) => downloadManager.resumeDownload(id));
  ipcMain.handle('downloads:cancel', (_event, id: string) => !!downloadManager.cancelDownload(id));
  ipcMain.handle('downloads:open-file', async (_event, id: string) => downloadManager.openFile(id));
  ipcMain.handle('downloads:open-folder', (_event, id: string) => downloadManager.openContainingFolder(id));
  ipcMain.handle('downloads:delete-file', (_event, id: string) => downloadManager.deleteFile(id));
  ipcMain.handle('downloads:remove-item', (_event, id: string) => downloadManager.removeDownload(id));
  ipcMain.handle('downloads:clear-completed', () => {
    downloadManager.clearCompleted();
    return true;
  });

  // Site Intelligence for Right-Side Sidebar
  ipcMain.handle('tab:get-site-intelligence', async () => {
    if (!tabManager) return null;
    const tabInfo = tabManager.getActiveTabInfo();
    if (!tabInfo) return null;

    const url = tabInfo.url || '';
    const isInternal = url.startsWith('thaaw://') || url.startsWith('view-source:');
    let domain = 'THAAW';
    let isSecure = true;
    let protocol = 'thaaw:';
    let trackerStats: any = null;
    let cookieCount = 0;
    let permissions: Record<string, 'allow' | 'deny' | 'prompt'> = {};

    if (!isInternal && (url.startsWith('http://') || url.startsWith('https://'))) {
      try {
        const parsed = new URL(url);
        domain = parsed.hostname;
        protocol = parsed.protocol;
        isSecure = protocol === 'https:';
        trackerStats = trackerBlocker.getStatsForDomain(url);
        permissions = permissionManager.getPermissionsForOrigin(parsed.origin);

        const activeProfile = profileManager.getActiveProfile();
        const partition = profileManager.getPartitionName(activeProfile.id);
        const sess = session.fromPartition(partition);
        const cookies = await sess.cookies.get({ domain });
        cookieCount = cookies.length;
      } catch {
        // Fallback
      }
    }

    const allDownloads = downloadManager.getAllDownloads();
    const siteDownloads = domain !== 'THAAW'
      ? allDownloads.filter(d => d.url && d.url.includes(domain)).slice(0, 5)
      : [];

    return {
      url,
      title: tabInfo.title || domain,
      favicon: tabInfo.favicon,
      domain,
      protocol,
      isSecure,
      isInternal,
      trackerStats,
      cookieCount,
      permissions,
      shieldActive: trackerStats ? trackerStats.isShieldActive : true,
      protectionLevel: trackerBlocker.getProtectionLevel(),
      downloads: siteDownloads
    };
  });

  ipcMain.on('sidebar:set-right', (_event, width: number) => {
    if (tabManager && typeof width === 'number') {
      tabManager.setRightSidebar(width);
    }
  });

  ipcMain.handle('site:clear-data', async (_event, domain: string) => {
    if (!domain || domain === 'THAAW') return false;
    try {
      const activeProfile = profileManager.getActiveProfile();
      const partition = profileManager.getPartitionName(activeProfile.id);
      const sess = session.fromPartition(partition);
      await sess.clearStorageData({
        origin: `https://${domain}`,
        storages: ['cookies', 'localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
      });
      await sess.clearStorageData({
        origin: `http://${domain}`,
        storages: ['cookies', 'localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
      });
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('site:set-permission', (_event, { origin, perm, value }: { origin: string; perm: string; value: 'allow' | 'deny' | 'prompt' }) => {
    permissionManager.setPermissionState(origin, perm as any, value);
    return true;
  });

  ipcMain.on('view:zoom-in', () => tabManager?.zoomInActiveTab());
  ipcMain.on('view:zoom-out', () => tabManager?.zoomOutActiveTab());
  ipcMain.on('view:zoom-reset', () => tabManager?.zoomResetActiveTab());
  ipcMain.on('window:minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
  });
  ipcMain.on('window:maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      if (tabManager) {
        setTimeout(() => tabManager?.updateActiveViewBounds(), 30);
        setTimeout(() => tabManager?.updateActiveViewBounds(), 100);
        setTimeout(() => tabManager?.updateActiveViewBounds(), 250);
      }
    }
  });
  ipcMain.on('window:close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });

  ipcMain.on('view:toggle-fullscreen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  ipcMain.on('view:print', () => {
    const wc = tabManager?.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) wc.print();
  });
  ipcMain.on('view:save', () => {
    const wc = tabManager?.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) (tabManager as any)?.savePageAs(wc);
  });
  ipcMain.on('view:source', () => {
    const wc = tabManager?.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) (tabManager as any)?.viewPageSource(wc);
  });

  ipcMain.on('tab:mute', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.toggleTabMute(sanitizedId);
    }
  });

  ipcMain.on('tab:pin', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.pinTab(sanitizedId);
    }
  });

  ipcMain.on('tab:duplicate', (_event, tabId: number) => {
    const { isValid, sanitizedId } = validateTabId(tabId);
    if (isValid && sanitizedId !== undefined && tabManager) {
      tabManager.duplicateTab(sanitizedId);
    }
  });

  ipcMain.handle('tab:search', (_event, query: string) => {
    if (!tabManager) return [];
    return tabManager.searchTabs(query || '');
  });

  ipcMain.on('tab:reopen-closed', () => {
    tabManager?.reopenClosedTab();
  });

  // Settings State Store (Profile-Scoped)
  ipcMain.handle('settings:get', () => profileManager.getProfileSettings());

  ipcMain.handle('settings:update', (_event, patch: Partial<ProfileSettings>) => {
    const updated = profileManager.updateProfileSettings(patch);
    if (typeof patch.showBookmarksBar === 'boolean') {
      const height = patch.showBookmarksBar ? 118 : 84;
      if (tabManager) {
        tabManager.setChromeHeight(height);
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser:bookmarks-bar-toggled', patch.showBookmarksBar);
      }
    }
    if (patch.protectionLevel) {
      trackerBlocker.setProtectionLevel(patch.protectionLevel as ProtectionLevel);
    }
    if ((patch.defaultSearchEngine || patch.customSearchUrl !== undefined) && tabManager) {
      const engine = patch.defaultSearchEngine || profileManager.getProfileSettings().defaultSearchEngine || 'duckduckgo';
      const customUrl = patch.customSearchUrl !== undefined ? patch.customSearchUrl : profileManager.getProfileSettings().customSearchUrl;
      tabManager.setDefaultSearchEngine(engine, customUrl);
      const engineUpdate = {
        engine,
        customUrl,
        label: engine === 'duckduckgo' ? 'DDG' :
               engine === 'google' ? 'Google' :
               engine === 'bing' ? 'Bing' :
               engine === 'brave' ? 'Brave' : 'Custom'
      };
      mainWindow?.webContents.send('browser:engine-updated', engineUpdate);
      tabManager.broadcast('browser:engine-updated', engineUpdate);
    }
    if (patch.theme || patch.themePreset) {
      const update = {
        theme: updated.theme,
        preset: updated.themePreset || (updated.theme === 'light' ? 'white' : 'midnight')
      };
      mainWindow?.webContents.send('browser:theme-updated', update);
      tabManager?.broadcast('browser:theme-updated', update);
    }
    return updated;
  });

  ipcMain.handle('profile:list', () => profileManager.listProfiles());
  ipcMain.handle('profile:get-active', () => profileManager.getActiveProfile());
  ipcMain.handle('profile:set-active', (_event, id: string) => {
    return applyActiveProfile(id, true);
  });
  ipcMain.handle('profile:create', (_event, name: string) => profileManager.createProfile(name));
  ipcMain.handle('profile:update', (_event, id: string, patch: { name?: string; email?: string; color?: string; avatar?: string; avatarIcon?: string }) => {
    const updated = profileManager.updateProfile(id, patch || {});
    if (updated?.id === profileManager.getActiveProfile().id) {
      mainWindow?.webContents.send('browser:profile-changed', updated);
    }
    return updated;
  });
  ipcMain.handle('profile:duplicate', (_event, id: string) => profileManager.duplicateProfile(id));
  ipcMain.handle('profile:update-settings', (_event, id: string, patch: Partial<ProfileSettings>) => {
    const updated = profileManager.updateProfileSettings(patch || {}, id);
    if (id === profileManager.getActiveProfile().id && (patch.theme || patch.themePreset)) {
      mainWindow?.webContents.send('browser:theme-updated', { theme: updated.theme, preset: updated.themePreset || 'midnight' });
    }
    return updated;
  });
  ipcMain.handle('profile:can-delete', (_event, id: string) => profileManager.canDeleteProfile(id));
  ipcMain.handle('profile:delete', async (_event, id: string) => {
    if (!profileManager.canDeleteProfile(id)) return { success: false, reason: 'Profile is active, protected, or the last available profile.' };
    const profile = profileManager.listProfiles().find(p => p.id === id);
    if (profile?.storagePath) {
      await session.fromPartition(profileManager.getPartitionName(id)).clearStorageData().catch(() => undefined);
    }
    return { success: profileManager.deleteProfile(id) };
  });
  ipcMain.handle('profile:get-startup-preference', () => profileManager.shouldShowProfilePickerOnStartup());
  ipcMain.handle('profile:set-startup-preference', (_event, val: boolean) => {
    profileManager.setShowProfilePickerOnStartup(val);
    return { success: true };
  });
  ipcMain.handle('profile:select-and-launch', (_event, profileId: string) => {
    applyActiveProfile(profileId, false);

    if (pickerWindow && !pickerWindow.isDestroyed()) {
      const pw = pickerWindow;
      pickerWindow = null;
      pw.close();
    }
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.focus();
    }
    return { success: true };
  });
  ipcMain.on('profile:picker-launch', () => {
    createProfilePickerWindow();
  });

  // PWA Subsystem IPC Handlers
  ipcMain.handle('pwa:install', async (_event, manifest) => {
    const res = await pwaManager.installPwa(manifest);
    if (res.success && res.pwa) {
      const activeProf = profileManager.getActiveProfile();
      const activePart = profileManager.getPartitionName(activeProf.id);
      pwaManager.openPwaWindow(res.pwa.id, activePart);
    }
    return res;
  });
  ipcMain.handle('pwa:open', (_event, id: string) => {
    const activeProf = profileManager.getActiveProfile();
    const activePart = profileManager.getPartitionName(activeProf.id);
    return { success: !!pwaManager.openPwaWindow(id, activePart) };
  });
  ipcMain.handle('pwa:list', () => pwaManager.listPwas());
  ipcMain.handle('pwa:uninstall', (_event, id: string) => pwaManager.uninstallPwa(id));
  ipcMain.handle('pwa:check-installed', (_event, originOrUrl: string) => pwaManager.isPwaInstalled(originOrUrl));

  ipcMain.on('profile:context-menu', (_event, id: string) => {
    const profile = profileManager.listProfiles().find(p => p.id === id);
    if (!profile || !tabManager) return;
    const canDelete = profileManager.canDeleteProfile(id);
    tabManager.showCustomContextMenu([
      { id: 'open', label: 'Open Profile', icon: 'user' },
      { id: 'edit', label: 'Edit Profile', icon: 'edit' },
      { id: 'duplicate', label: 'Duplicate Profile', icon: 'copy', disabled: profile.isPrivate },
      { id: 'rename', label: 'Rename Profile', icon: 'edit', disabled: profile.isPrivate },
      { id: 'avatar', label: 'Change Avatar', icon: 'image', disabled: profile.isPrivate },
      { id: 'settings', label: 'Profile Settings', icon: 'settings' },
      { id: 'separator', type: 'separator', label: '' },
      { id: 'delete', label: 'Delete Profile', icon: 'trash', disabled: !canDelete }
    ], action => {
      if (action === 'open') applyActiveProfile(id, true);
      else mainWindow?.webContents.send('browser:profile-context-action', { action, profileId: id });
    });
  });

  // Native Menus that render on top of WebContentsView
  ipcMain.on('menu:show-main', () => {
    if (!mainWindow) return;
    const template: Electron.MenuItemConstructorOptions[] = [
      { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: () => tabManager?.createTab('thaaw://newtab') },
      { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => createWindow() },
      { type: 'separator' },
      { label: 'Bookmarks', accelerator: 'CmdOrCtrl+Shift+O', click: () => tabManager?.createTab('thaaw://bookmarks') },
      { label: 'History', accelerator: 'CmdOrCtrl+H', click: () => tabManager?.createTab('thaaw://history') },
      { label: 'Downloads', accelerator: 'CmdOrCtrl+J', click: () => tabManager?.createTab('thaaw://downloads') },
      { label: 'Password Vault', click: () => tabManager?.createTab('thaaw://passwords') },
      { type: 'separator' },
      { label: 'Security Center', click: () => tabManager?.createTab('thaaw://security') },
      { label: 'Privacy Center', click: () => tabManager?.createTab('thaaw://privacy') },
      { label: 'Settings', click: () => tabManager?.createTab('thaaw://settings') },
      { type: 'separator' },
      { label: 'About THAAW', click: () => tabManager?.createTab('thaaw://about') }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });

  ipcMain.on('menu:show-profile', () => {
    if (!mainWindow) return;
    const active = profileManager.getActiveProfile();
    const profiles = profileManager.listProfiles();
    const currentUser = authManager.getCurrentUser();

    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: currentUser ? `Signed In: ${currentUser.name || currentUser.email}` : `Profile: ${active.name}`,
        enabled: false
      },
      {
        label: currentUser ? currentUser.email : `Mode: ${active.isPrivate ? 'Private' : 'Standard'}`,
        enabled: false
      },
      { type: 'separator' }
    ];

    profiles.forEach(p => {
      template.push({
        label: p.name + (p.id === 'guest' || p.isPrivate ? ' (Guest)' : ''),
        type: 'radio',
        checked: p.id === active.id,
        click: () => {
          applyActiveProfile(p.id, true);
        }
      });
    });

    template.push({ type: 'separator' });
    template.push({
      label: 'Open Profile Selector...',
      click: () => {
        createProfilePickerWindow();
      }
    });
    template.push({
      label: 'Manage Profiles & Settings...',
      click: () => tabManager?.createTab('thaaw://settings')
    });

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });

  ipcMain.on('menu:show-engine', () => {
    if (!mainWindow) return;
    const curSettings = profileManager.getProfileSettings();
    const engines: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'DuckDuckGo',
        type: 'radio',
        checked: curSettings.defaultSearchEngine === 'duckduckgo',
        click: () => {
          profileManager.updateProfileSettings({ defaultSearchEngine: 'duckduckgo' });
          tabManager?.setDefaultSearchEngine('duckduckgo');
          mainWindow?.webContents.send('browser:engine-updated', { engine: 'duckduckgo', label: 'DDG' });
        }
      },
      {
        label: 'Google',
        type: 'radio',
        checked: curSettings.defaultSearchEngine === 'google',
        click: () => {
          profileManager.updateProfileSettings({ defaultSearchEngine: 'google' });
          tabManager?.setDefaultSearchEngine('google');
          mainWindow?.webContents.send('browser:engine-updated', { engine: 'google', label: 'Google' });
        }
      },
      {
        label: 'Bing',
        type: 'radio',
        checked: curSettings.defaultSearchEngine === 'bing',
        click: () => {
          profileManager.updateProfileSettings({ defaultSearchEngine: 'bing' });
          tabManager?.setDefaultSearchEngine('bing');
          mainWindow?.webContents.send('browser:engine-updated', { engine: 'bing', label: 'Bing' });
        }
      },
      {
        label: 'Brave Search',
        type: 'radio',
        checked: curSettings.defaultSearchEngine === 'brave',
        click: () => {
          profileManager.updateProfileSettings({ defaultSearchEngine: 'brave' });
          tabManager?.setDefaultSearchEngine('brave');
          mainWindow?.webContents.send('browser:engine-updated', { engine: 'brave', label: 'Brave' });
        }
      }
    ];
    const menu = Menu.buildFromTemplate(engines);
    menu.popup({ window: mainWindow });
  });

  ipcMain.on('tab:modal-state', (_event, isOpen: boolean) => {
    tabManager?.setModalOpen(isOpen);
    mainWindow?.webContents.send('browser:modal-state', { isOpen });
  });

  ipcMain.handle('data:clear', async () => {
    const partition = profileManager.getPartitionName(profileManager.getActiveProfile().id);
    await session.fromPartition(partition).clearStorageData();
    return { success: true };
  });

  ipcMain.on('palette:action', (_event, commandId: string) => {
    if (!tabManager) return;
    switch (commandId) {
      case 'new-window':
        createWindow();
        break;
      case 'new-incognito':
        // Private profiles use an in-memory partition and leave no browser storage behind.
        applyActiveProfile('private', true);
        createWindow();
        break;
      case 'exit-app':
        app.quit();
        break;
      case 'new-tab':
        tabManager.createTab('thaaw://newtab');
        break;
      case 'reopen-closed-tab':
        tabManager.reopenClosedTab();
        break;
      case 'open-security':
        tabManager.createTab('thaaw://security');
        break;
      case 'open-privacy':
        tabManager.createTab('thaaw://privacy');
        break;
      case 'open-settings':
        tabManager.createTab('thaaw://settings');
        break;
      case 'open-about':
        tabManager.createTab('thaaw://about');
        break;
      case 'open-downloads':
        tabManager.createTab('thaaw://downloads');
        break;
      case 'open-history':
        tabManager.createTab('thaaw://history');
        break;
      case 'open-bookmarks':
        tabManager.createTab('thaaw://bookmarks');
        break;
      case 'open-passwords':
        tabManager.createTab('thaaw://passwords');
        break;
      case 'toggle-theme': {
        const curSettings = profileManager.getProfileSettings();
        const nextTheme = curSettings.theme === 'dark' ? 'light' : 'dark';
        const nextPreset = nextTheme === 'light' ? 'white' : 'midnight';
        profileManager.updateProfileSettings({ theme: nextTheme, themePreset: nextPreset });
        mainWindow?.webContents.send('browser:theme-updated', { theme: nextTheme, preset: nextPreset });
        tabManager?.broadcast('browser:theme-updated', { theme: nextTheme, preset: nextPreset });
        break;
      }
      case 'toggle-sidebar': {
        mainWindow?.webContents.send('browser:toggle-sidebar');
        break;
      }
      case 'toggle-shield': {
        const active = tabManager.getActiveTabInfo();
        if (active) {
          trackerBlocker.toggleShield(active.url);
          const stats = trackerBlocker.getStatsForDomain(active.url);
          mainWindow?.webContents.send('browser:security-status-updated', stats);
        }
        break;
      }
      case 'clear-data':
        session.defaultSession.clearStorageData();
        break;
    }
  });
}

function createProfilePickerWindow(): void {
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    pickerWindow.focus();
    return;
  }

  pickerWindow = new BrowserWindow({
    width: 860,
    height: 620,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#0A0D14',
    title: "Who's using THAAW?",
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'thaaw-app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  const candidate1 = path.join(__dirname, '..', 'profiles', 'profile-picker.html');
  const candidate2 = path.join(app.getAppPath(), 'browser', 'profiles', 'profile-picker.html');
  const candidate3 = path.join(app.getAppPath(), 'dist', 'browser', 'profiles', 'profile-picker.html');
  const pickerPath = fs.existsSync(candidate1) ? candidate1 : (fs.existsSync(candidate2) ? candidate2 : candidate3);
  pickerWindow.loadFile(pickerPath);

  pickerWindow.on('closed', () => {
    pickerWindow = null;
    if (!mainWindow && BrowserWindow.getAllWindows().length === 0) {
      app.quit();
    }
  });
}

function createWindow(): void {
  // Completely suppress standard desktop application menu (File / Edit / View / Window / Help)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0A0D14',
    title: 'THAAW',
    frame: false, // Frameless: THAAW tab bar serves as top window interface without OS title bar
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'thaaw-app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false, // Chrome UI window runs with preload bridge
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Load browser shell UI
  const uiPath = path.join(__dirname, '..', 'ui', 'index.html');
  mainWindow.loadFile(uiPath);

  const activeProfile = profileManager.getActiveProfile();
  const activeSettings = profileManager.getProfileSettings(activeProfile.id);

  // Synchronize initial Chromium native theme appearance with active profile
  const initialTheme = activeSettings.theme || 'dark';
  nativeTheme.themeSource = initialTheme === 'light' ? 'light' : initialTheme === 'dark' ? 'dark' : 'system';

  // Initialize Tab Manager with profile-aware managers
  tabManager = new TabManager(
    mainWindow,
    trackerBlocker,
    downloadManager,
    permissionManager,
    (tabs, activeTabId) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('browser:tabs-updated', { tabs, activeTabId });
      }
    },
    (activeUrl) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const stats = trackerBlocker.getStatsForDomain(activeUrl);
        mainWindow.webContents.send('browser:security-status-updated', stats);
      }
    },
    activeHistoryManager,
    profileManager,
    configureSessionSecurity
  );
  tabManager.setDefaultSearchEngine(activeSettings.defaultSearchEngine || 'duckduckgo');
  if (activeSettings.showBookmarksBar) {
    tabManager.setChromeHeight(118);
  }

  mainWindow.webContents.on('context-menu', (_e, params) => {
    if (!mainWindow || mainWindow.isDestroyed() || !tabManager) return;
    const items: any[] = [];
    if (params.isEditable) {
      items.push(
        { id: 'undo', label: 'Undo', icon: 'undo', shortcut: 'Ctrl+Z' },
        { id: 'redo', label: 'Redo', icon: 'redo', shortcut: 'Ctrl+Y' },
        { id: 'sep_1', type: 'separator', label: '' },
        { id: 'cut', label: 'Cut', icon: 'cut', shortcut: 'Ctrl+X' },
        { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'paste', label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V' },
        { id: 'paste-and-go', label: 'Paste and Go', icon: 'arrow-right' },
        { id: 'sep_2', type: 'separator', label: '' },
        { id: 'select-all', label: 'Select All', icon: 'select', shortcut: 'Ctrl+A' },
        { id: 'sep_3', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      const query = params.selectionText.trim();
      items.push(
        { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'search-selection', label: `Search for "${query.length > 24 ? query.slice(0, 24) + '...' : query}"`, icon: 'search' },
        { id: 'sep_1', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    } else {
      items.push(
        { id: 'new-tab', label: 'New Tab', icon: 'plus', shortcut: 'Ctrl+T' },
        { id: 'reload', label: 'Reload', icon: 'refresh', shortcut: 'Ctrl+R' },
        { id: 'sep_1', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    }

    tabManager.showCustomContextMenu(items, (actionId: string) => {
      switch (actionId) {
        case 'undo': mainWindow?.webContents.undo(); break;
        case 'redo': mainWindow?.webContents.redo(); break;
        case 'cut': mainWindow?.webContents.cut(); break;
        case 'copy': mainWindow?.webContents.copy(); break;
        case 'paste': mainWindow?.webContents.paste(); break;
        case 'paste-and-go': {
          const text = clipboard.readText().trim();
          if (text && tabManager) tabManager.navigateActiveTab(text);
          break;
        }
        case 'select-all': mainWindow?.webContents.selectAll(); break;
        case 'search-selection': {
          const query = params.selectionText.trim();
          if (query && tabManager) tabManager.createTab(query);
          break;
        }
        case 'new-tab': tabManager?.createTab('thaaw://newtab'); break;
        case 'reload': tabManager?.getActiveTabWebContents()?.reload(); break;
        case 'inspect': mainWindow?.webContents.inspectElement(params.x, params.y); break;
      }
    });
  });

  mainWindow.webContents.once('did-finish-load', () => {
    const elapsed = Date.now() - startupStartTime;
    console.log(`[THAAW Benchmark] Cold startup ready in ${elapsed}ms`);
    // Open initial tab
    tabManager?.createTab('thaaw://newtab');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    tabManager = null;
  });
}

app.whenReady().then(() => {
  setupProtocolHandlers();
  configureSessionSecurity(session.defaultSession);
  app.on('session-created', (sess) => {
    configureSessionSecurity(sess);
  });

  // Configure active profile session immediately; any other sessions configure lazily on demand
  const activeProf = profileManager.getActiveProfile();
  const activePart = profileManager.getPartitionName(activeProf.id);
  const activeSess = session.fromPartition(activePart);
  configureSessionSecurity(activeSess);

  setupIpcHandlers();

  // Check for standalone PWA startup argument (--app=URL)
  const appArg = process.argv.find(arg => arg.startsWith('--app='));
  if (appArg) {
    const appUrl = appArg.replace('--app=', '');
    let pwa = pwaManager.getInstalledPwaForUrl(appUrl);
    if (!pwa) {
      try {
        const origin = new URL(appUrl).origin;
        pwa = {
          id: pwaManager.generatePwaId(origin, appUrl),
          name: 'Web Application',
          shortName: 'App',
          description: '',
          startUrl: appUrl,
          scope: origin,
          iconUrl: '',
          themeColor: '#0A0D14',
          backgroundColor: '#0A0D14',
          origin,
          installedAt: Date.now()
        };
      } catch {}
    }
    if (pwa) {
      pwaManager.openPwaWindow(pwa.id, activePart);
    } else {
      createWindow();
    }
  } else {
    // Multi-Profile Startup Check
    const selectable = profileManager.getSelectableProfiles();
    const shouldShowPicker = profileManager.shouldShowProfilePickerOnStartup() && selectable.length > 1;

    if (shouldShowPicker) {
      createProfilePickerWindow();
    } else {
      createWindow();
    }
  }
  console.log('[THAAW] Browser initialized successfully. "Stop What Shouldn\'t Pass."');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !pickerWindow) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    activeHistoryManager.flushSave();
    activeBookmarkManager.flushSave();
  } catch {}
});

