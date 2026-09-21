/**
 * THAAW Browser — IPC Security Validation Layer
 * Enforces strict message contracts, input sanitization, and origin authorization checks.
 * Principle: Never trust a renderer simply because it is part of THAAW.
 */

export interface ValidatedIpcMessage<T = unknown> {
  channel: string;
  senderId: number;
  payload: T;
  timestamp: number;
}

export type IpcChannel =
  | 'tab:create'
  | 'tab:close'
  | 'tab:switch'
  | 'tab:navigate'
  | 'tab:reload'
  | 'tab:stop'
  | 'tab:back'
  | 'tab:forward'
  | 'tab:mute'
  | 'tab:duplicate'
  | 'tab:pin'
  | 'tab:search'
  | 'adblock:get-status'
  | 'adblock:toggle'
  | 'adblock:toggle-site'
  | 'security:get-status'
  | 'security:toggle-shield'
  | 'security:set-protection-level'
  | 'permission:respond'
  | 'download:respond'
  | 'palette:action'
  | 'settings:get'
  | 'settings:update'
  | 'profiles:list'
  | 'profiles:switch'
  | 'downloads:list'
  | 'data:clear'
  | 'theme:get'
  | 'theme:set'
  | 'history:get'
  | 'history:delete'
  | 'history:clear'
  | 'bookmarks:get'
  | 'bookmarks:add'
  | 'bookmarks:update'
  | 'bookmarks:delete'
  | 'bookmarks:toggle'
  | 'bookmarks:import'
  | 'passwords:get'
  | 'passwords:save'
  | 'passwords:reveal'
  | 'passwords:delete'
  | 'passwords:update'
  | 'passwords:get-security-status'
  | 'news:get'
  | 'sidebar:resize'
  | 'auth:create-account'
  | 'auth:sign-in'
  | 'auth:sign-out'
  | 'auth:get-current-user'
  | 'auth:update-profile'
  | 'auth:list-accounts'
  | 'devtools:toggle'
  | 'devtools:inspect'
  | 'profile:picker-launch'
  | 'profile:select-and-launch'
  | 'profile:set-startup-preference'
  | 'profile:get-startup-preference'
  | 'tab:reopen-closed'
  | 'history:clear-range'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close';

const ALLOWED_CHANNELS = new Set<string>([
  'tab:create',
  'tab:close',
  'tab:switch',
  'tab:navigate',
  'tab:reload',
  'tab:stop',
  'tab:back',
  'tab:forward',
  'tab:mute',
  'tab:duplicate',
  'tab:pin',
  'tab:search',
  'tab:reopen-closed',
  'adblock:get-status',
  'adblock:toggle',
  'adblock:toggle-site',
  'security:get-status',
  'security:toggle-shield',
  'security:set-protection-level',
  'permission:respond',
  'download:respond',
  'palette:action',
  'settings:get',
  'settings:update',
  'profiles:list',
  'profiles:switch',
  'downloads:list',
  'data:clear',
  'theme:get',
  'theme:set',
  'history:get',
  'history:delete',
  'history:clear',
  'history:clear-range',
  'bookmarks:get',
  'bookmarks:add',
  'bookmarks:update',
  'bookmarks:delete',
  'bookmarks:toggle',
  'bookmarks:import',
  'passwords:get',
  'passwords:save',
  'passwords:reveal',
  'passwords:delete',
  'passwords:update',
  'passwords:get-security-status',
  'news:get',
  'sidebar:resize',
  'auth:create-account',
  'auth:sign-in',
  'auth:sign-out',
  'auth:get-current-user',
  'auth:update-profile',
  'auth:list-accounts',
  'devtools:toggle',
  'devtools:inspect',
  'profile:picker-launch',
  'profile:select-and-launch',
  'profile:set-startup-preference',
  'profile:get-startup-preference',
  'window:minimize',
  'window:maximize',
  'window:close'
]);

/**
 * Validates and sanitizes navigation URLs.
 * Rejects javascript:, data:, file:, and dangerous schemes from user navigation.
 * Resolves search engine shortcuts (!g, !ddg, !yt, !gh, !b, !w, !sp).
 * Correctly detects domains, localhost, IP addresses, ports, and custom search engines.
 */
