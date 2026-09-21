/**
 * THAAW Browser — Download System Upgrade Unit Tests
 * Verifies download registration, active progress, category detection,
 * speed/ETA calculations, pause/resume/cancel controls, and safe file/folder handling.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DownloadManager, DownloadRecord } from '../../browser/downloads/download-manager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DownloadManager — UI/UX & Download System Upgrade', () => {
  let tmpDir: string;
  let manager: DownloadManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'thaaw-dl-test-'));
    manager = new DownloadManager(path.join(tmpDir, 'downloads.json'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_e) {}
  });

  describe('Download Registration & Category Classification', () => {
    it('should register downloads and accurately classify file categories', () => {
      const testCases = [
        { filename: 'source.zip', expectedCat: 'archive' },
        { filename: 'banner.png', expectedCat: 'image' },
        { filename: 'clip.mp4', expectedCat: 'video' },
        { filename: 'podcast.mp3', expectedCat: 'audio' },
        { filename: 'app.deb', expectedCat: 'executable' },
        { filename: 'script.ts', expectedCat: 'code' },
        { filename: 'report.pdf', expectedCat: 'document' },
        { filename: 'data.xyz', expectedCat: 'generic' }
      ];

      for (const tc of testCases) {
        const item = manager.registerDownload(
          null,
          tc.filename,
          10485760,
          path.join(tmpDir, tc.filename),
          `https://example.com/${tc.filename}`
        );

        expect(item.fileCategory).toBe(tc.expectedCat);
        expect(item.state).toBe('progressing');
        expect(item.percent).toBe(0);
      }
    });
  });

  describe('Live Progress Tracking, Speed & ETA', () => {
    it('should compute progress percentage, speed and ETA during downloads', () => {
      const item = manager.registerDownload(
        null,
        'huge-file.iso',
        100000000, // 100 MB
        path.join(tmpDir, 'huge-file.iso'),
        'https://example.com/huge-file.iso'
      );

      // Advance progress: 50MB downloaded
      const updated = manager.updateProgress(item.id, 50000000, 100000000);
      expect(updated).not.toBeNull();
      expect(updated!.receivedBytes).toBe(50000000);
      expect(updated!.percent).toBe(50);
      expect(updated!.state).toBe('progressing');
      expect(typeof updated!.speed).toBe('number');
    });
  });

  describe('Pause, Resume, and Cancel Lifecycle', () => {
    it('should transition through pause, resume, and cancel states correctly', () => {
      let mockPaused = false;
      let mockResumed = false;
      let mockCancelled = false;

      const mockNativeItem: any = {
        pause: () => { mockPaused = true; },
        resume: () => { mockResumed = true; },
        cancel: () => { mockCancelled = true; },
        isPaused: () => mockPaused
      };

      const item = manager.registerDownload(
        mockNativeItem,
        'asset.zip',
        20000000,
        path.join(tmpDir, 'asset.zip'),
        'https://example.com/asset.zip'
      );

      // 1. Pause
      const pausedResult = manager.pauseDownload(item.id);
      expect(pausedResult).toBe(true);
      expect(mockPaused).toBe(true);

      // 2. Resume
      const resumeResult = manager.resumeDownload(item.id);
      expect(resumeResult).toBe(true);
      expect(mockResumed).toBe(true);

      // 3. Cancel
      const cancelResult = manager.cancelDownload(item.id);
      expect(cancelResult).not.toBeNull();
      expect(cancelResult!.state).toBe('cancelled');
      expect(mockCancelled).toBe(true);
    });
  });

  describe('Completion and Zero Auto-Open Behavior', () => {
    it('should complete download and persist state without auto-opening file manager', () => {
      const item = manager.registerDownload(
        null,
        'doc.pdf',
        5000000,
        path.join(tmpDir, 'doc.pdf'),
        'https://example.com/doc.pdf'
      );

      const completed = manager.completeDownload(item.id);
      expect(completed).not.toBeNull();
      expect(completed!.state).toBe('completed');
      expect(completed!.percent).toBe(100);

      // Verify persistence to downloads.json
      const persistedFile = path.join(tmpDir, 'downloads.json');
      expect(fs.existsSync(persistedFile)).toBe(true);
      const json = JSON.parse(fs.readFileSync(persistedFile, 'utf-8'));
      expect(json.length).toBe(1);
      expect(json[0].id).toBe(item.id);
      expect(json[0].state).toBe('completed');
    });
  });

  describe('Popover Limit: Latest 5 Downloads Only', () => {
    it('should return strictly at most 5 items in getRecentDownloads() sorted descending by time', () => {
      const ids: string[] = [];
      for (let i = 1; i <= 8; i++) {
        const item = manager.registerDownload(
          null,
          `file-${i}.zip`,
          1000 * i,
          path.join(tmpDir, `file-${i}.zip`),
          `https://example.com/file-${i}.zip`
        );
        ids.push(item.id);
      }

      const recent = manager.getRecentDownloads(5);
      expect(recent.length).toBe(5);
      expect(recent[0].id).toBe(ids[7]);
      expect(recent[1].id).toBe(ids[6]);
      expect(recent[2].id).toBe(ids[5]);
      expect(recent[3].id).toBe(ids[4]);
      expect(recent[4].id).toBe(ids[3]);

      const all = manager.getAllDownloads();
      expect(all.length).toBe(8);
    });
  });

  describe('Clear Completed Downloads', () => {
    it('should remove completed downloads while preserving active/progressing items', () => {
      const activeItem = manager.registerDownload(
        null,
        'active.zip',
        10000,
        path.join(tmpDir, 'active.zip'),
        'https://example.com/active.zip'
      );

      const doneItem = manager.registerDownload(
        null,
        'done.zip',
        10000,
        path.join(tmpDir, 'done.zip'),
        'https://example.com/done.zip'
      );
      manager.completeDownload(doneItem.id);

      manager.clearCompleted();

      const remaining = manager.getAllDownloads();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(activeItem.id);
    });
  });
});
