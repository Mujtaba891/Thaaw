/**
 * THAAW Browser — Professional UI Chrome Renderer
 * Manages tab strip UI, Omnibox, security indicators, dialogs, sidebar, and modals.
 * 100% SVG Iconography. Zero Emojis.
 */

interface ThaawTabInfo {
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
}

interface ThaawSecurityStatus {
  domain: string;
  isShieldActive: boolean;
  protectionLevel: string;
  trackersBlockedCount: number;
  adsBlockedCount?: number;
  recentBlocks?: any[];
  thirdPartyCookiesBlocked: boolean;
  fingerprintProtectionActive: boolean;
  httpsEnforced: boolean;
}

interface ThaawPermissionRequest {
  id: string;
  origin: string;
  permission: string;
  details: {
    who: string;
    what: string;
    why: string;
    when: string;
  };
}

interface ThaawDownloadPrompt {
  downloadId: string;
  inspection: {
    filename: string;
    riskLevel: string;
    reasons: string[];
  };
}

interface ThaawAPIBridge {
  createTab(url?: string): void;
  closeTab(id: number): void;
  switchTab(id: number): void;
  navigate(url: string): void;
  reload(): void;
  stop(): void;
  goBack(): void;
  goForward(): void;
  toggleTabMute(id: number): void;
  duplicateTab(id: number): void;
  pinTab(id: number): void;
  reopenClosedTab?(): Promise<any>;
  sleepTab?(id: number): void;
  wakeTab?(id: number): void;
  setMinimalMode?(enabled: boolean): Promise<any>;
  setChromeHeight?(height: number): void;
  searchTabs(query: string): Promise<ThaawTabInfo[]>;
  setSidebarOffset(width: number): void;
  getTheme(): Promise<{ theme: string; preset?: string }>;
  setTheme(theme: string, preset?: string): Promise<{ success: boolean; theme: string; preset?: string }>;
  getWallpaper?(): Promise<string>;
  setWallpaper?(wallpaper: string): Promise<{ success: boolean; wallpaper: string }>;
  getHistory(query?: string): Promise<any[]>;
  deleteHistoryItem(id: string): Promise<boolean>;
  clearHistory(): Promise<boolean>;
  clearHistoryRange?(sinceTimestamp: number): Promise<{ success: boolean; removedCount: number }>;
  getBookmarks(query?: string): Promise<any[]>;
  addBookmark(item: { title: string; url: string; parentId?: string; isFolder?: boolean }): Promise<any>;
  updateBookmark(id: string, patch: unknown): Promise<any>;
  deleteBookmark(id: string): Promise<boolean>;
  toggleBookmark(title: string, url: string): Promise<{ bookmarked: boolean }>;
  importBookmarks?(content: string, format?: 'json' | 'html'): Promise<{ imported: number; errors: number }>;
  getPasswords(query?: string): Promise<any[]>;
  savePassword(item: { website: string; username: string; password: string }): Promise<any>;
  revealPassword(id: string): Promise<string>;
  deletePassword(id: string): Promise<boolean>;
  getNews(category?: string): Promise<any>;
  getSettings(): Promise<unknown>;
  updateSettings(settings: unknown): Promise<unknown>;
  clearBrowsingData(): Promise<{ success: boolean }>;
  getSecurityStatus(): Promise<ThaawSecurityStatus>;
  toggleShield(): Promise<{ isShieldActive: boolean }>;
  setProtectionLevel(level: string): Promise<{ level: string }>;
  respondPermission(requestId: string, decision: 'allow' | 'allow-once' | 'deny'): void;
  respondDownload(downloadId: string, accept: boolean): void;
  executeCommand(commandId: string): void;
  listProfiles(): Promise<any[]>;
  getActiveProfile(): Promise<any>;
  setActiveProfile(id: string): Promise<any>;
  createProfile(name: string): Promise<any>;
  updateBrowserProfile(id: string, patch: any): Promise<any>;
  duplicateBrowserProfile(id: string): Promise<any>;
  updateBrowserProfileSettings(id: string, patch: any): Promise<any>;
  canDeleteBrowserProfile(id: string): Promise<boolean>;
  deleteBrowserProfile(id: string): Promise<{ success: boolean; reason?: string }>;
  showProfileContextMenu(id: string): void;
  showMainMenu(): void;
  showProfileMenu(): void;
  showEngineMenu(): void;
  setModalOpen(isOpen: boolean): void;
  onTabSnapshot?: (callback: (data: { dataUrl?: string; visible: boolean }) => void) => () => void;
  showTabContextMenu(id: number): void;
  toggleDevTools(): void;
  inspectElement(x?: number, y?: number): void;
  createAccount(params: any): Promise<any>;
  signIn(params: any): Promise<any>;
  signOut(): Promise<any>;
  getCurrentUser(): Promise<any>;
  updateProfile(params: any): Promise<any>;
  listAccounts(): Promise<any[]>;
  getRecentDownloads(limit?: number): Promise<any[]>;
  getAllDownloads(): Promise<any[]>;
  pauseDownload(id: string): Promise<boolean>;
  resumeDownload(id: string): Promise<boolean>;
  cancelDownload(id: string): Promise<boolean>;
  openDownloadFile(id: string): Promise<boolean>;
  openDownloadFolder(id: string): Promise<boolean>;
  deleteDownloadFile(id: string): Promise<boolean>;
  removeDownloadItem(id: string): Promise<boolean>;
  clearCompletedDownloads(): Promise<boolean>;
  getSiteIntelligence(): Promise<any>;
  setRightSidebar(width: number): Promise<boolean>;
  clearSiteData(origin?: string): Promise<{ success: boolean }>;
  onPwaStatus?(callback: (data: { tabId: number; isPwa: boolean; pwa?: any }) => void): () => void;
  installPwa?(manifest: any): Promise<{ success: boolean; pwa?: any; error?: string }>;
  openPwa?(id: string): Promise<{ success: boolean }>;
  listPwas?(): Promise<any[]>;
  uninstallPwa?(id: string): Promise<{ success: boolean }>;
  isPwaInstalled?(originOrUrl: string): Promise<boolean>;
  updateSitePermission(permission: string, state: string, origin?: string): Promise<{ success: boolean }>;
  getMatchingCredentials?(originOrUrl: string): Promise<any[]>;
  saveOrUpdateCredential?(item: { website: string; username: string; password: string; id?: string }): Promise<any>;
  autofillActiveTab?(cred: { username: string; password: string }): Promise<{ success: boolean; error?: string }>;
  zoomIn(): void;
  zoomOut(): void;
  zoomReset(): void;
  toggleFullscreen(): void;
  printPage(): void;
  savePage(): void;
  viewSource(): void;
  minimizeWindow?(): void;
  maximizeWindow?(): void;
  closeWindow?(): void;
  onShowQrCode(callback: (data: { url: string }) => void): () => void;
  onShowCast(callback: (data: { url: string }) => void): () => void;
  onTabsUpdated(callback: (data: { tabs: ThaawTabInfo[]; activeTabId: number | null }) => void): () => void;
  onThemeUpdated(callback: (data: { theme: string; preset: string }) => void): () => void;
  onWallpaperUpdated?(callback: (wallpaper: string) => void): () => void;
  onEngineUpdated(callback: (data: { engine: string; label: string }) => void): () => void;
  onToggleSidebar(callback: () => void): () => void;
  onSecurityStatusUpdated(callback: (status: ThaawSecurityStatus) => void): () => void;
  onPermissionRequested(callback: (request: ThaawPermissionRequest) => void): () => void;
  onDownloadPrompt(callback: (prompt: ThaawDownloadPrompt) => void): () => void;
  onDownloadStarted?(callback: (item: any) => void): () => void;
  onDownloadProgress?(callback: (data: any) => void): () => void;
  onDownloadCompleted?(callback: (item: any) => void): () => void;
  onDownloadFailed?(callback: (data: any) => void): () => void;
  onDownloadCancelled?(callback: (data: any) => void): () => void;
  onFocusOmnibox?(callback: () => void): () => void;
  onOpenPalette?(callback: () => void): () => void;
  onOpenTabSearch?(callback: () => void): () => void;
  onProfileChanged?(callback: (profile: any) => void): () => void;
  onProfileContextAction?(callback: (data: { action: string; profileId: string }) => void): () => void;
  getRecentSearches?(limit?: number): Promise<any[]>;
  addSearchQuery?(query: string, engine?: string): Promise<any>;
  deleteSearchQuery?(query: string): Promise<boolean>;
  clearSearchHistory?(): Promise<{ success: boolean }>;
  getAutocompleteSuggestions?(query: string): Promise<any[]>;
  toggleBookmarksBar?(show: boolean): Promise<any>;
  importPasswordCsv?(csvContent: string): Promise<any>;
  exportPasswordCsv?(): Promise<any>;
  getMatchingCredentials?(originOrUrl: string): Promise<any[]>;
  onBookmarksBarToggled?(callback: (show: boolean) => void): () => void;
  onShowPasswordPrompt?(callback: (data: any) => void): () => void;
  respondPasswordPrompt?(decision: string, data: any): void;
  onAuthChanged?(callback: (user: any) => void): () => void;
  onMinimalModeChanged?(callback: (enabled: boolean) => void): () => void;
  getWallpaper?(): Promise<string>;
  setWallpaper?(wallpaper: string): Promise<any>;
  saveWallpaperFromUrl?(url: string): Promise<any>;
  onViewImageFullscreen?(callback: (url: string) => void): () => void;
  onZoomChanged?(callback: (zoom: number) => void): () => void;
}

interface Window {
  thaawAPI: ThaawAPIBridge;
}

// Inline SVG Icons Helper (Zero Emojis)
const SVG = {
  close: '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  volume: '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>',
  volumeMuted: '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>',
  pin: '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle></svg>',
  lock: '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  lockOpen: '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>',
  shield: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',
  starFilled: '<svg viewBox="0 0 24 24" width="15" height="15" fill="var(--thaaw-primary, #38bdf8)" stroke="var(--thaaw-primary, #38bdf8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  starOutline: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  gear: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  clock: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  download: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  tab: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
  trash: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  stop: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  reload: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
  sun: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  moon: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  key: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
  folder: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  search: '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  info: '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
};

// DOM Elements
const brandHomeBtn = document.getElementById('brandHomeBtn') as HTMLElement;
const tabStrip = document.getElementById('tabStrip') as HTMLElement;
const newTabBtn = document.getElementById('newTabBtn') as HTMLElement;
const tabSearchBtn = document.getElementById('tabSearchBtn') as HTMLElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;
const forwardBtn = document.getElementById('forwardBtn') as HTMLButtonElement;
const reloadBtn = document.getElementById('reloadBtn') as HTMLButtonElement;
const urlInput = document.getElementById('urlInput') as HTMLInputElement;
const engineBadge = document.getElementById('engineBadge') as HTMLElement;
const engineMenu = document.getElementById('engineMenu') as HTMLElement;
const bookmarkCurrentBtn = document.getElementById('bookmarkCurrentBtn') as HTMLElement;
const securityIndicatorBtn = document.getElementById('securityIndicatorBtn') as HTMLElement;
const securityLockIcon = document.getElementById('securityLockIcon') as HTMLElement;
const shieldBlockedBadge = document.getElementById('shieldBlockedBadge') as HTMLElement;
const quickShieldBtn = document.getElementById('quickShieldBtn') as HTMLElement;
const downloadsBtn = document.getElementById('downloadsBtn') as HTMLElement;
const pwaInstallBtn = document.getElementById('pwaInstallBtn') as HTMLElement | null;
const pwaInstallModal = document.getElementById('pwaInstallModal') as HTMLElement | null;
const pwaModalCloseBtn = document.getElementById('pwaModalCloseBtn') as HTMLElement | null;
const pwaModalIcon = document.getElementById('pwaModalIcon') as HTMLImageElement | null;
const pwaModalName = document.getElementById('pwaModalName') as HTMLElement | null;
const pwaModalOrigin = document.getElementById('pwaModalOrigin') as HTMLElement | null;
const pwaModalDesc = document.getElementById('pwaModalDesc') as HTMLElement | null;
const pwaCancelBtn = document.getElementById('pwaCancelBtn') as HTMLElement | null;
const pwaConfirmInstallBtn = document.getElementById('pwaConfirmInstallBtn') as HTMLElement | null;
const profileBtn = document.getElementById('profileBtn') as HTMLElement;
const profileAvatarIcon = document.getElementById('profileAvatarIcon') as HTMLElement | null;
const topProfileAvatar = document.getElementById('topProfileAvatar') as HTMLElement;
const profileMenu = document.getElementById('profileMenu') as HTMLElement;
const topProfileName = document.getElementById('topProfileName') as HTMLElement;
const topProfileList = document.getElementById('topProfileList') as HTMLElement;
const profileActiveAvatar = document.getElementById('profileActiveAvatar') as HTMLElement | null;
const profileActiveName = document.getElementById('profileActiveName') as HTMLElement | null;
const profileActiveEmail = document.getElementById('profileActiveEmail') as HTMLElement | null;
const profileActiveStatus = document.getElementById('profileActiveStatus') as HTMLElement | null;
const createProfileQuickBtn = (document.getElementById('createProfileBtn') || document.getElementById('createProfileQuickBtn')) as HTMLElement | null;
const editProfileQuickBtn = (document.getElementById('editCurrentProfileBtn') || document.getElementById('editProfileQuickBtn')) as HTMLElement | null;
const manageProfilesQuickBtn = (document.getElementById('openProfileSettingsBtn') || document.getElementById('manageProfilesQuickBtn')) as HTMLElement | null;
const openProfileSettingsBtn = document.getElementById('openProfileSettingsBtn') as HTMLElement;
const commandPaletteBtn = document.getElementById('commandPaletteBtn') as HTMLElement;
const menuBtn = document.getElementById('menuBtn') as HTMLElement | null;

// Bookmarks Bar, Autocomplete, Password Prompt & PWA Elements
const bookmarksBar = document.getElementById('bookmarksBar') as HTMLElement | null;
const omniboxAutocompleteDropdown = document.getElementById('omniboxAutocompleteDropdown') as HTMLElement | null;
const passwordKeyBtn = document.getElementById('passwordKeyBtn') as HTMLElement | null;
const passwordSavePrompt = document.getElementById('passwordSavePrompt') as HTMLElement | null;
const pwdPromptTitle = document.getElementById('pwdPromptTitle') as HTMLElement | null;
const pwdPromptOrigin = document.getElementById('pwdPromptOrigin') as HTMLElement | null;
const pwdPromptUsername = document.getElementById('pwdPromptUsername') as HTMLElement | null;
const pwdPromptMasked = document.getElementById('pwdPromptMasked') as HTMLElement | null;
const pwdPromptPlain = document.getElementById('pwdPromptPlain') as HTMLElement | null;
const pwdPromptToggleBtn = document.getElementById('pwdPromptToggleBtn') as HTMLElement | null;
const pwdPromptCloseBtn = document.getElementById('pwdPromptCloseBtn') as HTMLElement | null;
const pwdPromptNotNowBtn = (document.getElementById('pwdPromptNotNowBtn') || document.getElementById('pwdPromptDismissBtn')) as HTMLButtonElement | null;
const pwdPromptSaveBtn = document.getElementById('pwdPromptSaveBtn') as HTMLButtonElement | null;

// Flyouts & Modals
const securityPanel = document.getElementById('securityPanel') as HTMLElement;
const panelDomain = document.getElementById('panelDomain') as HTMLElement;
const panelBlockedCount = document.getElementById('panelBlockedCount') as HTMLElement;
const panelHttpsStatus = document.getElementById('panelHttpsStatus') as HTMLElement;
const panelProtectionBadge = document.getElementById('panelProtectionBadge') as HTMLElement;
const shieldToggle = document.getElementById('shieldToggle') as HTMLInputElement;
const clearSiteDataBtn = document.getElementById('clearSiteDataBtn') as HTMLElement;
const openSecurityCenterBtn = document.getElementById('openSecurityCenterBtn') as HTMLElement;
const mainMenu = document.getElementById('mainMenu') as HTMLElement;

// Browser Menu View Elements
const zoomLevelDisplay = document.getElementById('zoomLevelDisplay') as HTMLElement;
const zoomInBtn = document.getElementById('zoomInBtn') as HTMLElement;
const zoomOutBtn = document.getElementById('zoomOutBtn') as HTMLElement;
const zoomResetBtn = document.getElementById('zoomResetBtn') as HTMLElement;
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn') as HTMLElement;
const profileCenterModal = document.getElementById('profileCenterModal') as HTMLElement;
const deleteProfileModal = document.getElementById('deleteProfileModal') as HTMLElement;
const profileCenterList = document.getElementById('profileCenterList') as HTMLElement;
const profileEditorForm = document.getElementById('profileEditorForm') as HTMLFormElement;
const profileEditorId = document.getElementById('profileEditorId') as HTMLInputElement;
const profileEditorName = document.getElementById('profileEditorName') as HTMLInputElement;
const profileEditorEmail = document.getElementById('profileEditorEmail') as HTMLInputElement;
const profileEditorColor = document.getElementById('profileEditorColor') as HTMLInputElement;
const profileEditorAvatarFile = document.getElementById('profileEditorAvatarFile') as HTMLInputElement;
const profileEditorAvatarBtn = document.getElementById('profileEditorAvatarBtn') as HTMLElement;
const profileEditorTheme = document.getElementById('profileEditorTheme') as HTMLSelectElement;
const profileEditorInitial = document.getElementById('profileEditorInitial') as HTMLElement;
const profileEditorHeading = document.getElementById('profileEditorHeading') as HTMLElement;
const closeProfileCenterBtn = document.getElementById('closeProfileCenterBtn') as HTMLElement;
const duplicateProfileBtn = document.getElementById('duplicateProfileBtn') as HTMLElement;
const requestDeleteProfileBtn = document.getElementById('requestDeleteProfileBtn') as HTMLElement;
const cancelDeleteProfileBtn = document.getElementById('cancelDeleteProfileBtn') as HTMLElement;
const confirmDeleteProfileBtn = document.getElementById('confirmDeleteProfileBtn') as HTMLElement;
const deleteProfileMessage = document.getElementById('deleteProfileMessage') as HTMLElement;

