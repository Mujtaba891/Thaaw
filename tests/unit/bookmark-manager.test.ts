import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { BookmarkManager } from '../../browser/main/bookmark-manager';

describe('BookmarkManager (Hierarchical Storage & Import/Export)', () => {
  let tmpDir: string;
  let testFilePath: string;
  let manager: BookmarkManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaaw-bm-test-'));
    testFilePath = path.join(tmpDir, 'test_bookmarks.json');
    manager = new BookmarkManager(testFilePath);
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should initialize with default bookmarks if file does not exist', () => {
    const bookmarks = manager.getBookmarks();
    expect(bookmarks.length).toBeGreaterThan(0);
    expect(bookmarks.some(b => b.title === 'DuckDuckGo')).toBe(true);
  });

  it('should add a bookmark and persist to disk', () => {
    const item = manager.addBookmark('Rust Lang', 'https://www.rust-lang.org');
    expect(item.title).toBe('Rust Lang');
    expect(item.url).toBe('https://www.rust-lang.org');
    expect(item.isFolder).toBe(false);

    manager.flushSave();
    const diskContent = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    expect(diskContent.some((b: any) => b.url === 'https://www.rust-lang.org')).toBe(true);
  });

  it('should add a folder and support nested children', () => {
    const folder = manager.addBookmark('Development', '', 'root', true);
    expect(folder.isFolder).toBe(true);

    const child = manager.addBookmark('MDN Web Docs', 'https://developer.mozilla.org', folder.id, false);
    expect(child.parentId).toBe(folder.id);

    const all = manager.getBookmarks();
    expect(all.some(b => b.id === folder.id)).toBe(true);
    expect(all.some(b => b.id === child.id)).toBe(true);
  });

  it('should delete a folder and all of its nested children', () => {
    const folder = manager.addBookmark('Temporary', '', 'root', true);
    const child1 = manager.addBookmark('Site 1', 'https://site1.example.com', folder.id);
    const child2 = manager.addBookmark('Site 2', 'https://site2.example.com', folder.id);

    expect(manager.getBookmarks().some(b => b.id === child1.id)).toBe(true);

    const deleted = manager.deleteBookmark(folder.id);
    expect(deleted).toBe(true);

    const remaining = manager.getBookmarks();
    expect(remaining.some(b => b.id === folder.id)).toBe(false);
    expect(remaining.some(b => b.id === child1.id)).toBe(false);
    expect(remaining.some(b => b.id === child2.id)).toBe(false);
  });

  it('should toggle bookmarks on and off', () => {
    const url = 'https://archlinux.org';
    const first = manager.toggleUrlBookmark('Arch Linux', url);
    expect(first.bookmarked).toBe(true);
    expect(manager.isBookmarked(url)).toBe(true);

    const second = manager.toggleUrlBookmark('Arch Linux', url);
    expect(second.bookmarked).toBe(false);
    expect(manager.isBookmarked(url)).toBe(false);
  });

  it('should export bookmarks to Netscape HTML format', () => {
    manager.addBookmark('Kernel Org', 'https://www.kernel.org');
    const html = manager.exportNetscapeHtml();
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('https://www.kernel.org');
    expect(html).toContain('Kernel Org');
  });

  it('should import bookmarks from Netscape HTML format', () => {
    const netscapeHtml = `
      <!DOCTYPE NETSCAPE-Bookmark-file-1>
      <TITLE>Bookmarks</TITLE>
      <H1>Bookmarks</H1>
      <DL><p>
        <DT><A HREF="https://alpinelinux.org">Alpine Linux</A>
        <DT><A HREF="https://kernel.org">The Linux Kernel</A>
      </DL><p>
    `;

    const result = manager.importBookmarks(netscapeHtml, 'html');
    expect(result.imported).toBe(2);
    expect(result.errors).toBe(0);

    expect(manager.isBookmarked('https://alpinelinux.org')).toBe(true);
    expect(manager.isBookmarked('https://kernel.org')).toBe(true);
  });

  it('should import bookmarks from JSON format', () => {
    const jsonStr = JSON.stringify([
      { title: 'Debian', url: 'https://debian.org', parentId: 'root', isFolder: false },
      { title: 'Void Linux', url: 'https://voidlinux.org', parentId: 'root', isFolder: false }
    ]);

    const result = manager.importBookmarks(jsonStr, 'json');
    expect(result.imported).toBe(2);
    expect(result.errors).toBe(0);

    expect(manager.isBookmarked('https://debian.org')).toBe(true);
    expect(manager.isBookmarked('https://voidlinux.org')).toBe(true);
  });

  it('should gracefully handle empty or invalid bookmark import data', () => {
    const res1 = manager.importBookmarks('', 'html');
    expect(res1.imported).toBe(0);
    expect(res1.errors).toBe(1);

    const res2 = manager.importBookmarks('{"invalid: json', 'json');
    expect(res2.imported).toBe(0);
  });
});
