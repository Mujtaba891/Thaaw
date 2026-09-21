/**
 * THAAW Browser — Local Browsing History Manager
 * Privacy-first, device-only history persistence. Zero external telemetry.
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  visitCount: number;
}

export class HistoryManager {
  private filePath: string;
  private items: HistoryItem[] = [];
  private searches: string[] = [];
  private searchFilePath: string;
  private isLoaded = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const userData = app?.getPath ? app.getPath('userData') : process.cwd();
      this.filePath = path.join(userData, 'thaaw_history.json');
    }
    this.searchFilePath = path.join(
      path.dirname(this.filePath),
      path.basename(this.filePath).replace(/\.json$/, '_searches.json')
    );
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.items = JSON.parse(raw);
      } else {
        this.items = [];
      }
      if (fs.existsSync(this.searchFilePath)) {
        const rawSearches = fs.readFileSync(this.searchFilePath, 'utf8');
        this.searches = JSON.parse(rawSearches);
      } else {
        this.searches = [];
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('[THAAW History] Failed to read history file, resetting:', err);
      this.items = [];
      this.searches = [];
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
      fs.writeFileSync(this.searchFilePath, JSON.stringify(this.searches, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW History] Failed to write history file:', err);
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

  public addEntry(url: string, title?: string): HistoryItem {
    if (!url || url.startsWith('thaaw://') || url.startsWith('about:')) {
      return { id: '', url, title: title || '', timestamp: Date.now(), visitCount: 1 };
    }

    const cleanUrl = url.trim();

    // Automatically capture searches from known search engine queries
    try {
      if (cleanUrl.includes('duckduckgo.com/?q=') ||
          cleanUrl.includes('google.com/search?') ||
          cleanUrl.includes('bing.com/search?') ||
          cleanUrl.includes('search.brave.com/search?')) {
        const u = new URL(cleanUrl);
        const q = u.searchParams.get('q');
        if (q && q.trim()) {
          this.addSearchQuery(q.trim());
        }
      }
    } catch {}

    const existingIndex = this.items.findIndex(i => i.url === cleanUrl);

    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      existing.title = title || existing.title;
      existing.timestamp = Date.now();
      existing.visitCount = (existing.visitCount || 1) + 1;
      // Move to top
      this.items.splice(existingIndex, 1);
      this.items.unshift(existing);
      this.save();
      return existing;
    }

    const newItem: HistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url: cleanUrl,
      title: title || cleanUrl,
      timestamp: Date.now(),
      visitCount: 1
    };

    this.items.unshift(newItem);
    // Retain up to 5,000 entries
    if (this.items.length > 5000) {
      this.items.pop();
    }
    this.save();
    return newItem;
  }

  public addSearchQuery(query: string): void {
    if (!query || typeof query !== 'string') return;
    const clean = query.trim();
    if (!clean) return;

    const existingIndex = this.searches.findIndex(s => s.toLowerCase() === clean.toLowerCase());
    if (existingIndex >= 0) {
      this.searches.splice(existingIndex, 1);
    }
    this.searches.unshift(clean);
    if (this.searches.length > 100) {
      this.searches.pop();
    }
    this.save();
  }

  public getRecentSearches(limit = 10): string[] {
    return this.searches.slice(0, Math.max(1, limit));
  }

  public deleteSearchQuery(query: string): boolean {
    if (!query) return false;
    const clean = query.trim().toLowerCase();
    const idx = this.searches.findIndex(s => s.toLowerCase() === clean);
    if (idx >= 0) {
      this.searches.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public clearSearchHistory(): void {
    this.searches = [];
    this.save();
  }

  public getEntries(query?: string, limit = 200): HistoryItem[] {
    if (!query) {
      return this.items.slice(0, limit);
    }
    const q = query.toLowerCase().trim();
    return this.items
      .filter(i => (i.title && i.title.toLowerCase().includes(q)) || i.url.toLowerCase().includes(q))
      .slice(0, limit);
  }

  public deleteItem(id: string): boolean {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public clearRange(sinceTimestamp: number): number {
    const initial = this.items.length;
    this.items = this.items.filter(i => i.timestamp < sinceTimestamp);
    this.save();
    return initial - this.items.length;
  }

  public clearAll(): void {
    this.items = [];
    this.searches = [];
    this.save();
  }
}