// Download Popover & Toolbar Elements
const downloadBadge = document.getElementById('downloadBadge') as HTMLElement;
const downloadPopover = document.getElementById('downloadPopover') as HTMLElement;
const downloadPopoverList = document.getElementById('downloadPopoverList') as HTMLElement;
const downloadPopoverEmpty = document.getElementById('downloadPopoverEmpty') as HTMLElement;
const downloadClearBtn = document.getElementById('downloadClearBtn') as HTMLElement;
const downloadShowMoreBtn = document.getElementById('downloadShowMoreBtn') as HTMLElement;

// Toast Container
const toastContainer = document.getElementById('toastContainer') as HTMLElement;

// Backdrop & Fullscreen Image Lightbox
const flyoutBackdrop = document.getElementById('flyoutBackdrop') as HTMLElement | null;
const tabSnapshotLayer = document.getElementById('tabSnapshotLayer') as HTMLElement | null;
const imageLightboxModal = document.getElementById('imageLightboxModal') as HTMLElement | null;
const lightboxImg = document.getElementById('lightboxImg') as HTMLImageElement | null;
const lightboxCloseBtn = document.getElementById('lightboxCloseBtn') as HTMLElement | null;
const lightboxSaveWallpaperBtn = document.getElementById('lightboxSaveWallpaperBtn') as HTMLElement | null;
const lightboxCopyUrlBtn = document.getElementById('lightboxCopyUrlBtn') as HTMLElement | null;

window.thaawAPI?.onTabSnapshot?.((data) => {
  if (!tabSnapshotLayer) return;
  if (data.visible && data.dataUrl) {
    tabSnapshotLayer.style.backgroundImage = `url(${data.dataUrl})`;
    tabSnapshotLayer.classList.remove('hidden');
  } else {
    tabSnapshotLayer.classList.add('hidden');
    tabSnapshotLayer.style.backgroundImage = 'none';
  }
});

// Modals
const tabSearchModal = document.getElementById('tabSearchModal') as HTMLElement;
const tabSearchInput = document.getElementById('tabSearchInput') as HTMLInputElement;
const tabSearchResults = document.getElementById('tabSearchResults') as HTMLElement;

const permissionModal = document.getElementById('permissionModal') as HTMLElement;
const permModalTitle = document.getElementById('permModalTitle') as HTMLElement;
const permWho = document.getElementById('permWho') as HTMLElement;
const permWhat = document.getElementById('permWhat') as HTMLElement;
const permWhy = document.getElementById('permWhy') as HTMLElement;
const permAllowBtn = document.getElementById('permAllowBtn') as HTMLElement;
const permAllowOnceBtn = document.getElementById('permAllowOnceBtn') as HTMLElement;
const permDenyBtn = document.getElementById('permDenyBtn') as HTMLElement;

const downloadModal = document.getElementById('downloadModal') as HTMLElement;
const dlFilename = document.getElementById('dlFilename') as HTMLElement;
const dlWarningMessage = document.getElementById('dlWarningMessage') as HTMLElement;
const dlAcceptBtn = document.getElementById('dlAcceptBtn') as HTMLElement;
const dlCancelBtn = document.getElementById('dlCancelBtn') as HTMLElement;
const paletteModal = document.getElementById('paletteModal') as HTMLElement;
const paletteInput = document.getElementById('paletteInput') as HTMLInputElement;
const paletteList = document.getElementById('paletteList') as HTMLElement;

// QR Code and Cast Modals
const qrModal = document.getElementById('qrModal') as HTMLElement;
const qrCodeContainer = document.getElementById('qrCodeContainer') as HTMLElement;
const qrUrlText = document.getElementById('qrUrlText') as HTMLElement;
const copyQrUrlBtn = document.getElementById('copyQrUrlBtn') as HTMLElement;
const closeQrBtn = document.getElementById('closeQrBtn') as HTMLElement;

const castModal = document.getElementById('castModal') as HTMLElement;
const closeCastBtn = document.getElementById('closeCastBtn') as HTMLElement;

// Download Item Actions Modal
const downloadActionsModal = document.getElementById('downloadActionsModal') as HTMLElement;
const dlMenuIcon = document.getElementById('dlMenuIcon') as HTMLElement;
const dlMenuFilename = document.getElementById('dlMenuFilename') as HTMLElement;
const dlActionOpen = document.getElementById('dlActionOpen') as HTMLElement;
const dlActionFolder = document.getElementById('dlActionFolder') as HTMLElement;
const dlActionCopyLink = document.getElementById('dlActionCopyLink') as HTMLElement;
const dlActionRemove = document.getElementById('dlActionRemove') as HTMLElement;
const dlActionDelete = document.getElementById('dlActionDelete') as HTMLElement;
const dlActionCancel = document.getElementById('dlActionCancel') as HTMLElement;
let selectedDownloadItem: any = null;

// Premium Site Control Center Modal Elements
const siteControlModal = document.getElementById('siteControlModal') as HTMLElement;
const closeSiteControlBtn = document.getElementById('closeSiteControlBtn') as HTMLElement;
const siteTabLockBtn = document.getElementById('siteTabLockBtn') as HTMLElement;
const siteTabShieldBtn = document.getElementById('siteTabShieldBtn') as HTMLElement;
const siteTabKeyBtn = document.getElementById('siteTabKeyBtn') as HTMLElement;
const sitePanelLock = document.getElementById('sitePanelLock') as HTMLElement;
const sitePanelShield = document.getElementById('sitePanelShield') as HTMLElement;
const sitePanelKey = document.getElementById('sitePanelKey') as HTMLElement;
const siteControlDomain = document.getElementById('siteControlDomain') as HTMLElement;
const siteControlSecBadge = document.getElementById('siteControlSecBadge') as HTMLElement;
const siteControlFullUrl = document.getElementById('siteControlFullUrl') as HTMLElement;
const siteControlCopyUrlBtn = document.getElementById('siteControlCopyUrlBtn') as HTMLElement;
const siteControlFavicon = document.getElementById('siteControlFavicon') as HTMLImageElement;
const siteControlFaviconFallback = document.getElementById('siteControlFaviconFallback') as HTMLElement;
const siteTabShieldBadge = document.getElementById('siteTabShieldBadge') as HTMLElement;
const siteTabKeyBadge = document.getElementById('siteTabKeyBadge') as HTMLElement;

// Lock tab elements
const siteSecCertStatus = document.getElementById('siteSecCertStatus') as HTMLElement;
const siteSecProtocolBadge = document.getElementById('siteSecProtocolBadge') as HTMLElement;
const siteSecCertDesc = document.getElementById('siteSecCertDesc') as HTMLElement;
const siteSecCipher = document.getElementById('siteSecCipher') as HTMLElement;
const siteSecHsts = document.getElementById('siteSecHsts') as HTMLElement;
const siteSecProtocol = document.getElementById('siteSecProtocol') as HTMLElement;
const sitePermsList = document.getElementById('sitePermsList') as HTMLElement;
const siteStorageCookiesCount = document.getElementById('siteStorageCookiesCount') as HTMLElement;
const siteClearDataBtn = document.getElementById('siteClearDataBtn') as HTMLElement;

// Shield tab elements
const siteMasterShieldToggle = document.getElementById('siteMasterShieldToggle') as HTMLInputElement;
const siteShieldActiveLabel = document.getElementById('siteShieldActiveLabel') as HTMLElement;
const siteMetricTrackers = document.getElementById('siteMetricTrackers') as HTMLElement;
const siteMetricAds = document.getElementById('siteMetricAds') as HTMLElement;
const siteMetricFingerprint = document.getElementById('siteMetricFingerprint') as HTMLElement;
const siteMetricHttps = document.getElementById('siteMetricHttps') as HTMLElement;
const levelCardBalanced = document.getElementById('levelCardBalanced') as HTMLElement;
const levelCardStrict = document.getElementById('levelCardStrict') as HTMLElement;
const levelCardMaximum = document.getElementById('levelCardMaximum') as HTMLElement;
const siteBlockedStream = document.getElementById('siteBlockedStream') as HTMLElement;

// Key tab elements
const siteMatchedCredsList = document.getElementById('siteMatchedCredsList') as HTMLElement;
const siteAddCredForm = document.getElementById('siteAddCredForm') as HTMLFormElement;
const siteCredUsername = document.getElementById('siteCredUsername') as HTMLInputElement;
const siteCredPassword = document.getElementById('siteCredPassword') as HTMLInputElement;
const siteCredTogglePwd = document.getElementById('siteCredTogglePwd') as HTMLElement;
const siteGenResult = document.getElementById('siteGenResult') as HTMLInputElement;
const siteGenRefreshBtn = document.getElementById('siteGenRefreshBtn') as HTMLElement;
const siteGenCopyBtn = document.getElementById('siteGenCopyBtn') as HTMLElement;
const siteGenUseBtn = document.getElementById('siteGenUseBtn') as HTMLElement;
const siteGenLengthSlider = document.getElementById('siteGenLengthSlider') as HTMLInputElement;
const siteGenLengthVal = document.getElementById('siteGenLengthVal') as HTMLElement;
const siteGenUpper = document.getElementById('siteGenUpper') as HTMLInputElement;
const siteGenLower = document.getElementById('siteGenLower') as HTMLInputElement;
const siteGenNumbers = document.getElementById('siteGenNumbers') as HTMLInputElement;
const siteGenSymbols = document.getElementById('siteGenSymbols') as HTMLInputElement;
const siteGenStrengthBar = document.getElementById('siteGenStrengthBar') as HTMLElement;
const siteGenStrengthText = document.getElementById('siteGenStrengthText') as HTMLElement;

let currentActiveTabId: number | null = null;
let activePermissionRequestId: string | null = null;
let activeDownloadId: string | null = null;
let cachedTabs: ThaawTabInfo[] = [];

function updateFlyoutState(): void {
  const isAnyFlyoutOpen = Boolean(
    (profileMenu && !profileMenu.classList.contains('hidden')) ||
    (downloadPopover && !downloadPopover.classList.contains('hidden')) ||
    (securityPanel && !securityPanel.classList.contains('hidden')) ||
    (mainMenu && !mainMenu.classList.contains('hidden')) ||
    (passwordSavePrompt && !passwordSavePrompt.classList.contains('hidden')) ||
    (pwaInstallModal && !pwaInstallModal.classList.contains('hidden'))
  );

  const isAnyModalOpen = [tabSearchModal, paletteModal, permissionModal, downloadModal, downloadActionsModal, qrModal, castModal, profileCenterModal, deleteProfileModal, imageLightboxModal, siteControlModal].some(
    m => m && !m.classList.contains('hidden')
  );

  if (!isAnyFlyoutOpen) {
    flyoutBackdrop?.classList.add('hidden');
  }

  if (!isAnyFlyoutOpen && !isAnyModalOpen) {
    window.thaawAPI?.setModalOpen(false);
  } else {
    window.thaawAPI?.setModalOpen(true);
  }
}

function openModal(modal: HTMLElement): void {
  if (!modal) return;
  modal.classList.remove('hidden');
  window.thaawAPI?.setModalOpen(true);
}

function closeModal(modal: HTMLElement): void {
  if (!modal) return;
  modal.classList.add('hidden');
  updateFlyoutState();
}

let currentLightboxImgUrl = '';
function openImageLightbox(imageUrl: string): void {
  if (!imageLightboxModal || !lightboxImg || !imageUrl) return;
  currentLightboxImgUrl = imageUrl;
  lightboxImg.src = imageUrl;
  imageLightboxModal.classList.remove('hidden');
  window.thaawAPI?.setModalOpen(true);
}

function closeImageLightbox(): void {
  if (!imageLightboxModal) return;
  imageLightboxModal.classList.add('hidden');
  if (lightboxImg) lightboxImg.src = '';
  currentLightboxImgUrl = '';
  updateFlyoutState();
}

lightboxCloseBtn?.addEventListener('click', () => closeImageLightbox());
imageLightboxModal?.addEventListener('click', (e) => {
  if (e.target === imageLightboxModal || (e.target as HTMLElement).classList.contains('lightbox-img-container')) {
    closeImageLightbox();
  }
});

lightboxSaveWallpaperBtn?.addEventListener('click', async () => {
  if (currentLightboxImgUrl) {
    if (window.thaawAPI?.saveWallpaperFromUrl) {
      await window.thaawAPI.saveWallpaperFromUrl(currentLightboxImgUrl);
    } else if (window.thaawAPI?.setWallpaper) {
      await window.thaawAPI.setWallpaper(currentLightboxImgUrl);
    }
    syncChromeWallpaper(currentLightboxImgUrl);
    showToast('Saved and set as browser wallpaper!', 'info');
  }
});

lightboxCopyUrlBtn?.addEventListener('click', () => {
  if (currentLightboxImgUrl) {
    navigator.clipboard.writeText(currentLightboxImgUrl);
    showToast('Image address copied to clipboard', 'info');
  }
});

(window.thaawAPI as any).onViewImageFullscreen?.((url: string) => {
  openImageLightbox(url);
});


// Search Engine Shortcut detection in Omnibox
urlInput?.addEventListener('input', () => {
  const val = urlInput.value.trim();
  if (val.startsWith('!g')) {
    engineBadge.textContent = 'Google';
    engineBadge.style.display = 'inline-block';
  } else if (val.startsWith('!ddg')) {
    engineBadge.textContent = 'DDG';
    engineBadge.style.display = 'inline-block';
  } else if (val.startsWith('!b')) {
    engineBadge.textContent = 'Brave';
    engineBadge.style.display = 'inline-block';
  } else if (val.startsWith('!yt')) {
    engineBadge.textContent = 'YouTube';
    engineBadge.style.display = 'inline-block';
  } else if (val.startsWith('!gh')) {
    engineBadge.textContent = 'GitHub';
    engineBadge.style.display = 'inline-block';
  } else if (val.startsWith('!w')) {
    engineBadge.textContent = 'Wiki';
    engineBadge.style.display = 'inline-block';
  } else {
    engineBadge.textContent = 'DDG';
    engineBadge.style.display = 'inline-block';
  }
});

