/**
 * THAAW Browser — Secure Authentication & Identity Subsystem
 * Handles user account creation, credentials verification, password hashing with PBKDF2,
 * session management, and profile metadata persistence.
 * Zero external telemetry. Zero plaintext passwords stored.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  profileId: string;
  passwordHash: string;
  salt: string;
  sessionToken?: string;
  createdAt: number;
  lastLoginAt: number;
  settings: {
    theme?: string;
    preset?: string;
    searchEngine?: string;
    protectionLevel?: string;
    syncEnabled?: boolean;
  };
}

export interface UserAccountPublic {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  profileId: string;
  createdAt: number;
  lastLoginAt: number;
  isAuthenticated: boolean;
  settings?: UserAccount['settings'];
}

export class AuthManager {
  private baseDir: string;
  private accountsFile: string;
  private sessionFile: string;
  private accounts = new Map<string, UserAccount>();
  private activeAccountId: string | null = null;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(os.homedir(), '.config', 'thaaw', 'auth');
    this.accountsFile = path.join(this.baseDir, 'accounts.json');
    this.sessionFile = path.join(this.baseDir, 'active_session.json');

    this.ensureDir();
    this.loadAccounts();
    this.restoreSession();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  }

  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private loadAccounts(): void {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const raw = fs.readFileSync(this.accountsFile, 'utf8');
        const list: UserAccount[] = JSON.parse(raw);
        this.accounts.clear();
        for (const acc of list) {
          this.accounts.set(acc.id, acc);
        }
      }
    } catch (err) {
      console.warn('[THAAW Auth] Failed to load accounts file:', err);
      this.accounts.clear();
    }
  }

  private saveAccounts(): void {
    try {
      this.ensureDir();
      const list = Array.from(this.accounts.values());
      fs.writeFileSync(this.accountsFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW Auth] Failed to write accounts file:', err);
    }
  }

  private restoreSession(): void {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const raw = fs.readFileSync(this.sessionFile, 'utf8');
        const session = JSON.parse(raw);
        if (session && session.accountId && session.token) {
          const account = this.accounts.get(session.accountId);
          if (account && account.sessionToken === session.token) {
            this.activeAccountId = account.id;
            return;
          }
        }
      }
    } catch {
      // Ignore corrupted session
    }
    this.activeAccountId = null;
  }

  private persistSession(account: UserAccount | null): void {
    try {
      this.ensureDir();
      if (account && account.sessionToken) {
        fs.writeFileSync(
          this.sessionFile,
          JSON.stringify({ accountId: account.id, token: account.sessionToken, timestamp: Date.now() }, null, 2),
          'utf8'
        );
      } else if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
      }
    } catch (err) {
      console.error('[THAAW Auth] Failed to persist session:', err);
    }
  }

  public createAccount(params: {
    email: string;
    password: string;
    name: string;
    profileId?: string;
    avatarColor?: string;
  }): { success: boolean; account?: UserAccountPublic; error?: string } {
    const email = params.email.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    const name = (params.name || email.split('@')[0]).trim();

    // Check for existing account with same email
    for (const existing of this.accounts.values()) {
      if (existing.email === email) {
        return { success: false, error: 'An account with this email already exists.' };
      }
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(params.password, salt);
    const id = `acc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const profileId = params.profileId || `prof_${Date.now()}`;
    const token = this.generateToken();

    const colors = ['#00D1FF', '#10B981', '#F59E0B', '#A855F7', '#EC4899', '#38BDF8'];
    const avatarColor = params.avatarColor || colors[Math.floor(Math.random() * colors.length)];

    const newAccount: UserAccount = {
      id,
      email,
      name,
      avatarColor,
      profileId,
      passwordHash,
      salt,
      sessionToken: token,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      settings: {
        theme: 'dark',
        preset: 'midnight',
        searchEngine: 'duckduckgo',
        protectionLevel: 'balanced',
        syncEnabled: true
      }
    };

    this.accounts.set(id, newAccount);
    this.saveAccounts();

    this.activeAccountId = id;
    this.persistSession(newAccount);

    return {
      success: true,
      account: this.toPublic(newAccount)
    };
  }

  public signIn(params: {
    email: string;
    password: string;
  }): { success: boolean; account?: UserAccountPublic; error?: string } {
    const email = params.email.trim().toLowerCase();
    let matched: UserAccount | null = null;

    for (const acc of this.accounts.values()) {
      if (acc.email === email) {
        matched = acc;
        break;
      }
    }

    if (!matched) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const computed = this.hashPassword(params.password, matched.salt);
    if (computed !== matched.passwordHash) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const token = this.generateToken();
    matched.sessionToken = token;
    matched.lastLoginAt = Date.now();
    this.saveAccounts();

    this.activeAccountId = matched.id;
    this.persistSession(matched);

    return {
      success: true,
      account: this.toPublic(matched)
    };
  }

  public signOut(): { success: boolean } {
    if (this.activeAccountId) {
      const acc = this.accounts.get(this.activeAccountId);
      if (acc) {
        acc.sessionToken = undefined;
        this.saveAccounts();
      }
    }
    this.activeAccountId = null;
    this.persistSession(null);
    return { success: true };
  }

  public getCurrentUser(): UserAccountPublic | null {
    if (!this.activeAccountId) return null;
    const acc = this.accounts.get(this.activeAccountId);
    return acc ? this.toPublic(acc) : null;
  }

  public getAccountByProfileId(profileId: string): UserAccountPublic | null {
    for (const acc of this.accounts.values()) {
      if (acc.profileId === profileId) {
        return this.toPublic(acc);
      }
    }
    return null;
  }

  public setActiveAccountForProfile(profileId: string): UserAccountPublic | null {
    for (const acc of this.accounts.values()) {
      if (acc.profileId === profileId) {
        this.activeAccountId = acc.id;
        this.persistSession(acc);
        return this.toPublic(acc);
      }
    }
    this.activeAccountId = null;
    this.persistSession(null);
    return null;
  }

  public updateProfile(params: {
    name?: string;
    avatarColor?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    settings?: UserAccount['settings'];
  }): { success: boolean; account?: UserAccountPublic; error?: string } {
    if (!this.activeAccountId) {
      return { success: false, error: 'No user is currently signed in.' };
    }
    const acc = this.accounts.get(this.activeAccountId);
    if (!acc) {
      return { success: false, error: 'Account not found.' };
    }

    if (params.name) acc.name = params.name.trim();
    if (params.avatarColor) acc.avatarColor = params.avatarColor;

    if (params.email && params.email.trim().toLowerCase() !== acc.email) {
      const nextEmail = params.email.trim().toLowerCase();
      for (const other of this.accounts.values()) {
        if (other.id !== acc.id && other.email === nextEmail) {
          return { success: false, error: 'Email is already in use by another account.' };
        }
      }
      acc.email = nextEmail;
    }

    if (params.newPassword) {
      if (!params.currentPassword) {
        return { success: false, error: 'Current password is required to set a new password.' };
      }
      const verify = this.hashPassword(params.currentPassword, acc.salt);
      if (verify !== acc.passwordHash) {
        return { success: false, error: 'Current password does not match.' };
      }
      if (params.newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long.' };
      }
      acc.salt = this.generateSalt();
      acc.passwordHash = this.hashPassword(params.newPassword, acc.salt);
      acc.sessionToken = this.generateToken();
      this.persistSession(acc);
    }

    if (params.settings) {
      acc.settings = { ...acc.settings, ...params.settings };
    }

    this.saveAccounts();
    return { success: true, account: this.toPublic(acc) };
  }

  public listAccounts(): UserAccountPublic[] {
    return Array.from(this.accounts.values()).map(acc => this.toPublic(acc));
  }

  public deleteAccount(id: string): boolean {
    const deleted = this.accounts.delete(id);
    if (deleted) {
      if (this.activeAccountId === id) {
        this.signOut();
      }
      this.saveAccounts();
    }
    return deleted;
  }

  private toPublic(acc: UserAccount): UserAccountPublic {
    return {
      id: acc.id,
      email: acc.email,
      name: acc.name,
      avatarColor: acc.avatarColor,
      profileId: acc.profileId,
      createdAt: acc.createdAt,
      lastLoginAt: acc.lastLoginAt,
      isAuthenticated: !!acc.sessionToken && acc.id === this.activeAccountId,
      settings: acc.settings
    };
  }
}
