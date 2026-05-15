/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  🧠 AURELIA — PERSISTENCE BRIDGE (PHASE J3)                  ║
 * ║  Sovereign Vault · IndexedDB · Zero-Jank State              ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 * 🛡️ GOVERNANCE: Memory Sovereignty.
 * 🛡️ PERFORMANCE: Non-blocking asynchronous persistence.
 */

export class PersistenceBridge {
    private static instance: PersistenceBridge | null = null;
    private readonly dbName = 'SantisSovereignVault';
    private readonly storeName = 'experience_state';
    private readonly dbVersion = 1;
    private db: IDBDatabase | null = null;

    private constructor() {}

    public static getInstance(): PersistenceBridge {
        if (!this.instance) this.instance = new PersistenceBridge();
        return this.instance;
    }

    /**
     * Initializes the Sovereign Vault database.
     */
    public async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('🛡️ [Persistence Bridge] Vault access denied:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('🛡️ [Persistence Bridge] Sovereign Vault Online.');
                resolve();
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Saves state to the vault asynchronously.
     */
    public async save(key: string, data: any): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                // Simple Obfuscation (Base64)
                const payload = btoa(JSON.stringify(data));
                const request = store.put(payload, key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Loads state from the vault.
     */
    public async load(key: string): Promise<any | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);

                request.onsuccess = () => {
                    if (request.result) {
                        try {
                            const decoded = JSON.parse(atob(request.result));
                            resolve(decoded);
                        } catch (e) {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => reject(request.error);
            } catch (err) {
                reject(err);
            }
        });
    }
}