// Render Tabs
function renderTabs(tabs: ThaawTabInfo[], activeId: number | null): void {
  cachedTabs = tabs;
  currentActiveTabId = activeId;
  tabStrip.innerHTML = '';

  tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab-item ${tab.id === activeId ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''} ${tab.isSleeping ? 'sleeping' : ''}`;
    tabEl.dataset.tabId = String(tab.id);
    if (tab.isSleeping) {
      tabEl.title = `${tab.title || 'Tab'} (Sleeping — Memory Saved)`;
    }

    // Favicon or loading spinner
    const faviconWrap = document.createElement('div');
    faviconWrap.className = 'tab-favicon';
    if (tab.isLoading) {
      const spinner = document.createElement('div');
      spinner.className = 'tab-spinner';
      faviconWrap.appendChild(spinner);
    } else if (tab.favicon) {
      const img = document.createElement('img');
      img.src = tab.favicon;
      img.alt = '';
      faviconWrap.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'tab-favicon-fallback';
      fallback.textContent = tab.title ? tab.title.charAt(0).toUpperCase() : 'T';
      faviconWrap.appendChild(fallback);
    }
    tabEl.appendChild(faviconWrap);

    // Title (hidden if pinned)
    if (!tab.isPinned) {
      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.textContent = tab.isLoading ? 'Loading...' : (tab.title || 'New Tab');
      tabEl.appendChild(titleSpan);

      if (tab.isSleeping) {
        const sleepBadge = document.createElement('span');
        sleepBadge.className = 'tab-sleep-badge';
        sleepBadge.textContent = 'Sleep';
        tabEl.appendChild(sleepBadge);
      }
    }

    // Audio Mute button
    if (tab.isAudioPlaying || tab.isAudioMuted) {
      const muteBtn = document.createElement('button');
      muteBtn.className = `tab-mute-btn ${tab.isAudioMuted ? 'muted' : ''}`;
      muteBtn.innerHTML = tab.isAudioMuted ? SVG.volumeMuted : SVG.volume;
      muteBtn.title = tab.isAudioMuted ? 'Unmute tab' : 'Mute tab';
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.thaawAPI.toggleTabMute(tab.id);
      });
      tabEl.appendChild(muteBtn);
    }

    // Close button (hidden if pinned)
    if (!tab.isPinned) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close-btn';
      closeBtn.innerHTML = SVG.close;
      closeBtn.title = 'Close tab (Ctrl+W)';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.thaawAPI.closeTab(tab.id);
      });
      tabEl.appendChild(closeBtn);
    }

    // Click to switch
    tabEl.addEventListener('click', () => {
      window.thaawAPI.switchTab(tab.id);
    });

    // Right-click tab context menu
    tabEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.thaawAPI.showTabContextMenu(tab.id);
    });

    tabStrip.appendChild(tabEl);
  });

  // Requirements 29-30: Position '+' button immediately AFTER the last tab
  if (newTabBtn) {
    tabStrip.appendChild(newTabBtn);
  }

  // Update Navigation Controls & Omnibox for active tab
  const activeTab = tabs.find(t => t.id === activeId);
  if (activeTab) {
    backBtn.disabled = !activeTab.canGoBack;
    forwardBtn.disabled = !activeTab.canGoForward;
    if (document.activeElement !== urlInput) {
      urlInput.value = activeTab.url === 'thaaw://newtab' ? '' : activeTab.url;
    }
    updateSecurityIndicator(activeTab.url);
    checkBookmarkState(activeTab.url);

    // Top Loading Progress Bar Animation (Snappy, instantaneous completion)
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    if (loadingProgressBar) {
      if (activeTab.isLoading) {
        loadingProgressBar.classList.add('active');
        if (!loadingProgressBar.style.width || loadingProgressBar.style.width === '0%' || loadingProgressBar.style.width === '100%') {
          loadingProgressBar.style.width = '45%';
          setTimeout(() => {
            if (activeTab.isLoading && loadingProgressBar.classList.contains('active')) {
              loadingProgressBar.style.width = '80%';
            }
          }, 100);
        }
      } else {
        loadingProgressBar.style.width = '100%';
        setTimeout(() => {
          if (!activeTab.isLoading) {
            loadingProgressBar.classList.remove('active');
            loadingProgressBar.style.width = '0%';
          }
        }, 70);
      }
    }

    // Dynamic Reload / Stop icon
    if (activeTab.isLoading) {
      reloadBtn.innerHTML = SVG.stop;
      reloadBtn.title = 'Stop loading (Esc)';
    } else {
      reloadBtn.innerHTML = SVG.reload;
      reloadBtn.title = 'Reload (Ctrl+R)';
    }


    updateSidebarActiveRoute(activeTab.url);
  }
}

// Check bookmark state for Omnibox star
async function checkBookmarkState(url: string): Promise<void> {
  if (!url || url === 'thaaw://newtab') {
    bookmarkCurrentBtn.innerHTML = SVG.starOutline;
    bookmarkCurrentBtn.classList.remove('active');
    bookmarkCurrentBtn.title = 'Bookmark this page (Ctrl+D)';
    return;
  }
  try {
    const bookmarks = await window.thaawAPI.getBookmarks();
    const isBookmarked = bookmarks.some((b: any) => b.url === url);
    bookmarkCurrentBtn.innerHTML = isBookmarked ? SVG.starFilled : SVG.starOutline;
    bookmarkCurrentBtn.classList.toggle('active', isBookmarked);
    bookmarkCurrentBtn.title = isBookmarked ? 'Edit or remove bookmark' : 'Bookmark this page (Ctrl+D)';
  } catch (_e) {
    bookmarkCurrentBtn.innerHTML = SVG.starOutline;
  }
}

// Update Security Indicator in Omnibox
function updateSecurityIndicator(url: string): void {
  if (url.startsWith('https://') || url.startsWith('thaaw://')) {
    securityLockIcon.innerHTML = SVG.lock;
    securityIndicatorBtn.className = 'security-indicator secure';
    securityIndicatorBtn.title = 'Secure connection (TLS encrypted)';
  } else {
    securityLockIcon.innerHTML = SVG.lockOpen;
    securityIndicatorBtn.className = 'security-indicator insecure';
    securityIndicatorBtn.title = 'Insecure connection (Unencrypted HTTP)';
  }
  if (passwordKeyBtn) {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('thaaw://'))) {
      passwordKeyBtn.classList.remove('hidden');
    }
  }
}

// Global Theme Management
let currentThemeMode = 'dark';
let currentThemePreset = 'midnight';

function syncChromeWallpaper(wallpaperId?: string): void {
  const layer = document.getElementById('chromeWallpaperLayer');
  if (!layer) return;

  const applyWp = (wpId: string) => {
    layer.className = 'chrome-wallpaper-layer';
    if (wpId === 'none') {
      layer.style.backgroundImage = 'none';
      layer.style.backgroundColor = currentThemeMode === 'light' ? '#F8FAFC' : '#050812';
    } else if (!wpId || wpId === 'default') {
      if (currentThemeMode === 'light') {
        layer.style.backgroundImage = 'url("../../assets/wallpapers/light/light-13.webp")';
        layer.style.backgroundColor = '#FAF9F6';
      } else {
        layer.style.backgroundImage = 'url("../../assets/wallpapers/thaaw-midnight-mountains.webp")';
        layer.style.backgroundColor = '#050812';
      }
    } else if (wpId.startsWith('http://') || wpId.startsWith('https://') || wpId.startsWith('data:') || wpId.startsWith('file://')) {
      layer.style.backgroundImage = `url("${wpId}")`;
      layer.style.backgroundColor = currentThemeMode === 'light' ? '#F8FAFC' : '#050812';
    } else {
      const file = wpId.endsWith('.webp') ? wpId : (wpId.startsWith('light-') ? `light/${wpId}.webp` : `${wpId}.webp`);
      layer.style.backgroundImage = `url("../../assets/wallpapers/${file}")`;
      layer.style.backgroundColor = currentThemeMode === 'light' ? '#F8FAFC' : '#050812';
    }
  };

  if (wallpaperId) {
    applyWp(wallpaperId);
    return;
  }

  if (window.thaawAPI?.getWallpaper) {
    window.thaawAPI.getWallpaper().then((wp: string) => {
      applyWp(wp || 'default');
    }).catch(() => {
      applyWp('default');
    });
  } else {
    applyWp('default');
  }
}

function applyThemeToDOM(theme: string, preset?: string): void {
  currentThemeMode = theme;
  if (preset) currentThemePreset = preset;
  document.documentElement.setAttribute('data-theme', theme);
  if (preset) {
    document.documentElement.setAttribute('data-theme-preset', preset);
  }
  syncChromeWallpaper();
}

// Initialize Theme & Wallpaper
window.thaawAPI.getTheme().then(res => {
  if (res) applyThemeToDOM(res.theme, res.preset);
  else syncChromeWallpaper();
}).catch(() => {
  syncChromeWallpaper();
});

window.thaawAPI.onThemeUpdated((data) => {
  applyThemeToDOM(data.theme, data.preset);
});

window.thaawAPI.onWallpaperUpdated?.((wp: string) => {
  syncChromeWallpaper(wp);
});

window.addEventListener('storage', (e) => {
  if (e.key === 'thaaw_active_wallpaper') {
    syncChromeWallpaper(e.newValue || undefined);
  }
});

// Search Engine Selector Dropdown
engineBadge?.addEventListener('click', (e) => {
  e.stopPropagation();
  window.thaawAPI.showEngineMenu();
});

window.thaawAPI.onEngineUpdated(({ engine, label }) => {
  engineBadge.textContent = label.length > 5 ? label.substring(0, 4) : label;
  urlInput.placeholder = `Search ${label} or enter address...`;
  window.thaawAPI.updateSettings({ defaultSearchEngine: engine });
});

// =========================================================================
// Omnibox Autocomplete Engine (History, Bookmarks, Open Tabs, Searches)
// =========================================================================
let autocompleteSelectedIndex = -1;
let currentSuggestions: Array<{ type: string; title: string; url: string; snippet?: string }> = [];

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function hideAutocomplete(): void {
  if (omniboxAutocompleteDropdown) {
    omniboxAutocompleteDropdown.classList.add('hidden');
    omniboxAutocompleteDropdown.innerHTML = '';
  }
  autocompleteSelectedIndex = -1;
  currentSuggestions = [];
}

async function updateAutocompleteSuggestions(query: string): Promise<void> {
  if (!omniboxAutocompleteDropdown || !query || query.trim().length === 0) {
    hideAutocomplete();
    return;
  }
  try {
    const suggestions = await window.thaawAPI.getAutocompleteSuggestions?.(query) || [];
    currentSuggestions = suggestions;
    autocompleteSelectedIndex = -1;

    if (suggestions.length === 0) {
      hideAutocomplete();
      return;
    }

    omniboxAutocompleteDropdown.innerHTML = '';
    suggestions.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'omnibox-autocomplete-item';
      el.dataset.index = String(index);

      const icon = document.createElement('div');
      icon.className = 'omnibox-autocomplete-icon';
      if (item.type === 'bookmark') icon.innerHTML = SVG.bookmark;
      else if (item.type === 'history') icon.innerHTML = SVG.clock;
      else if (item.type === 'tab') icon.innerHTML = SVG.tab;
      else icon.innerHTML = SVG.search;
      el.appendChild(icon);

      const content = document.createElement('div');
      content.className = 'omnibox-autocomplete-content';

      const titleEl = document.createElement('span');
      titleEl.className = 'omnibox-autocomplete-title';
      titleEl.textContent = item.title;
      content.appendChild(titleEl);

      if (item.url && item.url !== item.title) {
        const urlEl = document.createElement('span');
        urlEl.className = 'omnibox-autocomplete-url';
        urlEl.textContent = item.url;
        content.appendChild(urlEl);
      }
      el.appendChild(content);

      const badgeText = item.snippet || (item.type === 'bookmark' ? 'Bookmark' : item.type === 'history' ? 'Visited' : item.type === 'tab' ? 'Switch Tab' : '');
      if (badgeText) {
        const badge = document.createElement('span');
        badge.className = `omnibox-autocomplete-badge badge-${item.type}`;
        badge.textContent = badgeText.length > 2 && badgeText === badgeText.toUpperCase()
          ? badgeText.charAt(0).toUpperCase() + badgeText.slice(1).toLowerCase()
          : badgeText;
        el.appendChild(badge);
      }

      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectAutocompleteItem(item);
      });

      omniboxAutocompleteDropdown.appendChild(el);
    });

    omniboxAutocompleteDropdown.classList.remove('hidden');
  } catch (_err) {
    hideAutocomplete();
  }
}

function selectAutocompleteItem(item: { type: string; title: string; url: string }): void {
  hideAutocomplete();
  if (item.type === 'tab') {
    const tab = cachedTabs.find(t => t.url === item.url || t.title === item.title);
    if (tab) {
      window.thaawAPI.switchTab(tab.id);
      return;
    }
  }
  const destination = item.url || item.title;
  if (destination) {
    window.thaawAPI.navigate(destination);
  }
}

function highlightAutocompleteIndex(index: number): void {
  if (!omniboxAutocompleteDropdown) return;
  const items = Array.from(omniboxAutocompleteDropdown.querySelectorAll('.omnibox-autocomplete-item'));
  items.forEach((item, i) => {
    if (i === index) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
      const sug = currentSuggestions[i];
      if (sug) {
        urlInput.value = sug.url || sug.title;
      }
    } else {
      item.classList.remove('active');
    }
  });
}

// Omnibox Navigation & Autocomplete Keydown
urlInput.addEventListener('input', () => {
  const val = urlInput.value.trim();
  updateAutocompleteSuggestions(val);
});

urlInput.addEventListener('blur', () => {
  setTimeout(() => hideAutocomplete(), 180);
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    if (currentSuggestions.length > 0) {
      e.preventDefault();
      autocompleteSelectedIndex = (autocompleteSelectedIndex + 1) % currentSuggestions.length;
      highlightAutocompleteIndex(autocompleteSelectedIndex);
      return;
    }
  } else if (e.key === 'ArrowUp') {
    if (currentSuggestions.length > 0) {
      e.preventDefault();
      autocompleteSelectedIndex = (autocompleteSelectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
      highlightAutocompleteIndex(autocompleteSelectedIndex);
      return;
    }
  } else if (e.key === 'Enter') {
    if (autocompleteSelectedIndex >= 0 && currentSuggestions[autocompleteSelectedIndex]) {
      e.preventDefault();
      selectAutocompleteItem(currentSuggestions[autocompleteSelectedIndex]);
      urlInput.blur();
      return;
    }
    hideAutocomplete();
    const target = urlInput.value.trim();
    if (target) {
      if (e.altKey) {
        window.thaawAPI.createTab(target);
      } else {
        window.thaawAPI.navigate(target);
      }
      urlInput.blur();
    }
    return;
  } else if (e.key === 'Tab') {
    if (autocompleteSelectedIndex >= 0 && currentSuggestions[autocompleteSelectedIndex]) {
      e.preventDefault();
      const sug = currentSuggestions[autocompleteSelectedIndex];
      urlInput.value = sug.url || sug.title;
      return;
    }
  } else if (e.key === 'Escape') {
    if (!omniboxAutocompleteDropdown?.classList.contains('hidden')) {
      e.preventDefault();
      hideAutocomplete();
      return;
    }
    const active = cachedTabs.find(t => t.id === currentActiveTabId);
    if (active?.isLoading) {
      window.thaawAPI.stop();
    } else {
      urlInput.value = active && active.url !== 'thaaw://newtab' ? active.url : '';
      urlInput.blur();
    }
    return;
  }
});

// =========================================================================
// Bookmarks Bar Renderer & Manager
// =========================================================================
// =========================================================================
// Bookmarks Bar Renderer & Manager (Enhanced Modern Glassmorphic Look)
// =========================================================================
let contextMenuBookmark: any = null;

function closeBookmarkPopups(): void {
  const folderPopup = document.getElementById('bookmarkFolderPopup');
  if (folderPopup) {
    folderPopup.classList.add('hidden');
    folderPopup.innerHTML = '';
  }
  const ctxMenu = document.getElementById('bookmarkContextMenu');
  if (ctxMenu) {
    ctxMenu.classList.add('hidden');
  }
  const overflowMenu = document.getElementById('bookmarksOverflowMenu');
  if (overflowMenu) {
    overflowMenu.classList.add('hidden');
  }
}

// Global click & Escape listener for bookmark popups
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  if (
    target.closest('#bookmarkContextMenu') ||
    target.closest('#bookmarkFolderPopup') ||
    target.closest('#bookmarksOverflowMenu') ||
    target.closest('.bookmark-bar-item.is-folder') ||
    target.closest('#bookmarksOverflowBtn')
  ) {
    return;
  }
  closeBookmarkPopups();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookmarkPopups();
  }
});

// Setup context menu action handlers
const bmCtxOpen = document.getElementById('bmCtxOpen');
const bmCtxOpenNewTab = document.getElementById('bmCtxOpenNewTab');
const bmCtxCopyUrl = document.getElementById('bmCtxCopyUrl');
const bmCtxDelete = document.getElementById('bmCtxDelete');

bmCtxOpen?.addEventListener('click', () => {
  if (contextMenuBookmark?.url) {
    window.thaawAPI.navigate(contextMenuBookmark.url);
  }
  closeBookmarkPopups();
});

bmCtxOpenNewTab?.addEventListener('click', () => {
  if (contextMenuBookmark?.url) {
    window.thaawAPI.createTab(contextMenuBookmark.url);
  }
  closeBookmarkPopups();
});

bmCtxCopyUrl?.addEventListener('click', () => {
  if (contextMenuBookmark?.url) {
    navigator.clipboard.writeText(contextMenuBookmark.url);
    showToast('Bookmark URL copied to clipboard', 'info');
  }
  closeBookmarkPopups();
});

bmCtxDelete?.addEventListener('click', async () => {
  if (contextMenuBookmark?.id) {
    await window.thaawAPI.deleteBookmark(contextMenuBookmark.id);
    showToast('Bookmark removed', 'info');
    renderBookmarksBar();
  }
  closeBookmarkPopups();
});

function showBookmarkContextMenu(e: MouseEvent, bm: any): void {
  e.preventDefault();
  e.stopPropagation();
  closeBookmarkPopups();
  contextMenuBookmark = bm;

  const ctx = document.getElementById('bookmarkContextMenu');
  if (!ctx) return;

  const x = Math.min(e.clientX, window.innerWidth - 190);
  const y = Math.min(e.clientY, window.innerHeight - 150);

  ctx.style.left = `${x}px`;
  ctx.style.top = `${y}px`;
  ctx.classList.remove('hidden');
}

function createBookmarkFavicon(url: string, title?: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'bookmark-bar-favicon';
  if (!url) {
    wrap.innerHTML = SVG.bookmark;
    return wrap;
  }

  try {
    let clean = url.trim();
    if (!clean.includes('://')) clean = 'https://' + clean;
    const parsed = new URL(clean);
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase();

    const bundledMap: Record<string, string> = {
      'github.com': 'thaaw://assets/favicons/github.svg',
      'youtube.com': 'thaaw://assets/favicons/youtube.svg',
      'duckduckgo.com': 'thaaw://assets/favicons/duckduckgo.svg',
      'google.com': 'thaaw://assets/favicons/google.svg',
      'wikipedia.org': 'thaaw://assets/favicons/wikipedia.svg',
      'reddit.com': 'thaaw://assets/favicons/reddit.svg',
      'x.com': 'thaaw://assets/favicons/x.svg',
      'twitter.com': 'thaaw://assets/favicons/x.svg',
      'linkedin.com': 'thaaw://assets/favicons/linkedin.svg'
    };

    const iconUrl = bundledMap[domain] || `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = title || domain;
    img.width = 15;
    img.height = 15;
    img.loading = 'lazy';
    img.onerror = () => {
      const initials = (title && title.trim().length > 0 ? title.trim().slice(0, 2) : domain.slice(0, 2)).toUpperCase();
      wrap.innerHTML = `<span class="bookmark-favicon-badge">${initials}</span>`;
    };
    wrap.appendChild(img);
    return wrap;
  } catch {
    wrap.innerHTML = SVG.bookmark;
    return wrap;
  }
}

