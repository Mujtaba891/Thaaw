/**
 * THAAW Browser — Authentication System Tests
 * Verifies PBKDF2 credential security, account management, session persistence, and profile updates.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { AuthManager } from '../../browser/profiles/auth-manager';

describe('AuthManager (Authentication, Sessions & Accounts)', () => {
  const testStorageDir = path.join('/tmp', 'thaaw-auth-tests-' + Date.now());
  let authManager: AuthManager;

  beforeEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testStorageDir, { recursive: true });
    authManager = new AuthManager(testStorageDir);
  });

  afterEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('Account Creation & Registration', () => {
    it('should successfully create an account with PBKDF2 hashed password', async () => {
      const result = await authManager.createAccount({
        email: 'developer@thaaw.dev',
        password: 'securepassword123',
        name: 'Lead Architect',
        avatarColor: '#00F0FF'
      });

      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
      expect(result.account?.email).toBe('developer@thaaw.dev');
      expect(result.account?.name).toBe('Lead Architect');
      expect(result.account?.avatarColor).toBe('#00F0FF');

      // Ensure active session is established
      const currentUser = authManager.getCurrentUser();
      expect(currentUser).not.toBeNull();
      expect(currentUser?.email).toBe('developer@thaaw.dev');
    });

    it('should prevent registering duplicate email addresses', async () => {
      await authManager.createAccount({
        email: 'dev@thaaw.dev',
        password: 'password123',
        name: 'Developer 1'
      });

      const duplicateResult = await authManager.createAccount({
        email: 'dev@thaaw.dev',
        password: 'password456',
        name: 'Developer 2'
      });

      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.error).toContain('already exists');
    });

    it('should reject passwords shorter than 6 characters', async () => {
      const result = await authManager.createAccount({
        email: 'short@thaaw.dev',
        password: '123',
        name: 'Short'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });
  });

  describe('Authentication & Sign-In', () => {
    beforeEach(async () => {
      await authManager.createAccount({
        email: 'tester@thaaw.dev',
        password: 'correctpassword99',
        name: 'Quality Tester'
      });
      await authManager.signOut();
    });

    it('should authenticate valid credentials and establish session', async () => {
      expect(authManager.getCurrentUser()).toBeNull();

      const result = await authManager.signIn({
        email: 'tester@thaaw.dev',
        password: 'correctpassword99'
      });

      expect(result.success).toBe(true);
      expect(result.account?.email).toBe('tester@thaaw.dev');
      expect(authManager.getCurrentUser()?.email).toBe('tester@thaaw.dev');
    });

    it('should reject incorrect password', async () => {
      const result = await authManager.signIn({
        email: 'tester@thaaw.dev',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
      expect(authManager.getCurrentUser()).toBeNull();
    });

    it('should reject non-existent user email', async () => {
      const result = await authManager.signIn({
        email: 'nobody@thaaw.dev',
        password: 'anypassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email or password');
    });
  });

  describe('Session Persistence & Sign-Out', () => {
    it('should clear session upon sign out', async () => {
      await authManager.createAccount({
        email: 'user@thaaw.dev',
        password: 'mypassword123',
        name: 'Active User'
      });

      expect(authManager.getCurrentUser()).not.toBeNull();

      await authManager.signOut();
      expect(authManager.getCurrentUser()).toBeNull();
    });

    it('should persist session across AuthManager instantiations', async () => {
      await authManager.createAccount({
        email: 'persisted@thaaw.dev',
        password: 'persistedpass1',
        name: 'Persistent User'
      });

      // Instantiate a new AuthManager with the same storage directory
      const newAuthManager = new AuthManager(testStorageDir);
      const currentUser = newAuthManager.getCurrentUser();

      expect(currentUser).not.toBeNull();
      expect(currentUser?.email).toBe('persisted@thaaw.dev');
      expect(currentUser?.name).toBe('Persistent User');
    });
  });

  describe('Profile & Password Updates', () => {
    beforeEach(async () => {
      await authManager.createAccount({
        email: 'profile@thaaw.dev',
        password: 'oldpassword123',
        name: 'Original Name',
        avatarColor: '#10B981'
      });
    });

    it('should update user display name and avatar color', async () => {
      const updateResult = await authManager.updateProfile({
        name: 'Updated Name',
        avatarColor: '#EC4899'
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.account?.name).toBe('Updated Name');
      expect(updateResult.account?.avatarColor).toBe('#EC4899');

      const user = authManager.getCurrentUser();
      expect(user?.name).toBe('Updated Name');
      expect(user?.avatarColor).toBe('#EC4899');
    });

    it('should successfully change password when current password matches', async () => {
      const updateResult = await authManager.updateProfile({
        currentPassword: 'oldpassword123',
        newPassword: 'brandnewpassword456'
      });

      expect(updateResult.success).toBe(true);

      // Sign out and sign in with new password
      await authManager.signOut();

      const oldPassSignIn = await authManager.signIn({
        email: 'profile@thaaw.dev',
        password: 'oldpassword123'
      });
      expect(oldPassSignIn.success).toBe(false);

      const newPassSignIn = await authManager.signIn({
        email: 'profile@thaaw.dev',
        password: 'brandnewpassword456'
      });
      expect(newPassSignIn.success).toBe(true);
    });

    it('should reject password change if current password is wrong', async () => {
      const updateResult = await authManager.updateProfile({
        currentPassword: 'wrongcurrentpassword',
        newPassword: 'brandnewpassword456'
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('Current password does not match');
    });
  });

  describe('Account Listing & Public Sanitization', () => {
    it('should return list of registered accounts without leaking password hashes or salts', async () => {
      await authManager.createAccount({
        email: 'user1@thaaw.dev',
        password: 'secretpass1',
        name: 'User One'
      });

      await authManager.createAccount({
        email: 'user2@thaaw.dev',
        password: 'secretpass2',
        name: 'User Two'
      });

      const accounts = authManager.listAccounts();
      expect(accounts.length).toBe(2);

      for (const account of accounts) {
        expect(account.email).toBeDefined();
        expect(account.name).toBeDefined();
        expect((account as any).passwordHash).toBeUndefined();
        expect((account as any).salt).toBeUndefined();
      }
    });
  });
});
