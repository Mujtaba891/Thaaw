/**
 * THAAW Browser — Centralized Permission Broker
 * Implements the 4-W Permission Architecture: WHO, WHAT, WHY, WHEN.
 * Principles: Least privilege, explicit consent, no deceptive dark patterns.
 */

export type PermissionType =
  | 'media:camera'
  | 'media:microphone'
  | 'geolocation'
  | 'notifications'
  | 'clipboard-read'
  | 'midi'
  | 'sensors';

export type PermissionDecision = 'allow' | 'allow-once' | 'deny';

export interface PermissionRequest {
  id: string;
  origin: string;
  permission: PermissionType;
  details: {
    who: string;  // Sanitized origin
    what: string; // Plain-English capability description
    why: string;  // Context/reason
    when: string; // Session / Permanent
  };
  timestamp: number;
}

import fs from 'fs';
import path from 'path';

export interface StoredPermission {
  decision: 'allow' | 'deny';
  grantedAt: number;
}

export class PermissionManager {
  private sitePermissions = new Map<string, Map<PermissionType, StoredPermission>>();
  private pendingRequests = new Map<string, { request: PermissionRequest; resolve: (res: boolean) => void }>();
  private storageFile?: string;

  constructor(storageFile?: string) {
    if (storageFile) {
      this.setStorageFile(storageFile);
    }
  }

  public setStorageFile(filePath: string): void {
    this.storageFile = filePath;
    this.load();
  }

  private load(): void {
    if (!this.storageFile) return;
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data: Record<string, Record<string, StoredPermission>> = JSON.parse(raw);
        this.sitePermissions.clear();
        for (const [origin, perms] of Object.entries(data)) {
          const innerMap = new Map<PermissionType, StoredPermission>();
          for (const [pType, stored] of Object.entries(perms)) {
            innerMap.set(pType as PermissionType, stored);
          }
          this.sitePermissions.set(origin, innerMap);
        }
      }
    } catch (err) {
      console.warn('[THAAW Permissions] Failed to load persisted permissions:', err);
    }
  }

  private save(): void {
    if (!this.storageFile) return;
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: Record<string, Record<string, StoredPermission>> = {};
      for (const [origin, innerMap] of this.sitePermissions.entries()) {
        data[origin] = {};
        for (const [pType, stored] of innerMap.entries()) {
          data[origin][pType] = stored;
        }
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[THAAW Permissions] Failed to persist permissions:', err);
    }
  }

  /**
   * Resolves human-readable descriptions for permission types.
   */
  public static getPermissionDescriptor(permission: PermissionType): { name: string; what: string; why: string } {
    switch (permission) {
      case 'media:camera':
        return {
          name: 'Camera',
          what: 'Access your video camera stream',
          why: 'To enable video calling or photo capture'
        };
      case 'media:microphone':
        return {
          name: 'Microphone',
          what: 'Capture your audio and microphone input',
          why: 'To record audio or enable voice communications'
        };
      case 'geolocation':
        return {
          name: 'Precise Location',
          what: 'Access your physical GPS/network geographical coordinates',
          why: 'To provide localized services or map positioning'
        };
      case 'notifications':
        return {
          name: 'System Notifications',
          what: 'Display desktop banners and alert sounds',
          why: 'To alert you to new messages or time-sensitive events'
        };
      case 'clipboard-read':
        return {
          name: 'Clipboard Reading',
          what: 'Read text or data currently in your system clipboard',
          why: 'To paste text or images into web forms'
        };
      default:
        return {
          name: permission,
          what: `Use device capability: ${permission}`,
          why: 'Requested by web application'
        };
    }
  }

  /**
   * Queries existing permission grant state for an origin.
   */
  public checkPermission(origin: string, permission: PermissionType): 'allow' | 'deny' | 'prompt' {
    const originMap = this.sitePermissions.get(origin);
    if (!originMap) return 'prompt';
    const stored = originMap.get(permission);
    if (!stored) return 'prompt';
    return stored.decision;
  }

  /**
   * Creates a formal 4-W permission request for user review.
   */
  public createRequest(
    origin: string,
    permission: PermissionType,
    resolve: (granted: boolean) => void
  ): PermissionRequest {
    const descriptor = PermissionManager.getPermissionDescriptor(permission);
    const requestId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const request: PermissionRequest = {
      id: requestId,
      origin,
      permission,
      details: {
        who: origin,
        what: descriptor.what,
        why: descriptor.why,
        when: 'Choose Allow (Persist), Allow Once (This Session), or Deny'
      },
      timestamp: Date.now()
    };

    this.pendingRequests.set(requestId, { request, resolve });
    return request;
  }

  /**
   * Handles user response to a permission prompt.
   */
  public handleResponse(requestId: string, decision: PermissionDecision): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) return false;

    const { request, resolve } = pending;
    this.pendingRequests.delete(requestId);

    const granted = decision === 'allow' || decision === 'allow-once';

    // If decision is persistent allow or deny, store it
    if (decision === 'allow' || decision === 'deny') {
      let originMap = this.sitePermissions.get(request.origin);
      if (!originMap) {
        originMap = new Map();
        this.sitePermissions.set(request.origin, originMap);
      }
      originMap.set(request.permission, {
        decision,
        grantedAt: Date.now()
      });
      this.save();
    }

    resolve(granted);
    return true;
  }

  /**
   * Retrieves all permissions and their states for an origin.
   */
  public getPermissionsForOrigin(origin: string): Record<string, 'allow' | 'deny' | 'prompt'> {
    const defaultTypes: PermissionType[] = [
      'media:camera',
      'media:microphone',
      'geolocation',
      'notifications',
      'clipboard-read'
    ];
    const result: Record<string, 'allow' | 'deny' | 'prompt'> = {};
    for (const type of defaultTypes) {
      result[type] = this.checkPermission(origin, type);
    }
    return result;
  }

  /**
   * Explicitly sets or changes permission state for an origin.
   */
  public setPermissionState(origin: string, permission: PermissionType, decision: 'allow' | 'deny' | 'prompt'): void {
    if (decision === 'prompt') {
      this.revokePermission(origin, permission);
      return;
    }
    let originMap = this.sitePermissions.get(origin);
    if (!originMap) {
      originMap = new Map();
      this.sitePermissions.set(origin, originMap);
    }
    originMap.set(permission, {
      decision,
      grantedAt: Date.now()
    });
    this.save();
  }

  /**
   * Revokes a site's permission grant.
   */
  public revokePermission(origin: string, permission: PermissionType): void {
    const originMap = this.sitePermissions.get(origin);
    if (originMap) {
      originMap.delete(permission);
      this.save();
    }
  }

  /**
   * Clears all stored permissions.
   */
  public clearAllPermissions(): void {
    this.sitePermissions.clear();
    this.pendingRequests.clear();
    this.save();
  }
}