function createBookmarkItemElement(bm: any, allBookmarks: any[]): HTMLElement {
  const item = document.createElement('div');
  item.className = `bookmark-bar-item ${bm.isFolder ? 'is-folder' : ''}`;
  item.title = bm.isFolder ? `Folder: ${bm.title}` : `${bm.title || 'Bookmark'} (${bm.url || ''})`;

  if (bm.isFolder) {
    const icon = document.createElement('div');
    icon.className = 'bookmark-bar-favicon';
    icon.innerHTML = SVG.folder;
    item.appendChild(icon);

    const title = document.createElement('span');
    title.className = 'bookmark-bar-title';
    title.textContent = bm.title || 'Folder';
    item.appendChild(title);

    const chevron = document.createElement('span');
    chevron.className = 'bookmark-folder-chevron';
    chevron.innerHTML = SVG.chevronDown;
    item.appendChild(chevron);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const popup = document.getElementById('bookmarkFolderPopup');
      if (!popup) return;

      if (!popup.classList.contains('hidden') && popup.dataset.folderId === bm.id) {
        closeBookmarkPopups();
        return;
      }

      closeBookmarkPopups();
      popup.dataset.folderId = bm.id;
      popup.innerHTML = '';

      const children = allBookmarks.filter(b => b.parentId === bm.id);
      if (children.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'bookmark-folder-empty';
        empty.textContent = 'Folder is empty';
        popup.appendChild(empty);
      } else {
        children.forEach(child => {
          const childRow = document.createElement('button');
          childRow.className = 'dropdown-item';
          childRow.style.display = 'flex';
          childRow.style.alignItems = 'center';
          childRow.style.gap = '8px';
          childRow.style.width = '100%';
          childRow.style.textAlign = 'left';

          const childFav = createBookmarkFavicon(child.url, child.title);
          childRow.appendChild(childFav);

          const childTitle = document.createElement('span');
          childTitle.style.overflow = 'hidden';
          childTitle.style.textOverflow = 'ellipsis';
          childTitle.style.whiteSpace = 'nowrap';
          childTitle.textContent = child.title || child.url;
          childRow.appendChild(childTitle);

          childRow.addEventListener('click', (ev) => {
            if (child.url) {
              if (ev.ctrlKey || ev.metaKey || ev.button === 1) {
                window.thaawAPI.createTab(child.url);
              } else {
                window.thaawAPI.navigate(child.url);
              }
            }
            closeBookmarkPopups();
          });

          childRow.addEventListener('contextmenu', (ev) => {
            showBookmarkContextMenu(ev, child);
          });

          popup.appendChild(childRow);
        });
      }

      const rect = item.getBoundingClientRect();
      popup.style.top = `${rect.bottom + 4}px`;
      popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`;
      popup.classList.remove('hidden');
    });
  } else {
    item.appendChild(createBookmarkFavicon(bm.url, bm.title));

    const title = document.createElement('span');
    title.className = 'bookmark-bar-title';
    title.textContent = bm.title || (bm.url ? new URL(bm.url).hostname : 'Bookmark');
    item.appendChild(title);

    item.addEventListener('click', (e) => {
      if (bm.url) {
        if (e.ctrlKey || e.metaKey || e.button === 1) {
          window.thaawAPI.createTab(bm.url);
        } else {
          window.thaawAPI.navigate(bm.url);
        }
      }
    });

    item.addEventListener('contextmenu', (e) => {
      showBookmarkContextMenu(e, bm);
    });
  }

  return item;
}

async function renderBookmarksBar(): Promise<void> {
  if (!bookmarksBar) return;
  try {
    const settings = await window.thaawAPI.getSettings() as any;
    const show = Boolean(settings?.showBookmarksBar);
    if (!show) {
      bookmarksBar.classList.add('hidden');
      window.thaawAPI?.setChromeHeight?.(84);
      return;
    }
    bookmarksBar.classList.remove('hidden');
    window.thaawAPI?.setChromeHeight?.(118);

    const itemsContainer = document.getElementById('bookmarksBarItems') || bookmarksBar;
    const overflowContainer = document.getElementById('bookmarksBarOverflow');
    const overflowBtn = document.getElementById('bookmarksOverflowBtn');
    const overflowMenu = document.getElementById('bookmarksOverflowMenu');

    itemsContainer.innerHTML = '';
    if (overflowMenu) overflowMenu.innerHTML = '';

    const bookmarks = await window.thaawAPI.getBookmarks() as any[];

    if (!bookmarks || bookmarks.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.className = 'bookmarks-bar-empty';
      emptySpan.innerHTML = `<span>${SVG.starOutline}</span><span>Quick access bookmarks bar — Press Ctrl+D or click the star in address bar to add</span>`;
      itemsContainer.appendChild(emptySpan);
      if (overflowContainer) overflowContainer.classList.add('hidden');
      return;
    }

    // Top-level bookmarks (parentId === 'root' or undefined)
    const topLevel = bookmarks.filter(bm => !bm.parentId || bm.parentId === 'root');
    const maxBarItems = 20;
    const visibleItems = topLevel.slice(0, maxBarItems);
    const overflowItems = topLevel.slice(maxBarItems);

    visibleItems.forEach(bm => {
      itemsContainer.appendChild(createBookmarkItemElement(bm, bookmarks));
    });

    if (overflowItems.length > 0 && overflowContainer && overflowMenu && overflowBtn) {
      overflowContainer.classList.remove('hidden');
      overflowMenu.innerHTML = '';
      overflowItems.forEach(bm => {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'dropdown-item';
        menuBtn.style.display = 'flex';
        menuBtn.style.alignItems = 'center';
        menuBtn.style.gap = '8px';

        const fav = createBookmarkFavicon(bm.url, bm.title);
        menuBtn.appendChild(fav);

        const t = document.createElement('span');
        t.style.overflow = 'hidden';
        t.style.textOverflow = 'ellipsis';
        t.style.whiteSpace = 'nowrap';
        t.textContent = bm.title || bm.url;
        menuBtn.appendChild(t);

        menuBtn.addEventListener('click', (e) => {
          if (bm.url) {
            if (e.ctrlKey || e.metaKey || e.button === 1) {
              window.thaawAPI.createTab(bm.url);
            } else {
              window.thaawAPI.navigate(bm.url);
            }
          }
          closeBookmarkPopups();
        });

        menuBtn.addEventListener('contextmenu', (e) => {
          showBookmarkContextMenu(e, bm);
        });

        overflowMenu.appendChild(menuBtn);
      });

      overflowBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = !overflowMenu.classList.contains('hidden');
        closeBookmarkPopups();
        if (!isOpen) {
          overflowMenu.classList.remove('hidden');
        }
      };
    } else if (overflowContainer) {
      overflowContainer.classList.add('hidden');
    }
  } catch (e) {
    console.warn('[BookmarksBar] Render error:', e);
  }
}

window.thaawAPI.onBookmarksBarToggled?.((show: boolean) => {
  if (bookmarksBar) {
    if (show) {
      bookmarksBar.classList.remove('hidden');
      window.thaawAPI?.setChromeHeight?.(118);
      renderBookmarksBar();
    } else {
      bookmarksBar.classList.add('hidden');
      window.thaawAPI?.setChromeHeight?.(84);
    }
  }
});

// =========================================================================
// Password Save / Update Flyout & URL Bar Key Icon
// =========================================================================
let pendingPasswordData: any = null;
let isPasswordVisibleInPrompt = false;

function positionPasswordPrompt(): void {
  if (!passwordSavePrompt) return;
  const anchor = (passwordKeyBtn && !passwordKeyBtn.classList.contains('hidden'))
    ? passwordKeyBtn
    : (document.querySelector('.omnibox-container') as HTMLElement);
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + 6;
    const right = Math.max(16, window.innerWidth - rect.right - 10);
    passwordSavePrompt.style.top = `${top}px`;
    passwordSavePrompt.style.right = `${right}px`;
  }
}

function openPasswordPrompt(data: any): void {
  pendingPasswordData = data;
  isPasswordVisibleInPrompt = false;
  if (passwordKeyBtn) passwordKeyBtn.classList.remove('hidden');
  if (passwordSavePrompt) {
    if (pwdPromptTitle) pwdPromptTitle.textContent = data.mode === 'update' ? 'Update Password?' : 'Save Password?';
    if (pwdPromptOrigin) pwdPromptOrigin.textContent = data.origin || '';
    if (pwdPromptUsername) pwdPromptUsername.textContent = data.username || 'Saved account';
    if (pwdPromptPlain) pwdPromptPlain.textContent = data.password || '';
    if (pwdPromptMasked) pwdPromptMasked.classList.remove('hidden');
    if (pwdPromptPlain) pwdPromptPlain.classList.add('hidden');
    if (pwdPromptSaveBtn) pwdPromptSaveBtn.textContent = data.mode === 'update' ? 'Update' : 'Save';

    positionPasswordPrompt();
    passwordSavePrompt.classList.remove('hidden');
    updateFlyoutState();
  }
}

function closePasswordPrompt(action?: 'dismiss'): void {
  if (passwordSavePrompt) {
    passwordSavePrompt.classList.add('hidden');
    if (action === 'dismiss' && pendingPasswordData && window.thaawAPI?.respondPasswordPrompt) {
      window.thaawAPI.respondPasswordPrompt('dismiss', pendingPasswordData);
    }
    pendingPasswordData = null;
    updateFlyoutState();
  }
}

window.thaawAPI.onShowPasswordPrompt?.((data) => {
  openPasswordPrompt(data);
});

(window.thaawAPI as any).onPasswordFieldsDetected?.((data: any) => {
  if (data?.hasPasswordFields && passwordKeyBtn) {
    passwordKeyBtn.classList.remove('hidden');
  }
});

passwordKeyBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  openSiteControlModal('key');
});

pwdPromptToggleBtn?.addEventListener('click', () => {
  isPasswordVisibleInPrompt = !isPasswordVisibleInPrompt;
  if (isPasswordVisibleInPrompt) {
    pwdPromptMasked?.classList.add('hidden');
    pwdPromptPlain?.classList.remove('hidden');
  } else {
    pwdPromptMasked?.classList.remove('hidden');
    pwdPromptPlain?.classList.add('hidden');
  }
});

pwdPromptSaveBtn?.addEventListener('click', () => {
  if (pendingPasswordData && window.thaawAPI.respondPasswordPrompt) {
    window.thaawAPI.respondPasswordPrompt(pendingPasswordData.mode, {
      website: pendingPasswordData.origin,
      username: pendingPasswordData.username,
      password: pendingPasswordData.password,
      id: pendingPasswordData.id
    });
    showToast(pendingPasswordData.mode === 'update' ? 'Password updated in vault.' : 'Password saved to vault.', 'success');
  }
  closePasswordPrompt();
});

pwdPromptNotNowBtn?.addEventListener('click', () => {
  closePasswordPrompt('dismiss');
});

pwdPromptCloseBtn?.addEventListener('click', () => {
  closePasswordPrompt('dismiss');
});

// =========================================================================
// Progressive Web App (PWA) Install Flyout & URL Bar Icon
// =========================================================================
let currentActivePwaData: any = null;

function positionPwaModal(): void {
  if (!pwaInstallModal) return;
  const anchor = (pwaInstallBtn && !pwaInstallBtn.classList.contains('hidden'))
    ? pwaInstallBtn
    : (document.querySelector('.omnibox-container') as HTMLElement);
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    const top = rect.bottom + 6;
    const right = Math.max(16, window.innerWidth - rect.right - 10);
    pwaInstallModal.style.top = `${top}px`;
    pwaInstallModal.style.right = `${right}px`;
  }
}

function openPwaInstallModal(): void {
  if (!pwaInstallModal || !currentActivePwaData) return;
  if (pwaModalName) pwaModalName.textContent = currentActivePwaData.name || currentActivePwaData.shortName || 'Web Application';
  if (pwaModalOrigin) pwaModalOrigin.textContent = currentActivePwaData.origin || '';
  if (pwaModalDesc) pwaModalDesc.textContent = currentActivePwaData.description || '';
  if (pwaModalIcon) {
    pwaModalIcon.src = currentActivePwaData.iconUrl || '';
    pwaModalIcon.onerror = () => {
      pwaModalIcon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%2338BDF8" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
    };
  }

  positionPwaModal();
  pwaInstallModal.classList.remove('hidden');
  updateFlyoutState();
}

function closePwaInstallModal(): void {
  if (!pwaInstallModal) return;
  pwaInstallModal.classList.add('hidden');
  updateFlyoutState();
}

window.thaawAPI?.onPwaStatus?.((data) => {
  if (data && data.isPwa && data.pwa) {
    currentActivePwaData = data.pwa;
    if (pwaInstallBtn) {
      pwaInstallBtn.classList.remove('hidden');
      pwaInstallBtn.setAttribute('title', `Install ${data.pwa.name || 'App'}`);
    }
  } else {
    currentActivePwaData = null;
    if (pwaInstallBtn) pwaInstallBtn.classList.add('hidden');
    if (pwaInstallModal && !pwaInstallModal.classList.contains('hidden')) {
      closePwaInstallModal();
    }
  }
});

pwaInstallBtn?.addEventListener('click', () => {
  if (pwaInstallModal && !pwaInstallModal.classList.contains('hidden')) {
    closePwaInstallModal();
  } else {
    openPwaInstallModal();
  }
});

pwaModalCloseBtn?.addEventListener('click', () => {
  closePwaInstallModal();
});

pwaCancelBtn?.addEventListener('click', () => {
  closePwaInstallModal();
});

pwaConfirmInstallBtn?.addEventListener('click', async () => {
  if (!currentActivePwaData || !window.thaawAPI?.installPwa) return;
  try {
    const res = await window.thaawAPI.installPwa(currentActivePwaData);
    closePwaInstallModal();
    if (res.success) {
      showToast(`Installed "${currentActivePwaData.name}" as an app.`, 'success');
    } else {
      showToast(res.error || 'Failed to install application.', 'error');
    }
  } catch {
    closePwaInstallModal();
    showToast('Failed to install application.', 'error');
  }
});

// Window Controls (Caption Buttons)
const captionCloseBtn = document.getElementById('closeBtn');
const captionMinBtn = document.getElementById('minBtn');
const captionMaxBtn = document.getElementById('maxBtn');

captionCloseBtn?.addEventListener('click', () => {
  if (window.thaawAPI?.closeWindow) window.thaawAPI.closeWindow();
  else window.close();
});

captionMinBtn?.addEventListener('click', () => {
  window.thaawAPI?.minimizeWindow?.();
});

captionMaxBtn?.addEventListener('click', () => {
  window.thaawAPI?.maximizeWindow?.();
});

// Authentic Browser Navigation Sidebar Management
type SidebarMode = 'expanded' | 'collapsed' | 'hidden';
let currentSidebarMode: SidebarMode = (localStorage.getItem('thaaw_sidebar_mode') as SidebarMode) || 'collapsed';

function setBrowserSidebarMode(mode: SidebarMode): void {
  currentSidebarMode = mode;
  try { localStorage.setItem('thaaw_sidebar_mode', mode); } catch (_) {}
  const sidebar = document.getElementById('browserSidebar');
  if (!sidebar) return;

  sidebar.classList.remove('expanded', 'collapsed', 'hidden');
  sidebar.classList.add(mode);

  let offset = 64;
  if (mode === 'expanded') offset = 240;
  else if (mode === 'hidden') offset = 0;

  window.thaawAPI?.setSidebarOffset?.(offset);
}

function updateSidebarActiveRoute(url: string): void {
  const sidebar = document.getElementById('browserSidebar');
  if (!sidebar) return;
  sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => item.classList.remove('active'));

  if (!url || url === 'thaaw://newtab' || url === 'about:blank') {
    document.getElementById('navItemHome')?.classList.add('active');
  } else if (url.startsWith('thaaw://history')) {
    document.getElementById('navItemHistory')?.classList.add('active');
  } else if (url.startsWith('thaaw://bookmarks')) {
    document.getElementById('navItemBookmarks')?.classList.add('active');
  } else if (url.startsWith('thaaw://downloads')) {
    document.getElementById('navItemDownloads')?.classList.add('active');
  } else if (url.startsWith('thaaw://passwords')) {
    document.getElementById('navItemPasswords')?.classList.add('active');
  } else if (url.startsWith('thaaw://privacy')) {
    document.getElementById('navItemPrivacy')?.classList.add('active');
  } else if (url.startsWith('thaaw://security')) {
    document.getElementById('navItemSecurity')?.classList.add('active');
  } else if (url.startsWith('thaaw://settings')) {
    if (url.includes('section-adblock')) {
      document.getElementById('navItemSettings')?.classList.add('active');
    } else {
      document.getElementById('navItemSettings')?.classList.add('active');
    }
  }
}

// Sidebar Buttons & Toggle Listeners
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
sidebarToggleBtn?.addEventListener('click', () => {
  if (currentSidebarMode === 'hidden') {
    setBrowserSidebarMode('collapsed');
  } else {
    setBrowserSidebarMode('hidden');
  }
});

const sidebarCollapseToggleBtn = document.getElementById('sidebarCollapseToggleBtn');
sidebarCollapseToggleBtn?.addEventListener('click', () => {
  if (currentSidebarMode === 'expanded') {
    setBrowserSidebarMode('collapsed');
  } else {
    setBrowserSidebarMode('expanded');
  }
});

// Sidebar Navigation Items
document.querySelectorAll<HTMLElement>('#browserSidebar .sidebar-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const nav = item.getAttribute('data-nav');
    const route = item.getAttribute('data-route');

    if (nav === 'tabs') {
      openTabSearch();
      return;
    }

    if (route) {
      const active = cachedTabs.find(t => t.id === currentActiveTabId);
      if (active && (active.url === 'thaaw://newtab' || active.url === 'about:blank')) {
        window.thaawAPI.navigate(route);
      } else {
        window.thaawAPI.createTab(route);
      }
    }
  });
});

// Brand & Toolbar Actions
brandHomeBtn?.addEventListener('click', () => {
  window.thaawAPI.createTab('thaaw://newtab');
});

newTabBtn.addEventListener('click', () => {
  window.thaawAPI.createTab('thaaw://newtab');
});

backBtn.addEventListener('click', () => window.thaawAPI.goBack());
forwardBtn.addEventListener('click', () => window.thaawAPI.goForward());
reloadBtn.addEventListener('click', () => {
  const active = cachedTabs.find(t => t.id === currentActiveTabId);
  if (active?.isLoading) {
    window.thaawAPI.stop();
  } else {
    window.thaawAPI.reload();
  }
});

bookmarkCurrentBtn?.addEventListener('click', async () => {
  const active = cachedTabs.find(t => t.id === currentActiveTabId);
  if (active && active.url && active.url !== 'thaaw://newtab') {
    const res = await window.thaawAPI.toggleBookmark(active.title || active.url, active.url);
    bookmarkCurrentBtn.innerHTML = res.bookmarked ? SVG.starFilled : SVG.starOutline;
    bookmarkCurrentBtn.classList.toggle('active', res.bookmarked);
  }
});

// Shield icon in URL bar opens Site Control Center modal
quickShieldBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  openSiteControlModal('shield');
});

// Security lock icon in URL bar opens Site Control Center modal
securityIndicatorBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  openSiteControlModal('lock');
});

// ============================================================================
// Premium Site Control Center Modal (Lock, Shield, Key) Implementation
// ============================================================================

type SiteControlTab = 'lock' | 'shield' | 'key';
let currentSiteControlOrigin = '';
let currentSiteControlDomain = '';
let currentSiteControlUrl = '';

function switchSiteControlTab(tab: SiteControlTab): void {
  const tabs: Array<{ name: SiteControlTab; btn: HTMLElement | null; panel: HTMLElement | null }> = [
    { name: 'lock', btn: siteTabLockBtn, panel: sitePanelLock },
    { name: 'shield', btn: siteTabShieldBtn, panel: sitePanelShield },
    { name: 'key', btn: siteTabKeyBtn, panel: sitePanelKey }
  ];

  tabs.forEach(t => {
    if (t.name === tab) {
      t.btn?.classList.add('active');
      t.btn?.setAttribute('aria-selected', 'true');
      t.panel?.classList.remove('hidden');
    } else {
      t.btn?.classList.remove('active');
      t.btn?.setAttribute('aria-selected', 'false');
      t.panel?.classList.add('hidden');
    }
  });
}

function updatePasswordStrength(pwd: string, length: number, typesCount: number): void {
  const entropy = Math.round(length * Math.log2(typesCount * 24 || 26));
  let label = 'Very Strong';
  let color = '#10b981';
  let pct = 100;

  if (entropy < 40) {
    label = 'Weak';
    color = '#ef4444';
    pct = 25;
  } else if (entropy < 65) {
    label = 'Fair';
    color = '#f59e0b';
    pct = 50;
  } else if (entropy < 85) {
    label = 'Strong';
    color = '#06b6d4';
    pct = 75;
  } else {
    label = 'Very Strong';
    color = '#10b981';
    pct = 100;
  }

  if (siteGenStrengthBar) {
    siteGenStrengthBar.style.width = `${pct}%`;
    siteGenStrengthBar.style.background = color;
  }
  if (siteGenStrengthText) {
    siteGenStrengthText.textContent = `${label} (${entropy} bits)`;
    siteGenStrengthText.style.color = color;
  }
}

function generateSecurePassword(): void {
  const len = parseInt(siteGenLengthSlider?.value || '16', 10);
  const upper = siteGenUpper?.checked ?? true;
  const lower = siteGenLower?.checked ?? true;
  const nums = siteGenNumbers?.checked ?? true;
  const syms = siteGenSymbols?.checked ?? true;

  let chars = '';
  if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (nums) chars += '0123456789';
  if (syms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const randomValues = new Uint32Array(len);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  if (siteGenResult) siteGenResult.value = result;
  updatePasswordStrength(result, len, [upper, lower, nums, syms].filter(Boolean).length);
}

async function loadSiteSecurityData(url: string, intel: any): Promise<void> {
  const isHttps = url.startsWith('https://');
  const isHttp = url.startsWith('http://');

  if (isHttps) {
    siteControlSecBadge.className = 'site-sec-badge secure';
    siteControlSecBadge.textContent = 'SECURE';
    siteSecCertStatus.textContent = 'Valid & Encrypted Connection';
    siteSecProtocolBadge.textContent = 'TLS 1.3';
    siteSecCipher.textContent = 'TLS_AES_256_GCM_SHA384';
    siteSecHsts.textContent = 'Enforced';
    siteSecProtocol.textContent = 'HTTP/2 over TLS';
    siteSecCertDesc.textContent = 'Your connection to this site is encrypted with modern cryptography. Information you submit (such as passwords or credit cards) is private and protected.';
  } else if (isHttp) {
    siteControlSecBadge.className = 'site-sec-badge insecure';
    siteControlSecBadge.textContent = 'INSECURE';
    siteSecCertStatus.textContent = 'Unencrypted Connection';
    siteSecProtocolBadge.textContent = 'HTTP/1.1';
    siteSecCipher.textContent = 'None (Plaintext)';
    siteSecHsts.textContent = 'Disabled';
    siteSecProtocol.textContent = 'Plain HTTP';
    siteSecCertDesc.textContent = 'Warning: This site does not use HTTPS encryption. Sensitive information you enter could be monitored or modified by third parties.';
  } else {
    siteControlSecBadge.className = 'site-sec-badge secure';
    siteControlSecBadge.textContent = 'INTERNAL';
    siteSecCertStatus.textContent = 'Secure THAAW System Component';
    siteSecProtocolBadge.textContent = 'thaaw:';
    siteSecCipher.textContent = 'Native Sandboxed';
    siteSecHsts.textContent = 'N/A';
    siteSecProtocol.textContent = 'Direct Core IPC';
    siteSecCertDesc.textContent = 'This is a built-in browser service running in an isolated, sandboxed profile environment.';
  }

  if (sitePermsList) {
    const segments = sitePermsList.querySelectorAll<HTMLElement>('.perm-segment');
    segments.forEach(seg => {
      const pKey = seg.dataset.perm;
      const currentVal = (intel?.permissions && pKey ? intel.permissions[pKey] : 'prompt') || 'prompt';
      seg.querySelectorAll<HTMLButtonElement>('.perm-seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === currentVal);
      });
    });
  }

  if (siteStorageCookiesCount) {
    siteStorageCookiesCount.textContent = String(intel?.cookieCount || 0);
  }
}

async function loadSiteShieldData(stats: any): Promise<void> {
  const isShieldActive = !!stats?.isShieldActive;
  if (siteMasterShieldToggle) siteMasterShieldToggle.checked = isShieldActive;
  if (siteShieldActiveLabel) {
    siteShieldActiveLabel.className = isShieldActive ? 'shield-status-tag active' : 'shield-status-tag disabled';
    siteShieldActiveLabel.textContent = isShieldActive ? 'ACTIVE' : 'DISABLED';
  }

  const blockedCount = stats?.trackersBlockedCount || 0;
  const adsCount = stats?.adsBlockedCount || 0;

  if (siteTabShieldBadge) siteTabShieldBadge.textContent = String(blockedCount);
  if (siteMetricTrackers) siteMetricTrackers.textContent = String(blockedCount);
  if (siteMetricAds) siteMetricAds.textContent = String(adsCount);

  const currentLevel = stats?.protectionLevel || 'balanced';
  [levelCardBalanced, levelCardStrict, levelCardMaximum].forEach(card => {
    if (card) card.classList.toggle('active', card.dataset.level === currentLevel);
  });

  if (siteBlockedStream) {
    siteBlockedStream.innerHTML = '';
    const blocks: any[] = stats?.recentBlocks || [];
    if (blocks.length === 0) {
      siteBlockedStream.innerHTML = '<div class="blocked-empty">All clear. No tracking telemetry detected on this page.</div>';
    } else {
      blocks.forEach(b => {
        const item = document.createElement('div');
        item.className = 'blocked-stream-item';
        let trackerHost = b.trackerDomain || b.url || 'Tracker';
        try {
          trackerHost = new URL(b.url).hostname;
        } catch {}
        item.innerHTML = `
          <div class="blocked-url-wrap">
            <span class="blocked-tag">${b.category || 'TRACKER'}</span>
            <span class="blocked-url" title="${b.url || ''}">${trackerHost}</span>
          </div>
          <span style="font-size: 10px; color: var(--thaaw-text-muted);">${b.reason || 'Blocked'}</span>
        `;
        siteBlockedStream.appendChild(item);
      });
    }
  }
}

async function loadSiteVaultData(origin: string): Promise<void> {
  if (!siteMatchedCredsList) return;
  siteMatchedCredsList.innerHTML = '';

  let matching: any[] = [];
  try {
    if (window.thaawAPI.getMatchingCredentials) {
      matching = await window.thaawAPI.getMatchingCredentials(origin);
    }
  } catch {
    matching = [];
  }

  if (!matching || matching.length === 0) {
    try {
      const all = await window.thaawAPI.getPasswords();
      const domain = currentSiteControlDomain.toLowerCase();
      matching = (all || []).filter((p: any) => {
        const w = (p.website || '').toLowerCase();
        return w.includes(domain) || domain.includes(w);
      });
    } catch {}
  }

  if (siteTabKeyBadge) {
    if (matching.length > 0) {
      siteTabKeyBadge.textContent = String(matching.length);
      siteTabKeyBadge.classList.remove('hidden');
    } else {
      siteTabKeyBadge.classList.add('hidden');
    }
  }

  if (matching.length === 0) {
    siteMatchedCredsList.innerHTML = '<div class="site-cred-empty">No saved passwords found for this website.</div>';
    return;
  }

  matching.forEach((cred: any) => {
    const card = document.createElement('div');
    card.className = 'site-cred-card';

    const info = document.createElement('div');
    info.className = 'cred-card-info';

    const userSpan = document.createElement('div');
    userSpan.className = 'cred-card-username';
    userSpan.textContent = cred.username || 'Saved Account';

    const pwdRow = document.createElement('div');
    pwdRow.className = 'cred-card-pwd-row';

    const pwdText = document.createElement('span');
    pwdText.className = 'cred-card-pwd-text';
    pwdText.textContent = '••••••••';

    pwdRow.appendChild(pwdText);
    info.appendChild(userSpan);
    info.appendChild(pwdRow);

    const actions = document.createElement('div');
    actions.className = 'cred-card-actions';

    let isRevealed = false;
    let revealedPlaintext = '';
    const revealBtn = document.createElement('button');
    revealBtn.className = 'site-mini-btn';
    revealBtn.title = 'Reveal password';
    revealBtn.setAttribute('aria-label', 'Reveal password');
    revealBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
    revealBtn.addEventListener('click', async () => {
      isRevealed = !isRevealed;
      if (isRevealed) {
        if (!revealedPlaintext && cred.id) {
          try {
            const revRes = await window.thaawAPI.revealPassword(cred.id);
            revealedPlaintext = typeof revRes === 'string' ? revRes : (revRes as any)?.password || '';
          } catch {}
        }
        pwdText.textContent = revealedPlaintext || '••••••••';
      } else {
        pwdText.textContent = '••••••••';
      }
    });

    const copyPwdBtn = document.createElement('button');
    copyPwdBtn.className = 'btn btn-secondary btn-sm';
    copyPwdBtn.textContent = 'Copy';
    copyPwdBtn.title = 'Copy password';
    copyPwdBtn.addEventListener('click', async () => {
      if (!revealedPlaintext && cred.id) {
        try {
          const revRes = await window.thaawAPI.revealPassword(cred.id);
          revealedPlaintext = typeof revRes === 'string' ? revRes : (revRes as any)?.password || '';
        } catch {}
      }
      if (revealedPlaintext) {
        await navigator.clipboard.writeText(revealedPlaintext);
        showToast('Password copied to clipboard.', 'success');
      }
    });

    const autofillBtn = document.createElement('button');
    autofillBtn.className = 'btn btn-primary btn-sm';
    autofillBtn.textContent = 'Autofill';
    autofillBtn.title = 'Autofill this credential directly into the current page';
    autofillBtn.addEventListener('click', async () => {
      if (!revealedPlaintext && cred.id) {
        try {
          const revRes = await window.thaawAPI.revealPassword(cred.id);
          revealedPlaintext = typeof revRes === 'string' ? revRes : (revRes as any)?.password || '';
        } catch {}
      }
      if (window.thaawAPI.autofillActiveTab) {
        await window.thaawAPI.autofillActiveTab({ username: cred.username, password: revealedPlaintext });
      }
      closeModal(siteControlModal);
      showToast(`Autofilled credentials for ${cred.username} into page.`, 'success');
    });

    actions.appendChild(revealBtn);
    actions.appendChild(copyPwdBtn);
    actions.appendChild(autofillBtn);

    card.appendChild(info);
    card.appendChild(actions);
    siteMatchedCredsList.appendChild(card);
  });
}

async function openSiteControlModal(initialTab: SiteControlTab = 'lock'): Promise<void> {
  const activeTab = cachedTabs.find(t => t.id === currentActiveTabId);
  const activeUrl = activeTab?.url || urlInput.value || 'thaaw://newtab';
  currentSiteControlUrl = activeUrl;

  let domain = 'THAAW';
  let origin = activeUrl;
  try {
    const parsed = new URL(activeUrl);
    domain = parsed.hostname;
    origin = parsed.origin;
  } catch {
    domain = activeUrl.startsWith('thaaw://') ? 'THAAW Internal' : activeUrl;
    origin = activeUrl;
  }
  currentSiteControlDomain = domain;
  currentSiteControlOrigin = origin;

  if (siteControlDomain) siteControlDomain.textContent = domain;
  if (siteControlFullUrl) siteControlFullUrl.textContent = activeUrl;

  if (activeTab?.favicon) {
    siteControlFavicon.src = activeTab.favicon;
    siteControlFavicon.classList.remove('hidden');
    siteControlFaviconFallback.classList.add('hidden');
  } else {
    siteControlFavicon.classList.add('hidden');
    siteControlFaviconFallback.classList.remove('hidden');
  }

  switchSiteControlTab(initialTab);
  openModal(siteControlModal);
  generateSecurePassword();

  try {
    const [intel, stats] = await Promise.all([
      window.thaawAPI.getSiteIntelligence?.().catch(() => null),
      window.thaawAPI.getSecurityStatus().catch(() => null)
    ]);

    await loadSiteSecurityData(activeUrl, intel);
    await loadSiteShieldData(stats);
    await loadSiteVaultData(origin);
  } catch {
    // Graceful fallback
  }
}

// Tab Switcher buttons
siteTabLockBtn?.addEventListener('click', () => switchSiteControlTab('lock'));
siteTabShieldBtn?.addEventListener('click', () => switchSiteControlTab('shield'));
siteTabKeyBtn?.addEventListener('click', () => switchSiteControlTab('key'));

// Modal Close button & Backdrop click
closeSiteControlBtn?.addEventListener('click', () => closeModal(siteControlModal));
siteControlModal?.addEventListener('click', (e) => {
  if (e.target === siteControlModal) closeModal(siteControlModal);
});

// Copy URL Button
siteControlCopyUrlBtn?.addEventListener('click', async () => {
  if (currentSiteControlUrl) {
    await navigator.clipboard.writeText(currentSiteControlUrl);
    showToast('Site address copied to clipboard.', 'success');
  }
});

// Permission 3-way toggle buttons delegation
sitePermsList?.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest('.perm-seg-btn') as HTMLButtonElement | null;
  if (!btn) return;
  const parentSeg = btn.closest('.perm-segment') as HTMLElement;
  const permKey = parentSeg?.dataset.perm;
  const newVal = btn.dataset.val as 'allow' | 'prompt' | 'deny';
  if (!permKey || !newVal || !currentSiteControlOrigin) return;

  parentSeg.querySelectorAll('.perm-seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  try {
    await window.thaawAPI.updateSitePermission(permKey, newVal, currentSiteControlOrigin);
    showToast(`Site permission updated: ${newVal.toUpperCase()}`, 'info');
  } catch {}
});

// Clear Site Data Button in Modal
siteClearDataBtn?.addEventListener('click', async () => {
  if (currentSiteControlDomain) {
    try {
      if (window.thaawAPI.clearSiteData) {
        await window.thaawAPI.clearSiteData(currentSiteControlDomain);
      } else {
        await window.thaawAPI.clearBrowsingData();
      }
      if (siteStorageCookiesCount) siteStorageCookiesCount.textContent = '0';
      showToast('Site cookies, storage, and cache cleared.', 'success');
    } catch {
      showToast('Cleared site data.', 'info');
    }
  }
});

// Master Shield Toggle in Modal
siteMasterShieldToggle?.addEventListener('change', async () => {
  const res = await window.thaawAPI.toggleShield();
  const active = res.isShieldActive;
  if (siteShieldActiveLabel) {
    siteShieldActiveLabel.className = active ? 'shield-status-tag active' : 'shield-status-tag disabled';
    siteShieldActiveLabel.textContent = active ? 'ACTIVE' : 'DISABLED';
  }
  quickShieldBtn.className = `chrome-btn-sm shield-toggle-btn ${active ? 'active' : 'disabled'}`;
  showToast(`THAAW Shield is now ${active ? 'Active' : 'Disabled'} for this site`, active ? 'info' : 'warning');
});

// Protection Level Selector in Modal
[levelCardBalanced, levelCardStrict, levelCardMaximum].forEach(card => {
  card?.addEventListener('click', async () => {
    const level = card.dataset.level;
    if (!level) return;
    await window.thaawAPI.setProtectionLevel(level);
    [levelCardBalanced, levelCardStrict, levelCardMaximum].forEach(c => c?.classList.remove('active'));
    card.classList.add('active');
    showToast(`Protection level set to ${level.toUpperCase()}`, 'info');
  });
});

// Quick Save Credential Form in Modal
siteAddCredForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = siteCredUsername?.value.trim();
  const password = siteCredPassword?.value;
  if (!username || !password) {
    showToast('Please enter both username and password.', 'warning');
    return;
  }
  if (window.thaawAPI.saveOrUpdateCredential) {
    await window.thaawAPI.saveOrUpdateCredential({
      website: currentSiteControlOrigin || currentSiteControlDomain,
      username,
      password
    });
  } else {
    await window.thaawAPI.savePassword({
      website: currentSiteControlOrigin || currentSiteControlDomain,
      username,
      password
    });
  }
  if (siteCredUsername) siteCredUsername.value = '';
  if (siteCredPassword) siteCredPassword.value = '';
  showToast('Credential saved to vault.', 'success');
  loadSiteVaultData(currentSiteControlOrigin);
});

// Password Generator Controls
siteGenRefreshBtn?.addEventListener('click', () => generateSecurePassword());
siteGenLengthSlider?.addEventListener('input', () => {
  if (siteGenLengthVal) siteGenLengthVal.textContent = siteGenLengthSlider.value;
  generateSecurePassword();
});
[siteGenUpper, siteGenLower, siteGenNumbers, siteGenSymbols].forEach(cb => {
  cb?.addEventListener('change', () => generateSecurePassword());
});
siteGenCopyBtn?.addEventListener('click', async () => {
  if (siteGenResult?.value) {
    await navigator.clipboard.writeText(siteGenResult.value);
    showToast('Generated password copied to clipboard.', 'success');
  }
});
siteGenUseBtn?.addEventListener('click', async () => {
  if (siteGenResult?.value) {
    const pwd = siteGenResult.value;
    if (siteCredPassword) siteCredPassword.value = pwd;
    await navigator.clipboard.writeText(pwd);
    showToast('Password applied to save form and copied.', 'success');
  }
});
siteCredTogglePwd?.addEventListener('click', () => {
  if (siteCredPassword) {
    siteCredPassword.type = siteCredPassword.type === 'password' ? 'text' : 'password';
  }
});

shieldToggle.addEventListener('change', async () => {
  const res = await window.thaawAPI.toggleShield();
  showToast(`THAAW Shield is now ${res.isShieldActive ? 'Active' : 'Disabled'}`, res.isShieldActive ? 'info' : 'warning');
});

clearSiteDataBtn.addEventListener('click', async () => {
  await window.thaawAPI.clearBrowsingData();
  showToast('Site cookies, cache, and storage cleared.', 'success');
  securityPanel.classList.add('hidden');
});

openSecurityCenterBtn.addEventListener('click', () => {
  window.thaawAPI.createTab('thaaw://security');
  securityPanel.classList.add('hidden');
});

function positionMainMenu(): void {
  if (!mainMenu || !menuBtn) return;
  const rect = menuBtn.getBoundingClientRect();
  const right = Math.max(12, Math.round(window.innerWidth - rect.right));
  const top = Math.round(rect.bottom + 6);
  mainMenu.style.top = `${top}px`;
  mainMenu.style.right = `${right}px`;
}

function positionProfileMenu(): void {
  if (!profileMenu || !profileBtn) return;
  const rect = profileBtn.getBoundingClientRect();
  const right = Math.max(12, Math.round(window.innerWidth - rect.right));
  const top = Math.round(rect.bottom + 6);
  profileMenu.style.top = `${top}px`;
  profileMenu.style.right = `${right}px`;
}

function positionDownloadPopover(): void {
  if (!downloadPopover || !downloadsBtn) return;
  const rect = downloadsBtn.getBoundingClientRect();
  const right = Math.max(12, Math.round(window.innerWidth - rect.right));
  const top = Math.round(rect.bottom + 6);
  downloadPopover.style.top = `${top}px`;
  downloadPopover.style.right = `${right}px`;
}

window.addEventListener('resize', () => {
  if (isDownloadPopoverOpen) positionDownloadPopover();
  if (profileMenu && !profileMenu.classList.contains('hidden')) positionProfileMenu();
  if (mainMenu && !mainMenu.classList.contains('hidden')) positionMainMenu();
});

// Main Menu Button toggles authentic Browser Main Menu (if present)
menuBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeDownloadPopover();
  profileMenu?.classList.add('hidden');
  securityPanel?.classList.add('hidden');
  const isOpening = mainMenu?.classList.contains('hidden');
  if (isOpening) {
    positionMainMenu();
    mainMenu?.classList.remove('hidden');
    flyoutBackdrop?.classList.remove('hidden');
  } else {
    mainMenu?.classList.add('hidden');
  }
  updateFlyoutState();
});

// Downloads Button toggles custom Download Popover
downloadsBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeMainMenu();
  toggleDownloadPopover();
});

// Profile Switcher — a renderer-owned surface so it keeps THAAW styling above browser views.
profileBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (profileMenu?.classList.contains('hidden')) {
    closeDownloadPopover();
    securityPanel?.classList.add('hidden');
    closeMainMenu();
    positionProfileMenu();
    profileMenu.classList.remove('hidden');
    flyoutBackdrop?.classList.remove('hidden');
    updateFlyoutState();
    renderTopProfiles();
  } else {
    profileMenu?.classList.add('hidden');
    updateFlyoutState();
  }
});

commandPaletteBtn?.addEventListener('click', () => {
  openCommandPalette();
});

async function renderTopProfiles(): Promise<void> {
  try {
    const active = await window.thaawAPI.getActiveProfile();
    const profiles = await window.thaawAPI.listProfiles();
    const currentUser = await window.thaawAPI.getCurrentUser?.();

    const displayName = currentUser?.name || active?.name || 'THAAW Profile';
    const displayEmail = currentUser?.email || active?.email || 'Local Browser Profile';
    const displayColor = currentUser?.avatarColor || active?.color || '#38bdf8';
    const displayAvatar = active?.avatar;

    // 1. Update toolbar Profile Icon
    if (profileAvatarIcon) {
      if (displayAvatar) {
        profileAvatarIcon.style.backgroundImage = `url(${displayAvatar})`;
        profileAvatarIcon.style.backgroundSize = 'cover';
        profileAvatarIcon.textContent = '';
      } else {
        profileAvatarIcon.style.backgroundImage = '';
        profileAvatarIcon.style.backgroundColor = displayColor;
        profileAvatarIcon.textContent = displayName.charAt(0).toUpperCase();
      }
    }

    // 2. Update active profile header card in flyout
    if (profileActiveName) profileActiveName.textContent = displayName;
    if (profileActiveEmail) profileActiveEmail.textContent = displayEmail;
    if (profileActiveStatus) profileActiveStatus.textContent = 'Active Profile';
    if (profileActiveAvatar) {
      if (displayAvatar) {
        profileActiveAvatar.style.backgroundImage = `url(${displayAvatar})`;
        profileActiveAvatar.style.backgroundSize = 'cover';
        profileActiveAvatar.textContent = '';
      } else {
        profileActiveAvatar.style.backgroundImage = '';
        profileActiveAvatar.style.backgroundColor = displayColor;
        profileActiveAvatar.textContent = displayName.charAt(0).toUpperCase();
      }
    }

    if (topProfileName) topProfileName.textContent = displayName;
    if (topProfileAvatar) {
      topProfileAvatar.textContent = displayName.charAt(0).toUpperCase();
      topProfileAvatar.style.background = displayColor;
      if (displayAvatar) {
        topProfileAvatar.style.backgroundImage = `url(${displayAvatar})`;
        topProfileAvatar.style.backgroundSize = 'cover';
        topProfileAvatar.textContent = '';
      }
    }

    // 3. Render Profiles List for Quick Switch
    if (topProfileList) {
      topProfileList.innerHTML = '';
      profiles.forEach((p: any) => {
        const isCurrent = active && active.id === p.id;
        const item = document.createElement('div');
        item.className = 'menu-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.cursor = 'pointer';
        item.style.padding = '7px 10px';
        item.style.margin = '1px 6px';
        item.style.borderRadius = '8px';
        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 9px;">
            <span class="profile-avatar" style="width: 26px; height: 26px; font-size: 11.5px; display: inline-flex; align-items: center; justify-content: center; background: ${p.color || '#38bdf8'}; color: #000; border-radius: 50%; font-weight: 700; box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.2);">${p.name.charAt(0).toUpperCase()}</span>
            <span style="font-size: 12.5px; font-weight: 500;">${escapeHtml(p.name)}</span>
          </div>
          ${isCurrent ? '<span class="badge-tag" style="font-size: 9.5px; padding: 2px 7px; border-radius: 8px; font-weight: 700;">ACTIVE</span>' : '<span style="font-size: 11px; color: var(--thaaw-cyan); opacity: 0.85;">Switch</span>'}
        `;
        const avatar = item.querySelector('.profile-avatar') as HTMLElement | null;
        if (avatar && p.avatar) {
          avatar.style.backgroundImage = `url(${p.avatar})`;
          avatar.style.backgroundSize = 'cover';
          avatar.textContent = '';
        }
        item.addEventListener('click', async (evt) => {
          evt.stopPropagation();
          await window.thaawAPI.setActiveProfile(p.id);
          profileMenu?.classList.add('hidden');
          renderTopProfiles();
        });
        item.addEventListener('contextmenu', evt => {
          evt.preventDefault();
          evt.stopPropagation();
          window.thaawAPI.showProfileContextMenu(p.id);
        });
        topProfileList.appendChild(item);
      });
    }
  } catch (_e) {
    if (topProfileList) {
      topProfileList.innerHTML = '<div style="padding: 8px 12px; font-size: 11px; color: var(--thaaw-text-muted);">Local Profile (Active)</div>';
    }
  }
}

