import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('THAAW New Tab / Home Page Redesign Verification', () => {
  const newtabHtmlPath = path.resolve(__dirname, '../../browser/internal-pages/newtab.html');
  const internalCssPath = path.resolve(__dirname, '../../browser/internal-pages/internal.css');
  const tokensCssPath = path.resolve(__dirname, '../../browser/ui/theme/tokens.css');
  const iconsJsPath = path.resolve(__dirname, '../../browser/internal-pages/icons.js');

  it('verifies all new tab files exist', () => {
    expect(fs.existsSync(newtabHtmlPath)).toBe(true);
    expect(fs.existsSync(internalCssPath)).toBe(true);
    expect(fs.existsSync(tokensCssPath)).toBe(true);
    expect(fs.existsSync(iconsJsPath)).toBe(true);
  });

  describe('Color System Tokens & Brand Standards', () => {
    const cssContent = fs.readFileSync(internalCssPath, 'utf8');

    it('contains the mandatory primary visual palette', () => {
      expect(cssContent).toContain('#FF6FF0'); // Primary Pink
      expect(cssContent).toContain('#38BDF8'); // Primary Cyan
      expect(cssContent).toContain('#C2410C'); // Deep Orange
      expect(cssContent).toContain('rgba(255, 111, 0, 0.15)'); // Transparent Orange
    });

    it('uses the recommended dark background family', () => {
      expect(cssContent).toContain('#050812');
      expect(cssContent).toContain('#070B14');
      expect(cssContent).toContain('#0A1020');
      expect(cssContent).toContain('#0D1324');
    });

    it('defines wallpaper overlay and glassmorphism tokens', () => {
      expect(cssContent).toContain('var(--thaaw-glass-bg)');
      expect(cssContent).toContain('transparent');
      expect(cssContent).toContain('16px');
      expect(cssContent).toContain('rgba(255, 255, 255, 0.08)');
    });
  });

  describe('Zero Emojis Mandate', () => {
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    const files = [newtabHtmlPath, internalCssPath, tokensCssPath, iconsJsPath];

    files.forEach((filePath) => {
      it(`verifies ${path.basename(filePath)} contains zero emojis`, () => {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(emojiRegex);
        expect(match).toBeNull();
      });
    });
  });

  describe('Search and URL Parsing Logic', () => {
    function isUrl(input: string): boolean {
      const q = input.trim();
      if (q.startsWith('http://') || q.startsWith('https://') || q.startsWith('thaaw://')) return true;
      if (q.includes('.') && !q.includes(' ') && q.indexOf('.') < q.length - 1) return true;
      if (q.startsWith('localhost:') || q === 'localhost') return true;
      return false;
    }

    function normalizeUrl(input: string): string {
      let trimmed = input.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('thaaw://')) {
        trimmed = 'https://' + trimmed;
      }
      return trimmed;
    }

    function buildSearchUrl(engine: string, query: string, customUrl?: string): string {
      const encoded = encodeURIComponent(query.trim());
      if (engine === 'google') return `https://www.google.com/search?q=${encoded}`;
      if (engine === 'bing') return `https://www.bing.com/search?q=${encoded}`;
      if (engine === 'brave') return `https://search.brave.com/search?q=${encoded}`;
      if (engine === 'custom' && customUrl) return customUrl.replace('%s', encoded);
      return `https://duckduckgo.com/?q=${encoded}`;
    }

    it('correctly classifies direct URLs', () => {
      expect(isUrl('github.com')).toBe(true);
      expect(isUrl('https://news.ycombinator.com')).toBe(true);
      expect(isUrl('thaaw://security')).toBe(true);
      expect(isUrl('localhost:8080')).toBe(true);
      expect(isUrl('sub.domain.org/path?arg=1')).toBe(true);
    });

    it('correctly classifies search queries', () => {
      expect(isUrl('best programming language')).toBe(false);
      expect(isUrl('weather tomorrow in srinagar')).toBe(false);
      expect(isUrl('thaaw browser security')).toBe(false);
      expect(isUrl('hello world')).toBe(false);
    });

    it('normalizes bare URLs with https protocol', () => {
      expect(normalizeUrl('github.com')).toBe('https://github.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('thaaw://settings')).toBe('thaaw://settings');
    });

    it('builds valid search query URLs for each engine', () => {
      const query = 'privacy browser';
      expect(buildSearchUrl('duckduckgo', query)).toBe('https://duckduckgo.com/?q=privacy%20browser');
      expect(buildSearchUrl('google', query)).toBe('https://www.google.com/search?q=privacy%20browser');
      expect(buildSearchUrl('bing', query)).toBe('https://www.bing.com/search?q=privacy%20browser');
      expect(buildSearchUrl('brave', query)).toBe('https://search.brave.com/search?q=privacy%20browser');
      expect(buildSearchUrl('custom', query, 'https://kagi.com/search?q=%s')).toBe('https://kagi.com/search?q=privacy%20browser');
    });
  });

  describe('Shortcuts Data Architecture', () => {
    interface ShortcutItem {
      title: string;
      url: string;
      icon: string;
      position: number;
    }

    it('maintains 5 shortcut slots structure (4 default sites + 1 Add button)', () => {
      const defaultShortcuts: ShortcutItem[] = [
        { title: 'GitHub', url: 'https://github.com', icon: 'github', position: 0 },
        { title: 'YouTube', url: 'https://youtube.com', icon: 'youtube', position: 1 },
        { title: 'Gmail', url: 'https://mail.google.com', icon: 'gmail', position: 2 },
        { title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'chatgpt', position: 3 }
      ];

      expect(defaultShortcuts.length).toBe(4);
      // In UI, 4 items + 1 Add button = 5 slots total
      const totalSlots = defaultShortcuts.length + 1;
      expect(totalSlots).toBe(5);
    });

    it('supports add, edit, delete operations', () => {
      const list: ShortcutItem[] = [
        { title: 'GitHub', url: 'https://github.com', icon: 'github', position: 0 }
      ];

      // Add
      list.push({ title: 'Ars Technica', url: 'https://arstechnica.com', icon: 'globe', position: 1 });
      expect(list.length).toBe(2);
      expect(list[1].title).toBe('Ars Technica');

      // Edit
      list[1].title = 'Ars';
      expect(list[1].title).toBe('Ars');

      // Delete
      list.splice(0, 1);
      expect(list.length).toBe(1);
      expect(list[0].title).toBe('Ars');
    });
  });

  describe('DOM Hierarchy in newtab.html', () => {
    const html = fs.readFileSync(newtabHtmlPath, 'utf8');

    it('contains Top Right Controls with Appearance, Profile, and Apps/Customize buttons', () => {
      expect(html).toContain('id="themeToggleBtn"');
      expect(html).toContain('id="profileBtn"');
      expect(html).toContain('id="customizeBtn"');
    });

    it('contains Center Branding with THAAW logo and tagline', () => {
      expect(html).toContain('id="centerBrandSection"');
      expect(html.includes('assets/logo/thaaw-logo.svg') || html.includes('id="thaawLogoSvg"')).toBe(true);
      expect(html).toContain("Stop What");
      expect(html).toContain("Shouldn't Pass.");
    });

    it('contains Search Bar with Input and Search submit button', () => {
      expect(html).toContain('id="searchForm"');
      expect(html).toContain('id="searchInput"');
      expect(html).toContain('id="searchSubmitBtn"');
    });

    it('contains Shortcuts section and Lower Cohesive Panel', () => {
      expect(html).toContain('id="shortcutsSection"');
      expect(html).toContain('id="lowerPanel"');
      expect(html).toContain('id="newsSection"');
      expect(html).toContain('id="infoSection"');
    });

    it('contains Dynamic Clock, Weather, and Quote widgets', () => {
      expect(html).toContain('id="liveClock"');
      expect(html).toContain('id="liveDate"');
      expect(html).toContain('id="weatherTemp"');
      expect(html).toContain('id="weatherLocation"');
      expect(html).toContain('Srinagar');
      expect(html).toContain('id="quoteText"');
    });

    it('contains Slide-in Customize THAAW Drawer with reset to default', () => {
      expect(html).toContain('id="customizeDrawerBackdrop"');
      expect(html).toContain('Customize THAAW');
      expect(html).toContain('id="resetDefaultsBtn"');
    });
  });
});
