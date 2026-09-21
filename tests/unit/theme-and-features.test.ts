import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('THAAW Browser Themes, Wallpapers & Functionality Verification', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const presetsPath = path.join(rootDir, 'assets/themes/theme-presets.json');
  const wallpapersJsonPath = path.join(rootDir, 'assets/wallpapers/wallpapers.json');
  const wallpapersDir = path.join(rootDir, 'assets/wallpapers');
  const thumbsDir = path.join(rootDir, 'assets/wallpapers/thumbs');
  const faviconsDir = path.join(rootDir, 'assets/favicons');

  describe('Theme Presets (4 Dark + 4 Light)', () => {
    it('verifies theme-presets.json exists and contains exactly 4 dark and 4 light presets', () => {
      expect(fs.existsSync(presetsPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));

      expect(data.dark).toBeDefined();
      expect(data.light).toBeDefined();
      expect(data.dark.length).toBe(4);
      expect(data.light.length).toBe(4);

      // Dark presets
      const darkIds = data.dark.map((p: any) => p.id);
      expect(darkIds).toContain('midnight');
      expect(darkIds).toContain('deep-space');
      expect(darkIds).toContain('obsidian');
      expect(darkIds).toContain('eclipse');

      // Light presets
      const lightIds = data.light.map((p: any) => p.id);
      expect(lightIds).toContain('white');
      expect(lightIds).toContain('frost');
      expect(lightIds).toContain('pearl');
      expect(lightIds).toContain('cloud');
    });

    it('verifies tokens.css defines all preset tokens and selectors', () => {
      const tokensCss = fs.readFileSync(path.join(rootDir, 'browser/ui/theme/tokens.css'), 'utf8');
      expect(tokensCss).toContain('[data-theme-preset="midnight"]');
      expect(tokensCss).toContain('[data-theme-preset="deep-space"]');
      expect(tokensCss).toContain('[data-theme-preset="obsidian"]');
      expect(tokensCss).toContain('[data-theme-preset="eclipse"]');
      expect(tokensCss).toContain('[data-theme-preset="white"]');
      expect(tokensCss).toContain('[data-theme-preset="frost"]');
      expect(tokensCss).toContain('[data-theme-preset="pearl"]');
      expect(tokensCss).toContain('[data-theme-preset="cloud"]');
    });
  });

  describe('30 Wallpapers System (15 Dark + 15 Light)', () => {
    it('verifies wallpapers.json registers exactly 30 wallpapers (15 dark + 15 light)', () => {
      expect(fs.existsSync(wallpapersJsonPath)).toBe(true);
      const list = JSON.parse(fs.readFileSync(wallpapersJsonPath, 'utf8'));
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(30);

      const darkList = list.filter((wp: any) => wp.mode === 'dark');
      const lightList = list.filter((wp: any) => wp.mode === 'light');
      expect(darkList.length).toBe(15);
      expect(lightList.length).toBe(15);
    });

    it('verifies all 30 wallpaper WebP files and their thumbnails exist on disk', () => {
      const list = JSON.parse(fs.readFileSync(wallpapersJsonPath, 'utf8'));
      list.forEach((wp: { id: string; filename: string; thumb?: string; thumbnail?: string }) => {
        const fullPath = path.join(wallpapersDir, wp.filename);
        const thumbFilename = wp.thumb || wp.thumbnail || '';
        const thumbPath = path.join(wallpapersDir, thumbFilename);

        expect(fs.existsSync(fullPath)).toBe(true);
        expect(fs.existsSync(thumbPath)).toBe(true);

        const statFull = fs.statSync(fullPath);
        const statThumb = fs.statSync(thumbPath);
        expect(statFull.size).toBeGreaterThan(1000);
        expect(statThumb.size).toBeGreaterThan(100);
      });
    });
  });

  describe('Centralized Favicon Assets', () => {
    it('verifies bundled brand SVG favicons exist in assets/favicons', () => {
      const expectedSvgs = [
        'github.svg',
        'youtube.svg',
        'gmail.svg',
        'chatgpt.svg',
        'duckduckgo.svg',
        'wikipedia.svg',
        'google.svg',
        'reddit.svg',
        'x.svg',
        'linkedin.svg'
      ];

      expectedSvgs.forEach(svgName => {
        const svgPath = path.join(faviconsDir, svgName);
        expect(fs.existsSync(svgPath)).toBe(true);
        const content = fs.readFileSync(svgPath, 'utf8');
        expect(content).toContain('<svg');
      });
    });
  });

  describe('Zero Emojis in JSON configurations', () => {
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    [presetsPath, wallpapersJsonPath].forEach(filePath => {
      it(`verifies ${path.basename(filePath)} contains zero emojis`, () => {
        const text = fs.readFileSync(filePath, 'utf8');
        expect(text.match(emojiRegex)).toBeNull();
      });
    });
  });
});