// Quick action buttons in profile popover
createProfileQuickBtn?.addEventListener('click', async () => {
  profileMenu?.classList.add('hidden');
  const count = (await window.thaawAPI.listProfiles())?.length || 1;
  const newProf = await window.thaawAPI.createProfile(`Profile ${count + 1}`);
  if (newProf) {
    await openProfileCenter(newProf.id);
    showToast(`Created profile: ${newProf.name}`, 'success');
  }
});

editProfileQuickBtn?.addEventListener('click', async () => {
  profileMenu?.classList.add('hidden');
  const active = await window.thaawAPI.getActiveProfile();
  if (active) {
    await openProfileCenter(active.id);
  }
});

manageProfilesQuickBtn?.addEventListener('click', () => {
  profileMenu?.classList.add('hidden');
  openProfileCenter();
});

openProfileSettingsBtn?.addEventListener('click', () => {
  profileMenu?.classList.add('hidden');
  openProfileCenter();
});

let profilePendingDeleteId = '';
let profileCenterSelectedId = '';
let profileEditorAvatar: string | undefined;

async function populateProfileEditor(id: string): Promise<void> {
  const profiles = await window.thaawAPI.listProfiles();
  const profile = profiles.find((p: any) => p.id === id);
  if (!profile) return;
  profileCenterSelectedId = id;
  profileEditorId.value = id;
  profileEditorName.value = profile.name || '';
  profileEditorEmail.value = profile.email || '';
  profileEditorColor.value = /^#[0-9a-f]{6}$/i.test(profile.color || '') ? profile.color : '#00d1ff';
  profileEditorAvatar = profile.avatar;
  profileEditorInitial.textContent = (profile.name || 'P').charAt(0).toUpperCase();
  profileEditorInitial.parentElement!.style.background = profileEditorColor.value;
  profileEditorInitial.parentElement!.style.backgroundImage = profile.avatar ? `url(${profile.avatar})` : '';
  profileEditorInitial.parentElement!.style.backgroundSize = 'cover';
  profileEditorHeading.textContent = `${profile.name} profile`;
  const settings: any = id === (await window.thaawAPI.getActiveProfile()).id
    ? await window.thaawAPI.getSettings() : { theme: 'dark' };
  profileEditorTheme.value = settings?.theme === 'light' ? 'light' : 'dark';
  const canDelete = await window.thaawAPI.canDeleteBrowserProfile(id);
  const activeProfile = await window.thaawAPI.getActiveProfile();
  if (canDelete) {
    requestDeleteProfileBtn.style.display = '';
    (requestDeleteProfileBtn as HTMLButtonElement).disabled = false;
    requestDeleteProfileBtn.removeAttribute('title');
    requestDeleteProfileBtn.style.opacity = '1';
    requestDeleteProfileBtn.style.cursor = 'pointer';
  } else {
    const isOnly = profiles.filter((p: any) => p.id !== 'private').length <= 1;
    const reason = id === activeProfile?.id
      ? 'Active profile cannot be deleted. Switch to another profile first.'
      : (isOnly ? 'Cannot delete the only remaining profile.' : 'This profile cannot be deleted.');
    requestDeleteProfileBtn.style.display = '';
    (requestDeleteProfileBtn as HTMLButtonElement).disabled = true;
    requestDeleteProfileBtn.title = reason;
    requestDeleteProfileBtn.style.opacity = '0.4';
    requestDeleteProfileBtn.style.cursor = 'not-allowed';
  }
  await renderProfileCenterList();
}

