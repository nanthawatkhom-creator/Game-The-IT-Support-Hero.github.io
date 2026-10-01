import { FBXModelConfig, CustomCharacterInstance, FBXCharacterManager, FBXAnimationSlots } from '../game/FBXCharacterManager';

export interface SavedSlotData {
  name: string;
  source: 'upload' | 'embedded';
  buffer?: ArrayBuffer; // only present if source === 'upload'
  isWithoutSkin?: boolean;
}

export interface SavedCharacterRecord {
  id: 'active_custom_character';
  updatedAt: number;
  baseModelFileName: string;
  baseModelBuffer: ArrayBuffer;
  slots: {
    idle?: SavedSlotData;
    walk?: SavedSlotData;
    run?: SavedSlotData;
    attack?: SavedSlotData;
  };
  config: FBXModelConfig;
}

const DB_NAME = 'OfficeHero3DStorage';
const DB_VERSION = 1;
const STORE_NAME = 'custom_character';

class CharacterStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save the complete character model, animation files, and transform configuration
   */
  public async saveCharacter(record: Omit<SavedCharacterRecord, 'id' | 'updatedAt'>): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const dataToSave: SavedCharacterRecord = {
          ...record,
          id: 'active_custom_character',
          updatedAt: Date.now(),
        };

        const req = store.put(dataToSave);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save character to IndexedDB:', err);
    }
  }

  /**
   * Load the saved character record from storage
   */
  public async loadCharacter(): Promise<SavedCharacterRecord | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('active_custom_character');

        req.onsuccess = () => {
          resolve((req.result as SavedCharacterRecord) || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to load character from IndexedDB:', err);
      return null;
    }
  }

  /**
   * Clear the saved character from storage
   */
  public async clearCharacter(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete('active_custom_character');

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to clear character from IndexedDB:', err);
    }
  }

  /**
   * Helper: ArrayBuffer to Base64
   */
  public arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Helper: Base64 to ArrayBuffer
   */
  public base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Serialize character record to portable JSON bundle
   */
  public serializePackage(record: Omit<SavedCharacterRecord, 'id' | 'updatedAt'>): any {
    const serializedSlots: Record<string, any> = {};
    for (const [key, slot] of Object.entries(record.slots)) {
      if (slot) {
        serializedSlots[key] = {
          name: slot.name,
          source: slot.source,
          isWithoutSkin: slot.isWithoutSkin,
          base64: slot.buffer ? this.arrayBufferToBase64(slot.buffer) : undefined,
        };
      }
    }
    return {
      version: 1,
      createdAt: Date.now(),
      baseModelFileName: record.baseModelFileName,
      baseModelBase64: this.arrayBufferToBase64(record.baseModelBuffer),
      slots: serializedSlots,
      config: record.config,
    };
  }

  /**
   * Deserialize portable JSON bundle back to SavedCharacterRecord
   */
  public deserializePackage(pkg: any): SavedCharacterRecord {
    const slots: SavedCharacterRecord['slots'] = {};
    for (const [key, slot] of Object.entries(pkg.slots || {})) {
      const s = slot as any;
      if (s) {
        slots[key as 'idle' | 'walk' | 'run' | 'attack'] = {
          name: s.name,
          source: s.source,
          isWithoutSkin: s.isWithoutSkin,
          buffer: s.base64 ? this.base64ToArrayBuffer(s.base64) : undefined,
        };
      }
    }
    return {
      id: 'active_custom_character',
      updatedAt: pkg.createdAt || Date.now(),
      baseModelFileName: pkg.baseModelFileName || 'default_model.fbx',
      baseModelBuffer: this.base64ToArrayBuffer(pkg.baseModelBase64),
      slots,
      config: pkg.config,
    };
  }

  /**
   * Load the default bundled character package from public/character/default_character.json
   * Guarantees that any new machine, browser, or visitor loads the custom character automatically!
   */
  public async loadDefaultBundledCharacter(): Promise<SavedCharacterRecord | null> {
    try {
      const candidatePaths = [
        './character/default_character.json',
        '/character/default_character.json',
        'character/default_character.json',
      ];
      for (const p of candidatePaths) {
        try {
          const res = await fetch(p, { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            if (data && data.baseModelBase64) {
              return this.deserializePackage(data);
            }
          }
        } catch {
          // Continue to next path
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Reconstructs a full CustomCharacterInstance from a saved record
   */
  public async restoreInstanceFromRecord(
    record: SavedCharacterRecord
  ): Promise<CustomCharacterInstance> {
    // 1. Parse base model group
    const baseGroup = await FBXCharacterManager.parseFBX(record.baseModelBuffer);
    FBXCharacterManager.prepareFBXMesh(baseGroup);

    // 2. Resolve animations
    const embeddedClips = baseGroup.animations || [];
    const clips: FBXAnimationSlots = {};

    const resolveSlot = async (slotKey: 'idle' | 'walk' | 'run' | 'attack') => {
      const slotData = record.slots[slotKey];
      if (!slotData) return;

      if (slotData.source === 'upload' && slotData.buffer) {
        try {
          const animGroup = await FBXCharacterManager.parseFBX(slotData.buffer);
          if (animGroup.animations && animGroup.animations.length > 0) {
            clips[slotKey] = animGroup.animations[0];
            return;
          }
        } catch (e) {
          console.warn(`Failed to parse saved animation for slot ${slotKey}:`, e);
        }
      }

      if (slotData.source === 'embedded' && slotData.name) {
        const found = embeddedClips.find((c) => c.name === slotData.name);
        if (found) {
          clips[slotKey] = found;
          return;
        }
      }
    };

    await Promise.all([
      resolveSlot('idle'),
      resolveSlot('walk'),
      resolveSlot('run'),
      resolveSlot('attack'),
    ]);

    // If no idle is set but base model has an animation, assign it as idle
    if (!clips.idle && embeddedClips.length > 0) {
      clips.idle = embeddedClips[0];
    }

    // 3. Create instance using saved config
    return FBXCharacterManager.createCharacterInstance(baseGroup, clips, record.config);
  }
}

export const characterStorage = new CharacterStorage();
