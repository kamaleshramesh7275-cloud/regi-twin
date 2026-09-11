/**
 * PhysioTwin Offline Storage & Mutation Sync Engine
 * Built on IndexedDB for robust offline-first performance, caching, and replay.
 */

const DB_NAME = "physiotwin_offline_db";
const DB_VERSION = 1;
const CACHE_STORE = "offline_cache";
const MUTATION_STORE = "mutation_queue";

interface CacheRecord<T = any> {
  key: string;
  data: T;
  timestamp: number;
}

export interface OfflineMutation {
  id?: number;
  type: "workout" | "meal" | "water" | "pain" | "survey" | "vitals";
  payload: any;
  timestamp: number;
  retryCount: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        reject(new Error("IndexedDB not supported in this environment"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(MUTATION_STORE)) {
          const mStore = db.createObjectStore(MUTATION_STORE, { keyPath: "id", autoIncrement: true });
          mStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export const offlineStorage = {
  /**
   * Save any JSON serializable payload to offline IndexedDB cache
   */
  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction(CACHE_STORE, "readwrite");
      const store = tx.objectStore(CACHE_STORE);
      const record: CacheRecord<T> = {
        key,
        data,
        timestamp: Date.now()
      };
      store.put(record);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem(`pt_cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {
        console.warn("Local storage cache fallback error:", e);
      }
    }
  },

  /**
   * Retrieve cached data by key
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const db = await getDB();
      const tx = db.transaction(CACHE_STORE, "readonly");
      const store = tx.objectStore(CACHE_STORE);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.data as T);
          } else {
            // Check localStorage fallback
            const local = localStorage.getItem(`pt_cache_${key}`);
            if (local) {
              try {
                const parsed = JSON.parse(local);
                resolve(parsed.data as T);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      const local = localStorage.getItem(`pt_cache_${key}`);
      if (local) {
        try {
          return JSON.parse(local).data as T;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  /**
   * Queue a write action when the device is offline
   */
  async enqueueMutation(type: OfflineMutation["type"], payload: any): Promise<number> {
    try {
      const db = await getDB();
      const tx = db.transaction(MUTATION_STORE, "readwrite");
      const store = tx.objectStore(MUTATION_STORE);
      const item: OfflineMutation = {
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0
      };
      const req = store.add(item);
      return new Promise((resolve, reject) => {
        req.onsuccess = () => {
          window.dispatchEvent(new CustomEvent("offline-queue-changed"));
          resolve(req.result as number);
        };
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("Failed to enqueue offline mutation:", err);
      return -1;
    }
  },

  /**
   * Get all queued offline mutations
   */
  async getPendingMutations(): Promise<OfflineMutation[]> {
    try {
      const db = await getDB();
      const tx = db.transaction(MUTATION_STORE, "readonly");
      const store = tx.objectStore(MUTATION_STORE);
      const request = store.getAll();
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  /**
   * Remove a successfully synced mutation
   */
  async deleteMutation(id: number): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction(MUTATION_STORE, "readwrite");
      tx.objectStore(MUTATION_STORE).delete(id);
      return new Promise((resolve) => {
        tx.oncomplete = () => {
          window.dispatchEvent(new CustomEvent("offline-queue-changed"));
          resolve();
        };
      });
    } catch (err) {
      console.warn("Delete mutation error:", err);
    }
  },

  /**
   * Replay and flush all queued mutations with the backend API
   */
  async flushQueue(apiClient: any): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const mutations = await this.getPendingMutations();
    if (mutations.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const m of mutations) {
      try {
        if (m.type === "workout" && apiClient.logWorkout) {
          await apiClient.logWorkout(m.payload.userId || "test-user", m.payload);
        } else if (m.type === "meal" && apiClient.logMealItem) {
          await apiClient.logMealItem(m.payload.userId || "test-user", m.payload);
        } else if (m.type === "water" && apiClient.logWaterIntake) {
          await apiClient.logWaterIntake(m.payload.userId || "test-user", m.payload.amountMl || 250);
        } else if (m.type === "pain" && apiClient.logPainEntry) {
          await apiClient.logPainEntry(m.payload);
        } else if (m.type === "survey" && apiClient.submitReadinessSurvey) {
          await apiClient.submitReadinessSurvey(m.payload.userId || "test-user", m.payload);
        }
        if (m.id) {
          await this.deleteMutation(m.id);
        }
        synced++;
      } catch (err) {
        console.warn(`Sync failed for offline item #${m.id} (${m.type}):`, err);
        failed++;
      }
    }

    return { synced, failed };
  }
};
