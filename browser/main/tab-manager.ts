/**
 * THAAW Browser — Tab Lifecycle & Viewport Manager
 * Coordinates sandboxed WebContentsView instances per tab with strong session isolation,
 * native Chromium context menus, native DevTools integration, and engine error pages.
 * Principle: Untrusted web content is fully isolated; renderer issues never crash the browser shell.
 */

import { WebContentsView, BaseWindow, BrowserWindow, Menu, MenuItemConstructorOptions, clipboard, dialog, session, screen, ipcMain } from 'electron';
import path from 'path';
import { sanitizeNavigationUrl } from '../security/ipc-validator';
import { TrackerBlocker } from '../privacy/tracker-blocker';
import { AdBlocker } from '../privacy/ad-blocker';
import { DownloadManager } from '../downloads/download-manager';
import { PermissionManager } from '../permissions/permission-manager';
import { ProfileManager } from '../profiles/profile-manager';

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isAudioMuted: boolean;
  isAudioPlaying: boolean;
  isPinned?: boolean;
  isSleeping?: boolean;
  lastActiveAt?: number;
  pwa?: any;
}

export interface CustomContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  type?: 'item' | 'separator';
}

export class TabManager {
  private tabs = new Map<number, { info: TabInfo; view: WebContentsView }>();
  private nextTabId = 1;
  private activeTabId: number | null = null;
  private window: BaseWindow;
  private trackerBlocker: TrackerBlocker;
  private downloadManager: DownloadManager;
  private permissionManager: PermissionManager;
  private profileManager?: ProfileManager;
  private historyManager?: any;
  private onTabsUpdatedCallback: (tabs: TabInfo[], activeId: number | null) => void;
  private onSecurityStatusCallback: (url: string) => void;
  private sidebarOffsetWidth = 0;
  private rightSidebarWidth = 0;
  private contextMenuWindow: BrowserWindow | null = null;
  private currentContextMenuActionHandler: ((actionId: string) => void) | null = null;
  private configureSessionCallback?: (sess: Electron.Session) => void;

  // Header height for the browser chrome toolbar and tabstrip (42px tabstrip + 42px toolbar)
  private static readonly CHROME_HEIGHT = 84;
  private chromeHeight = TabManager.CHROME_HEIGHT;
  private minimalMode = false;
  private memorySaverTimer: NodeJS.Timeout | null = null;
  private memorySaverThresholdMs = 15 * 60 * 1000; // 15 minutes inactive tab threshold
  private memorySaverEnabled = true;
  private closedTabs: Array<{ url: string; title: string }> = [];

  constructor(
    window: BaseWindow,
    trackerBlocker: TrackerBlocker,
    downloadManager: DownloadManager,
    permissionManager: PermissionManager,
    onTabsUpdated: (tabs: TabInfo[], activeId: number | null) => void,
    onSecurityStatus: (url: string) => void,
    historyManager?: any,
    profileManager?: ProfileManager,
    configureSessionCallback?: (sess: Electron.Session) => void
  ) {
    this.window = window;
    this.trackerBlocker = trackerBlocker;
    this.downloadManager = downloadManager;
    this.permissionManager = permissionManager;
    this.onTabsUpdatedCallback = onTabsUpdated;
    this.onSecurityStatusCallback = onSecurityStatus;
    this.historyManager = historyManager;
    this.profileManager = profileManager;
    this.configureSessionCallback = configureSessionCallback;

    this.setupWindowResizeListener();
    this.startMemorySaverLoop();
  }

  private startMemorySaverLoop(): void {
    if (this.memorySaverTimer) clearInterval(this.memorySaverTimer);
    this.memorySaverTimer = setInterval(() => {
      if (!this.memorySaverEnabled) return;
      const now = Date.now();
      this.tabs.forEach((tab, id) => {
        if (id === this.activeTabId) return;
        if (tab.info.isPinned || tab.info.isAudioPlaying || tab.info.isSleeping) return;
        if (tab.info.url && tab.info.url.startsWith('thaaw://')) return;
        const last = tab.info.lastActiveAt || now;
        if (now - last > this.memorySaverThresholdMs) {
          this.sleepTab(id);
        }
      });
    }, 60000);
    if (this.memorySaverTimer.unref) {
      this.memorySaverTimer.unref();
    }
  }

  private setupWindowResizeListener(): void {
    const triggerUpdate = () => {
      this.updateActiveViewBounds();
      // Ensure asynchronous window geometry updates on Linux X11/Wayland settle completely
      setTimeout(() => this.updateActiveViewBounds(), 30);
      setTimeout(() => this.updateActiveViewBounds(), 100);
      setTimeout(() => this.updateActiveViewBounds(), 250);
    };

    this.window.on('resize', triggerUpdate);
    (this.window as any).on?.('resized', triggerUpdate);
    (this.window as any).on?.('maximize', triggerUpdate);
    (this.window as any).on?.('unmaximize', triggerUpdate);
    (this.window as any).on?.('enter-full-screen', triggerUpdate);
    (this.window as any).on?.('leave-full-screen', triggerUpdate);
    (this.window as any).on?.('restore', triggerUpdate);
  }

  public setSidebarOffset(width: number): void {
    this.sidebarOffsetWidth = Math.max(0, width);
    this.updateActiveViewBounds();
  }

  public setRightSidebar(width: number): void {
    this.rightSidebarWidth = Math.max(0, width);
    this.updateActiveViewBounds();
  }

  public getActiveTabWebContents(): Electron.WebContents | null {
    if (!this.activeTabId) return null;
    const active = this.tabs.get(this.activeTabId);
    return active ? active.view.webContents : null;
  }

