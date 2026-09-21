import { describe, it, expect } from 'vitest';
import { sanitizeNavigationUrl } from '../../browser/security/ipc-validator';

describe('Search Engine Shortcuts & Bang Routing', () => {
  it('resolves !g to Google search', () => {
    const res = sanitizeNavigationUrl('!g linux kernel security');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://www.google.com/search?q=linux%20kernel%20security');
  });

  it('resolves !ddg to DuckDuckGo search', () => {
    const res = sanitizeNavigationUrl('!ddg privacy tools');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://duckduckgo.com/?q=privacy%20tools');
  });

  it('resolves !b to Brave search', () => {
    const res = sanitizeNavigationUrl('!b electron performance');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://search.brave.com/search?q=electron%20performance');
  });

  it('resolves !yt to YouTube search', () => {
    const res = sanitizeNavigationUrl('!yt ambient sound');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://www.youtube.com/results?search_query=ambient%20sound');
  });

  it('resolves !gh to GitHub search', () => {
    const res = sanitizeNavigationUrl('!gh typescript');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://github.com/search?q=typescript');
  });

  it('resolves !w to Wikipedia search', () => {
    const res = sanitizeNavigationUrl('!w Kashmir');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://en.wikipedia.org/wiki/Special:Search?search=Kashmir');
  });

  it('resolves empty bang without query to home domain', () => {
    const res = sanitizeNavigationUrl('!g');
    expect(res.isValid).toBe(true);
    expect(res.sanitizedUrl).toBe('https://www.google.com');
  });
});
