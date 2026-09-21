/**
 * THAAW Browser — Profile Subsystem Tests
 * Verifies profile partitioning, private session isolation, and storage segregation.
 */

import fs from 'fs';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileManager } from '../../browser/profiles/profile-manager';

describe('ProfileManager (Storage Partitioning & Isolation)', () => {
  let profileManager: ProfileManager;

  beforeEach(() => {
    try {
      fs.rmSync('/tmp/test-thaaw-profiles', { recursive: true, force: true });
    } catch {}
    profileManager = new ProfileManager('/tmp/test-thaaw-profiles');
  });

  describe('Default Profiles Initialization', () => {
    it('should initialize default Personal, Work, and Private profiles', () => {
      const profiles = profileManager.listProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(3);

      const ids = profiles.map(p => p.id);
      expect(ids).toContain('default');
      expect(ids).toContain('work');
      expect(ids).toContain('private');
    });

    it('should designate default profile as active on startup', () => {
      const active = profileManager.getActiveProfile();
      expect(active.id).toBe('default');
      expect(active.name).toBe('Personal');
      expect(active.isPrivate).toBe(false);
    });
  });

  describe('Profile Switching & Registration', () => {
    it('should switch active profile when valid profile ID is provided', () => {
      const switched = profileManager.setActiveProfile('work');
      expect(switched).toBe(true);
      expect(profileManager.getActiveProfile().id).toBe('work');
    });

    it('should reject switching to non-existent profile', () => {
      const switched = profileManager.setActiveProfile('non-existent-profile');
      expect(switched).toBe(false);
      expect(profileManager.getActiveProfile().id).toBe('default');
    });

    it('should allow registering a custom profile', () => {
      profileManager.registerProfile({
        id: 'developer',
        name: 'Developer Testing',
        isPrivate: false,
        color: '#F59E0B',
        storagePath: '/tmp/test-thaaw-profiles/developer'
      });

      expect(profileManager.setActiveProfile('developer')).toBe(true);
      expect(profileManager.getActiveProfile().name).toBe('Developer Testing');
    });
  });

  describe('Session & Partition Isolation', () => {
    it('should return persistent partition name for standard profiles', () => {
      const defaultPartition = profileManager.getPartitionName('default');
      expect(defaultPartition).toBe('persist:thaaw_profile_default');

      const workPartition = profileManager.getPartitionName('work');
      expect(workPartition).toBe('persist:thaaw_profile_work');
    });

    it('should return a dedicated unique in-memory partition for Private mode sessions', () => {
      const privatePartition = profileManager.getPartitionName('private');
      expect(privatePartition.startsWith('persist:')).toBe(false);
      expect(privatePartition).toMatch(/^thaaw_private_/);
    });
  });

  describe('Profile Deletion & Lifecycle', () => {
    it('should allow deleting default (Personal), work, developer, and guest when not active and another profile exists', () => {
      // Register custom profile and switch to it
      const custom = profileManager.createProfile('Custom Profile', '#38bdf8', 'user@example.com');
      profileManager.setActiveProfile(custom.id);

      // Now default (Personal), work, developer, and guest can all be deleted
      expect(profileManager.canDeleteProfile('default')).toBe(true);
      expect(profileManager.canDeleteProfile('work')).toBe(true);
      expect(profileManager.canDeleteProfile('developer')).toBe(true);
      expect(profileManager.canDeleteProfile('guest')).toBe(true);

      // Delete work
      expect(profileManager.deleteProfile('work')).toBe(true);
      expect(profileManager.listProfiles().some(p => p.id === 'work')).toBe(false);

      // Delete default (Personal)
      expect(profileManager.deleteProfile('default')).toBe(true);
      expect(profileManager.listProfiles().some(p => p.id === 'default')).toBe(false);
    });

    it('should prevent deleting the currently active profile', () => {
      const active = profileManager.getActiveProfile();
      expect(profileManager.canDeleteProfile(active.id)).toBe(false);
      expect(profileManager.deleteProfile(active.id)).toBe(false);
    });
  });
});