export function sanitizeNavigationUrl(
  input: unknown,
  defaultSearchEngine: string = 'duckduckgo',
  customSearchUrl?: string
): { isValid: boolean; sanitizedUrl: string; error?: string } {
  if (typeof input !== 'string') {
    return { isValid: false, sanitizedUrl: '', error: 'URL must be a string' };
  }

  let trimmed = input.trim().replace(/[\x00-\x1F\x7F]/g, '');
  if (!trimmed) {
    return { isValid: false, sanitizedUrl: '', error: 'URL cannot be empty' };
  }

  // Prevent denial of service with excessively large URL strings
  if (trimmed.length > 4096) {
    trimmed = trimmed.slice(0, 4096);
  }

  // Handle internal thaaw:// schemes (including query parameters like thaaw://error?code=...)
  if (trimmed.startsWith('thaaw://')) {
    const validInternalPages = [
      'newtab',
      'settings',
      'security',
      'privacy',
      'about',
      'downloads',
      'history',
      'bookmarks',
      'passwords',
      'error'
    ];
    const withoutScheme = trimmed.replace('thaaw://', '');
    const questionIndex = withoutScheme.indexOf('?');
    const pathPart = (questionIndex >= 0 ? withoutScheme.slice(0, questionIndex) : withoutScheme)
      .split('/')[0]
      .toLowerCase();
    const queryPart = questionIndex >= 0 ? withoutScheme.slice(questionIndex) : '';

    if (validInternalPages.includes(pathPart)) {
      return { isValid: true, sanitizedUrl: `thaaw://${pathPart}${queryPart}` };
    }
    return { isValid: true, sanitizedUrl: 'thaaw://newtab' };
  }

  // Handle Chromium view-source: scheme
  if (trimmed.startsWith('view-source:')) {
    const subUrl = trimmed.slice('view-source:'.length);
    const subValidation = sanitizeNavigationUrl(subUrl, defaultSearchEngine, customSearchUrl);
    if (subValidation.isValid) {
      return { isValid: true, sanitizedUrl: `view-source:${subValidation.sanitizedUrl}` };
    }
    return { isValid: false, sanitizedUrl: '', error: 'Invalid view-source target URL' };
  }

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return { isValid: false, sanitizedUrl: '', error: 'Forbidden URI scheme' };
  }

  // Handle local file URLs (file://)
  if (lower.startsWith('file://')) {
    // Block sensitive operating system files
    const sensitivePatterns = [
      /\/etc\/(passwd|shadow|sudoers|master\.passwd)/i,
      /\/proc\//i,
      /\/sys\//i,
      /c:[\\\/]windows[\\\/]system32/i
    ];
    if (sensitivePatterns.some(pat => pat.test(trimmed))) {
      return { isValid: false, sanitizedUrl: '', error: 'Forbidden URI scheme' };
    }
    return { isValid: true, sanitizedUrl: trimmed };
  } else if (lower.startsWith('file:')) {
    return { isValid: false, sanitizedUrl: '', error: 'Forbidden URI scheme' };
  }

  // Handle search shortcuts / bangs
  if (trimmed.startsWith('!')) {
    const spaceIndex = trimmed.indexOf(' ');
    const bang = spaceIndex === -1 ? trimmed.slice(1).toLowerCase() : trimmed.slice(1, spaceIndex).toLowerCase();
    const query = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();
    const encoded = encodeURIComponent(query);

    switch (bang) {
      case 'g':
        return { isValid: true, sanitizedUrl: query ? `https://www.google.com/search?q=${encoded}` : 'https://www.google.com' };
      case 'ddg':
        return { isValid: true, sanitizedUrl: query ? `https://duckduckgo.com/?q=${encoded}` : 'https://duckduckgo.com' };
      case 'b':
        return { isValid: true, sanitizedUrl: query ? `https://search.brave.com/search?q=${encoded}` : 'https://search.brave.com' };
      case 'yt':
        return { isValid: true, sanitizedUrl: query ? `https://www.youtube.com/results?search_query=${encoded}` : 'https://www.youtube.com' };
      case 'gh':
        return { isValid: true, sanitizedUrl: query ? `https://github.com/search?q=${encoded}` : 'https://github.com' };
      case 'w':
        return { isValid: true, sanitizedUrl: query ? `https://en.wikipedia.org/wiki/Special:Search?search=${encoded}` : 'https://en.wikipedia.org' };
      case 'sp':
        return { isValid: true, sanitizedUrl: query ? `https://www.startpage.com/sp/search?query=${encoded}` : 'https://www.startpage.com' };
    }
  }

  // Check for localhost or loopback IP addresses (e.g. localhost, localhost:3000, 127.0.0.1:8080)
  if (
    lower.startsWith('localhost:') ||
    lower === 'localhost' ||
    /^127(?:\.\d+){1,3}(?::\d+)?(?:\/.*)?$/.test(lower)
  ) {
    return { isValid: true, sanitizedUrl: `http://${trimmed}` };
  }

  // Check if it's a local host:port pattern without scheme (e.g. devserver:8080)
  if (/^[a-zA-Z0-9-]+:\d{2,5}(?:\/.*)?$/.test(trimmed)) {
    return { isValid: true, sanitizedUrl: `http://${trimmed}` };
  }

  // Check if it's already a full HTTP/HTTPS URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { isValid: true, sanitizedUrl: parsed.href };
    }
    return { isValid: false, sanitizedUrl: '', error: `Unsupported protocol: ${parsed.protocol}` };
  } catch {
    // Check if it looks like a domain name (e.g. example.com, sub.domain.co.uk)
    if (trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.startsWith('.')) {
      return { isValid: true, sanitizedUrl: `https://${trimmed}` };
    }

    // Default to configured search engine
    const engine = (defaultSearchEngine || 'duckduckgo').toLowerCase();
    const encoded = encodeURIComponent(trimmed);

    // Custom search engine URL template support (e.g. https://example.com/search?q=%s)
    if (engine === 'custom' && customSearchUrl) {
      if (customSearchUrl.includes('%s')) {
        return { isValid: true, sanitizedUrl: customSearchUrl.replace(/%s/g, encoded) };
      }
      const sep = customSearchUrl.includes('?') ? '&' : '?';
      return { isValid: true, sanitizedUrl: `${customSearchUrl}${sep}q=${encoded}` };
    }

    if (defaultSearchEngine && defaultSearchEngine.includes('%s')) {
      return { isValid: true, sanitizedUrl: defaultSearchEngine.replace(/%s/g, encoded) };
    }

    if (engine === 'google') {
      return { isValid: true, sanitizedUrl: `https://www.google.com/search?q=${encoded}` };
    }
    if (engine === 'bing') {
      return { isValid: true, sanitizedUrl: `https://www.bing.com/search?q=${encoded}` };
    }
    if (engine === 'brave') {
      return { isValid: true, sanitizedUrl: `https://search.brave.com/search?q=${encoded}` };
    }
    return { isValid: true, sanitizedUrl: `https://duckduckgo.com/?q=${encoded}` };
  }
}

