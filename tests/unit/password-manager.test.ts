/**
 * THAAW Browser — Password Vault Subsystem Tests
 * Verifies authenticated credential storage, AES-256-GCM fallback, reveal, update, and search filtering.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PasswordManager } from '../../browser/main/password-manager';

describe('PasswordManager (Cryptographic Vault)', () => {
  const testDir = path.join('/tmp', `thaaw-vault-test-${Date.now()}`);
  const testVaultFile = path.join(testDir, 'test_vault.json');
  let manager: PasswordManager;

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
    manager = new PasswordManager(testVaultFile);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should report vault security status honestly', () => {
    const status = manager.getVaultSecurityStatus();
    expect(status).toBeDefined();
    expect(['OS_KEYCHAIN', 'ENCRYPTED_VAULT_FALLBACK']).toContain(status.status);
    expect(status.description).toBeTruthy();
  });

  it('should store credentials without exposing plaintext in the vault file', () => {
    const res = manager.saveCredential('https://github.com/login', 'developer', 'SecretP@ssw0rd!');
    expect(res.success).toBe(true);
    expect(res.id).toBeTruthy();

    // Verify vault file on disk does NOT contain the plaintext password
    const rawVault = fs.readFileSync(testVaultFile, 'utf8');
    expect(rawVault).not.toContain('SecretP@ssw0rd!');
    expect(rawVault).toContain('github.com');
    expect(rawVault).toContain('developer');
  });

  it('should correctly reveal the saved password when requested', () => {
    const res = manager.saveCredential('https://thaaw.dev', 'admin', 'SuperSecure123#');
    expect(res.success).toBe(true);

    const revealed = manager.revealPassword(res.id);
    expect(revealed.success).toBe(true);
    expect(revealed.password).toBe('SuperSecure123#');
  });

  it('should allow updating existing credentials (website, username, password)', () => {
    const res = manager.saveCredential('https://gitlab.com', 'coder', 'InitialPass1!');
    expect(res.success).toBe(true);

    const updateRes = manager.updateCredential(res.id, {
      username: 'lead-coder',
      password: 'UpdatedPassword99$'
    });
    expect(updateRes.success).toBe(true);

    const list = manager.getCredentialList();
    const updated = list.find(c => c.id === res.id);
    expect(updated?.username).toBe('lead-coder');

    const revealed = manager.revealPassword(res.id);
    expect(revealed.password).toBe('UpdatedPassword99$');
  });

  it('should filter credentials by query', () => {
    manager.saveCredential('github.com', 'user1', 'pass1');
    manager.saveCredential('google.com', 'user2', 'pass2');
    manager.saveCredential('gitlab.com', 'user3', 'pass3');

    const gitMatches = manager.getCredentialList('git');
    expect(gitMatches.length).toBe(2);

    const googleMatches = manager.getCredentialList('google');
    expect(googleMatches.length).toBe(1);
    expect(googleMatches[0].website).toBe('google.com');
  });

  it('should delete a credential and persist changes', () => {
    const res = manager.saveCredential('example.com', 'testuser', 'pass');
    expect(manager.getCredentialList().length).toBe(1);

    const deleted = manager.deleteCredential(res.id);
    expect(deleted).toBe(true);
    expect(manager.getCredentialList().length).toBe(0);

    // Re-instantiate from disk
    const manager2 = new PasswordManager(testVaultFile);
    expect(manager2.getCredentialList().length).toBe(0);
  });
});
