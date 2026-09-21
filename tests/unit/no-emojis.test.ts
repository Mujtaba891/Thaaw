import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Zero Emojis Mandate Verification', () => {
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  const targetFiles = [
    'browser/ui/index.html',
    'browser/ui/renderer.ts',
    'browser/internal-pages/newtab.html',
    'browser/internal-pages/settings.html',
    'browser/internal-pages/privacy.html',
    'browser/internal-pages/security.html',
    'browser/internal-pages/about.html',
    'browser/internal-pages/downloads.html',
    'browser/internal-pages/history.html',
    'browser/internal-pages/bookmarks.html',
    'browser/internal-pages/passwords.html',
    'browser/internal-pages/favicon-resolver.js',
    'browser/profiles/profile-picker.html',
    'browser/internal-pages/error.html'
  ];

  targetFiles.forEach((relPath) => {
    it(`verifies ${relPath} contains zero emojis`, () => {
      const fullPath = path.resolve(__dirname, '../../', relPath);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(emojiRegex);
      if (match) {
        throw new Error(`Found disallowed emoji "${match[0]}" in file ${relPath}`);
      }
      expect(match).toBeNull();
    });
  });
});