async function renderProfileCenterList(): Promise<void> {
  const [profiles, active] = await Promise.all([window.thaawAPI.listProfiles(), window.thaawAPI.getActiveProfile()]);
  profileCenterList.innerHTML = '';
  profiles.filter((p: any) => p.id !== 'private').forEach((profile: any) => {
    const item = document.createElement('div');
    item.className = `profile-center-item ${profile.id === profileCenterSelectedId ? 'selected' : ''}`;
    const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.style.background = profile.color || '#00d1ff'; avatar.textContent = profile.name.charAt(0).toUpperCase();
    if (profile.avatar) { avatar.style.backgroundImage = `url(${profile.avatar})`; avatar.style.backgroundSize = 'cover'; }
    const copy = document.createElement('div'); copy.className = 'copy';
    const name = document.createElement('strong'); name.textContent = profile.name;
    const detail = document.createElement('small'); detail.textContent = profile.id === active?.id ? 'Active profile' : (profile.email || 'Isolated workspace');
    copy.append(name, detail); item.append(avatar, copy);
    item.addEventListener('click', () => populateProfileEditor(profile.id));
    item.addEventListener('contextmenu', event => { event.preventDefault(); window.thaawAPI.showProfileContextMenu(profile.id); });
    profileCenterList.appendChild(item);
  });
}

async function openProfileCenter(id?: string): Promise<void> {
  openModal(profileCenterModal);
  const active = await window.thaawAPI.getActiveProfile();
  await populateProfileEditor(id || active.id);
}

closeProfileCenterBtn?.addEventListener('click', () => closeModal(profileCenterModal));
profileEditorForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const id = profileEditorId.value;
  const updated = await window.thaawAPI.updateBrowserProfile(id, { name: profileEditorName.value, email: profileEditorEmail.value, color: profileEditorColor.value, avatar: profileEditorAvatar });
  if (!updated) return showToast('Profile changes could not be saved.', 'error');
  await window.thaawAPI.updateBrowserProfileSettings(id, { theme: profileEditorTheme.value, themePreset: profileEditorTheme.value === 'light' ? 'white' : 'midnight' });
  profileEditorInitial.textContent = updated.name.charAt(0).toUpperCase();
  profileEditorInitial.parentElement!.style.background = updated.color;
  await renderTopProfiles(); await renderProfileCenterList();
  showToast('Profile changes saved.', 'success');
});
profileEditorAvatarBtn?.addEventListener('click', () => profileEditorAvatarFile.click());
profileEditorAvatarFile?.addEventListener('change', () => {
  const file = profileEditorAvatarFile.files?.[0];
  if (!file) return;
  if (file.size > 1024 * 1024) return showToast('Choose an image smaller than 1 MB.', 'warning');
  const reader = new FileReader();
  reader.onload = () => {
    profileEditorAvatar = String(reader.result);
    profileEditorInitial.parentElement!.style.backgroundImage = `url(${profileEditorAvatar})`;
  };
  reader.readAsDataURL(file);
});
duplicateProfileBtn?.addEventListener('click', async () => {
  const copy = await window.thaawAPI.duplicateBrowserProfile(profileEditorId.value);
  if (copy) { await populateProfileEditor(copy.id); showToast('Created an isolated profile copy.', 'success'); }
});
requestDeleteProfileBtn?.addEventListener('click', async () => {
  const id = profileEditorId.value;
  if (!(await window.thaawAPI.canDeleteBrowserProfile(id))) return showToast('This profile cannot be deleted while active or protected.', 'info');
  profilePendingDeleteId = id;
  deleteProfileMessage.textContent = `Deleting “${profileEditorName.value}” permanently removes its THAAW settings, bookmarks, history, downloads, site data, and sessions from this device.`;
  openModal(deleteProfileModal);
});
cancelDeleteProfileBtn?.addEventListener('click', () => closeModal(deleteProfileModal));
confirmDeleteProfileBtn?.addEventListener('click', async () => {
  const result = await window.thaawAPI.deleteBrowserProfile(profilePendingDeleteId);
  closeModal(deleteProfileModal);
  if (!result.success) return showToast(result.reason || 'Profile could not be deleted.', 'error');
  const active = await window.thaawAPI.getActiveProfile();
  await populateProfileEditor(active.id); await renderTopProfiles();
  showToast('Profile and its local data were deleted.', 'success');
});
window.thaawAPI.onProfileContextAction?.(async ({ action, profileId }) => {
  if (action === 'settings') return openProfileCenter(profileId);
  await openProfileCenter(profileId);
  if (action === 'duplicate') duplicateProfileBtn.click();
  if (action === 'delete') requestDeleteProfileBtn.click();
  if (action === 'rename') profileEditorName.focus();
  if (action === 'avatar') profileEditorColor.focus();
});

profileBtn?.addEventListener('contextmenu', event => {
  event.preventDefault();
  window.thaawAPI.getActiveProfile().then(profile => window.thaawAPI.showProfileContextMenu(profile.id));
});

window.thaawAPI.onProfileChanged?.(() => {
  renderTopProfiles();
  profileMenu?.classList.add('hidden');
});

// Initialize authentic browser sidebar according to user preference
setBrowserSidebarMode(currentSidebarMode);

// Tab Search Modal (Ctrl+Shift+A)
tabSearchBtn?.addEventListener('click', () => openTabSearch());

let currentTabSearchIndex = 0;
let currentFilteredTabs: ThaawTabInfo[] = [];

function updateTabSearchSelection(): void {
  const items = tabSearchResults.querySelectorAll('.search-result-item');
  items.forEach((el, idx) => {
    el.classList.toggle('active', idx === currentTabSearchIndex);
    if (idx === currentTabSearchIndex) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  });
}

function openTabSearch(): void {
  openModal(tabSearchModal);
  tabSearchInput.value = '';
  tabSearchInput.focus();
  currentFilteredTabs = cachedTabs;
  currentTabSearchIndex = 0;
  renderTabSearchResults(currentFilteredTabs);
}