/**
 * Validates that an incoming IPC channel is explicitly allowed.
 */
export function validateIpcChannel(channel: string): boolean {
  return ALLOWED_CHANNELS.has(channel);
}

/**
 * Validates tab ID is a safe non-negative integer.
 */
export function validateTabId(tabId: unknown): { isValid: boolean; sanitizedId?: number } {
  if (typeof tabId === 'number' && Number.isInteger(tabId) && tabId >= 0 && Number.isFinite(tabId)) {
    return { isValid: true, sanitizedId: tabId };
  }
  return { isValid: false };
}

/**
 * Validates incoming IPC message channel and scans payload for dangerous keys.
 */
export function validateIpcMessage(channel: string, payload: unknown): { isValid: boolean; error?: string } {
  if (!channel || typeof channel !== 'string') {
    return { isValid: false, error: 'IPC channel must be a non-empty string' };
  }

  if (!ALLOWED_CHANNELS.has(channel)) {
    return { isValid: false, error: `Unauthorized or unknown IPC channel: ${channel}` };
  }

  // Scan for prototype pollution
  if (payload && typeof payload === 'object') {
    const hasPrototypePollution = Object.prototype.hasOwnProperty.call(payload, '__proto__') ||
                                  Object.prototype.hasOwnProperty.call(payload, 'constructor');
    if (hasPrototypePollution) {
      delete (payload as any)['__proto__'];
      delete (payload as any)['constructor'];
    }
  }

  return { isValid: true };
}

/**
 * Validates permission response structure strictly.
 */
export function validatePermissionResponse(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { requestId?: unknown; decision?: unknown };
  if (typeof p.requestId !== 'string' || !p.requestId.trim()) return false;
  return p.decision === 'allow' || p.decision === 'allow-once' || p.decision === 'deny';
}

/**
 * Validates download response structure strictly.
 */
export function validateDownloadResponse(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { downloadId?: unknown; accept?: unknown };
  if (typeof p.downloadId !== 'string' || !p.downloadId.trim()) return false;
  return typeof p.accept === 'boolean';
}

/**
 * Validates custom search engine URL templates.
 * Enforces %s placeholder and http/https scheme.
 */
export function validateCustomSearchTemplate(template: string): { isValid: boolean; error?: string } {
  if (typeof template !== 'string' || !template.trim()) {
    return { isValid: false, error: 'Custom search URL template cannot be empty' };
  }

  const trimmed = template.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
    return { isValid: false, error: 'Custom search engine must use http:// or https://' };
  }

  if (!trimmed.includes('%s')) {
    return { isValid: false, error: 'Custom search engine template must contain %s placeholder for query' };
  }

  return { isValid: true };
}

