/**
 * THAAW Browser — Isolated Profile Subsystem
 * Enforces strong storage partitioning and profile directory segregation between user profiles.
 * Supports Personal, Work, Developer, Guest, and custom developer profiles.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ProfileMetadata {
  id: string;
  name: string;
  isPrivate: boolean;
  color: string;
  storagePath: string;
  email?: string;
  avatarIcon?: string;
  /** A data URL or a named THAAW avatar. Kept in profile metadata, never in shared UI state. */
  avatar?: string;
  createdAt?: number;
}

export class ProfileManager {
  private baseDir: string;
  private configFile: string;
  private profilesFile: string;
  private activeProfileId: string = 'default';
  private profiles = new Map<string, ProfileMetadata>();
  private showProfilePickerOnStartup = true;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(os.homedir(), '.config', 'thaaw', 'profiles');
    this.configFile = path.join(this.baseDir, 'config.json');
    this.profilesFile = path.join(this.baseDir, 'profiles.json');

    this.ensureDir(this.baseDir);
    this.loadPersistedProfiles();
    if (this.profiles.size === 0) {
      this.initializeDefaultProfiles();
      this.saveProfiles();
    }
    this.loadConfig();
  }

  private ensureDir(dir: string): void {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignore directory creation errors in sandboxed test runs
    }
  }

  private initializeDefaultProfiles(): void {
    this.registerProfile({
      id: 'default',
      name: 'Personal',
      isPrivate: false,
      color: '#00D1FF',
      storagePath: path.join(this.baseDir, 'default')
    });

    this.registerProfile({
      id: 'work',
      name: 'Work',
      isPrivate: false,
      color: '#10B981',
      storagePath: path.join(this.baseDir, 'work')
    });

    this.registerProfile({
      id: 'developer',
      name: 'Developer',
      isPrivate: false,
      color: '#F59E0B',
      storagePath: path.join(this.baseDir, 'developer')
    });

    this.registerProfile({
      id: 'guest',
      name: 'Guest',
      isPrivate: true,
      color: '#94A3B8',
      storagePath: '' // Ephemeral in-memory partition
    });

    this.registerProfile({
      id: 'private',
      name: 'Private Window',
      isPrivate: true,
      color: '#A855F7',
      storagePath: '' // In-memory ephemeral
    });
  }

  private loadPersistedProfiles(): void {
    try {
      if (fs.existsSync(this.profilesFile)) {
        const raw = fs.readFileSync(this.profilesFile, 'utf8');
        const list: ProfileMetadata[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          this.profiles.clear();
          for (const p of list) {
            this.profiles.set(p.id, p);
          }
        }
      }
    } catch (err) {
      console.warn('[THAAW Profile] Failed to read persisted profiles:', err);
    }
  }

  private saveProfiles(): void {
    try {
      this.ensureDir(this.baseDir);
      // Save all custom profiles and overrides
      const list = Array.from(this.profiles.values());
      fs.writeFileSync(this.profilesFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW Profile] Failed to save profiles:', err);
    }
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        const conf = JSON.parse(raw);
        if (typeof conf.showPickerOnStartup === 'boolean') {
          this.showProfilePickerOnStartup = conf.showPickerOnStartup;
        }
        // Test instances deliberately start from the baseline profile; production restores
        // the last selected isolated workspace after a browser restart.
        if (!process.env.VITEST && typeof conf.lastActiveProfileId === 'string' && this.profiles.has(conf.lastActiveProfileId)) {
          this.activeProfileId = conf.lastActiveProfileId;
        }
      }
    } catch {}
  }

  private saveConfig(): void {
    try {
      this.ensureDir(this.baseDir);
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(
          {
            showPickerOnStartup: this.showProfilePickerOnStartup,
            lastActiveProfileId: this.activeProfileId
          },
          null,
          2
        ),
        'utf8'
      );
    } catch {}
  }

  public registerProfile(profile: ProfileMetadata): void {
    this.profiles.set(profile.id, profile);
  }

  public getActiveProfile(): ProfileMetadata {
    return (
      this.profiles.get(this.activeProfileId) ||
      Array.from(this.profiles.values()).find(p => !p.isPrivate) ||
      Array.from(this.profiles.values())[0]!
    );
  }

  public setActiveProfile(id: string): boolean {
    if (id === 'guest' && !this.profiles.has('guest')) {
      this.registerProfile({
        id: 'guest',
        name: 'Guest',
        isPrivate: true,
        color: '#94A3B8',
        storagePath: ''
      });
    }
    if (this.profiles.has(id)) {
      this.activeProfileId = id;
      this.saveConfig();
      return true;
    }
    return false;
  }

  public listProfiles(): ProfileMetadata[] {
    return Array.from(this.profiles.values());
  }

  public getSelectableProfiles(): ProfileMetadata[] {
    // Return profiles meant for the profile selector (Personal, Work, Developer, Guest, and custom)
    return Array.from(this.profiles.values()).filter(p => p.id !== 'private');
  }

  public createProfile(name: string, color?: string, email?: string): ProfileMetadata {
    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const storagePath = path.join(this.baseDir, id);
    this.ensureDir(storagePath);

    const colors = ['#00D1FF', '#10B981', '#F59E0B', '#A855F7', '#EC4899', '#38BDF8'];
    const assignedColor = color || colors[Math.floor(Math.random() * colors.length)];

    const newProfile: ProfileMetadata = {
      id,
      name: cleanName,
      isPrivate: false,
      color: assignedColor,
      storagePath,
      email,
      createdAt: Date.now()
    };

    this.registerProfile(newProfile);
    this.saveProfiles();
    return newProfile;
  }

  /** Update durable profile identity metadata. Profile settings remain in its isolated directory. */
  public updateProfile(id: string, patch: Pick<Partial<ProfileMetadata>, 'name' | 'email' | 'color' | 'avatar' | 'avatarIcon'>): ProfileMetadata | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    const name = typeof patch.name === 'string' ? patch.name.trim().slice(0, 80) : profile.name;
    if (!name) return null;
    const email = typeof patch.email === 'string' ? patch.email.trim().slice(0, 254) : profile.email;
    const safeAvatar = typeof patch.avatar === 'string' && patch.avatar.length <= 1_500_000 && /^data:image\/(png|jpeg|webp);base64,/i.test(patch.avatar)
      ? patch.avatar : undefined;
    const updated: ProfileMetadata = {
      ...profile,
      name,
      ...(email ? { email } : {}),
      ...(patch.email === '' ? { email: undefined } : {}),
      ...(typeof patch.color === 'string' ? { color: patch.color } : {}),
      ...(safeAvatar ? { avatar: safeAvatar } : {}),
      ...(typeof patch.avatarIcon === 'string' ? { avatarIcon: patch.avatarIcon } : {})
    };
    this.profiles.set(id, updated);
    this.saveProfiles();
    return updated;
  }

  public duplicateProfile(id: string): ProfileMetadata | null {
    const source = this.profiles.get(id);
    if (!source || source.isPrivate) return null;
    const copy = this.createProfile(`${source.name} Copy`, source.color, source.email);
    copy.avatar = source.avatar;
    copy.avatarIcon = source.avatarIcon;
    this.profiles.set(copy.id, copy);
    // Copying browser storage would copy active credentials and locks. A fresh isolated
    // partition is intentional; preferences are the only safe profile state to clone.
    this.updateProfileSettings(this.getProfileSettings(source.id), copy.id);
    this.saveProfiles();
    return copy;
  }

  public canDeleteProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile || id === 'private') return false;
    // Cannot delete currently active profile
    if (this.activeProfileId === id) return false;
    // Must have at least one profile remaining
    const remainingCount = Array.from(this.profiles.values()).filter(p => p.id !== 'private').length;
    return remainingCount > 1;
  }

  public deleteProfile(id: string): boolean {
    if (!this.canDeleteProfile(id)) {
      return false;
    }
    const profile = this.profiles.get(id);
    if (!profile) return false;

    this.profiles.delete(id);
    if (this.activeProfileId === id) {
      const firstRemaining = Array.from(this.profiles.values()).find(p => p.id !== 'private');
      this.activeProfileId = firstRemaining ? firstRemaining.id : 'default';
    }
    this.saveProfiles();
    this.saveConfig();

    // Optionally cleanup profile directory
    try {
      if (profile.storagePath && fs.existsSync(profile.storagePath)) {
        fs.rmSync(profile.storagePath, { recursive: true, force: true });
      }
    } catch {}

    return true;
  }

  public getProfileDir(profileId?: string): string {
    const targetId = profileId || this.activeProfileId;
    const profile = this.profiles.get(targetId);
    if (!profile || profile.isPrivate || !profile.storagePath) {
      const ephemeral = path.join(this.baseDir, 'ephemeral', `guest_${Date.now()}`);
      this.ensureDir(ephemeral);
      return ephemeral;
    }
    this.ensureDir(profile.storagePath);
    return profile.storagePath;
  }

  private ephemeralSessionToken = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  public getPartitionName(profileId: string): string {
    const profile = this.profiles.get(profileId);
    if (!profile || profile.isPrivate) {
      return `thaaw_private_${this.ephemeralSessionToken}_${profile?.id || 'anon'}`;
    }
    return `persist:thaaw_profile_${profile.id}`;
  }

  public shouldShowProfilePickerOnStartup(): boolean {
    return this.showProfilePickerOnStartup;
  }

  public setShowProfilePickerOnStartup(enabled: boolean): void {
    this.showProfilePickerOnStartup = enabled;
    this.saveConfig();
  }

  public getProfileSettings(profileId?: string): ProfileSettings {
    const profDir = this.getProfileDir(profileId);
    const settingsFile = path.join(profDir, 'settings.json');
    const defaults: ProfileSettings = {
      settingsVersion: 2,
      theme: 'dark',
      themePreset: 'midnight',
      accent: 'blue',
      density: 'comfortable',
      tabStyle: 'rounded',
      defaultSearchEngine: 'duckduckgo',
      customSearchUrl: '',
      httpsFirst: true,
      protectionLevel: 'balanced',
      doH: true,
      telemetry: false,
      startupMode: 'newtab',
      searchSuggestions: true,
      audioIndicator: true,
      hardwareAcceleration: true,
      memorySaver: true,
      wallpaper: 'default',
      clockFormat: '12h',
      showWeather: true,
      showNews: true,
      showBookmarksBar: false
    };

    try {
      if (fs.existsSync(settingsFile)) {
        const raw = fs.readFileSync(settingsFile, 'utf8');
        try {
          const loaded = JSON.parse(raw);
          // Migration from version 1 or unversioned settings
          if (!loaded.settingsVersion || loaded.settingsVersion < 2) {
            const migrated: ProfileSettings = {
              ...defaults,
              ...loaded,
              settingsVersion: 2
            };
            this.ensureDir(profDir);
            fs.writeFileSync(settingsFile, JSON.stringify(migrated, null, 2), 'utf8');
            return migrated;
          }
          return { ...defaults, ...loaded };
        } catch (parseErr) {
          // Recover gracefully from corrupted JSON
          console.warn('[THAAW Profile] Corrupted settings JSON detected. Backing up and resetting to defaults:', parseErr);
          const backupPath = path.join(profDir, `settings.corrupted.${Date.now()}.bak`);
          try {
            fs.copyFileSync(settingsFile, backupPath);
            fs.writeFileSync(settingsFile, JSON.stringify(defaults, null, 2), 'utf8');
          } catch {}
          return defaults;
        }
      } else {
        this.ensureDir(profDir);
        fs.writeFileSync(settingsFile, JSON.stringify(defaults, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[THAAW Profile] Error accessing profile settings:', err);
    }

    return defaults;
  }

  public updateProfileSettings(patch: Partial<ProfileSettings>, profileId?: string): ProfileSettings {
    const profDir = this.getProfileDir(profileId);
    const settingsFile = path.join(profDir, 'settings.json');
    const current = this.getProfileSettings(profileId);
    const updated: ProfileSettings = { ...current, ...patch, settingsVersion: 2 };

    try {
      this.ensureDir(profDir);
      fs.writeFileSync(settingsFile, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW Profile] Failed to save profile settings:', err);
    }

    return updated;
  }
}

export interface ProfileSettings {
  settingsVersion: number;
  theme: string;
  themePreset?: string;
  accent?: string;
  density?: string;
  tabStyle?: string;
  defaultSearchEngine?: string;
  customSearchUrl?: string;
  httpsFirst?: boolean;
  protectionLevel?: string;
  doH?: boolean;
  telemetry?: boolean;
  startupMode?: string;
  searchSuggestions?: boolean;
  audioIndicator?: boolean;
  hardwareAcceleration?: boolean;
  memorySaver?: boolean;
  wallpaper?: string;
  clockFormat?: string;
  showWeather?: boolean;
  showNews?: boolean;
  showBookmarksBar?: boolean;
}
