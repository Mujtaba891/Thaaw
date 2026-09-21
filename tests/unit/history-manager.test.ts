import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { HistoryManager } from '../../browser/main/history-manager';

describe('HistoryManager (Private Local History & Range Clearing)', () => {
  let tmpDir: string;
  let testFilePath: string;
  let manager: HistoryManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaaw-hist-test-'));
    testFilePath = path.join(tmpDir, 'test_history.json');
    manager = new HistoryManager(testFilePath);
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should ignore internal thaaw:// and about: URLs from history persistence', () => {
    manager.addEntry('thaaw://settings', 'Settings');
    manager.addEntry('about:blank', 'Blank');
    const list = manager.getEntries();
    expect(list.length).toBe(0);
  });

  it('should record external visits and persist them to disk', () => {
    const entry = manager.addEntry('https://eff.org', 'Electronic Frontier Foundation');
    expect(entry.url).toBe('https://eff.org');
    expect(entry.visitCount).toBe(1);

    manager.flushSave();
    const disk = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    expect(disk.some((h: any) => h.url === 'https://eff.org')).toBe(true);
  });

  it('should deduplicate URLs and increment visit count', () => {
    manager.addEntry('https://gnu.org', 'GNU Project');
    const updated = manager.addEntry('https://gnu.org', 'GNU Operating System');
    expect(updated.visitCount).toBe(2);
    expect(updated.title).toBe('GNU Operating System');

    const entries = manager.getEntries();
    expect(entries.filter(e => e.url === 'https://gnu.org').length).toBe(1);
  });

  it('should delete a history item by ID', () => {
    const item = manager.addEntry('https://fsf.org', 'Free Software Foundation');
    expect(manager.getEntries().length).toBe(1);

    const deleted = manager.deleteItem(item.id);
    expect(deleted).toBe(true);
    expect(manager.getEntries().length).toBe(0);
  });

  it('should clear entries within a given time range', () => {
    const now = Date.now();
    // Add item with current timestamp
    manager.addEntry('https://recent.org', 'Recent Visit');

    // Simulate an older item
    const entries = manager.getEntries();
    if (entries[0]) {
      entries[0].timestamp = now - 50000; // 50 seconds ago
    }

    // Add another item
    const fresh = manager.addEntry('https://fresh.org', 'Fresh Visit');

    // Clear range since 20 seconds ago -> should remove fresh, keep older
    const removedCount = manager.clearRange(now - 20000);
    expect(removedCount).toBe(1);

    const remaining = manager.getEntries();
    expect(remaining.some(e => e.url === 'https://recent.org')).toBe(true);
    expect(remaining.some(e => e.url === 'https://fresh.org')).toBe(false);
  });

  it('should clear all history records', () => {
    manager.addEntry('https://site1.com', 'Site 1');
    manager.addEntry('https://site2.com', 'Site 2');
    expect(manager.getEntries().length).toBe(2);

    manager.clearAll();
    expect(manager.getEntries().length).toBe(0);
  });
});
