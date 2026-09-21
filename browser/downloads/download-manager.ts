/**
 * THAAW Browser — Download Subsystem & Security Engine
 * Real-time download management, threat inspection, and progress tracking.
 * Principle: Browser-native download lifecycle; never automatically launch the OS file manager.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';

export type DownloadRiskLevel = 'safe' | 'caution' | 'dangerous';
export type DownloadState = 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';

export interface DownloadInspectionResult {
  filename: string;
  extension: string;
  riskLevel: DownloadRiskLevel;
  mimeType?: string;
  reasons: string[];
  requiresUserConfirmation: boolean;
}

export interface DownloadRecord {
  id: string;
  filename: string;
  savePath: string;
  url: string;
  mimeType?: string;
  fileCategory: 'archive' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'executable' | 'generic';
  state: DownloadState;
  receivedBytes: number;
  totalBytes: number;
  percent: number;
  speed: number; // bytes per second
  estimatedSecondsRemaining: number;
  startTime: number;
  endTime?: number;
  canResume: boolean;
  isPaused: boolean;
  error?: string;
}

export class DownloadManager {
  // High-risk executable and script extensions
  private static readonly DANGEROUS_EXTENSIONS = new Set<string>([
    '.exe',
    '.sh',
    '.bin',
    '.elf',
    '.deb',
    '.rpm',
    '.appimage',
    '.bat',
    '.cmd',
    '.ps1',
    '.vbs',
    '.msi',
    '.apk',
    '.jar'
  ]);

  // Cautionary archive / script containers
  private static readonly CAUTION_EXTENSIONS = new Set<string>([
    '.zip',
    '.tar',
    '.gz',
    '.bz2',
    '.7z',
    '.iso',
    '.dmg',
    '.scr'
  ]);

  private storageFile: string;
  private downloads: DownloadRecord[] = [];
  private activeItems = new Map<string, {
    item?: any;
    record: DownloadRecord;
    lastBytes: number;
    lastTime: number;
    speedSamples: number[];
  }>();

  constructor(customStoragePath?: string) {
    const baseDir = customStoragePath ? path.dirname(customStoragePath) : path.join(os.homedir(), '.config', 'thaaw');
    this.storageFile = customStoragePath || path.join(baseDir, 'downloads.json');

    this.ensureDir(path.dirname(this.storageFile));
    this.loadPersistedDownloads();
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch {
        // Ignored
      }
    }
  }

  private loadPersistedDownloads(): void {
    if (!fs.existsSync(this.storageFile)) return;
    try {
      const data = fs.readFileSync(this.storageFile, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.downloads = parsed.map(item => ({
          ...item,
          // If browser restarted during download, mark as interrupted
          state: item.state === 'progressing' || item.state === 'paused' ? 'interrupted' : item.state
        }));
      }
    } catch {
      this.downloads = [];
    }
  }

  private persistDownloads(): void {
    try {
      // Persist latest 100 records
      const serialized = JSON.stringify(this.downloads.slice(0, 100), null, 2);
      fs.writeFileSync(this.storageFile, serialized, 'utf8');
    } catch {
      // Ignored
    }
  }

  public static classifyFileCategory(filename: string): DownloadRecord['fileCategory'] {
    const ext = path.extname(filename).toLowerCase();
    if (['.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz', '.iso', '.dmg'].includes(ext)) {
      return 'archive';
    }
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.avif'].includes(ext)) {
      return 'image';
    }
    if (['.mp4', '.mkv', '.webm', '.avi', '.mov', '.wmv', '.flv'].includes(ext)) {
      return 'video';
    }
    if (['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.opus'].includes(ext)) {
      return 'audio';
    }
    if (['.pdf', '.docx', '.doc', '.xlsx', '.pptx', '.txt', '.md', '.rtf', '.csv'].includes(ext)) {
      return 'document';
    }
    if (['.js', '.ts', '.html', '.css', '.json', '.py', '.rs', '.go', '.c', '.cpp', '.java', '.xml', '.yml', '.yaml'].includes(ext)) {
      return 'code';
    }
    if (DownloadManager.DANGEROUS_EXTENSIONS.has(ext)) {
      return 'executable';
    }
    return 'generic';
  }

  /**
   * Inspects a pending download item and classifies risk.
   */
  public inspectDownload(filename: string, mimeType?: string, originUrl?: string): DownloadInspectionResult {
    const ext = path.extname(filename).toLowerCase();
    const reasons: string[] = [];
    let riskLevel: DownloadRiskLevel = 'safe';

    // 1. Check dangerous extension list
    if (DownloadManager.DANGEROUS_EXTENSIONS.has(ext)) {
      riskLevel = 'dangerous';
      reasons.push(`Executable or script file (${ext}) can run arbitrary code on your system.`);
    } else if (DownloadManager.CAUTION_EXTENSIONS.has(ext)) {
      riskLevel = 'caution';
      reasons.push(`Archive or container file (${ext}) may contain unverified contents.`);
    }

    // 2. MIME type mismatch check
    if (mimeType) {
      const lowerMime = mimeType.toLowerCase();
      if (
        (lowerMime.includes('application/x-msdos-program') ||
         lowerMime.includes('application/x-sh') ||
         lowerMime.includes('application/x-executable')) &&
        riskLevel === 'safe'
      ) {
        riskLevel = 'dangerous';
        reasons.push(`MIME type mismatch: Server indicates executable payload (${mimeType}) despite extension.`);
      }
    }

    // 3. Origin check
    if (originUrl && !originUrl.startsWith('https://')) {
      reasons.push('Download originates from an unencrypted connection (HTTP).');
      if (riskLevel === 'safe') {
        riskLevel = 'caution';
      }
    }

    return {
      filename,
      extension: ext,
      riskLevel,
      mimeType,
      reasons,
      requiresUserConfirmation: riskLevel === 'dangerous'
    };
  }

  /**
   * Registers an active download and begins tracking progress.
   */
  public registerDownload(
    item: any,
    filename: string,
    totalBytes: number,
    savePath: string,
    originUrl: string = '',
    mimeType?: string
  ): DownloadRecord {
    const id = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const percent = totalBytes > 0 ? Math.round((0 / totalBytes) * 100) : 0;

    const record: DownloadRecord = {
      id,
      filename,
      savePath,
      url: originUrl,
      mimeType,
      fileCategory: DownloadManager.classifyFileCategory(filename),
      state: 'progressing',
      receivedBytes: 0,
      totalBytes: Math.max(0, totalBytes),
      percent,
      speed: 0,
      estimatedSecondsRemaining: 0,
      startTime: now,
      canResume: typeof item?.canResume === 'function' ? item.canResume() : true,
      isPaused: false
    };

    this.activeItems.set(id, {
      item,
      record,
      lastBytes: 0,
      lastTime: now,
      speedSamples: []
    });

    // Add to top of list
    this.downloads.unshift(record);
    this.persistDownloads();

    return { ...record };
  }

  /**
   * Updates progress of an active download item.
   */
  public updateProgress(id: string, receivedBytes: number, totalBytes: number): DownloadRecord | null {
    const active = this.activeItems.get(id);
    if (!active) {
      // Check in persisted list
      const rec = this.downloads.find(d => d.id === id);
      return rec ? { ...rec } : null;
    }

    const now = Date.now();
    const timeDelta = Math.max(0.1, (now - active.lastTime) / 1000);
    const bytesDelta = Math.max(0, receivedBytes - active.lastBytes);

    const instantSpeed = bytesDelta / timeDelta;
    active.speedSamples.push(instantSpeed);
    if (active.speedSamples.length > 5) {
      active.speedSamples.shift();
    }
    const avgSpeed = active.speedSamples.reduce((a, b) => a + b, 0) / active.speedSamples.length;

    const total = totalBytes > 0 ? totalBytes : active.record.totalBytes;
    const percent = total > 0 ? Math.min(100, Math.round((receivedBytes / total) * 100)) : 0;
    const remainingBytes = Math.max(0, total - receivedBytes);
    const estimatedSecondsRemaining = avgSpeed > 0 ? Math.round(remainingBytes / avgSpeed) : 0;

    active.record.receivedBytes = receivedBytes;
    active.record.totalBytes = total;
    active.record.percent = percent;
    active.record.speed = Math.round(avgSpeed);
    active.record.estimatedSecondsRemaining = estimatedSecondsRemaining;
    active.record.isPaused = typeof active.item?.isPaused === 'function' ? active.item.isPaused() : false;
    active.record.state = active.record.isPaused ? 'paused' : 'progressing';

    active.lastBytes = receivedBytes;
    active.lastTime = now;

    // Update in history list
    const idx = this.downloads.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.downloads[idx] = { ...active.record };
    }

    return { ...active.record };
  }

  /**
   * Marks download as completed safely. Never auto-opens file manager.
   */
  public completeDownload(id: string, finalPath?: string): DownloadRecord | null {
    const active = this.activeItems.get(id);
    const now = Date.now();

    let record: DownloadRecord;
    if (active) {
      active.record.state = 'completed';
      active.record.percent = 100;
      active.record.receivedBytes = active.record.totalBytes > 0 ? active.record.totalBytes : active.lastBytes;
      active.record.speed = 0;
      active.record.estimatedSecondsRemaining = 0;
      active.record.endTime = now;
      if (finalPath) {
        active.record.savePath = finalPath;
      }
      record = { ...active.record };
      this.activeItems.delete(id);
    } else {
      const existing = this.downloads.find(d => d.id === id);
      if (!existing) return null;
      existing.state = 'completed';
      existing.percent = 100;
      existing.speed = 0;
      existing.estimatedSecondsRemaining = 0;
      existing.endTime = now;
      if (finalPath) existing.savePath = finalPath;
      record = { ...existing };
    }

    const idx = this.downloads.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.downloads[idx] = record;
    }
    this.persistDownloads();

    return record;
  }

  /**
   * Marks download as failed or interrupted.
   */
  public failDownload(id: string, error?: string): DownloadRecord | null {
    const active = this.activeItems.get(id);
    const now = Date.now();

    let record: DownloadRecord;
    if (active) {
      active.record.state = 'interrupted';
      active.record.speed = 0;
      active.record.estimatedSecondsRemaining = 0;
      active.record.endTime = now;
      active.record.error = error || 'Download interrupted';
      record = { ...active.record };
      this.activeItems.delete(id);
    } else {
      const existing = this.downloads.find(d => d.id === id);
      if (!existing) return null;
      existing.state = 'interrupted';
      existing.speed = 0;
      existing.endTime = now;
      existing.error = error || 'Download interrupted';
      record = { ...existing };
    }

    const idx = this.downloads.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.downloads[idx] = record;
    }
    this.persistDownloads();

    return record;
  }

  /**
   * Cancels an active download.
   */
  public cancelDownload(id: string): DownloadRecord | null {
    const active = this.activeItems.get(id);
    if (active && active.item) {
      try {
        if (typeof active.item.cancel === 'function') {
          active.item.cancel();
        }
      } catch {
        // Ignored
      }
    }

    const now = Date.now();
    let record: DownloadRecord;
    if (active) {
      active.record.state = 'cancelled';
      active.record.speed = 0;
      active.record.estimatedSecondsRemaining = 0;
      active.record.endTime = now;
      record = { ...active.record };
      this.activeItems.delete(id);
    } else {
      const existing = this.downloads.find(d => d.id === id);
      if (!existing) return null;
      existing.state = 'cancelled';
      existing.speed = 0;
      existing.endTime = now;
      record = { ...existing };
    }

    const idx = this.downloads.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.downloads[idx] = record;
    }
    this.persistDownloads();

    return record;
  }

  /**
   * Pauses an active download.
   */
  public pauseDownload(id: string): boolean {
    const active = this.activeItems.get(id);
    if (!active || !active.item) return false;
    try {
      if (typeof active.item.pause === 'function') {
        active.item.pause();
        active.record.state = 'paused';
        active.record.isPaused = true;
        active.record.speed = 0;
        this.persistDownloads();
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Resumes a paused download.
   */
  public resumeDownload(id: string): boolean {
    const active = this.activeItems.get(id);
    if (!active || !active.item) return false;
    try {
      if (typeof active.item.resume === 'function') {
        active.item.resume();
        active.record.state = 'progressing';
        active.record.isPaused = false;
        active.lastTime = Date.now();
        this.persistDownloads();
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Returns top N recent downloads (default 5 for the toolbar popover).
   */
  public getRecentDownloads(limit: number = 5): DownloadRecord[] {
    return this.downloads.slice(0, Math.max(1, limit)).map(d => ({ ...d }));
  }

  /**
   * Returns all downloads for the full downloads page.
   */
  public getAllDownloads(): DownloadRecord[] {
    return this.downloads.map(d => ({ ...d }));
  }

  /**
   * Returns active download count.
   */
  public getActiveCount(): number {
    return this.activeItems.size;
  }

  /**
   * Clears completed and cancelled downloads from the list.
   */
  public clearCompleted(): void {
    this.downloads = this.downloads.filter(d => d.state === 'progressing' || d.state === 'paused');
    this.persistDownloads();
  }

  /**
   * Safely opens the downloaded file only upon explicit user request.
   */
  public async openFile(id: string): Promise<boolean> {
    const item = this.downloads.find(d => d.id === id);
    if (!item || !item.savePath || !fs.existsSync(item.savePath)) return false;

    try {
      const { shell } = require('electron');
      const result = await shell.openPath(item.savePath);
      return result === ''; // empty string means success
    } catch {
      return false;
    }
  }

  /**
   * Safely shows the containing folder in the OS file manager only upon explicit user request.
   */
  public openContainingFolder(id: string): boolean {
    const item = this.downloads.find(d => d.id === id);
    if (!item || !item.savePath) return false;

    try {
      const { shell } = require('electron');
      shell.showItemInFolder(item.savePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Permanently deletes the downloaded file from disk and removes the record from history.
   */
  public deleteFile(id: string): boolean {
    const item = this.downloads.find(d => d.id === id);
    let deleted = false;
    if (item && item.savePath && fs.existsSync(item.savePath)) {
      try {
        fs.unlinkSync(item.savePath);
        deleted = true;
      } catch {
        // Ignored
      }
    }
    this.removeDownload(id);
    return deleted;
  }

  /**
   * Removes the download record from history without deleting the physical file.
   */
  public removeDownload(id: string): boolean {
    const initialLen = this.downloads.length;
    this.downloads = this.downloads.filter(d => d.id !== id);
    if (this.downloads.length !== initialLen) {
      this.persistDownloads();
      return true;
    }
    return false;
  }
}
