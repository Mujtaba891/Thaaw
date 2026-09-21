/**
 * THAAW Browser — Hierarchical Bookmark Manager
 * Stores bookmarks and folders locally with import/export support.
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  parentId: string; // 'root' or folder ID
  isFolder: boolean;
  createdAt: number;
  order: number;
}

export class BookmarkManager {
  private filePath: string;
  private items: BookmarkItem[] = [];

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const userData = app?.getPath ? app.getPath('userData') : process.cwd();
      this.filePath = path.join(userData, 'thaaw_bookmarks.json');
    }
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.items = JSON.parse(raw);
      } else {
        // Initial default bookmarks
        this.items = [
          {
            id: 'bm_default_1',
            title: 'GitHub',
            url: 'https://github.com',
            parentId: 'root',
            isFolder: false,
            createdAt: Date.now(),
            order: 0
          },
          {
            id: 'bm_default_2',
            title: 'DuckDuckGo',
            url: 'https://duckduckgo.com',
            parentId: 'root',
            isFolder: false,
            createdAt: Date.now(),
            order: 1
          },
          {
            id: 'bm_default_3',
            title: 'Wikipedia',
            url: 'https://en.wikipedia.org',
            parentId: 'root',
            isFolder: false,
            createdAt: Date.now(),
            order: 2
          }
        ];
        this.save();
      }
    } catch (err) {
      console.warn('[THAAW Bookmarks] Failed to load bookmarks, initializing default:', err);
      this.items = [];
    }
  }

  private saveTimer: NodeJS.Timeout | null = null;

  public flushSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW Bookmarks] Failed to save bookmarks:', err);
    }
  }

  private save(immediate = false): void {
    if (immediate) {
      this.flushSave();
      return;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flushSave();
    }, 400);
  }

  public getBookmarks(query?: string): BookmarkItem[] {
    if (!query) {
      return [...this.items].sort((a, b) => a.order - b.order);
    }
    const q = query.toLowerCase().trim();
    return this.items.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
  }

  public isBookmarked(url: string): boolean {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return this.items.some(b => !b.isFolder && b.url.toLowerCase() === clean);
  }

  public addBookmark(title: string, url: string, parentId = 'root', isFolder = false): BookmarkItem {
    const item: BookmarkItem = {
      id: `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim() || 'Untitled',
      url: isFolder ? '' : (url.trim() || ''),
      parentId: parentId || 'root',
      isFolder,
      createdAt: Date.now(),
      order: this.items.length
    };
    this.items.push(item);
    this.save();
    return item;
  }

  public updateBookmark(id: string, patch: Partial<Pick<BookmarkItem, 'title' | 'url' | 'parentId' | 'order'>>): BookmarkItem | null {
    const item = this.items.find(i => i.id === id);
    if (!item) return null;

    if (patch.title !== undefined) item.title = patch.title.trim();
    if (patch.url !== undefined && !item.isFolder) item.url = patch.url.trim();
    if (patch.parentId !== undefined) item.parentId = patch.parentId;
    if (patch.order !== undefined) item.order = patch.order;

    this.save();
    return item;
  }

  public deleteBookmark(id: string): boolean {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) {
      // If folder, remove children too
      const removed = this.items.splice(idx, 1)[0];
      if (removed.isFolder) {
        this.items = this.items.filter(i => i.parentId !== removed.id);
      }
      this.save();
      return true;
    }
    return false;
  }

  public toggleUrlBookmark(title: string, url: string): { bookmarked: boolean; item?: BookmarkItem } {
    const cleanUrl = url.trim().toLowerCase();
    const existing = this.items.find(i => !i.isFolder && i.url.toLowerCase() === cleanUrl);
    if (existing) {
      this.deleteBookmark(existing.id);
      return { bookmarked: false };
    } else {
      const added = this.addBookmark(title || url, url);
      return { bookmarked: true, item: added };
    }
  }

  public exportNetscapeHtml(): string {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. It will be read and overwritten. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>THAAW Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
    for (const item of this.items) {
      if (item.isFolder) {
        html += `  <DT><H3>${item.title}</H3>\n  <DL><p>\n  </DL><p>\n`;
      } else {
        html += `  <DT><A HREF="${item.url}">${item.title}</A>\n`;
      }
    }
    html += `</DL><p>\n`;
    return html;
  }

  public importBookmarks(content: string, format: 'json' | 'html' = 'html'): { imported: number; errors: number } {
    if (!content || typeof content !== 'string') {
      return { imported: 0, errors: 1 };
    }

    const trimmed = content.trim();
    let imported = 0;
    let errors = 0;

    if (format === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.bookmarks) ? parsed.bookmarks : []);
        for (const item of list) {
          if (item && typeof item === 'object') {
            const title = typeof item.title === 'string' ? item.title.trim() : 'Bookmark';
            const url = typeof item.url === 'string' ? item.url.trim() : '';
            const parentId = typeof item.parentId === 'string' ? item.parentId : 'root';
            const isFolder = Boolean(item.isFolder);
            if (url || isFolder) {
              this.addBookmark(title, url, parentId, isFolder);
              imported++;
            }
          }
        }
        return { imported, errors };
      } catch (_e) {
        // Fall back to HTML parsing if JSON parse fails
      }
    }

    // Parse Netscape HTML Bookmark format
    try {
      const linkRegex = /<A\s+[^>]*HREF=["']([^"']+)["'][^>]*>([^<]*)<\/A>/gi;
      let match: RegExpExecArray | null;
      while ((match = linkRegex.exec(content)) !== null) {
        const rawUrl = match[1]?.trim();
        const rawTitle = match[2]?.trim() || rawUrl;
        if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('thaaw://'))) {
          this.addBookmark(rawTitle, rawUrl);
          imported++;
        }
      }
    } catch (_e) {
      errors++;
    }

    return { imported, errors };
  }
}