  public zoomInActiveTab(): void {
    const wc = this.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) {
      const current = wc.getZoomFactor();
      const next = Math.min(3.0, Math.round((current + 0.1) * 10) / 10);
      wc.setZoomFactor(next);
      this.broadcastToWindow('browser:zoom-changed', Math.round(next * 100));
    }
  }

  public zoomOutActiveTab(): void {
    const wc = this.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) {
      const current = wc.getZoomFactor();
      const next = Math.max(0.25, Math.round((current - 0.1) * 10) / 10);
      wc.setZoomFactor(next);
      this.broadcastToWindow('browser:zoom-changed', Math.round(next * 100));
    }
  }

  public zoomResetActiveTab(): void {
    const wc = this.getActiveTabWebContents();
    if (wc && !wc.isDestroyed()) {
      wc.setZoomFactor(1.0);
      this.broadcastToWindow('browser:zoom-changed', 100);
    }
  }

  public setWallpaperFromUrl(imageUrl: string): void {
    if (!imageUrl) return;
    if (this.profileManager) {
      this.profileManager.updateProfileSettings({ wallpaper: imageUrl });
    }
    this.broadcastToWindow('browser:wallpaper-updated', imageUrl);
    this.broadcastToWindow('browser:show-toast', { message: 'Image set as browser wallpaper', type: 'info' });
  }

  public setProfileManager(profileManager: ProfileManager): void {
    this.profileManager = profileManager;
  }

  public setHistoryManager(historyManager: any): void {
    this.historyManager = historyManager;
  }

  public broadcast(channel: string, ...args: any[]): void {
    this.tabs.forEach(tab => {
      try {
        if (!tab.view.webContents.isDestroyed()) {
          tab.view.webContents.send(channel, ...args);
        }
      } catch {}
    });
  }

  private broadcastToWindow(channel: string, ...args: any[]): void {
    try {
      const win = this.window as any;
      if (win && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    } catch {}
  }

  private isModalStateOpen = false;

  public async setModalOpen(isOpen: boolean): Promise<void> {
    if (this.isModalStateOpen === isOpen) return;
    this.isModalStateOpen = isOpen;

    if (this.activeTabId) {
      const active = this.tabs.get(this.activeTabId);
      if (active && !active.view.webContents.isDestroyed()) {
        if (isOpen) {
          try {
            const image = await active.view.webContents.capturePage();
            if (this.isModalStateOpen && !active.view.webContents.isDestroyed()) {
              const dataUrl = image.toDataURL();
              this.broadcastToWindow('browser:tab-snapshot', { dataUrl, visible: true });
              active.view.setVisible(false);
            }
          } catch {
            if (this.isModalStateOpen) {
              active.view.setVisible(false);
            }
          }
        } else {
          active.view.setVisible(true);
          this.broadcastToWindow('browser:tab-snapshot', { visible: false });
        }
      }
    }

    // Broadcast modal state to the active tab view and all views so internal pages can adjust their overlapping elements
    this.broadcast('browser:modal-state', { isOpen });
  }

  public updateActiveViewBounds(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (!active) return;

    const bounds = typeof (this.window as any).getContentBounds === 'function'
      ? (this.window as any).getContentBounds()
      : this.window.getBounds();
    const x = this.sidebarOffsetWidth;
    const width = Math.max(0, bounds.width - x - this.rightSidebarWidth);
    // Position the web view below the browser UI chrome toolbar
    active.view.setBounds({
      x,
      y: this.chromeHeight,
      width,
      height: Math.max(0, bounds.height - this.chromeHeight)
    });
  }

  private defaultSearchEngine = 'duckduckgo';
  private customSearchUrl?: string;

  public setDefaultSearchEngine(engine: string, customUrl?: string): void {
    this.defaultSearchEngine = engine || 'duckduckgo';
    this.customSearchUrl = customUrl;
  }

  public getDefaultSearchEngine(): string {
    return this.defaultSearchEngine;
  }

  public getCustomSearchUrl(): string | undefined {
    return this.customSearchUrl;
  }

  /**
   * Creates a new tab with hardened security defaults and profile partition isolation.
   */
  public createTab(initialUrl: string = 'thaaw://newtab'): TabInfo {
    const tabId = this.nextTabId++;
    const partition = this.profileManager?.getPartitionName(this.profileManager.getActiveProfile().id) || 'persist:thaaw_profile_default';
    const tabSession = session.fromPartition(partition);
    if (this.configureSessionCallback) {
      this.configureSessionCallback(tabSession);
    }

    // Create sandboxed WebContentsView with preload bridge for internal pages and isolated partition
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true,
        devTools: true,
        allowRunningInsecureContent: false,
        navigateOnDragDrop: false,
        spellcheck: true,
        partition
      }
    });

    const isNewTab = initialUrl.startsWith('thaaw://newtab') || initialUrl === 'about:blank';
    try {
      view.setBackgroundColor(isNewTab ? '#00000000' : '#0A0D14');
    } catch {}

    const info: TabInfo = {
      id: tabId,
      url: initialUrl,
      title: 'New Tab',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isAudioMuted: false,
      isAudioPlaying: false,
      isPinned: false,
      isSleeping: false,
      lastActiveAt: Date.now()
    };

    this.tabs.set(tabId, { info, view });
    this.setupViewEventListeners(tabId, view, info);

    // Navigate to initial URL
    this.navigateTab(tabId, initialUrl);

    // Make this the active tab
    this.switchTab(tabId);

    return info;
  }

  private setupViewEventListeners(tabId: number, view: WebContentsView, info: TabInfo): void {
    const { webContents } = view;

    // Do not aggressively throttle new views; throttling is managed dynamically per tab activity & media playback
    try {
      (webContents as any).setBackgroundThrottling?.(false);
    } catch {}

    // Standard Chromium Developer & Navigation Keyboard Shortcuts
    webContents.on('before-input-event', (event, input) => {
      info.lastActiveAt = Date.now();
      if (input.type !== 'keyDown') return;

      const isMac = process.platform === 'darwin';
      const cmdOrCtrl = isMac ? input.meta : input.control;

      // Ctrl++ / Ctrl+=: Zoom In
      if (cmdOrCtrl && (input.key === '=' || input.key === '+' || input.key === 'Add')) {
        event.preventDefault();
        this.zoomInActiveTab();
        return;
      }

      // Ctrl+-: Zoom Out
      if (cmdOrCtrl && (input.key === '-' || input.key === '_' || input.key === 'Subtract')) {
        event.preventDefault();
        this.zoomOutActiveTab();
        return;
      }

      // Ctrl+0: Reset Zoom
      if (cmdOrCtrl && (input.key === '0' || input.code === 'Numpad0')) {
        event.preventDefault();
        this.zoomResetActiveTab();
        return;
      }

      // F12 or Ctrl+Shift+I: Toggle DevTools
      if (input.key === 'F12' || (cmdOrCtrl && input.shift && (input.key === 'I' || input.key === 'i'))) {
        event.preventDefault();
        this.toggleDevToolsActiveTab();
        return;
      }

      // Ctrl+Shift+J: DevTools Console
      if (cmdOrCtrl && input.shift && (input.key === 'J' || input.key === 'j')) {
        event.preventDefault();
        this.openDevToolsActiveTab('bottom');
        return;
      }

      // Ctrl+Shift+C: Inspect Element
      if (cmdOrCtrl && input.shift && (input.key === 'C' || input.key === 'c')) {
        event.preventDefault();
        this.inspectElementActiveTab();
        return;
      }

      // Ctrl+U: View Source
      if (cmdOrCtrl && !input.shift && (input.key === 'U' || input.key === 'u')) {
        event.preventDefault();
        this.viewPageSource(webContents);
        return;
      }

      // Ctrl+T: New Tab
      if (cmdOrCtrl && !input.shift && (input.key === 'T' || input.key === 't')) {
        event.preventDefault();
        this.createTab('thaaw://newtab');
        return;
      }

      // Ctrl+W: Close Current Tab
      if (cmdOrCtrl && !input.shift && (input.key === 'W' || input.key === 'w')) {
        event.preventDefault();
        this.closeTab(tabId);
        return;
      }

      // Ctrl+Shift+T: Reopen Closed Tab
      if (cmdOrCtrl && input.shift && (input.key === 'T' || input.key === 't')) {
        event.preventDefault();
        this.reopenClosedTab();
        return;
      }

      // Ctrl+R or F5: Reload Tab
      if ((cmdOrCtrl && !input.shift && (input.key === 'R' || input.key === 'r')) || input.key === 'F5') {
        event.preventDefault();
        webContents.reload();
        return;
      }

      // Ctrl+Shift+R or Ctrl+F5: Hard Reload (Ignore Cache)
      if ((cmdOrCtrl && input.shift && (input.key === 'R' || input.key === 'r')) || (cmdOrCtrl && input.key === 'F5')) {
        event.preventDefault();
        webContents.reloadIgnoringCache();
        return;
      }

      // Alt+Left: Back
      if (input.alt && input.key === 'ArrowLeft') {
        event.preventDefault();
        const nav = (webContents as any).navigationHistory;
        if (nav ? nav.canGoBack() : webContents.canGoBack()) {
          nav ? nav.goBack() : webContents.goBack();
        }
        return;
      }

      // Alt+Right: Forward
      if (input.alt && input.key === 'ArrowRight') {
        event.preventDefault();
        const nav = (webContents as any).navigationHistory;
        if (nav ? nav.canGoForward() : webContents.canGoForward()) {
          nav ? nav.goForward() : webContents.goForward();
        }
        return;
      }

      // Ctrl+P: Print
      if (cmdOrCtrl && !input.shift && (input.key === 'P' || input.key === 'p')) {
        event.preventDefault();
        webContents.print();
        return;
      }

      // Ctrl+S: Save Page
      if (cmdOrCtrl && !input.shift && (input.key === 'S' || input.key === 's')) {
        event.preventDefault();
        this.savePageAs(webContents);
        return;
      }

      // Ctrl+L or Alt+D: Focus Address Bar
      if ((cmdOrCtrl && !input.shift && (input.key === 'L' || input.key === 'l')) || (input.alt && (input.key === 'D' || input.key === 'd'))) {
        event.preventDefault();
        this.broadcastToWindow('browser:focus-omnibox');
        return;
      }

      // Ctrl+Shift+P: Command Palette
      if (cmdOrCtrl && input.shift && (input.key === 'P' || input.key === 'p')) {
        event.preventDefault();
        this.broadcastToWindow('browser:open-palette');
        return;
      }

      // Ctrl+Shift+A: Tab Search
      if (cmdOrCtrl && input.shift && (input.key === 'A' || input.key === 'a')) {
        event.preventDefault();
        this.broadcastToWindow('browser:open-tab-search');
        return;
      }

      // Ctrl+Tab: Next Tab
      if (input.control && input.key === 'Tab') {
        event.preventDefault();
        const tabIds = Array.from(this.tabs.keys());
        if (tabIds.length > 1) {
          const currentIdx = tabIds.indexOf(tabId);
          if (currentIdx !== -1) {
            const nextIdx = input.shift
              ? (currentIdx - 1 + tabIds.length) % tabIds.length
              : (currentIdx + 1) % tabIds.length;
            this.switchTab(tabIds[nextIdx]);
          }
        }
        return;
      }

      // Ctrl+1 through Ctrl+8: Jump to Tab
      if (cmdOrCtrl && !input.shift && input.key >= '1' && input.key <= '8') {
        event.preventDefault();
        const targetIndex = parseInt(input.key, 10) - 1;
        const tabIds = Array.from(this.tabs.keys());
        if (targetIndex < tabIds.length) {
          this.switchTab(tabIds[targetIndex]);
        }
        return;
      }

      // Ctrl+9: Jump to Last Tab
      if (cmdOrCtrl && !input.shift && input.key === '9') {
        event.preventDefault();
        const tabIds = Array.from(this.tabs.keys());
        if (tabIds.length > 0) {
          this.switchTab(tabIds[tabIds.length - 1]);
        }
        return;
      }
    });

    // Navigation and title tracking
    webContents.on('did-start-loading', () => {
      info.isLoading = true;
      if (!info.title || info.title === 'New Tab') {
        info.title = 'Loading...';
      }
      this.notifyTabsUpdated();
    });

    webContents.on('did-stop-loading', () => {
      info.isLoading = false;
      info.lastActiveAt = Date.now();
      const navHistory = (webContents as unknown as { navigationHistory?: { canGoBack(): boolean; canGoForward(): boolean; goBack(): void; goForward(): void } }).navigationHistory;
      info.canGoBack = navHistory ? navHistory.canGoBack() : webContents.canGoBack();
      info.canGoForward = navHistory ? navHistory.canGoForward() : webContents.canGoForward();
      info.url = webContents.getURL();
      this.notifyTabsUpdated();
      if (this.activeTabId === tabId) {
        this.onSecurityStatusCallback(info.url);
      }
      if (info.url && !info.url.startsWith('thaaw://') && !info.url.startsWith('about:') && !info.url.startsWith('view-source:')) {
        try {
          this.historyManager?.addEntry(info.url, info.title);
        } catch {
          // Ignored
        }
      }
      this.detectPwaStatus(tabId, webContents);
    });

    // Native Chromium Error Page Handling on Load Failure
    webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // Ignore -3 ERR_ABORTED (user stopped loading or redirect in progress)
      if (isMainFrame && errorCode !== -3) {
        console.warn(`[THAAW] Tab ${tabId} failed to load ${validatedURL}: [${errorCode}] ${errorDescription}`);
        info.isLoading = false;
        const errorPageUrl = `thaaw://error?code=${errorCode}&desc=${encodeURIComponent(errorDescription)}&url=${encodeURIComponent(validatedURL)}`;
        info.url = errorPageUrl;
        webContents.loadURL(errorPageUrl).catch(() => {});
        this.notifyTabsUpdated();
      }
    });

    webContents.on('page-title-updated', (_event, title) => {
      info.title = title || 'Untitled';
      this.notifyTabsUpdated();
    });

    webContents.on('page-favicon-updated', (_event, favicons) => {
      if (favicons.length > 0) {
        info.favicon = favicons[0];
        this.notifyTabsUpdated();
      }
    });

    // Audio status & background media unthrottling to eliminate video/audio crackles
    webContents.on('media-started-playing', () => {
      info.isAudioPlaying = true;
      try {
        (webContents as any).setBackgroundThrottling?.(false);
      } catch {}
      this.notifyTabsUpdated();
    });

    webContents.on('media-paused', () => {
      info.isAudioPlaying = false;
      if (this.activeTabId !== tabId) {
        try {
          (webContents as any).setBackgroundThrottling?.(true);
        } catch {}
      }
      this.notifyTabsUpdated();
    });

    // Mark responsive as soon as the main frame finishes loading
    webContents.on('did-frame-finish-load', (_event, isMainFrame) => {
      if (isMainFrame && info.isLoading) {
        info.isLoading = false;
        this.notifyTabsUpdated();
      }
    });

    // Inject cosmetic ad-blocking CSS and mark responsive when DOM is ready
    webContents.on('dom-ready', () => {
      if (info.isLoading) {
        info.isLoading = false;
        this.notifyTabsUpdated();
      }
      const currentUrl = webContents.getURL();
      if (
        currentUrl &&
        !currentUrl.startsWith('thaaw://') &&
        !currentUrl.startsWith('about:') &&
        !currentUrl.startsWith('view-source:')
      ) {
        if (this.trackerBlocker.isShieldActiveForDomain(currentUrl)) {
          webContents.insertCSS(AdBlocker.COSMETIC_FILTERS_CSS).catch(() => {});
        }
      }
    });

    // Crash containment
    webContents.on('render-process-gone', (_event, details) => {
      console.warn(`[THAAW] Tab ${tabId} renderer process gone: ${details.reason}`);
      info.title = 'Tab Crashed (Isolated)';
      info.isLoading = false;
      this.notifyTabsUpdated();
    });

    // Intercept window.open popups
    webContents.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });

    // Synchronize Chromium pinch/wheel zoom events
    webContents.on('zoom-changed', (_event, zoomDirection) => {
      if (zoomDirection === 'in') {
        this.zoomInActiveTab();
      } else if (zoomDirection === 'out') {
        this.zoomOutActiveTab();
      }
    });

    // Native Chromium Right-Click Context Menu
    webContents.on('context-menu', (_event, params) => {
      this.showContextMenu(webContents, params);
    });
  }

  private async detectPwaStatus(tabId: number, webContents: Electron.WebContents): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab || webContents.isDestroyed()) return;
    const currentUrl = webContents.getURL();
    if (!currentUrl || (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://'))) {
      tab.info.pwa = undefined;
      if (this.activeTabId === tabId) {
        this.broadcastToWindow('browser:pwa-status', { tabId, isPwa: false });
      }
      return;
    }

    try {
      const script = `
        (async () => {
          try {
            const manifestLink = document.querySelector('link[rel="manifest"]');
            const hasServiceWorker = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
            if (!manifestLink && !hasServiceWorker) {
              return { isPwa: false };
            }

            let manifest = null;
            if (manifestLink && manifestLink.href) {
              try {
                const res = await fetch(manifestLink.href);
                if (res.ok) {
                  manifest = await res.json();
                }
              } catch {}
            }

            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            const favIcon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            let iconUrl = '';

            if (manifest && Array.isArray(manifest.icons) && manifest.icons.length > 0) {
              const sorted = manifest.icons.slice().sort((a, b) => {
                const sa = parseInt((a.sizes || '0').split('x')[0], 10) || 0;
                const sb = parseInt((b.sizes || '0').split('x')[0], 10) || 0;
                return sb - sa;
              });
              if (sorted[0] && sorted[0].src) {
                iconUrl = new URL(sorted[0].src, manifestLink ? manifestLink.href : window.location.href).href;
              }
            }

            if (!iconUrl) {
              if (appleIcon && appleIcon.href) iconUrl = appleIcon.href;
              else if (favIcon && favIcon.href) iconUrl = favIcon.href;
              else iconUrl = window.location.origin + '/favicon.ico';
            }

            const name = (manifest && (manifest.name || manifest.short_name)) || document.title || window.location.hostname;
            const shortName = (manifest && (manifest.short_name || manifest.name)) || name;
            const startUrl = (manifest && manifest.start_url) ? new URL(manifest.start_url, window.location.origin).href : window.location.href;
            const themeColor = (manifest && manifest.theme_color) || (document.querySelector('meta[name="theme-color"]') ? document.querySelector('meta[name="theme-color"]').content : '#0A0D14');

            return {
              isPwa: true,
              name,
              shortName,
              description: (manifest && manifest.description) || '',
              startUrl,
              iconUrl,
              themeColor,
              origin: window.location.origin
            };
          } catch {
            return { isPwa: false };
          }
        })()
      `;
      const result = await webContents.executeJavaScript(script, true);
      if (result && result.isPwa) {
        tab.info.pwa = result;
        if (this.activeTabId === tabId) {
          this.broadcastToWindow('browser:pwa-status', { tabId, isPwa: true, pwa: result });
        }
      } else {
        tab.info.pwa = undefined;
        if (this.activeTabId === tabId) {
          this.broadcastToWindow('browser:pwa-status', { tabId, isPwa: false });
        }
      }
    } catch {
      tab.info.pwa = undefined;
      if (this.activeTabId === tabId) {
        this.broadcastToWindow('browser:pwa-status', { tabId, isPwa: false });
      }
    }
  }

  /**
   * Shows a 100% custom THAAW context menu styled with design tokens and icons.
   */
  public showCustomContextMenu(
    items: CustomContextMenuItem[],
    onAction: (actionId: string) => void
  ): void {
    try {
      if (!this.contextMenuWindow || this.contextMenuWindow.isDestroyed()) {
        const preloadPath = path.join(__dirname, 'context-menu-preload.js');
        const htmlPath = path.join(__dirname, '..', 'ui', 'context-menu.html');

        this.contextMenuWindow = new BrowserWindow({
          width: 250,
          height: 380,
          useContentSize: true,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          parent: this.window as any,
          skipTaskbar: true,
          resizable: false,
          show: false,
          webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            sandbox: false
          }
        });

        this.contextMenuWindow.loadFile(htmlPath);

        this.contextMenuWindow.on('blur', () => {
          this.hideContextMenu();
        });

        ipcMain.on('context-menu:select-action', (_event: any, actionId: string) => {
          const handler = this.currentContextMenuActionHandler;
          this.hideContextMenu();
          if (handler) {
            handler(actionId);
          }
        });

        ipcMain.on('context-menu:resize', (_event: any, { width, height }: { width: number; height: number }) => {
          if (this.contextMenuWindow && !this.contextMenuWindow.isDestroyed()) {
            this.contextMenuWindow.setSize(Math.max(220, width), Math.max(100, height));
          }
        });

        ipcMain.on('context-menu:close', () => {
          this.hideContextMenu();
        });
      }

      this.currentContextMenuActionHandler = onAction;

      const cursor = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursor);
      const workArea = display.workArea;

      const menuWidth = 250;
      const estimatedHeight = Math.min(520, items.length * 32 + 24);
      let x = cursor.x;
      let y = cursor.y;

      if (x + menuWidth > workArea.x + workArea.width) {
        x = cursor.x - menuWidth;
      }
      if (y + estimatedHeight > workArea.y + workArea.height) {
        y = cursor.y - estimatedHeight;
      }

      this.contextMenuWindow.setBounds({
        x: Math.max(workArea.x, x),
        y: Math.max(workArea.y, y),
        width: menuWidth,
        height: estimatedHeight
      });

      this.contextMenuWindow.webContents.send('context-menu:set-items', items);
      this.contextMenuWindow.show();
    } catch {
      // Graceful fallback for non-Electron test runner
    }
  }

  public hideContextMenu(): void {
    if (this.contextMenuWindow && !this.contextMenuWindow.isDestroyed()) {
      this.contextMenuWindow.hide();
    }
    this.currentContextMenuActionHandler = null;
  }

  /**
   * Fully Functional Custom THAAW Context Menu (zero OS native menu)
   */
  public showContextMenu(webContents: Electron.WebContents, params: Electron.ContextMenuParams): void {
    const items: CustomContextMenuItem[] = [];

    // 1. Link Context
    if (params.linkURL) {
      items.push(
        { id: 'open-link-new-tab', label: 'Open Link in New Tab', icon: 'external-link' },
        { id: 'open-link-new-window', label: 'Open Link in New Window', icon: 'window' },
        { id: 'copy-link', label: 'Copy Link Address', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'save-link', label: 'Save Link As...', icon: 'download', shortcut: 'Ctrl+S' },
        { id: 'sep_1', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    }
    // 2. Image Context
    else if (params.mediaType === 'image' || params.hasImageContents) {
      items.push(
        { id: 'open-image-new-tab', label: 'Open Image in New Tab', icon: 'image' },
        { id: 'view-fullscreen-image', label: 'View Fullscreen Image', icon: 'maximize' },
        { id: 'save-as-wallpaper', label: 'Save as Wallpaper', icon: 'image' },
        { id: 'save-image', label: 'Save Image As...', icon: 'download' },
        { id: 'copy-image', label: 'Copy Image', icon: 'copy' },
        { id: 'copy-image-address', label: 'Copy Image Address', icon: 'copy' },
        { id: 'sep_img', type: 'separator', label: '' },
        { id: 'block-element', label: 'Block Element', icon: 'shield-ban' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    }
    // 3. Audio & Video Context
    else if (params.mediaType === 'audio' || params.mediaType === 'video') {
      items.push(
        { id: 'open-media-new-tab', label: 'Open Media in New Tab', icon: 'play' },
        { id: 'save-media', label: 'Save Media As...', icon: 'download' },
        { id: 'copy-media-address', label: 'Copy Media Address', icon: 'copy' },
        { id: 'sep_med', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code' }
      );
    }
    // 4. Editable / Input Context
    else if (params.isEditable) {
      items.push(
        { id: 'undo', label: 'Undo', icon: 'undo', shortcut: 'Ctrl+Z', disabled: !params.editFlags.canUndo },
        { id: 'redo', label: 'Redo', icon: 'redo', shortcut: 'Ctrl+Y', disabled: !params.editFlags.canRedo },
        { id: 'sep_edit_1', type: 'separator', label: '' },
        { id: 'cut', label: 'Cut', icon: 'cut', shortcut: 'Ctrl+X', disabled: !params.editFlags.canCut },
        { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C', disabled: !params.editFlags.canCopy },
        { id: 'paste', label: 'Paste', icon: 'clipboard', shortcut: 'Ctrl+V', disabled: !params.editFlags.canPaste },
        { id: 'select-all', label: 'Select All', icon: 'select', shortcut: 'Ctrl+A', disabled: !params.editFlags.canSelectAll },
        { id: 'sep_edit_2', type: 'separator', label: '' },
        { id: 'inspect', label: 'Inspect', icon: 'code' }
      );
    }
    // 5. Selection Context
    else if (params.selectionText && params.selectionText.trim().length > 0) {
      const query = params.selectionText.trim();
      const displayQuery = query.length > 25 ? query.substring(0, 25) + '...' : query;
      const engine = (this.defaultSearchEngine || 'duckduckgo').toLowerCase();
      const engineLabel = engine === 'google' ? 'Google' : engine === 'bing' ? 'Bing' : engine === 'brave' ? 'Brave' : 'DuckDuckGo';

      items.push(
        { id: 'copy', label: 'Copy', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'search-selection', label: `Search ${engineLabel} for "${displayQuery}"`, icon: 'search' },
        { id: 'translate-selection', label: 'Translate Selection', icon: 'globe' },
        { id: 'sep_sel', type: 'separator', label: '' },
        { id: 'print', label: 'Print...', icon: 'printer', shortcut: 'Ctrl+P' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    }
    // 6. Normal Page Context
    else {
      const canBack = webContents.canGoBack();
      const canFwd = webContents.canGoForward();

      items.push(
        { id: 'back', label: 'Back', icon: 'arrow-left', shortcut: 'Alt+Left', disabled: !canBack },
        { id: 'forward', label: 'Forward', icon: 'arrow-right', shortcut: 'Alt+Right', disabled: !canFwd },
        { id: 'reload', label: 'Reload', icon: 'refresh', shortcut: 'Ctrl+R' },
        { id: 'sep_nav', type: 'separator', label: '' },
        { id: 'save-page', label: 'Save Page As...', icon: 'download', shortcut: 'Ctrl+S' },
        { id: 'print', label: 'Print...', icon: 'printer', shortcut: 'Ctrl+P' },
        { id: 'translate', label: 'Translate to English', icon: 'globe' },
        { id: 'view-source', label: 'View Page Source', icon: 'code', shortcut: 'Ctrl+U' },
        { id: 'sep_tools', type: 'separator', label: '' },
        { id: 'create-qr', label: 'Create QR Code for this Page', icon: 'qr-code' },
        { id: 'block-elements-site', label: 'Block Elements on this Site', icon: 'shield-ban' },
        { id: 'inspect', label: 'Inspect', icon: 'code', shortcut: 'Ctrl+Shift+I' }
      );
    }

    this.showCustomContextMenu(items, (actionId) => {
      switch (actionId) {
        case 'open-link-new-tab':
        case 'open-link-new-window':
          this.createTab(params.linkURL);
          break;
        case 'copy-link':
          clipboard.writeText(params.linkURL);
          break;
        case 'save-link':
          webContents.downloadURL(params.linkURL);
          break;
        case 'open-image-new-tab':
          this.createTab(params.srcURL);
          break;
        case 'view-fullscreen-image':
          this.broadcastToWindow('browser:view-image-fullscreen', params.srcURL);
          break;
        case 'save-as-wallpaper':
          this.setWallpaperFromUrl(params.srcURL);
          break;
        case 'save-image':
          webContents.downloadURL(params.srcURL);
          break;
        case 'copy-image':
          webContents.copyImageAt(params.x, params.y);
          break;
        case 'copy-image-address':
          clipboard.writeText(params.srcURL);
          break;
        case 'block-element':
          webContents.executeJavaScript(`
            (() => {
              const el = document.elementFromPoint(${params.x}, ${params.y});
              if (el) el.style.display = 'none';
            })();
          `);
          break;
        case 'open-media-new-tab':
          this.createTab(params.srcURL);
          break;
        case 'save-media':
          webContents.downloadURL(params.srcURL);
          break;
        case 'copy-media-address':
          clipboard.writeText(params.srcURL);
          break;
        case 'undo':
          webContents.undo();
          break;
        case 'redo':
          webContents.redo();
          break;
        case 'cut':
          webContents.cut();
          break;
        case 'copy':
          webContents.copy();
          break;
        case 'paste':
          webContents.paste();
          break;
        case 'select-all':
          webContents.selectAll();
          break;
        case 'search-selection': {
          const query = params.selectionText.trim();
          const engine = (this.defaultSearchEngine || 'duckduckgo').toLowerCase();
          let searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
          if (engine === 'google') searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          else if (engine === 'bing') searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
          else if (engine === 'brave') searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
          this.createTab(searchUrl);
          break;
        }
        case 'translate-selection': {
          const query = params.selectionText.trim();
          this.createTab(`https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(query)}`);
          break;
        }
        case 'back':
          if (webContents.canGoBack()) webContents.goBack();
          break;
        case 'forward':
          if (webContents.canGoForward()) webContents.goForward();
          break;
        case 'reload':
          webContents.reload();
          break;
        case 'save-page':
          this.savePageAs(webContents);
          break;
        case 'print':
          webContents.print();
          break;
        case 'translate':
          this.translatePage(webContents);
          break;
        case 'view-source':
          this.viewPageSource(webContents);
          break;
        case 'create-qr':
          this.triggerQrCode(webContents);
          break;
        case 'block-elements-site':
          this.toggleBlockElements(webContents);
          break;
        case 'inspect':
          webContents.inspectElement(params.x, params.y);
          if (!webContents.isDevToolsOpened()) {
            webContents.openDevTools({ mode: 'bottom' });
          }
          break;
      }
    });
  }

  private savePageAs(webContents: Electron.WebContents): void {
    const title = (webContents.getTitle() || 'webpage').replace(/[^a-z0-9_-]/gi, '_');
    dialog.showSaveDialog(this.window as any, {
      title: 'Save Page As',
      defaultPath: `${title}.html`,
      filters: [
        { name: 'Webpage, Complete (*.html)', extensions: ['html', 'htm'] },
        { name: 'Webpage, Single File (*.mhtml)', extensions: ['mhtml'] }
      ]
    }).then(({ canceled, filePath }) => {
      if (!canceled && filePath) {
        const format = filePath.endsWith('.mhtml') ? 'MHTML' : 'HTMLComplete';
        webContents.savePage(filePath, format).catch(err => {
          console.warn('[THAAW] Save page failed:', err.message);
        });
      }
    });
  }

  private viewPageSource(webContents: Electron.WebContents): void {
    const url = webContents.getURL();
    if (url && !url.startsWith('thaaw://') && !url.startsWith('view-source:')) {
      this.createTab(`view-source:${url}`);
    }
  }

  private translatePage(webContents: Electron.WebContents): void {
    const url = webContents.getURL();
    if (url && !url.startsWith('thaaw://')) {
      this.createTab(`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(url)}`);
    }
  }

  private triggerQrCode(webContents: Electron.WebContents): void {
    const url = webContents.getURL();
    this.broadcastToWindow('browser:show-qr-code', { url });
  }

  private triggerCast(webContents: Electron.WebContents): void {
    const url = webContents.getURL();
    this.broadcastToWindow('browser:show-cast', { url });
  }

  private toggleBlockElements(webContents: Electron.WebContents): void {
    const url = webContents.getURL();
    this.trackerBlocker.toggleShield(url);
    this.onSecurityStatusCallback(url);
    this.broadcastToWindow('browser:security-status-updated', this.trackerBlocker.getStatsForDomain(url));
  }

  /**
   * Real Chromium DevTools Integration
   */
  public openDevToolsActiveTab(mode: 'detach' | 'right' | 'bottom' = 'bottom'): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (active && !active.view.webContents.isDestroyed()) {
      active.view.webContents.openDevTools({ mode });
    }
  }

  public inspectElementActiveTab(x?: number, y?: number): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (!active || active.view.webContents.isDestroyed()) return;
    if (x !== undefined && y !== undefined) {
      active.view.webContents.inspectElement(x, y);
    }
    if (!active.view.webContents.isDevToolsOpened()) {
      active.view.webContents.openDevTools({ mode: 'bottom' });
    }
  }

  public toggleDevToolsActiveTab(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (!active || active.view.webContents.isDestroyed()) return;
    if (active.view.webContents.isDevToolsOpened()) {
      active.view.webContents.closeDevTools();
    } else {
      active.view.webContents.openDevTools({ mode: 'bottom' });
    }
  }

  public showTabContextMenu(tabId: number): void {
    const target = this.tabs.get(tabId);
    if (!target) return;

    const items: CustomContextMenuItem[] = [
      { id: 'new-tab', label: 'New Tab', icon: 'plus', shortcut: 'Ctrl+T' },
      { id: 'reload-tab', label: 'Reload Tab', icon: 'refresh', shortcut: 'Ctrl+R' },
      { id: 'duplicate-tab', label: 'Duplicate Tab', icon: 'copy' },
      { id: 'pin-tab', label: target.info.isPinned ? 'Unpin Tab' : 'Pin Tab', icon: 'pin' },
      { id: 'mute-tab', label: target.info.isAudioMuted ? 'Unmute Tab' : 'Mute Tab', icon: 'volume-x' },
      { id: 'toggle-tab-sleep', label: target.info.isSleeping ? 'Wake Tab' : 'Sleep Tab (Save Memory)', icon: 'moon' },
      { id: 'reopen-closed-tab', label: 'Reopen Closed Tab', icon: 'history', shortcut: 'Ctrl+Shift+T', disabled: this.closedTabs.length === 0 },
      { id: 'sep_tab_1', type: 'separator', label: '' },
      { id: 'close-tab', label: 'Close Tab', icon: 'x', shortcut: 'Ctrl+W' },
      { id: 'close-other-tabs', label: 'Close Other Tabs', icon: 'trash' },
      { id: 'close-tabs-right', label: 'Close Tabs to the Right', icon: 'arrow-right' }
    ];

    this.showCustomContextMenu(items, (actionId) => {
      switch (actionId) {
        case 'new-tab':
          this.createTab('thaaw://newtab');
          break;
        case 'reload-tab':
          target.view.webContents.reload();
          break;
        case 'duplicate-tab':
          this.duplicateTab(tabId);
          break;
        case 'pin-tab':
          this.pinTab(tabId);
          break;
        case 'mute-tab':
          this.toggleTabMute(tabId);
          break;
        case 'toggle-tab-sleep':
          if (target.info.isSleeping) {
            this.wakeTab(tabId);
          } else {
            this.sleepTab(tabId);
          }
          break;
        case 'close-tab':
          this.closeTab(tabId);
          break;
        case 'reopen-closed-tab':
          this.reopenClosedTab();
          break;
        case 'close-other-tabs':
          Array.from(this.tabs.keys()).forEach(id => {
            if (id !== tabId) this.closeTab(id);
          });
          break;
        case 'close-tabs-right': {
          const ids = Array.from(this.tabs.keys());
          const idx = ids.indexOf(tabId);
          if (idx >= 0) {
            ids.slice(idx + 1).forEach(id => this.closeTab(id));
          }
          break;
        }
      }
    });
  }

  public switchTab(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;

    // Wake tab if it was put to sleep by memory saver
    if (target.info.isSleeping) {
      this.wakeTab(tabId);
    }
    target.info.lastActiveAt = Date.now();

    // Remove current active view from window content view
    if (this.activeTabId && this.activeTabId !== tabId) {
      const current = this.tabs.get(this.activeTabId);
      if (current) {
        this.window.contentView.removeChildView(current.view);
        // Only throttle background tab if it is not currently playing media
        if (!current.info.isAudioPlaying) {
          try {
            (current.view.webContents as any).setBackgroundThrottling?.(true);
          } catch {}
        }
      }
    }

    this.activeTabId = tabId;
    // Active tab must NEVER be background-throttled to prevent video latency/stuttering
    try {
      (target.view.webContents as any).setBackgroundThrottling?.(false);
    } catch {}
    if (this.isModalStateOpen) {
      this.isModalStateOpen = false;
      this.broadcastToWindow('browser:tab-snapshot', { visible: false });
    }
    target.view.setVisible(true);
    this.window.contentView.addChildView(target.view);
    this.updateActiveViewBounds();
    this.notifyTabsUpdated();
    this.onSecurityStatusCallback(target.info.url);
    this.broadcastToWindow('browser:pwa-status', {
      tabId,
      isPwa: !!target.info.pwa,
      pwa: target.info.pwa
    });
    return true;
  }

  public closeTab(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;

    // Track closed tab for restore
    if (target.info.url && !target.info.url.startsWith('thaaw://newtab')) {
      this.closedTabs.push({ url: target.info.url, title: target.info.title || target.info.url });
      if (this.closedTabs.length > 25) {
        this.closedTabs.shift();
      }
    }

    // Detach view
    if (this.activeTabId === tabId) {
      this.window.contentView.removeChildView(target.view);
    }

    // Close webContents
    try {
      (target.view.webContents as unknown as { destroy(): void }).destroy();
    } catch {
      // Ignored
    }

    this.tabs.delete(tabId);

    // If active tab closed, switch to adjacent or create new tab
    if (this.activeTabId === tabId) {
      const remainingIds = Array.from(this.tabs.keys());
      if (remainingIds.length > 0) {
        this.switchTab(remainingIds[remainingIds.length - 1]);
      } else {
        this.createTab('thaaw://newtab');
      }
    } else {
      this.notifyTabsUpdated();
    }

    return true;
  }

  public reopenClosedTab(): TabInfo | null {
    const lastClosed = this.closedTabs.pop();
    if (!lastClosed) return null;
    return this.createTab(lastClosed.url);
  }

  public navigateTab(tabId: number, targetUrl: string): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;

    const { isValid, sanitizedUrl, error } = sanitizeNavigationUrl(
      targetUrl,
      this.defaultSearchEngine,
      this.customSearchUrl
    );
    if (!isValid) {
      console.warn(`[THAAW] Blocked invalid navigation: ${targetUrl} (${error})`);
      return false;
    }

    target.info.url = sanitizedUrl;
    const isNewTab = sanitizedUrl.startsWith('thaaw://newtab') || sanitizedUrl === 'about:blank';
    try {
      target.view.setBackgroundColor(isNewTab ? '#00000000' : '#FFFFFFFF');
    } catch {}
    target.view.webContents.loadURL(sanitizedUrl).catch(err => {
      console.warn(`[THAAW] Failed to load ${sanitizedUrl}:`, err.message);
    });

    this.notifyTabsUpdated();
    return true;
  }

  public navigateActiveTab(targetUrl: string): boolean {
    if (!this.activeTabId) return false;
    const active = this.tabs.get(this.activeTabId);
    if (active?.info.isPinned) {
      // Protect pinned tabs by opening navigation in a new tab
      this.createTab(targetUrl);
      return true;
    }
    return this.navigateTab(this.activeTabId, targetUrl);
  }

  public closeAllTabsAndOpenNew(initialUrl: string = 'thaaw://newtab'): void {
    const allIds = Array.from(this.tabs.keys());
    for (const id of allIds) {
      const tab = this.tabs.get(id);
      if (tab) {
        try {
          if (this.activeTabId === id) {
            this.window.contentView.removeChildView(tab.view);
          }
          (tab.view.webContents as any).destroy();
        } catch {}
      }
    }
    this.tabs.clear();
    this.activeTabId = null;
    this.createTab(initialUrl);
  }

  public reloadActiveTab(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (active) {
      active.view.webContents.reload();
    }
  }

  public stopActiveTab(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (active) {
      active.view.webContents.stop();
      active.info.isLoading = false;
      this.notifyTabsUpdated();
    }
  }

  public goBackActiveTab(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (!active) return;
    const { webContents } = active.view;
    const navHistory = (webContents as unknown as { navigationHistory?: { canGoBack(): boolean; canGoForward(): boolean; goBack(): void; goForward(): void } }).navigationHistory;
    const canBack = navHistory ? navHistory.canGoBack() : webContents.canGoBack();
    if (canBack) {
      if (navHistory) {
        navHistory.goBack();
      } else {
        webContents.goBack();
      }
    }
  }

  public goForwardActiveTab(): void {
    if (!this.activeTabId) return;
    const active = this.tabs.get(this.activeTabId);
    if (!active) return;
    const { webContents } = active.view;
    const navHistory = (webContents as unknown as { navigationHistory?: { canGoBack(): boolean; canGoForward(): boolean; goBack(): void; goForward(): void } }).navigationHistory;
    const canFwd = navHistory ? navHistory.canGoForward() : webContents.canGoForward();
    if (canFwd) {
      if (navHistory) {
        navHistory.goForward();
      } else {
        webContents.goForward();
      }
    }
  }

  public getActiveTabInfo(): TabInfo | null {
    if (!this.activeTabId) return null;
    const active = this.tabs.get(this.activeTabId);
    return active ? active.info : null;
  }

  public toggleTabMute(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;
    const newMute = !target.info.isAudioMuted;
    target.info.isAudioMuted = newMute;
    target.view.webContents.setAudioMuted(newMute);
    this.notifyTabsUpdated();
    return newMute;
  }

  public pinTab(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;
    target.info.isPinned = !target.info.isPinned;
    this.notifyTabsUpdated();
    return !!target.info.isPinned;
  }

  public duplicateTab(tabId: number): TabInfo | null {
    const target = this.tabs.get(tabId);
    if (!target) return null;
    return this.createTab(target.info.url);
  }

  public searchTabs(query: string): TabInfo[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.listTabs();
    return this.listTabs().filter(t => 
      t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q)
    );
  }

  public listTabs(): TabInfo[] {
    return Array.from(this.tabs.values()).map(t => t.info);
  }

  public setChromeHeight(height: number): void {
    this.chromeHeight = Math.max(40, height);
    this.updateActiveViewBounds();
  }

  public setMinimalMode(enabled: boolean): void {
    this.minimalMode = enabled;
    this.chromeHeight = enabled ? 74 : TabManager.CHROME_HEIGHT;
    this.updateActiveViewBounds();
  }

  public isMinimalMode(): boolean {
    return this.minimalMode;
  }

  public sleepTab(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;
    if (this.activeTabId === tabId || target.info.isPinned || target.info.isAudioPlaying) {
      return false;
    }
    target.info.isSleeping = true;
    try {
      target.view.webContents.stop();
    } catch {}
    this.notifyTabsUpdated();
    return true;
  }

  public wakeTab(tabId: number): boolean {
    const target = this.tabs.get(tabId);
    if (!target) return false;
    if (!target.info.isSleeping) return false;
    target.info.isSleeping = false;
    target.info.lastActiveAt = Date.now();
    try {
      target.view.webContents.reload();
    } catch {}
    this.notifyTabsUpdated();
    return true;
  }

  public setMemorySaverEnabled(enabled: boolean): void {
    this.memorySaverEnabled = enabled;
  }

  public setMemorySaverThreshold(minutes: number): void {
    this.memorySaverThresholdMs = Math.max(1, minutes) * 60 * 1000;
  }

  private notifyTabsUpdated(): void {
    this.onTabsUpdatedCallback(this.listTabs(), this.activeTabId);
  }
}

