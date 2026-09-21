/**
 * THAAW Browser — Secure UI Preload Bridge
 * Exposes a strictly typed API to the browser chrome UI via ContextBridge.
 * Zero Node.js primitives or direct ipcRenderer objects are leaked to the window.
 */

import { contextBridge, ipcRenderer } from 'electron';

const thaawAPI = {
  // Tab Management
  createTab: (url?: string) => ipcRenderer.send('tab:create', url),
  closeTab: (tabId: number) => ipcRenderer.send('tab:close', tabId),
  switchTab: (tabId: number) => ipcRenderer.send('tab:switch', tabId),
  navigate: (url: string) => ipcRenderer.send('tab:navigate', url),
  reload: () => ipcRenderer.send('tab:reload'),
  stop: () => ipcRenderer.send('tab:stop'),
  goBack: () => ipcRenderer.send('tab:back'),
  goForward: () => ipcRenderer.send('tab:forward'),
  toggleTabMute: (tabId: number) => ipcRenderer.send('tab:mute', tabId),
  duplicateTab: (tabId: number) => ipcRenderer.send('tab:duplicate', tabId),
  pinTab: (tabId: number) => ipcRenderer.send('tab:pin', tabId),
  sleepTab: (tabId: number) => ipcRenderer.send('tab:sleep', tabId),
  wakeTab: (tabId: number) => ipcRenderer.send('tab:wake', tabId),
  reopenClosedTab: () => ipcRenderer.send('tab:reopen-closed'),
  searchTabs: (query: string) => ipcRenderer.invoke('tab:search', query),

  // Minimal mode & Chrome Height
  setMinimalMode: (enabled: boolean) => ipcRenderer.invoke('browser:set-minimal-mode', enabled),
  setChromeHeight: (height: number) => ipcRenderer.send('chrome:set-height', height),

  // Sidebar bounds
  setSidebarOffset: (width: number) => ipcRenderer.send('sidebar:resize', width),

  // Global Theme & Wallpaper Management
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: string, preset?: string) => ipcRenderer.invoke('theme:set', { theme, preset }),
  getWallpaper: () => ipcRenderer.invoke('wallpaper:get'),
  setWallpaper: (wallpaper: string) => ipcRenderer.invoke('wallpaper:set', wallpaper),

  // History & Search History
  getHistory: (query?: string) => ipcRenderer.invoke('history:get', query),
  deleteHistoryItem: (id: string) => ipcRenderer.invoke('history:delete', id),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  clearHistoryRange: (sinceTimestamp: number) => ipcRenderer.invoke('history:clear-range', sinceTimestamp),
  getRecentSearches: (limit?: number) => ipcRenderer.invoke('history:get-searches', limit),
  addSearchQuery: (query: string, engine?: string) => ipcRenderer.invoke('history:add-search', query, engine),
  deleteSearchQuery: (query: string) => ipcRenderer.invoke('history:delete-search', query),
  clearSearchHistory: () => ipcRenderer.invoke('history:clear-searches'),

  // Omnibox Autocomplete
  getAutocompleteSuggestions: (query: string) => ipcRenderer.invoke('omnibox:autocomplete', query),

  // Bookmarks
  getBookmarks: (query?: string) => ipcRenderer.invoke('bookmarks:get', query),
  addBookmark: (item: { title: string; url: string; parentId?: string; isFolder?: boolean }) =>
    ipcRenderer.invoke('bookmarks:add', item),
  updateBookmark: (id: string, patch: unknown) => ipcRenderer.invoke('bookmarks:update', { id, patch }),
  deleteBookmark: (id: string) => ipcRenderer.invoke('bookmarks:delete', id),
  toggleBookmark: (title: string, url: string) => ipcRenderer.invoke('bookmarks:toggle', { title, url }),
  importBookmarks: (content: string, format?: 'json' | 'html') => ipcRenderer.invoke('bookmarks:import', { content, format }),
  toggleBookmarksBar: (show: boolean) => ipcRenderer.invoke('browser:toggle-bookmarks-bar', show),

  // Password Vault & Autofill
  getPasswords: (query?: string) => ipcRenderer.invoke('passwords:get', query),
  savePassword: (item: { website: string; username: string; password: string }) =>
    ipcRenderer.invoke('passwords:save', item),
  updatePassword: (item: { id: string; website?: string; username?: string; password?: string }) =>
    ipcRenderer.invoke('passwords:update', item),
  revealPassword: (id: string) => ipcRenderer.invoke('passwords:reveal', id),
  deletePassword: (id: string) => ipcRenderer.invoke('passwords:delete', id),
  getVaultSecurityStatus: () => ipcRenderer.invoke('passwords:get-security-status'),
  importPasswordCsv: (csvContent: string) => ipcRenderer.invoke('passwords:import-csv', csvContent),
  exportPasswordCsv: () => ipcRenderer.invoke('passwords:export-csv'),
  getMatchingCredentials: (originOrUrl: string) => ipcRenderer.invoke('passwords:get-matching', originOrUrl),
  saveOrUpdateCredential: (item: { website: string; username: string; password: string; id?: string }) =>
    ipcRenderer.invoke('passwords:save-or-update', item),
  autofillActiveTab: (cred: { username: string; password: string }) =>
    ipcRenderer.invoke('tab:autofill-active', cred),

  // News Provider & Reader
  getNews: (category?: string, page?: number, view?: string) => ipcRenderer.invoke('news:get', category, page, view),
  getCustomRssFeeds: () => ipcRenderer.invoke('news:get-rss-feeds'),
  addCustomRssFeed: (url: string, name: string, category: string) => ipcRenderer.invoke('news:add-rss-feed', { url, name, category }),
  deleteCustomRssFeed: (id: string) => ipcRenderer.invoke('news:delete-rss-feed', id),
  getNewsFollowState: () => ipcRenderer.invoke('news:get-follow-state'),
  toggleFollowPublisher: (publisher: string) => ipcRenderer.invoke('news:toggle-follow-publisher', publisher),
  toggleFollowChannel: (channel: string) => ipcRenderer.invoke('news:toggle-follow-channel', channel),
  hideNewsPublisher: (publisher: string) => ipcRenderer.invoke('news:hide-publisher', publisher),
  hideNewsTopic: (topic: string) => ipcRenderer.invoke('news:hide-topic', topic),

  // Settings & Customization
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: unknown) => ipcRenderer.invoke('settings:update', settings),
  clearBrowsingData: () => ipcRenderer.invoke('data:clear'),

  // Profiles
  listProfiles: () => ipcRenderer.invoke('profile:list'),
  getActiveProfile: () => ipcRenderer.invoke('profile:get-active'),
  setActiveProfile: (id: string) => ipcRenderer.invoke('profile:set-active', id),
  createProfile: (name: string) => ipcRenderer.invoke('profile:create', name),
  updateBrowserProfile: (id: string, patch: { name?: string; email?: string; color?: string; avatar?: string; avatarIcon?: string }) =>
    ipcRenderer.invoke('profile:update', id, patch),
  duplicateBrowserProfile: (id: string) => ipcRenderer.invoke('profile:duplicate', id),
  updateBrowserProfileSettings: (id: string, patch: unknown) => ipcRenderer.invoke('profile:update-settings', id, patch),
  canDeleteBrowserProfile: (id: string) => ipcRenderer.invoke('profile:can-delete', id),
  deleteBrowserProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),
  showProfileContextMenu: (id: string) => ipcRenderer.send('profile:context-menu', id),

  // Native Menus & Overlays (displayed on top of WebContentsView)
  showMainMenu: () => ipcRenderer.send('menu:show-main'),
  showProfileMenu: () => ipcRenderer.send('menu:show-profile'),
  showEngineMenu: () => ipcRenderer.send('menu:show-engine'),
  setModalOpen: (isOpen: boolean) => ipcRenderer.send('tab:modal-state', isOpen),
  onModalStateChanged: (callback: (data: { isOpen: boolean }) => void) => {
    const handler = (_event: unknown, data: { isOpen: boolean }) => callback(data);
    ipcRenderer.on('browser:modal-state', handler as any);
    return () => ipcRenderer.removeListener('browser:modal-state', handler as any);
  },
  onTabSnapshot: (callback: (data: { dataUrl?: string; visible: boolean }) => void) => {
    const handler = (_event: unknown, data: { dataUrl?: string; visible: boolean }) => callback(data);
    ipcRenderer.on('browser:tab-snapshot', handler as any);
    return () => ipcRenderer.removeListener('browser:tab-snapshot', handler as any);
  },

  // Security Center & Shields
  getSecurityStatus: () => ipcRenderer.invoke('security:get-status'),
  toggleShield: () => ipcRenderer.invoke('security:toggle-shield'),
  setProtectionLevel: (level: string) => ipcRenderer.invoke('security:set-protection-level', level),

  // Native Ad Blocker Engine
  getAdBlockerStatus: () => ipcRenderer.invoke('adblock:get-status'),
  toggleAdBlocker: (enabled?: boolean) => ipcRenderer.invoke('adblock:toggle', enabled),
  toggleAdBlockerSite: (hostname?: string) => ipcRenderer.invoke('adblock:toggle-site', hostname),

  // Permissions
  respondPermission: (requestId: string, decision: 'allow' | 'allow-once' | 'deny') =>
    ipcRenderer.send('permission:respond', { requestId, decision }),

  // Downloads
  respondDownload: (downloadId: string, accept: boolean) =>
    ipcRenderer.send('download:respond', { downloadId, accept }),

  // Command Palette
  executeCommand: (commandId: string) => ipcRenderer.send('palette:action', commandId),

  // PWA Subsystem
  onPwaStatus: (callback: (data: { tabId: number; isPwa: boolean; pwa?: any }) => void) => {
    const handler = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('browser:pwa-status', handler);
    return () => ipcRenderer.removeListener('browser:pwa-status', handler);
  },
  installPwa: (manifest: any) => ipcRenderer.invoke('pwa:install', manifest),
  openPwa: (id: string) => ipcRenderer.invoke('pwa:open', id),
  listPwas: () => ipcRenderer.invoke('pwa:list'),
  uninstallPwa: (id: string) => ipcRenderer.invoke('pwa:uninstall', id),
  isPwaInstalled: (originOrUrl: string) => ipcRenderer.invoke('pwa:check-installed', originOrUrl),

  // Authentication & Accounts
  createAccount: (params: { email: string; password: string; name: string; avatarColor?: string; profileId?: string }) =>
    ipcRenderer.invoke('auth:create-account', params),
  signIn: (params: { email: string; password: string }) =>
    ipcRenderer.invoke('auth:sign-in', params),
  signOut: () => ipcRenderer.invoke('auth:sign-out'),
  getCurrentUser: () => ipcRenderer.invoke('auth:get-current-user'),
  updateProfile: (params: { name?: string; avatarColor?: string; email?: string; currentPassword?: string; newPassword?: string; settings?: any }) =>
    ipcRenderer.invoke('auth:update-profile', params),
  listAccounts: () => ipcRenderer.invoke('auth:list-accounts'),

  // Profiles & Startup Picker
  selectProfileAndLaunch: (profileId: string) => ipcRenderer.invoke('profile:select-and-launch', profileId),
  getStartupPickerPreference: () => ipcRenderer.invoke('profile:get-startup-preference'),
  setStartupPickerPreference: (enabled: boolean) => ipcRenderer.invoke('profile:set-startup-preference', enabled),
  showTabContextMenu: (tabId: number) => ipcRenderer.send('tab:context-menu', tabId),

  // Developer Tools
  toggleDevTools: () => ipcRenderer.send('devtools:toggle'),
  inspectElement: (x?: number, y?: number) => ipcRenderer.send('devtools:inspect', { x, y }),

  // Push Event Subscriptions
  onShowQrCode: (callback: (data: { url: string }) => void) => {
    const handler = (_event: unknown, data: { url: string }) => callback(data);
    ipcRenderer.on('browser:show-qr-code', handler);
    return () => ipcRenderer.removeListener('browser:show-qr-code', handler);
  },

  onShowCast: (callback: (data: { url: string }) => void) => {
    const handler = (_event: unknown, data: { url: string }) => callback(data);
    ipcRenderer.on('browser:show-cast', handler);
    return () => ipcRenderer.removeListener('browser:show-cast', handler);
  },

  onTabsUpdated: (callback: (data: { tabs: unknown[]; activeTabId: number | null }) => void) => {
    const handler = (_event: unknown, data: { tabs: unknown[]; activeTabId: number | null }) => callback(data);
    ipcRenderer.on('browser:tabs-updated', handler);
    return () => ipcRenderer.removeListener('browser:tabs-updated', handler);
  },

  onThemeUpdated: (callback: (data: { theme: string; preset: string }) => void) => {
    const handler = (_event: unknown, data: { theme: string; preset: string }) => callback(data);
    ipcRenderer.on('browser:theme-updated', handler);
    return () => ipcRenderer.removeListener('browser:theme-updated', handler);
  },

  onWallpaperUpdated: (callback: (wallpaper: string) => void) => {
    const handler = (_event: unknown, wallpaper: string) => callback(wallpaper);
    ipcRenderer.on('browser:wallpaper-updated', handler);
    return () => ipcRenderer.removeListener('browser:wallpaper-updated', handler);
  },

  onEngineUpdated: (callback: (data: { engine: string; label: string }) => void) => {
    const handler = (_event: unknown, data: { engine: string; label: string }) => callback(data);
    ipcRenderer.on('browser:engine-updated', handler);
    return () => ipcRenderer.removeListener('browser:engine-updated', handler);
  },

  onToggleSidebar: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('browser:toggle-sidebar', handler);
    return () => ipcRenderer.removeListener('browser:toggle-sidebar', handler);
  },

  onSecurityStatusUpdated: (callback: (status: unknown) => void) => {
    const handler = (_event: unknown, status: unknown) => callback(status);
    ipcRenderer.on('browser:security-status-updated', handler);
    return () => ipcRenderer.removeListener('browser:security-status-updated', handler);
  },

  onPermissionRequested: (callback: (request: unknown) => void) => {
    const handler = (_event: unknown, request: unknown) => callback(request);
    ipcRenderer.on('browser:permission-requested', handler);
    return () => ipcRenderer.removeListener('browser:permission-requested', handler);
  },

  onDownloadPrompt: (callback: (prompt: unknown) => void) => {
    const handler = (_event: unknown, prompt: unknown) => callback(prompt);
    ipcRenderer.on('browser:download-prompt', handler);
    return () => ipcRenderer.removeListener('browser:download-prompt', handler);
  },

  onFocusOmnibox: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('browser:focus-omnibox', handler);
    return () => ipcRenderer.removeListener('browser:focus-omnibox', handler);
  },

  onOpenPalette: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('browser:open-palette', handler);
    return () => ipcRenderer.removeListener('browser:open-palette', handler);
  },

  onOpenTabSearch: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('browser:open-tab-search', handler);
    return () => ipcRenderer.removeListener('browser:open-tab-search', handler);
  },

  onProfileChanged: (callback: (profile: unknown) => void) => {
    const handler = (_event: unknown, p: unknown) => callback(p);
    ipcRenderer.on('browser:profile-changed', handler);
    return () => ipcRenderer.removeListener('browser:profile-changed', handler);
  },

  onProfileContextAction: (callback: (data: { action: string; profileId: string }) => void) => {
    const handler = (_event: unknown, data: { action: string; profileId: string }) => callback(data);
    ipcRenderer.on('browser:profile-context-action', handler);
    return () => ipcRenderer.removeListener('browser:profile-context-action', handler);
  },

  // Downloads Subsystem
  getRecentDownloads: () => ipcRenderer.invoke('downloads:get-recent'),
  getAllDownloads: () => ipcRenderer.invoke('downloads:get-all'),
  pauseDownload: (id: string) => ipcRenderer.invoke('downloads:pause', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('downloads:resume', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('downloads:cancel', id),
  openDownloadFile: (id: string) => ipcRenderer.invoke('downloads:open-file', id),
  openDownloadFolder: (id: string) => ipcRenderer.invoke('downloads:open-folder', id),
  deleteDownloadFile: (id: string) => ipcRenderer.invoke('downloads:delete-file', id),
  removeDownloadItem: (id: string) => ipcRenderer.invoke('downloads:remove-item', id),
  clearCompletedDownloads: () => ipcRenderer.invoke('downloads:clear-completed'),

  // Site Intelligence & Sidebar Control
  getSiteIntelligence: () => ipcRenderer.invoke('tab:get-site-intelligence'),
  setRightSidebar: (width: number) => ipcRenderer.send('sidebar:set-right', width),
  clearSiteData: (domain: string) => ipcRenderer.invoke('site:clear-data', domain),
  updateSitePermission: (origin: string, perm: string, value: string) =>
    ipcRenderer.invoke('site:set-permission', { origin, perm, value }),

  // View & Window Controls
  zoomIn: () => ipcRenderer.send('view:zoom-in'),
  zoomOut: () => ipcRenderer.send('view:zoom-out'),
  zoomReset: () => ipcRenderer.send('view:zoom-reset'),
  toggleFullscreen: () => ipcRenderer.send('view:toggle-fullscreen'),
  printPage: () => ipcRenderer.send('view:print'),
  savePage: () => ipcRenderer.send('view:save'),
  viewSource: () => ipcRenderer.send('view:source'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  onAuthChanged: (callback: (user: unknown) => void) => {
    const handler = (_event: unknown, u: unknown) => callback(u);
    ipcRenderer.on('browser:auth-changed', handler);
    return () => ipcRenderer.removeListener('browser:auth-changed', handler);
  },

  // Real-time Download Notifications
  onDownloadStarted: (callback: (record: unknown) => void) => {
    const handler = (_event: unknown, record: unknown) => callback(record);
    ipcRenderer.on('browser:download-started', handler);
    return () => ipcRenderer.removeListener('browser:download-started', handler);
  },

  onDownloadProgress: (callback: (record: unknown) => void) => {
    const handler = (_event: unknown, record: unknown) => callback(record);
    ipcRenderer.on('browser:download-progress', handler);
    return () => ipcRenderer.removeListener('browser:download-progress', handler);
  },

  onDownloadCompleted: (callback: (record: unknown) => void) => {
    const handler = (_event: unknown, record: unknown) => callback(record);
    ipcRenderer.on('browser:download-completed', handler);
    return () => ipcRenderer.removeListener('browser:download-completed', handler);
  },

  onDownloadFailed: (callback: (record: unknown) => void) => {
    const handler = (_event: unknown, record: unknown) => callback(record);
    ipcRenderer.on('browser:download-failed', handler);
    return () => ipcRenderer.removeListener('browser:download-failed', handler);
  },

  onDownloadCancelled: (callback: (record: unknown) => void) => {
    const handler = (_event: unknown, record: unknown) => callback(record);
    ipcRenderer.on('browser:download-cancelled', handler);
    return () => ipcRenderer.removeListener('browser:download-cancelled', handler);
  },

  onMinimalModeChanged: (callback: (enabled: boolean) => void) => {
    const handler = (_event: unknown, enabled: unknown) => callback(Boolean(enabled));
    ipcRenderer.on('browser:minimal-mode-changed', handler);
    return () => ipcRenderer.removeListener('browser:minimal-mode-changed', handler);
  },

  onBookmarksBarToggled: (callback: (show: boolean) => void) => {
    const handler = (_event: unknown, show: unknown) => callback(Boolean(show));
    ipcRenderer.on('browser:bookmarks-bar-toggled', handler);
    return () => ipcRenderer.removeListener('browser:bookmarks-bar-toggled', handler);
  },

  onShowPasswordPrompt: (callback: (data: { mode: 'save' | 'update'; origin: string; username: string; password?: string; id?: string }) => void) => {
    const handler = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('browser:password-prompt', handler);
    return () => ipcRenderer.removeListener('browser:password-prompt', handler);
  },

  onPasswordFieldsDetected: (callback: (data: { hasPasswordFields: boolean; origin?: string }) => void) => {
    const handler = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('browser:password-fields-detected', handler);
    return () => ipcRenderer.removeListener('browser:password-fields-detected', handler);
  },

  respondPasswordPrompt: (decision: 'save' | 'update' | 'dismiss', data: { website: string; username: string; password?: string; id?: string }) => {
    ipcRenderer.send('password:prompt-response', { decision, data });
  },

  saveWallpaperFromUrl: (url: string) => ipcRenderer.invoke('wallpaper:save-from-url', url),

  onViewImageFullscreen: (callback: (url: string) => void) => {
    const handler = (_event: unknown, url: string) => callback(url);
    ipcRenderer.on('browser:view-image-fullscreen', handler as any);
    return () => ipcRenderer.removeListener('browser:view-image-fullscreen', handler as any);
  },

  onZoomChanged: (callback: (zoom: number) => void) => {
    const handler = (_event: unknown, zoom: number) => callback(zoom);
    ipcRenderer.on('browser:zoom-changed', handler as any);
    return () => ipcRenderer.removeListener('browser:zoom-changed', handler as any);
  }
};

// Expose thaawAPI strictly to top-level chrome UI, profile picker, and internal thaaw:// pages
// (never to untrusted external websites or arbitrary user file:// pages)
const normalizedPath = window.location.pathname.replace(/\\/g, '/');
const isInternalThaaw =
  window.location.protocol.startsWith('thaaw:') ||
  (window.location.protocol === 'file:' && (
    normalizedPath.endsWith('/ui/index.html') ||
    normalizedPath.endsWith('/profiles/profile-picker.html') ||
    normalizedPath.includes('/browser/ui/index.html') ||
    normalizedPath.includes('/browser/profiles/profile-picker.html') ||
    normalizedPath.includes('/dist/browser/ui/index.html') ||
    normalizedPath.includes('/dist/browser/profiles/profile-picker.html')
  ));

if (isInternalThaaw) {
  contextBridge.exposeInMainWorld('thaawAPI', thaawAPI);
} else if (window.location.protocol === 'file:') {
  // Inject modern THAAW element styling for local HTML test files
  window.addEventListener('DOMContentLoaded', () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'thaaw-custom-elements';
    styleEl.textContent = `
      select, .input-select {
        appearance: none;
        -webkit-appearance: none;
        background-color: rgba(10, 16, 32, 0.75);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2338BDF8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 14px 14px;
        color: #F8FAFC;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        padding: 8px 36px 8px 14px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }
      select:focus, .input-select:focus {
        border-color: #38BDF8;
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
      }
      progress {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        height: 10px;
        border-radius: 9999px;
        overflow: hidden;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      progress::-webkit-progress-bar {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
      }
      progress::-webkit-progress-value {
        background: linear-gradient(90deg, #38BDF8 0%, #00E5FF 50%, #FF6FF0 100%);
        border-radius: 9999px;
        transition: width 0.25s ease;
      }
      input[type="range"] {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 9999px;
        outline: none;
        cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #38BDF8;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        cursor: pointer;
      }
      input[type="checkbox"], input[type="radio"] {
        cursor: pointer;
        accent-color: #38BDF8;
      }
      meter {
        appearance: none;
        -webkit-appearance: none;
        width: 100%;
        height: 10px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }
      meter::-webkit-meter-bar {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
      }
      meter::-webkit-meter-optimum-value {
        background: #10B981;
        border-radius: 9999px;
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 9999px;
      }
    `;
    document.head?.appendChild(styleEl);
  });
} else {
  // Privileged, isolated autofill integration for external web pages (zero JS API exposure to window)
  const initAutofill = () => {
    let activeAutofillPopup: HTMLElement | null = null;

    const removeAutofillPopup = () => {
      if (activeAutofillPopup) {
        activeAutofillPopup.remove();
        activeAutofillPopup = null;
      }
    };

    // Close popup on outside clicks
    document.addEventListener('click', (e) => {
      if (activeAutofillPopup && !activeAutofillPopup.contains(e.target as Node)) {
        removeAutofillPopup();
      }
    }, true);

    // Close on window resize or scroll
    window.addEventListener('resize', removeAutofillPopup, { passive: true });
    window.addEventListener('scroll', removeAutofillPopup, { passive: true });

    // Check if an input is relevant for credentials (email, username, password, login text)
    const isCredentialInput = (el: HTMLElement | null): el is HTMLInputElement => {
      if (!el || el.tagName !== 'INPUT') return false;
      const input = el as HTMLInputElement;
      const type = (input.type || 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image', 'range', 'reset'].includes(type)) {
        return false;
      }
      if (type === 'password' || type === 'email') return true;

      const name = (input.name || '').toLowerCase();
      const id = (input.id || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

      const keywords = ['user', 'login', 'email', 'mail', 'account', 'auth', 'identifier', 'phone', 'pass'];
      if (keywords.some(k => name.includes(k) || id.includes(k) || placeholder.includes(k) || autocomplete.includes(k))) {
        return true;
      }

      // If in same form/card as a password field, it is a credential input
      const container = input.form || input.closest('form, .login-box, .login-card, .auth-card, [class*="login"], [class*="auth"]') || input.parentElement;
      if (container && container.querySelector('input[type="password"]')) {
        return true;
      }

      return false;
    };

    // Helper: Find username or email field matching a password input
    const findUsernameForPassword = (passInput: HTMLInputElement, container: Element | Document): string => {
      const allInputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="password"])')) as HTMLInputElement[];

      // 1. Look for one with a value that has user/email in attributes or type
      for (const inp of allInputs) {
        if (!inp.value) continue;
        const type = (inp.type || '').toLowerCase();
        const name = (inp.name || inp.id || '').toLowerCase();
        const placeholder = (inp.placeholder || '').toLowerCase();
        if (type === 'email' || name.includes('user') || name.includes('email') || name.includes('mail') || name.includes('login') || placeholder.includes('email') || placeholder.includes('user')) {
          return inp.value.trim();
        }
      }

      // 2. Preceding input with a value
      for (const inp of allInputs) {
        if (inp.value && (inp.compareDocumentPosition(passInput) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          return inp.value.trim();
        }
      }

      // 3. Any non-empty text input
      for (const inp of allInputs) {
        if (inp.value.trim()) return inp.value.trim();
      }

      return '';
    };

    // Helper: trigger form submission IPC
    const triggerSubmitDetection = () => {
      const allPasswords = Array.from(document.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
      const filledPassword = allPasswords.find(p => p.value && p.value.length > 0);
      if (!filledPassword || !filledPassword.value) return;

      const container = filledPassword.form || filledPassword.closest('form, main, .login-box, .login-card, .auth-card, [class*="login"], [class*="auth"], [class*="card"], [class*="container"]') || document;
      const username = findUsernameForPassword(filledPassword, container);

      const targetOrigin = window.location.href;
      ipcRenderer.send('autofill:form-submitted', {
        origin: targetOrigin,
        username,
        password: filledPassword.value
      });
    };

    // Listen for form submissions (capture phase)
    document.addEventListener('submit', () => {
      triggerSubmitDetection();
    }, true);

    // Listen for button clicks (capture phase: handles AJAX login buttons, React/Vue/SPA login buttons)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('button, input[type="submit"], input[type="button"], [role="button"], a.btn, a.button');
      if (!btn) return;

      const btnText = (btn.textContent || (btn as HTMLInputElement).value || '').toLowerCase().trim();
      const isLoginAction =
        btn.getAttribute('type') === 'submit' ||
        btn.id.toLowerCase().includes('login') ||
        btn.id.toLowerCase().includes('signin') ||
        btn.id.toLowerCase().includes('submit') ||
        btn.className.toLowerCase().includes('login') ||
        btnText.includes('log in') ||
        btnText.includes('login') ||
        btnText.includes('sign in') ||
        btnText.includes('signin') ||
        btnText.includes('continue') ||
        btnText.includes('submit');

      // Check if button is inside or adjacent to a container containing a password field
      const container = btn.closest('form, main, .login-box, .login-card, .auth-card, [class*="login"], [class*="auth"], [class*="card"], [class*="container"]') || document;
      const hasPassInContainer = Boolean(container.querySelector('input[type="password"]'));

      if (isLoginAction || hasPassInContainer) {
        triggerSubmitDetection();
      }
    }, true);

    // Listen for Enter keydown in credential inputs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement | null;
        if (target && isCredentialInput(target)) {
          triggerSubmitDetection();
        }
      }
    }, true);

    // Active input focus and click delegation for autofill suggestions popover
    const handleInputActivation = async (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || !isCredentialInput(target)) return;

      // Notify browser chrome that a password or credential field is active/present
      const hasPasswordFields = document.querySelectorAll('input[type="password"]').length > 0;
      if (hasPasswordFields) {
        ipcRenderer.send('autofill:password-fields-detected', {
          hasPasswordFields: true,
          origin: window.location.href
        });
      }

      try {
        const originUrl = window.location.href;
        const accounts: Array<{ website: string; username: string }> = await ipcRenderer.invoke('autofill:query-accounts', originUrl);
        if (!accounts || accounts.length === 0) return;

        removeAutofillPopup();

        const rect = target.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const pop = document.createElement('div');
        pop.id = 'thaaw-autofill-popover';

        const popWidth = Math.max(240, Math.min(rect.width, 360));
        const popHeight = 44 + accounts.length * 40;
        let top = rect.bottom + 6;
        if (top + popHeight > window.innerHeight && rect.top > popHeight) {
          top = Math.max(8, rect.top - popHeight - 6);
        }
        let left = rect.left;
        if (left + popWidth > window.innerWidth) {
          left = Math.max(8, window.innerWidth - popWidth - 16);
        }

        pop.setAttribute('style', `
          position: fixed;
          top: ${top}px;
          left: ${left}px;
          width: ${popWidth}px;
          background: rgba(10, 16, 32, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 10px;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65), 0 0 1px rgba(56, 189, 248, 0.4);
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #F8FAFC;
          font-size: 12px;
          overflow: hidden;
          animation: thaawFadeIn 0.15s ease-out;
        `);

        const header = document.createElement('div');
        header.setAttribute('style', 'padding: 9px 12px; background: rgba(56, 189, 248, 0.12); border-bottom: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; font-weight: 600; color: #38BDF8; display: flex; align-items: center; gap: 7px;');
        header.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="#38BDF8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>THAAW Saved Accounts</span>
        `;
        pop.appendChild(header);

        accounts.forEach(acc => {
          const item = document.createElement('div');
          item.setAttribute('style', 'padding: 9px 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.04); transition: background 0.15s ease;');
          item.innerHTML = `
            <div style="display: flex; flex-direction: column; overflow: hidden; margin-right: 8px;">
              <span style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: #F8FAFC;">${acc.username}</span>
              <span style="font-size: 10px; color: #94A3B8; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${acc.website}</span>
            </div>
            <span style="font-size: 10px; font-weight: 600; color: #38BDF8; padding: 3px 8px; background: rgba(56, 189, 248, 0.16); border-radius: 5px; flex-shrink: 0;">Fill</span>
          `;
          item.addEventListener('mouseenter', () => item.style.background = 'rgba(56, 189, 248, 0.18)');
          item.addEventListener('mouseleave', () => item.style.background = 'transparent');
          item.addEventListener('mousedown', async (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            removeAutofillPopup();

            const filled = await ipcRenderer.invoke('autofill:request-fill', { origin: originUrl, username: acc.username });
            if (filled) {
              const form = target.form || target.closest('form, .login-box, .login-card, .auth-card, [class*="login"], [class*="auth"]') || document;
              const textInputs = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="password"])')) as HTMLInputElement[];
              const passInputs = Array.from(form.querySelectorAll('input[type="password"]')) as HTMLInputElement[];

              // Fill username/email
              if (target.type !== 'password') {
                target.value = filled.username;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                target.dispatchEvent(new Event('change', { bubbles: true }));
              } else if (textInputs.length > 0 && filled.username) {
                textInputs[0].value = filled.username;
                textInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                textInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
              }

              // Fill password
              if (passInputs.length > 0 && filled.password) {
                passInputs[0].value = filled.password;
                passInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                passInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          });
          pop.appendChild(item);
        });

        (document.body || document.documentElement).appendChild(pop);
        activeAutofillPopup = pop;
      } catch {}
    };

    // Attach document-level listeners (capture phase)
    document.addEventListener('focusin', handleInputActivation, true);
    document.addEventListener('click', handleInputActivation, true);

    // Also check for password inputs and notify chrome (optimized: debounced & scoped)
    const notifyPasswordPresence = () => {
      try {
        const hasPassword = document.querySelectorAll('input[type="password"]').length > 0;
        if (hasPassword) {
          ipcRenderer.send('autofill:password-fields-detected', {
            hasPasswordFields: true,
            origin: window.location.href
          });
        }
      } catch {}
    };

    let passwordCheckTimer: any = null;
    const schedulePasswordCheck = () => {
      if (passwordCheckTimer) return;
      passwordCheckTimer = setTimeout(() => {
        passwordCheckTimer = null;
        notifyPasswordPresence();
      }, 350);
    };

    if (document.readyState === 'complete') {
      notifyPasswordPresence();
    } else {
      window.addEventListener('load', notifyPasswordPresence, { once: true });
    }

    const observer = new MutationObserver((mutations) => {
      let relevant = false;
      for (let i = 0; i < mutations.length; i++) {
        const added = mutations[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const el = added[j] as HTMLElement;
          if (el.nodeType === 1) {
            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'FORM' || (el.firstElementChild && el.querySelector?.('input[type="password"]'))) {
              relevant = true;
              break;
            }
          }
        }
        if (relevant) break;
      }
      if (relevant) {
        schedulePasswordCheck();
      }
    });

    const targetObs = document.body || document.documentElement;
    if (targetObs) {
      observer.observe(targetObs, { childList: true, subtree: true });
    }

    // Handle fill command from browser chrome
    ipcRenderer.on('autofill:do-fill', (_event, cred: { username: string; password: string }) => {
      const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
      if (passwordInputs.length > 0) {
        const passInput = passwordInputs[0];
        passInput.value = cred.password;
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Find username/email field
        const form = passInput.form || passInput.closest('form, .login-box, .login-card, .auth-card') || document;
        const textInputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input:not([type])')) as HTMLInputElement[];
        if (textInputs.length > 0 && cred.username) {
          const userInput = textInputs[0];
          userInput.value = cred.username;
          userInput.dispatchEvent(new Event('input', { bubbles: true }));
          userInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutofill);
  } else {
    initAutofill();
  }

  const initPageEnhancements = () => {
    // =========================================================================
    // Click Image to View Full Screen
    // =========================================================================
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const img = target.closest('img') as HTMLImageElement | null;
      if (img) {
        const src = img.currentSrc || img.src || img.getAttribute('src');
        if (src && !src.startsWith('data:image/svg')) {
          // Check if image has substantive size
          const w = img.naturalWidth || img.clientWidth || img.width || 0;
          const h = img.naturalHeight || img.clientHeight || img.height || 0;
          if (w >= 48 || h >= 48 || !img.complete) {
            // Only trigger fullscreen preview on Alt+Click so regular link/button clicks are never hijacked
            if (e.altKey) {
              e.preventDefault();
              e.stopPropagation();
              ipcRenderer.send('browser:request-view-image-fullscreen', src);
            }
          }
        }
      }
    }, true);

    // =========================================================================
    // Custom Glassmorphic Controls for HTML5 Videos
    // =========================================================================
    const attachVideoControls = () => {
      if (location.hostname.includes('youtube.com') || location.hostname.includes('vimeo.com')) return;

      const videos = Array.from(document.querySelectorAll('video')) as HTMLVideoElement[];
      videos.forEach(video => {
        if ((video as any).__thaaw_controls_attached) return;
        (video as any).__thaaw_controls_attached = true;

        const overlay = document.createElement('div');
        overlay.className = 'thaaw-video-controls-overlay';
        overlay.setAttribute('style', `
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(10, 16, 32, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          z-index: 2147483640;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #F8FAFC;
          font-size: 12px;
          opacity: 0;
          pointer-events: auto;
          transition: opacity 0.25s ease;
          user-select: none;
        `);

        // Play/Pause button
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.setAttribute('style', 'background: transparent; border: none; color: #38BDF8; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 50%;');
        const updatePlayIcon = () => {
          playBtn.innerHTML = video.paused ? 
            `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>` :
            `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        };
        updatePlayIcon();
        playBtn.onclick = (e) => {
          e.stopPropagation();
          if (video.paused) video.play().catch(() => {}); else video.pause();
          updatePlayIcon();
        };

        // Time display
        const timeDisplay = document.createElement('span');
        timeDisplay.setAttribute('style', 'font-size: 11px; color: #CBD5E1; font-variant-numeric: tabular-nums;');
        const formatTime = (sec: number) => {
          if (isNaN(sec) || !isFinite(sec)) return '0:00';
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60);
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };
        timeDisplay.textContent = '0:00 / 0:00';

        // Scrub slider
        const scrub = document.createElement('input');
        scrub.type = 'range';
        scrub.min = '0';
        scrub.max = '100';
        scrub.value = '0';
        scrub.setAttribute('style', 'width: 80px; height: 4px; accent-color: #38BDF8; cursor: pointer;');
        scrub.oninput = (e) => {
          e.stopPropagation();
          if (video.duration) {
            video.currentTime = (parseFloat(scrub.value) / 100) * video.duration;
          }
        };

        // Volume / Mute
        const muteBtn = document.createElement('button');
        muteBtn.type = 'button';
        muteBtn.setAttribute('style', 'background: transparent; border: none; color: #CBD5E1; cursor: pointer; display: flex; align-items: center; padding: 4px;');
        const updateVolumeIcon = () => {
          muteBtn.innerHTML = (video.muted || video.volume === 0) ?
            `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>` :
            `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        };
        updateVolumeIcon();
        muteBtn.onclick = (e) => {
          e.stopPropagation();
          video.muted = !video.muted;
          updateVolumeIcon();
        };

        // Speed button (1x, 1.25x, 1.5x, 2x)
        const speedBtn = document.createElement('button');
        speedBtn.type = 'button';
        speedBtn.setAttribute('style', 'background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px; color: #F8FAFC; font-size: 10.5px; padding: 2px 5px; cursor: pointer;');
        const speeds = [1, 1.25, 1.5, 2];
        let currentSpeedIdx = 0;
        speedBtn.textContent = '1x';
        speedBtn.onclick = (e) => {
          e.stopPropagation();
          currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
          const spd = speeds[currentSpeedIdx];
          video.playbackRate = spd;
          speedBtn.textContent = `${spd}x`;
        };

        // Picture-in-Picture button
        const pipBtn = document.createElement('button');
        pipBtn.type = 'button';
        pipBtn.title = 'Picture-in-Picture';
        pipBtn.setAttribute('style', 'background: transparent; border: none; color: #CBD5E1; cursor: pointer; display: flex; align-items: center; padding: 4px;');
        pipBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="4" width="20" height="16" rx="2"></rect><rect x="12" y="10" width="8" height="6" rx="1"></rect></svg>`;
        pipBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            if (document.pictureInPictureElement === video) {
              await document.exitPictureInPicture();
            } else {
              await video.requestPictureInPicture();
            }
          } catch {}
        };

        // Fullscreen button
        const fsBtn = document.createElement('button');
        fsBtn.type = 'button';
        fsBtn.title = 'Fullscreen';
        fsBtn.setAttribute('style', 'background: transparent; border: none; color: #CBD5E1; cursor: pointer; display: flex; align-items: center; padding: 4px;');
        fsBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
        fsBtn.onclick = (e) => {
          e.stopPropagation();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            video.requestFullscreen?.().catch(() => {});
          }
        };

        overlay.appendChild(playBtn);
        overlay.appendChild(timeDisplay);
        overlay.appendChild(scrub);
        overlay.appendChild(muteBtn);
        overlay.appendChild(speedBtn);
        overlay.appendChild(pipBtn);
        overlay.appendChild(fsBtn);

        if (video.parentElement) {
          const parentStyle = window.getComputedStyle(video.parentElement);
          if (parentStyle.position === 'static') {
            video.parentElement.style.position = 'relative';
          }
          video.parentElement.appendChild(overlay);
        } else {
          document.body.appendChild(overlay);
        }

        let hideTimer: any = null;
        const showControls = () => {
          overlay.style.opacity = '1';
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (!video.paused) overlay.style.opacity = '0';
          }, 2500);
        };

        video.addEventListener('mousemove', showControls);
        video.addEventListener('mouseenter', showControls);
        overlay.addEventListener('mouseenter', () => {
          overlay.style.opacity = '1';
          clearTimeout(hideTimer);
        });
        overlay.addEventListener('mouseleave', () => {
          if (!video.paused) {
            hideTimer = setTimeout(() => overlay.style.opacity = '0', 1200);
          }
        });

        video.addEventListener('timeupdate', () => {
          if (video.duration) {
            scrub.value = String((video.currentTime / video.duration) * 100);
            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
          }
        });

        video.addEventListener('play', () => {
          updatePlayIcon();
          showControls();
        });
        video.addEventListener('pause', () => {
          updatePlayIcon();
          overlay.style.opacity = '1';
          clearTimeout(hideTimer);
        });
        video.addEventListener('volumechange', updateVolumeIcon);
      });
    };

    // YouTube in-stream video ad auto-skipper
    if (location.hostname.includes('youtube.com')) {
      const skipYouTubeAds = () => {
        try {
          const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-overlay-close-button') as HTMLElement | null;
          if (skipBtn) {
            skipBtn.click();
          }
          const adContainer = document.querySelector('.ad-showing, .ad-interrupting');
          if (adContainer) {
            const ytVideo = document.querySelector('video') as HTMLVideoElement | null;
            if (ytVideo && !isNaN(ytVideo.duration) && isFinite(ytVideo.duration)) {
              ytVideo.currentTime = ytVideo.duration;
              ytVideo.muted = true;
            }
          }
        } catch {}
      };
      setInterval(skipYouTubeAds, 500);
    }

    let videoAttachTimer: any = null;
    const scheduleAttachVideoControls = () => {
      if (videoAttachTimer) return;
      videoAttachTimer = setTimeout(() => {
        videoAttachTimer = null;
        attachVideoControls();
      }, 350);
    };

    if (document.readyState === 'complete') {
      attachVideoControls();
    } else {
      window.addEventListener('load', attachVideoControls, { once: true });
    }

    const videoObserver = new MutationObserver((mutations) => {
      let hasVideoNode = false;
      for (let i = 0; i < mutations.length; i++) {
        const added = mutations[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const node = added[j] as HTMLElement;
          if (node.nodeType === 1) {
            if (node.tagName === 'VIDEO' || (node.firstElementChild && node.querySelector?.('video'))) {
              hasVideoNode = true;
              break;
            }
          }
        }
        if (hasVideoNode) break;
      }
      if (hasVideoNode) {
        scheduleAttachVideoControls();
      }
    });

    const bodyOrDoc = document.body || document.documentElement;
    if (bodyOrDoc) {
      videoObserver.observe(bodyOrDoc, { childList: true, subtree: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageEnhancements);
  } else {
    initPageEnhancements();
  }
}


export type ThaawAPI = typeof thaawAPI;