function renderTabSearchResults(tabs: ThaawTabInfo[]): void {
  tabSearchResults.innerHTML = '';
  currentFilteredTabs = tabs;
  if (currentTabSearchIndex >= tabs.length) {
    currentTabSearchIndex = 0;
  }
  if (tabs.length === 0) {
    tabSearchResults.innerHTML = '<div class="pane-list-empty">No matching tabs found</div>';
    return;
  }
  tabs.forEach((tab, index) => {
    const item = document.createElement('div');
    item.className = 'search-result-item' + (index === currentTabSearchIndex ? ' active' : '');
    item.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 13px;">${tab.title || 'New Tab'}</div>
        <div style="font-size: 11px; color: var(--thaaw-text-muted);">${tab.url}</div>
      </div>
      <span class="shortcut-tag">${tab.id === currentActiveTabId ? 'Active' : 'Jump'}</span>
    `;
    item.addEventListener('click', () => {
      window.thaawAPI.switchTab(tab.id);
      closeModal(tabSearchModal);
    });
    tabSearchResults.appendChild(item);
  });
}

tabSearchInput?.addEventListener('input', () => {
  const q = tabSearchInput.value.toLowerCase().trim();
  const filtered = cachedTabs.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.url && t.url.toLowerCase().includes(q)));
  currentTabSearchIndex = 0;
  renderTabSearchResults(filtered);
});

tabSearchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentFilteredTabs.length > 0) {
      currentTabSearchIndex = (currentTabSearchIndex + 1) % currentFilteredTabs.length;
      updateTabSearchSelection();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentFilteredTabs.length > 0) {
      currentTabSearchIndex = (currentTabSearchIndex - 1 + currentFilteredTabs.length) % currentFilteredTabs.length;
      updateTabSearchSelection();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = currentFilteredTabs[currentTabSearchIndex];
    if (selected) {
      window.thaawAPI.switchTab(selected.id);
      closeModal(tabSearchModal);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(tabSearchModal);
  }
});

// Close panels on outer click
document.addEventListener('click', (e) => {
  let changed = false;
  if (!securityPanel.contains(e.target as Node) && !securityIndicatorBtn.contains(e.target as Node)) {
    if (!securityPanel.classList.contains('hidden')) {
      securityPanel.classList.add('hidden');
      changed = true;
    }
  }
  if (mainMenu && !mainMenu.contains(e.target as Node) && (!menuBtn || !menuBtn.contains(e.target as Node))) {
    if (!mainMenu.classList.contains('hidden')) {
      mainMenu.classList.add('hidden');
      changed = true;
    }
  }
  if (profileMenu && !profileMenu.contains(e.target as Node) && !profileBtn.contains(e.target as Node)) {
    if (!profileMenu.classList.contains('hidden')) {
      profileMenu.classList.add('hidden');
      changed = true;
    }
  }
  if (isDownloadPopoverOpen && downloadPopover && !downloadPopover.contains(e.target as Node) && !downloadsBtn.contains(e.target as Node)) {
    closeDownloadPopover();
    changed = true;
  }
  if (passwordSavePrompt && !passwordSavePrompt.classList.contains('hidden') && !passwordSavePrompt.contains(e.target as Node) && passwordKeyBtn && !passwordKeyBtn.contains(e.target as Node)) {
    closePasswordPrompt();
    changed = true;
  }
  if (pwaInstallModal && !pwaInstallModal.classList.contains('hidden') && !pwaInstallModal.contains(e.target as Node) && pwaInstallBtn && !pwaInstallBtn.contains(e.target as Node)) {
    closePwaInstallModal();
    changed = true;
  }
  if (changed) {
    updateFlyoutState();
  }
});

flyoutBackdrop?.addEventListener('click', (e) => {
  // Do NOT close if the click originated inside a popover or menu
  const target = e.target as Node;
  if (profileMenu && profileMenu.contains(target)) return;
  if (mainMenu && mainMenu.contains(target)) return;
  if (downloadPopover && downloadPopover.contains(target)) return;
  if (securityPanel && securityPanel.contains(target)) return;
  if (passwordSavePrompt && passwordSavePrompt.contains(target)) return;
  if (pwaInstallModal && pwaInstallModal.contains(target)) return;
  securityPanel?.classList.add('hidden');
  mainMenu?.classList.add('hidden');
  profileMenu?.classList.add('hidden');
  closePasswordPrompt();
  closePwaInstallModal();
  closeDownloadPopover();
  updateFlyoutState();
});

tabSearchModal?.addEventListener('click', (e) => {
  if (e.target === tabSearchModal) closeModal(tabSearchModal);
});

paletteModal?.addEventListener('click', (e) => {
  if (e.target === paletteModal) closeModal(paletteModal);
});

// Command Palette (Ctrl+Shift+P)
const COMMANDS = [
  { id: 'new-tab', title: 'Open New Tab', icon: SVG.tab },
  { id: 'reopen-closed-tab', title: 'Reopen Closed Tab', icon: SVG.tab },
  { id: 'new-window', title: 'Open New Window', icon: SVG.tab },
  { id: 'new-incognito', title: 'Open Private Window', icon: SVG.shield },
  { id: 'toggle-minimal-mode', title: 'Toggle Minimalist Chrome Mode (Zen)', icon: SVG.gear },
  { id: 'open-security', title: 'Open Security Center', icon: SVG.shield },
  { id: 'open-privacy', title: 'Open Privacy Center', icon: SVG.shield },
  { id: 'open-settings', title: 'Open Browser Settings', icon: SVG.gear },
  { id: 'open-bookmarks', title: 'Open Bookmarks Manager', icon: SVG.bookmark },
  { id: 'open-history', title: 'Open Browsing History', icon: SVG.clock },
  { id: 'open-downloads', title: 'Open Downloads Manager', icon: SVG.download },
  { id: 'open-passwords', title: 'Open Password Manager', icon: SVG.key },
  { id: 'open-about', title: 'Help & About THAAW', icon: SVG.info },
  { id: 'toggle-theme', title: 'Toggle Theme (Light / Dark)', icon: SVG.sun },
  { id: 'toggle-sidebar', title: 'Toggle Browser Sidebar', icon: SVG.tab },
  { id: 'toggle-shield', title: 'Toggle THAAW Shield on Active Site', icon: SVG.shield },
  { id: 'clear-data', title: 'Clear Cookies & Browsing Data', icon: SVG.trash }
];

let currentPaletteIndex = 0;
let currentFilteredCommands: typeof COMMANDS = [];

function updatePaletteSelection(): void {
  const items = paletteList.querySelectorAll('.palette-item');
  items.forEach((el, idx) => {
    el.classList.toggle('active', idx === currentPaletteIndex);
    if (idx === currentPaletteIndex) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  });
}

function openCommandPalette(): void {
  openModal(paletteModal);
  paletteInput.value = '';
  paletteInput.focus();
  currentFilteredCommands = COMMANDS;
  currentPaletteIndex = 0;
  renderPaletteCommands(COMMANDS);
}

function renderPaletteCommands(list: typeof COMMANDS): void {
  paletteList.innerHTML = '';
  currentFilteredCommands = list;
  if (currentPaletteIndex >= list.length) {
    currentPaletteIndex = 0;
  }
  list.forEach((cmd, index) => {
    const item = document.createElement('div');
    item.className = 'palette-item' + (index === currentPaletteIndex ? ' active' : '');
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${cmd.icon}</span>
        <span>${cmd.title}</span>
      </div>
    `;
    item.addEventListener('click', async () => {
      await executePaletteCommand(cmd);
      closeModal(paletteModal);
    });
    paletteList.appendChild(item);
  });
}

async function executePaletteCommand(cmd: (typeof COMMANDS)[number]): Promise<void> {
  if (cmd.id === 'toggle-minimal-mode') {
    toggleMinimalMode();
  } else if (cmd.id === 'toggle-theme') {
    const cur = await window.thaawAPI.getTheme();
    const nextTheme = cur.theme === 'dark' ? 'light' : 'dark';
    const nextPreset = nextTheme === 'dark' ? 'midnight' : 'white';
    await window.thaawAPI.setTheme(nextTheme, nextPreset);
  } else if (cmd.id === 'open-passwords') {
    window.thaawAPI.createTab('thaaw://passwords');
  } else if (cmd.id === 'open-about') {
    window.thaawAPI.createTab('thaaw://about');
  } else if (cmd.id === 'open-security') {
    window.thaawAPI.createTab('thaaw://security');
  } else if (cmd.id === 'open-privacy') {
    window.thaawAPI.createTab('thaaw://privacy');
  } else if (cmd.id === 'open-settings') {
    window.thaawAPI.createTab('thaaw://settings');
  } else if (cmd.id === 'open-bookmarks') {
    window.thaawAPI.createTab('thaaw://bookmarks');
  } else if (cmd.id === 'open-history') {
    window.thaawAPI.createTab('thaaw://history');
  } else if (cmd.id === 'open-downloads') {
    window.thaawAPI.createTab('thaaw://downloads');
  } else if (cmd.id === 'reopen-closed-tab') {
    if (window.thaawAPI.reopenClosedTab) {
      await window.thaawAPI.reopenClosedTab();
    } else {
      window.thaawAPI.executeCommand('reopen-closed-tab');
    }
  } else {
    window.thaawAPI.executeCommand(cmd.id);
  }
}

paletteInput.addEventListener('input', () => {
  const q = paletteInput.value.toLowerCase().trim();
  currentPaletteIndex = 0;
  renderPaletteCommands(COMMANDS.filter(c => c.title.toLowerCase().includes(q)));
});

paletteInput.addEventListener('keydown', async (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (currentFilteredCommands.length > 0) {
      currentPaletteIndex = (currentPaletteIndex + 1) % currentFilteredCommands.length;
      updatePaletteSelection();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (currentFilteredCommands.length > 0) {
      currentPaletteIndex = (currentPaletteIndex - 1 + currentFilteredCommands.length) % currentFilteredCommands.length;
      updatePaletteSelection();
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = currentFilteredCommands[currentPaletteIndex];
    if (selected) {
      await executePaletteCommand(selected);
      closeModal(paletteModal);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(paletteModal);
  }
});

// Minimalist Chrome Mode Controller
let isMinimalMode = localStorage.getItem('thaaw_minimal_mode') === 'true';

function applyMinimalMode(enabled: boolean): void {
  isMinimalMode = enabled;
  document.documentElement.setAttribute('data-minimal', enabled ? 'true' : 'false');
  localStorage.setItem('thaaw_minimal_mode', String(enabled));
  const newHeight = enabled ? 74 : 84;
  if (window.thaawAPI?.setChromeHeight) {
    window.thaawAPI.setChromeHeight(newHeight);
  }
  if (window.thaawAPI?.setMinimalMode) {
    window.thaawAPI.setMinimalMode(enabled);
  }
}

function toggleMinimalMode(): void {
  applyMinimalMode(!isMinimalMode);
  showToast(isMinimalMode ? 'Minimal Mode Enabled' : 'Standard Mode Restored', 'info');
}

if (isMinimalMode) {
  applyMinimalMode(true);
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+B: Toggle Sidebar
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault();
    if (currentSidebarMode === 'hidden') {
      setBrowserSidebarMode('collapsed');
    } else {
      setBrowserSidebarMode('hidden');
    }
    return;
  }

  // Ctrl+Shift+M: Toggle Minimalist Chrome Mode
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
    e.preventDefault();
    toggleMinimalMode();
    return;
  }
  // F12 or Ctrl+Shift+I: Developer Tools
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'))) {
    e.preventDefault();
    window.thaawAPI.toggleDevTools();
    return;
  }

  // Ctrl+Shift+J: Developer Console
  if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
    e.preventDefault();
    window.thaawAPI.toggleDevTools();
    return;
  }

  // Ctrl+Shift+C: Inspect Element
  if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
    e.preventDefault();
    window.thaawAPI.inspectElement();
    return;
  }

  // Ctrl+U: View Page Source
  if (e.ctrlKey && !e.shiftKey && (e.key === 'U' || e.key === 'u')) {
    e.preventDefault();
    const active = cachedTabs.find(t => t.id === currentActiveTabId);
    if (active && active.url && !active.url.startsWith('thaaw://') && !active.url.startsWith('view-source:')) {
      window.thaawAPI.createTab(`view-source:${active.url}`);
    }
    return;
  }

  // Ctrl+T: New Tab
  if (e.ctrlKey && !e.shiftKey && (e.key === 'T' || e.key === 't')) {
    e.preventDefault();
    window.thaawAPI.createTab('thaaw://newtab');
    return;
  }

  // Ctrl+W: Close Current Tab
  if (e.ctrlKey && !e.shiftKey && (e.key === 'W' || e.key === 'w')) {
    e.preventDefault();
    if (currentActiveTabId) {
      window.thaawAPI.closeTab(currentActiveTabId);
    }
    return;
  }

  // Ctrl+R or F5: Reload
  if ((e.ctrlKey && !e.shiftKey && (e.key === 'R' || e.key === 'r')) || e.key === 'F5') {
    e.preventDefault();
    window.thaawAPI.reload();
    return;
  }

  // Alt+Left: Go Back
  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    window.thaawAPI.goBack();
    return;
  }

  // Alt+Right: Go Forward
  if (e.altKey && e.key === 'ArrowRight') {
    e.preventDefault();
    window.thaawAPI.goForward();
    return;
  }

  // Ctrl+Shift+A: Tab Search
  if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
    e.preventDefault();
    openTabSearch();
    return;
  }

  // Ctrl+Shift+P: Command Palette
  if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  // Escape: Close Modals, Sidebar & Popovers
  if (e.key === 'Escape') {
    closeModal(tabSearchModal);
    closeModal(paletteModal);
    closeModal(permissionModal);
    closeModal(downloadModal);
    closeModal(qrModal);
    closeModal(castModal);
    if (siteControlModal && !siteControlModal.classList.contains('hidden')) {
      closeModal(siteControlModal);
    }
    securityPanel.classList.add('hidden');
    if (mainMenu) mainMenu.classList.add('hidden');
    profileMenu?.classList.add('hidden');
    closeDownloadPopover();
    closePasswordPrompt();
    closePwaInstallModal();
    updateFlyoutState();
  }
});

// Event Subscriptions from Main Process
window.thaawAPI.onTabsUpdated(({ tabs, activeTabId }) => {
  renderTabs(tabs, activeTabId);
});

window.thaawAPI.onSecurityStatusUpdated((status) => {
  panelBlockedCount.textContent = String(status.trackersBlockedCount || 0);
  if (shieldToggle) shieldToggle.checked = status.isShieldActive;
  if (siteMasterShieldToggle) siteMasterShieldToggle.checked = status.isShieldActive;
  if (siteShieldActiveLabel) {
    siteShieldActiveLabel.className = status.isShieldActive ? 'shield-status-tag active' : 'shield-status-tag disabled';
    siteShieldActiveLabel.textContent = status.isShieldActive ? 'ACTIVE' : 'DISABLED';
  }
  if (siteTabShieldBadge) siteTabShieldBadge.textContent = String(status.trackersBlockedCount || 0);
  if (siteMetricTrackers) siteMetricTrackers.textContent = String(status.trackersBlockedCount || 0);
  if (siteMetricAds) siteMetricAds.textContent = String(status.adsBlockedCount || 0);
  if (status.trackersBlockedCount > 0) {
    shieldBlockedBadge.textContent = String(status.trackersBlockedCount);
    shieldBlockedBadge.style.display = 'inline-block';
  } else {
    shieldBlockedBadge.style.display = 'none';
  }
  quickShieldBtn.className = `chrome-btn-sm shield-toggle-btn ${status.isShieldActive ? 'active' : 'disabled'}`;
});

window.thaawAPI.onPermissionRequested((req) => {
  activePermissionRequestId = req.id;
  permModalTitle.textContent = `${req.permission.toUpperCase()} Permission Request`;
  permWho.textContent = req.details.who;
  permWhat.textContent = req.details.what;
  permWhy.textContent = req.details.why;
  openModal(permissionModal);
});

permAllowBtn.addEventListener('click', () => {
  if (activePermissionRequestId) {
    window.thaawAPI.respondPermission(activePermissionRequestId, 'allow');
    closeModal(permissionModal);
  }
});

permAllowOnceBtn.addEventListener('click', () => {
  if (activePermissionRequestId) {
    window.thaawAPI.respondPermission(activePermissionRequestId, 'allow-once');
    closeModal(permissionModal);
  }
});

permDenyBtn.addEventListener('click', () => {
  if (activePermissionRequestId) {
    window.thaawAPI.respondPermission(activePermissionRequestId, 'deny');
    closeModal(permissionModal);
  }
});

window.thaawAPI.onDownloadPrompt((prompt) => {
  activeDownloadId = prompt.downloadId;
  dlFilename.textContent = prompt.inspection.filename;
  dlWarningMessage.textContent = prompt.inspection.reasons.join('. ');
  openModal(downloadModal);
});

dlAcceptBtn.addEventListener('click', () => {
  if (activeDownloadId) {
    window.thaawAPI.respondDownload(activeDownloadId, true);
    closeModal(downloadModal);
  }
});

dlCancelBtn.addEventListener('click', () => {
  if (activeDownloadId) {
    window.thaawAPI.respondDownload(activeDownloadId, false);
    closeModal(downloadModal);
  }
});

// =========================================================================
// QR Code for Page Modal & Generator
// =========================================================================
let currentQrUrl = '';

function generateQrSvg(text: string): string {
  const len = text.length;
  const version = len <= 32 ? 2 : len <= 64 ? 3 : 4;
  const size = 17 + version * 4; // 25, 29, or 33
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const set = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      reserved[r][c] = true;
    }
  };

  // 1. Finder patterns (7x7) at corners
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          reserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              matrix[nr][nc] = true;
            } else {
              matrix[nr][nc] = false;
            }
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment pattern
  if (version >= 2) {
    const alignPos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const nr = alignPos + r;
        const nc = alignPos + c;
        reserved[nr][nc] = true;
        matrix[nr][nc] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // Dark module
  set(4 * version + 9, 8, true);

  // 4. Encode data stream
  const bits: number[] = [];
  const pushBits = (val: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(len, 8); // Length
  for (let i = 0; i < len; i++) {
    pushBits(text.charCodeAt(i) & 0xff, 8);
  }
  pushBits(0, Math.min(4, 8 - (bits.length % 8)));
  while (bits.length % 8 !== 0) bits.push(0);

  const totalDataBytes = version === 2 ? 34 : version === 3 ? 55 : 80;
  let padToggle = true;
  while (bits.length < totalDataBytes * 8) {
    pushBits(padToggle ? 0xec : 0x11, 8);
    padToggle = !padToggle;
  }

  // Zig-zag module placement
  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (!reserved[r][c]) {
          const bit = bitIdx < bits.length ? bits[bitIdx++] : (r + c) % 2 === 0 ? 1 : 0;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  const cellSize = 6;
  const padding = 16;
  const totalWidth = size * cellSize + padding * 2;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${padding + c * cellSize}" y="${padding + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalWidth}" width="180" height="180" shape-rendering="crispEdges">
    <rect width="${totalWidth}" height="${totalWidth}" fill="#FFFFFF"/>
    ${rects}
  </svg>`;
}

window.thaawAPI.onShowQrCode?.((data) => {
  currentQrUrl = data.url;
  if (qrUrlText) qrUrlText.textContent = data.url;
  if (qrCodeContainer) qrCodeContainer.innerHTML = generateQrSvg(data.url);
  openModal(qrModal);
});

copyQrUrlBtn?.addEventListener('click', async () => {
  if (currentQrUrl) {
    try {
      await navigator.clipboard.writeText(currentQrUrl);
      const prev = copyQrUrlBtn.textContent;
      copyQrUrlBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyQrUrlBtn.textContent = prev;
      }, 1500);
    } catch (_e) {}
  }
});

closeQrBtn?.addEventListener('click', () => {
  closeModal(qrModal);
});

// =========================================================================
// Cast Media Device Modal
// =========================================================================
window.thaawAPI.onShowCast?.(() => {
  openModal(castModal);
});

closeCastBtn?.addEventListener('click', () => {
  closeModal(castModal);
});

document.querySelectorAll('.cast-device-item').forEach((item) => {
  item.addEventListener('click', () => {
    const badge = item.querySelector('.badge-tag');
    if (badge) {
      badge.textContent = 'Connecting...';
      badge.setAttribute('style', 'font-size: 10px; background: rgba(0, 240, 255, 0.2); color: var(--thaaw-cyan);');
      setTimeout(() => {
        badge.textContent = 'Connected';
        setTimeout(() => {
          closeModal(castModal);
          badge.textContent = 'Ready';
          badge.removeAttribute('style');
        }, 800);
      }, 700);
    }
  });
});

// Omnibox and Palette Global Shortcuts from WebContentsView
window.thaawAPI.onFocusOmnibox?.(() => {
  if (urlInput) {
    urlInput.focus();
    urlInput.select();
  }
});

window.thaawAPI.onOpenPalette?.(() => {
  openCommandPalette();
});

window.thaawAPI.onOpenTabSearch?.(() => {
  openTabSearch();
});

window.thaawAPI.onProfileChanged?.(() => {
  renderTopProfiles();
});

window.thaawAPI.onAuthChanged?.(() => {
  renderTopProfiles();
});

// =========================================================================
// Custom Toast Notification System (Zero OS-Native Alerts)
// =========================================================================
function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3500): void {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast-card toast-${type}`;

  let iconSvg = SVG.shield;
  if (type === 'success') {
    iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close-btn" title="Dismiss">${SVG.close}</button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn?.addEventListener('click', () => {
    dismiss();
  });

  let timer: any = setTimeout(() => {
    dismiss();
  }, duration);

  function dismiss() {
    clearTimeout(timer);
    toast.classList.add('exiting');
    setTimeout(() => {
      toast.remove();
    }, 220);
  }

  toastContainer.appendChild(toast);
}

// =========================================================================
// Browser Main Menu & Navigation Sidebar Helpers
// =========================================================================
function closeMainMenu(): void {
  if (mainMenu) mainMenu.classList.add('hidden');
}

function toggleNavigationSidebar(): void {
  if (currentSidebarMode === 'hidden') {
    setBrowserSidebarMode('collapsed');
  } else {
    setBrowserSidebarMode('hidden');
  }
}

// Hook system toggle shortcut
window.thaawAPI.onToggleSidebar?.(() => {
  toggleNavigationSidebar();
});

// =========================================================================
// Browser Main Menu: Zoom Controls & Action Listeners
// =========================================================================
let currentZoomPercent = 100;

zoomInBtn?.addEventListener('click', () => {
  window.thaawAPI.zoomIn();
  currentZoomPercent = Math.min(300, currentZoomPercent + 10);
  if (zoomLevelDisplay) zoomLevelDisplay.textContent = `${currentZoomPercent}%`;
});

zoomOutBtn?.addEventListener('click', () => {
  window.thaawAPI.zoomOut();
  currentZoomPercent = Math.max(30, currentZoomPercent - 10);
  if (zoomLevelDisplay) zoomLevelDisplay.textContent = `${currentZoomPercent}%`;
});

zoomResetBtn?.addEventListener('click', () => {
  window.thaawAPI.zoomReset();
  currentZoomPercent = 100;
  if (zoomLevelDisplay) zoomLevelDisplay.textContent = '100%';
});

(window.thaawAPI as any).onZoomChanged?.((zoomPercent: number) => {
  currentZoomPercent = zoomPercent;
  if (zoomLevelDisplay) zoomLevelDisplay.textContent = `${zoomPercent}%`;
});

// Global Keyboard Shortcuts for Zooming & Lightbox
window.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
  if (cmdOrCtrl) {
    if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') {
      e.preventDefault();
      window.thaawAPI.zoomIn();
    } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
      e.preventDefault();
      window.thaawAPI.zoomOut();
    } else if (e.key === '0' || e.code === 'Numpad0') {
      e.preventDefault();
      window.thaawAPI.zoomReset();
    }
  } else if (e.key === 'Escape') {
    if (imageLightboxModal && !imageLightboxModal.classList.contains('hidden')) {
      closeImageLightbox();
    }
  }
});

fullscreenToggleBtn?.addEventListener('click', () => {
  window.thaawAPI.toggleFullscreen();
});

// Main Menu & Action Buttons Event Delegation
document.querySelectorAll<HTMLElement>('.main-menu .menu-item[data-action], .sidebar-menu-item[data-action]').forEach(item => {
  item.addEventListener('click', async () => {
    const action = item.dataset.action;
    closeMainMenu();

    switch (action) {
      case 'toggle-sidebar':
        toggleNavigationSidebar();
        break;
      case 'new-tab':
        window.thaawAPI.createTab('thaaw://newtab');
        break;
      case 'new-window':
        window.thaawAPI.executeCommand('new-window');
        break;
      case 'new-private-window':
        window.thaawAPI.executeCommand('new-incognito');
        break;
      case 'open-security':
        window.thaawAPI.createTab('thaaw://security');
        break;
      case 'open-privacy':
        window.thaawAPI.createTab('thaaw://privacy');
        break;
      case 'open-passwords':
        window.thaawAPI.createTab('thaaw://passwords');
        break;
      case 'open-history':
        window.thaawAPI.createTab('thaaw://history');
        break;
      case 'open-bookmarks':
        window.thaawAPI.createTab('thaaw://bookmarks');
        break;
      case 'open-downloads':
        window.thaawAPI.createTab('thaaw://downloads');
        break;
      case 'clear-data':
        await window.thaawAPI.clearBrowsingData();
        showToast('Browsing data and cache cleared.', 'success');
        break;
      case 'print':
        window.thaawAPI.printPage();
        break;
      case 'find':
        openCommandPalette();
        break;
      case 'save-page':
        window.thaawAPI.savePage();
        break;
      case 'share-link':
        if (currentActiveTabId) {
          const tab = cachedTabs.find(t => t.id === currentActiveTabId);
          if (tab?.url) {
            await navigator.clipboard.writeText(tab.url);
            showToast('Page link copied to clipboard', 'success');
          }
        }
        break;
      case 'qr-code':
        if (currentActiveTabId) {
          const tab = cachedTabs.find(t => t.id === currentActiveTabId);
          if (tab?.url) {
            currentQrUrl = tab.url;
            if (qrUrlText) qrUrlText.textContent = tab.url;
            if (qrCodeContainer) qrCodeContainer.innerHTML = generateQrSvg(tab.url);
            openModal(qrModal);
          }
        }
        break;
      case 'cast':
        openModal(castModal);
        break;
      case 'devtools':
        window.thaawAPI.toggleDevTools();
        break;
      case 'view-source':
        window.thaawAPI.viewSource();
        break;
      case 'task-manager':
        window.thaawAPI.createTab('thaaw://taskmanager');
        break;
      case 'open-settings':
        window.thaawAPI.createTab('thaaw://settings');
        break;
      case 'open-help':
      case 'open-about':
        window.thaawAPI.createTab('thaaw://about');
        break;
      case 'exit':
        window.thaawAPI.executeCommand('exit-app');
        break;
    }
  });
});

// =========================================================================
// Download Popover & Micro-Interactions System
// =========================================================================
let isDownloadPopoverOpen = false;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'archive':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>';
    case 'image':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    case 'video':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
    case 'audio':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
    case 'code':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    case 'executable':
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>';
    default:
      return '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  }
}

async function renderDownloadPopover(): Promise<void> {
  if (!downloadPopoverList || !downloadPopoverEmpty) return;
  const items = await window.thaawAPI.getRecentDownloads(5);
  updateDownloadBadge(items);

  if (!items || items.length === 0) {
    downloadPopoverEmpty.style.display = 'flex';
    downloadPopoverList.innerHTML = '';
    return;
  }

  downloadPopoverEmpty.style.display = 'none';
  downloadPopoverList.innerHTML = items.map(item => {
    const isProgressing = item.state === 'progressing';
    const isCompleted = item.state === 'completed';
    const isFailed = item.state === 'failed';
    const isCancelled = item.state === 'cancelled';

    const pct = item.progress || 0;
    const categoryIcon = getCategoryIcon(item.category || 'generic');

    let statusText = 'Completed';
    let statusClass = 'completed';
    if (isProgressing) {
      statusText = item.isPaused ? 'Paused' : `${pct}%`;
      statusClass = 'progressing';
    } else if (isFailed) {
      statusText = 'Failed';
      statusClass = 'failed';
    } else if (isCancelled) {
      statusText = 'Cancelled';
      statusClass = 'cancelled';
    }

    return `
      <div class="download-popover-item" data-download-id="${item.id}">
        <div class="download-item-icon">${categoryIcon}</div>
        <div class="download-item-content">
          <div class="download-item-top">
            <span class="download-item-name" title="${item.filename}" data-action="open-file" data-id="${item.id}">${item.filename}</span>
            <span class="download-item-status ${statusClass}">${statusText}</span>
          </div>
          ${isProgressing ? `
            <div class="download-progress-bar">
              <div class="download-progress-fill" style="width: ${pct}%;"></div>
            </div>
            <div class="download-item-meta">
              <span class="download-meta-text">${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes)}</span>
              <span class="download-meta-speed">${item.speed ? `${formatBytes(item.speed)}/s` : ''} ${item.eta ? `· ${item.eta}s left` : ''}</span>
            </div>
          ` : `
            <div class="download-item-meta">
              <span class="download-meta-text">${formatBytes(item.totalBytes)}</span>
              <span class="download-meta-speed">${new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          `}
          <div class="download-item-actions">
            ${isProgressing ? `
              ${item.isPaused ? `
                <button class="download-action-btn" data-action="resume" data-id="${item.id}">Resume</button>
              ` : `
                <button class="download-action-btn" data-action="pause" data-id="${item.id}">Pause</button>
              `}
              <button class="download-action-btn danger" data-action="cancel" data-id="${item.id}">Cancel</button>
            ` : isCompleted ? `
              <button class="download-action-btn" data-action="open-file" data-id="${item.id}">Open</button>
              <button class="download-action-btn" data-action="open-folder" data-id="${item.id}">Folder</button>
            ` : isFailed ? `
              <button class="download-action-btn" data-action="retry" data-url="${item.url}">Retry</button>
            ` : ''}
            <button class="download-action-btn" data-action="more" data-id="${item.id}" title="Options">···</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Item row click handler: opens the download actions modal
  downloadPopoverList.querySelectorAll<HTMLElement>('.download-popover-item').forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action]') && !(e.target as HTMLElement).closest('[data-action="more"]')) return;
      const id = itemEl.dataset.downloadId;
      const item = items.find(i => i.id === id);
      if (item) {
        openDownloadActionsModal(item);
      }
    });
  });

  // Action button event handlers in Popover
  downloadPopoverList.querySelectorAll<HTMLElement>('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const url = btn.dataset.url;
      const item = items.find(i => i.id === id);

      if (action === 'more' && item) {
        openDownloadActionsModal(item);
      } else if (action === 'open-file' && id) {
        await window.thaawAPI.openDownloadFile(id);
      } else if (action === 'open-folder' && id) {
        await window.thaawAPI.openDownloadFolder(id);
      } else if (action === 'pause' && id) {
        await window.thaawAPI.pauseDownload(id);
        renderDownloadPopover();
      } else if (action === 'resume' && id) {
        await window.thaawAPI.resumeDownload(id);
        renderDownloadPopover();
      } else if (action === 'cancel' && id) {
        await window.thaawAPI.cancelDownload(id);
        renderDownloadPopover();
      } else if (action === 'retry' && url) {
        window.thaawAPI.createTab(url);
        closeDownloadPopover();
      }
    });
  });
}

function openDownloadActionsModal(item: any): void {
  if (!downloadActionsModal) return;
  selectedDownloadItem = item;
  if (dlMenuFilename) dlMenuFilename.textContent = item.filename;
  if (dlMenuIcon) dlMenuIcon.innerHTML = getCategoryIcon(item.category || 'generic');

  if (dlActionOpen) dlActionOpen.style.display = item.state === 'completed' ? 'flex' : 'none';
  if (dlActionFolder) dlActionFolder.style.display = item.state === 'completed' ? 'flex' : 'none';

  openModal(downloadActionsModal);
}

dlActionOpen?.addEventListener('click', async () => {
  if (selectedDownloadItem?.id) {
    await window.thaawAPI.openDownloadFile(selectedDownloadItem.id);
    closeModal(downloadActionsModal);
  }
});

dlActionFolder?.addEventListener('click', async () => {
  if (selectedDownloadItem?.id) {
    await window.thaawAPI.openDownloadFolder(selectedDownloadItem.id);
    closeModal(downloadActionsModal);
  }
});

dlActionCopyLink?.addEventListener('click', async () => {
  if (selectedDownloadItem?.url) {
    await navigator.clipboard.writeText(selectedDownloadItem.url);
    showToast('Download link copied to clipboard', 'info');
    closeModal(downloadActionsModal);
  }
});

dlActionRemove?.addEventListener('click', async () => {
  if (selectedDownloadItem?.id) {
    await window.thaawAPI.removeDownloadItem(selectedDownloadItem.id);
    showToast('Removed from downloads list', 'info');
    closeModal(downloadActionsModal);
    renderDownloadPopover();
  }
});

dlActionDelete?.addEventListener('click', async () => {
  if (selectedDownloadItem?.id) {
    await window.thaawAPI.deleteDownloadFile(selectedDownloadItem.id);
    showToast('File permanently deleted', 'warning');
    closeModal(downloadActionsModal);
    renderDownloadPopover();
  }
});

dlActionCancel?.addEventListener('click', () => {
  closeModal(downloadActionsModal);
});

function updateDownloadBadge(items: any[]): void {
  if (!downloadBadge) return;
  const progressingCount = items.filter(i => i.state === 'progressing').length;
  if (progressingCount > 0) {
    downloadBadge.textContent = String(progressingCount);
    downloadBadge.style.display = 'flex';
    downloadsBtn?.classList.add('downloading-active');
  } else {
    downloadBadge.style.display = 'none';
    downloadsBtn?.classList.remove('downloading-active');
  }
}

function toggleDownloadPopover(): void {
  if (!downloadPopover) return;
  if (isDownloadPopoverOpen) {
    closeDownloadPopover();
  } else {
    if (profileMenu) profileMenu.classList.add('hidden');
    securityPanel?.classList.add('hidden');
    closeMainMenu();
    isDownloadPopoverOpen = true;
    positionDownloadPopover();
    downloadPopover.classList.remove('hidden');
    flyoutBackdrop?.classList.remove('hidden');
    updateFlyoutState();
    renderDownloadPopover();
  }
}

function closeDownloadPopover(): void {
  if (!downloadPopover) return;
  isDownloadPopoverOpen = false;
  downloadPopover.classList.add('hidden');
  updateFlyoutState();
}

downloadClearBtn?.addEventListener('click', async (e) => {
  e.stopPropagation();
  await window.thaawAPI.clearCompletedDownloads();
  renderDownloadPopover();
  showToast('Completed downloads cleared from list', 'info');
});

downloadShowMoreBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeDownloadPopover();
  window.thaawAPI.createTab('thaaw://downloads');
});



// Real-time download events from Main Process
window.thaawAPI.onDownloadStarted?.((item) => {
  showToast(`Downloading: ${item.filename}`, 'info');
  downloadsBtn?.animate([
    { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(56, 189, 248, 0))' },
    { transform: 'scale(1.25)', filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.9))' },
    { transform: 'scale(1)', filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.5))' }
  ], { duration: 420, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
  downloadsBtn?.classList.add('downloading-active');

  // Automatically open the custom download popover showing the download with live progress bar
  if (!isDownloadPopoverOpen) {
    toggleDownloadPopover();
  } else {
    renderDownloadPopover();
  }
  window.thaawAPI.getRecentDownloads(5).then(updateDownloadBadge);
});

window.thaawAPI.onDownloadProgress?.((data) => {
  if (isDownloadPopoverOpen) {
    const itemEl = downloadPopoverList?.querySelector(`[data-download-id="${data.id}"]`);
    if (itemEl) {
      const fill = itemEl.querySelector('.download-progress-fill') as HTMLElement;
      const status = itemEl.querySelector('.download-item-status') as HTMLElement;
      const metaSpeed = itemEl.querySelector('.download-meta-speed') as HTMLElement;
      const metaText = itemEl.querySelector('.download-meta-text') as HTMLElement;
      if (fill) fill.style.width = `${data.progress}%`;
      if (status) status.textContent = `${data.progress}%`;
      if (metaText) metaText.textContent = `${formatBytes(data.receivedBytes)} / ${formatBytes(data.totalBytes)}`;
      if (metaSpeed) metaSpeed.textContent = `${data.speed ? `${formatBytes(data.speed)}/s` : ''} ${data.eta ? `· ${data.eta}s left` : ''}`;
    }
  }
});

window.thaawAPI.onDownloadCompleted?.((item) => {
  showToast(`Download complete: ${item.filename}`, 'success');
  downloadsBtn?.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.2)' },
    { transform: 'scale(1)' }
  ], { duration: 350 });
  if (isDownloadPopoverOpen) renderDownloadPopover();
  window.thaawAPI.getRecentDownloads(5).then(updateDownloadBadge);
});

window.thaawAPI.onDownloadFailed?.((data) => {
  showToast(`Download failed: ${data.filename || 'File'}`, 'error');
  if (isDownloadPopoverOpen) renderDownloadPopover();
  window.thaawAPI.getRecentDownloads(5).then(updateDownloadBadge);
});

window.thaawAPI.onDownloadCancelled?.((data) => {
  showToast(`Download cancelled: ${data.filename || 'File'}`, 'warning');
  if (isDownloadPopoverOpen) renderDownloadPopover();
  window.thaawAPI.getRecentDownloads(5).then(updateDownloadBadge);
});

// Initial load check for downloads badge
window.thaawAPI.getRecentDownloads?.(5).then(items => {
  updateDownloadBadge(items || []);
}).catch(() => {});

// Initial load for bookmarks bar and active profile
renderBookmarksBar().catch(() => {});
renderTopProfiles().catch(() => {});

window.thaawAPI.onProfileChanged?.(() => {
  renderTopProfiles().catch(() => {});
  renderBookmarksBar().catch(() => {});
});

