"use client";

/**
 * IndexedDB storage for recording chunks and session metadata
 * Provides persistence across browser refreshes and crashes
 */

export interface ChunkData {
  id: string; // unique identifier: `${sessionId}_${chunkIndex}`
  sessionId: string; // consultation/recording session ID
  uploadId: string; // S3 multipart upload ID
  chunkIndex: number; // sequential chunk number (0-based)
  partNumber: number; // S3 part number (1-based)
  timestamp: number; // when chunk was created
  blob: Blob; // actual video/audio data
  uploaded: boolean; // whether successfully uploaded to S3
  etag?: string; // S3 ETag if uploaded
  uploadAttempts: number; // retry counter
  lastUploadAttempt?: number; // timestamp of last upload try
}

export interface SessionMetadata {
  sessionId: string;
  uploadId: string;
  s3Key: string;
  filename: string;
  mimeType: string;
  partSize: number;
  status: 'recording' | 'stopping' | 'completed' | 'aborted';
  createdAt: number;
  lastActivity: number;
  uploadedParts: Array<{ partNumber: number; etag: string }>;
  nextPartNumber: number;
}

class ChunkStorage {
  private dbName = 'RecordingChunks';
  private version = 2; // Updated to match the current schema
  private db: IDBDatabase | null = null;

  private requiredStores: Array<{ name: string; indexes?: Array<{ name: string; keyPath: string; options?: IDBIndexParameters }> }> = [
    {
      name: 'chunks',
      indexes: [
        { name: 'sessionId', keyPath: 'sessionId' },
        { name: 'uploadId', keyPath: 'uploadId' },
        { name: 'uploaded', keyPath: 'uploaded' },
        { name: 'timestamp', keyPath: 'timestamp' },
      ],
    },
    {
      name: 'sessions',
      indexes: [
        { name: 'uploadId', keyPath: 'uploadId' },
        { name: 'status', keyPath: 'status' },
        { name: 'lastActivity', keyPath: 'lastActivity' },
      ],
    },
  ];

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ [CHUNK_STORAGE] IndexedDB open failed:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ [CHUNK_STORAGE] IndexedDB opened successfully, version:', this.db.version);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;
        
        console.log(`🔄 [CHUNK_STORAGE] Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Ensure all required stores and indexes exist
        for (const storeDef of this.requiredStores) {
          let store: IDBObjectStore;
          if (!db.objectStoreNames.contains(storeDef.name)) {
            console.log(`📦 [CHUNK_STORAGE] Creating object store: ${storeDef.name}`);
            store = db.createObjectStore(
              storeDef.name,
              storeDef.name === 'chunks' ? { keyPath: 'id' } : { keyPath: 'sessionId' }
            );
          } else {
            store = (request.transaction as IDBTransaction).objectStore(storeDef.name);
          }
          if (storeDef.indexes) {
            for (const idx of storeDef.indexes) {
              if (!store.indexNames.contains(idx.name)) {
                console.log(`📇 [CHUNK_STORAGE] Creating index: ${idx.name} on ${storeDef.name}`);
                store.createIndex(idx.name, idx.keyPath, idx.options || { unique: false });
              }
            }
          }
        }
      };
      
      request.onblocked = () => {
        console.warn('⚠️ [CHUNK_STORAGE] IndexedDB upgrade blocked by another tab');
        // Don't reject, just wait - the other tab will complete the upgrade
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      try {
        await this.init();
      } catch (error) {
        // If version conflict, try to recreate the database
        if (error instanceof Error && error.name === 'VersionError') {
          console.warn('⚠️ [CHUNK_STORAGE] Version conflict detected, recreating database');
          await this.recreateDatabase();
        } else {
          throw error;
        }
      }
    }
    
    if (!this.db) throw new Error('Failed to initialize IndexedDB');

    // Validate stores; if any missing (old schema), recreate DB safely
    const missing = this.requiredStores.some(({ name }) => !this.db!.objectStoreNames.contains(name));
    if (missing) {
      console.warn('⚠️ [CHUNK_STORAGE] Missing required stores, recreating database');
      await this.recreateDatabase();
    }
    return this.db!;
  }

  private async recreateDatabase(): Promise<void> {
    // Close existing
    try { this.db?.close(); } catch {}
    this.db = null;
    
    // Try to delete the existing database
    await new Promise<void>((resolve) => {
      const deleteReq = indexedDB.deleteDatabase(this.dbName);
      deleteReq.onsuccess = () => {
        console.log('🗑️ [CHUNK_STORAGE] Database deleted successfully');
        resolve();
      };
      deleteReq.onerror = () => {
        console.warn('⚠️ [CHUNK_STORAGE] Database deletion failed, continuing anyway');
        resolve();
      };
      deleteReq.onblocked = () => {
        console.warn('⚠️ [CHUNK_STORAGE] Database deletion blocked, continuing anyway');
        resolve();
      };
    });
    
    // Reset version to current and reinitialize
    this.version = 2;
    await this.init();
  }

  // Chunk management
  async saveChunk(chunk: Omit<ChunkData, 'uploadAttempts'>): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks'], 'readwrite');
    const store = transaction.objectStore('chunks');
    
    const chunkWithAttempts: ChunkData = {
      ...chunk,
      uploadAttempts: 0
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(chunkWithAttempts);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`💾 [CHUNK_STORAGE] Saved chunk ${chunk.chunkIndex} for session ${chunk.sessionId}`);
  }

  async getChunk(chunkId: string): Promise<ChunkData | null> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks'], 'readonly');
    const store = transaction.objectStore('chunks');

    return new Promise<ChunkData | null>((resolve, reject) => {
      const request = store.get(chunkId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnuploadedChunks(sessionId?: string): Promise<ChunkData[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks'], 'readonly');
    const store = transaction.objectStore('chunks');

    return new Promise<ChunkData[]>((resolve, reject) => {
      const chunks: ChunkData[] = [];
      let request: IDBRequest;

      if (sessionId) {
        const index = store.index('sessionId');
        request = index.openCursor(IDBKeyRange.only(sessionId));
      } else {
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const chunk = cursor.value as ChunkData;
          if (!chunk.uploaded) {
            chunks.push(chunk);
          }
          cursor.continue();
        } else {
          // Sort by chunk index for proper upload order
          chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
          resolve(chunks);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async markChunkUploaded(chunkId: string, etag: string): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks'], 'readwrite');
    const store = transaction.objectStore('chunks');

    const chunk = await new Promise<ChunkData | null>((resolve, reject) => {
      const request = store.get(chunkId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!chunk) {
      console.warn(`⚠️ [CHUNK_STORAGE] Chunk ${chunkId} not found for upload marking`);
      return;
    }

    chunk.uploaded = true;
    chunk.etag = etag;

    await new Promise<void>((resolve, reject) => {
      const request = store.put(chunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ [CHUNK_STORAGE] Marked chunk ${chunk.chunkIndex} as uploaded with ETag ${etag.substring(0, 8)}...`);
  }

  async incrementUploadAttempts(chunkId: string): Promise<number> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks'], 'readwrite');
    const store = transaction.objectStore('chunks');

    const chunk = await new Promise<ChunkData | null>((resolve, reject) => {
      const request = store.get(chunkId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!chunk) {
      console.warn(`⚠️ [CHUNK_STORAGE] Chunk ${chunkId} not found for attempt increment`);
      return 0;
    }

    chunk.uploadAttempts += 1;
    chunk.lastUploadAttempt = Date.now();

    await new Promise<void>((resolve, reject) => {
      const request = store.put(chunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return chunk.uploadAttempts;
  }

  // Session metadata management
  async saveSession(session: SessionMetadata): Promise<void> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    const sessionToSave = {
      ...session,
      lastActivity: Date.now()
    };

    console.log(`💾 [SESSION_STORAGE] Attempting to save session:`, {
      sessionId: session.sessionId,
      status: session.status,
      uploadId: session.uploadId.substring(0, 12) + '...',
      createdAt: new Date(session.createdAt).toISOString()
    });

    await new Promise<void>((resolve, reject) => {
      const request = store.put(sessionToSave);
      request.onsuccess = () => {
        console.log(`✅ [SESSION_STORAGE] IndexedDB PUT operation successful for ${session.sessionId}`);
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ [SESSION_STORAGE] IndexedDB PUT operation failed for ${session.sessionId}:`, request.error);
        reject(request.error);
      };
    });

    console.log(`📋 [SESSION_STORAGE] Session save complete for ${session.sessionId}`);
  }

  async getSession(sessionId: string): Promise<SessionMetadata | null> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');

    console.log(`🔍 [SESSION_STORAGE] Looking up session: ${sessionId}`);

    return new Promise<SessionMetadata | null>((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        const result = request.result || null;
        console.log(`🔍 [SESSION_STORAGE] Lookup result for ${sessionId}:`, result ? {
          found: true,
          status: result.status,
          uploadId: result.uploadId.substring(0, 12) + '...',
          lastActivity: new Date(result.lastActivity).toISOString()
        } : { found: false });
        resolve(result);
      };
      request.onerror = () => {
        console.error(`❌ [SESSION_STORAGE] Lookup failed for ${sessionId}:`, request.error);
        reject(request.error);
      };
    });
  }

  async getActiveSessions(): Promise<SessionMetadata[]> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');

    return new Promise<SessionMetadata[]>((resolve, reject) => {
      const sessions: SessionMetadata[] = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const session = cursor.value as SessionMetadata;
          if (session.status === 'recording' || session.status === 'stopping') {
            sessions.push(session);
          }
          cursor.continue();
        } else {
          resolve(sessions);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateSessionStatus(sessionId: string, status: SessionMetadata['status']): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      console.warn(`⚠️ [SESSION_STORAGE] Session ${sessionId} not found for status update`);
      return;
    }

    session.status = status;
    session.lastActivity = Date.now();
    await this.saveSession(session);

    console.log(`🔄 [SESSION_STORAGE] Updated session ${sessionId} status to ${status}`);
  }

  async addUploadedPart(sessionId: string, partNumber: number, etag: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      console.warn(`⚠️ [SESSION_STORAGE] Session ${sessionId} not found for part addition`);
      return;
    }

    // Avoid duplicates
    const existingPart = session.uploadedParts.find(p => p.partNumber === partNumber);
    if (!existingPart) {
      session.uploadedParts.push({ partNumber, etag });
      session.uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
    }

    // Bump nextPartNumber to maintain ascending, non-duplicate sequence across refresh/recovery
    if (session.nextPartNumber <= partNumber) {
      session.nextPartNumber = partNumber + 1;
    }

    session.lastActivity = Date.now();
    await this.saveSession(session);

    console.log(`📝 [SESSION_STORAGE] Added uploaded part ${partNumber} to session ${sessionId}`);
  }

  // Cleanup operations
  async clearSession(sessionId: string): Promise<void> {
    const db = await this.ensureDb();
    
    // Clear chunks for this session
    const chunksTransaction = db.transaction(['chunks'], 'readwrite');
    const chunksStore = chunksTransaction.objectStore('chunks');
    const chunksIndex = chunksStore.index('sessionId');
    
    await new Promise<void>((resolve, reject) => {
      const request = chunksIndex.openCursor(IDBKeyRange.only(sessionId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });

    // Clear session metadata
    const sessionTransaction = db.transaction(['sessions'], 'readwrite');
    const sessionStore = sessionTransaction.objectStore('sessions');
    
    await new Promise<void>((resolve, reject) => {
      const request = sessionStore.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`🧹 [CHUNK_STORAGE] Cleared all data for session ${sessionId}`);
  }

  async clearOldChunks(olderThanHours: number = 24): Promise<void> {
    const db = await this.ensureDb();
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    const transaction = db.transaction(['chunks', 'sessions'], 'readwrite');
    const chunksStore = transaction.objectStore('chunks');
    const sessionsStore = transaction.objectStore('sessions');
    
    // Clear old chunks
    await new Promise<void>((resolve, reject) => {
      const request = chunksStore.openCursor();
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const chunk = cursor.value as ChunkData;
          if (chunk.timestamp < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🧹 [CHUNK_STORAGE] Deleted ${deletedCount} old chunks`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });

    // Clear old sessions
    await new Promise<void>((resolve, reject) => {
      const request = sessionsStore.openCursor();
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const session = cursor.value as SessionMetadata;
          if (session.lastActivity < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🧹 [SESSION_STORAGE] Deleted ${deletedCount} old sessions`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageStats(): Promise<{ chunks: number; sessions: number; totalSizeMB: number }> {
    const db = await this.ensureDb();
    const transaction = db.transaction(['chunks', 'sessions'], 'readonly');
    
    const chunksStore = transaction.objectStore('chunks');
    const sessionsStore = transaction.objectStore('sessions');
    
    const chunksCount = await new Promise<number>((resolve, reject) => {
      const request = chunksStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const sessionsCount = await new Promise<number>((resolve, reject) => {
      const request = sessionsStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Calculate approximate size by sampling chunks
    let totalBytes = 0;
    await new Promise<void>((resolve, reject) => {
      const request = chunksStore.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const chunk = cursor.value as ChunkData;
          totalBytes += chunk.blob.size;
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });

    return {
      chunks: chunksCount,
      sessions: sessionsCount,
      totalSizeMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100
    };
  }

  // Get all chunks for a specific session (for downloading/viewing)
  async getAllChunksForSession(sessionId: string): Promise<ChunkData[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        const chunks = request.result.sort((a, b) => a.chunkIndex - b.chunkIndex);
        console.log(`📊 [CHUNK_STORAGE] Retrieved ${chunks.length} chunks for session ${sessionId}`);
        resolve(chunks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (for debugging/reset purposes)
  async clearAllData(): Promise<void> {
    try {
      await this.clearOldChunks(0); // Clear all chunks (0 hours = everything)
      console.log('🧹 [CHUNK_STORAGE] All data cleared successfully');
    } catch (error) {
      console.error('❌ [CHUNK_STORAGE] Failed to clear data:', error);
      throw error;
    }
  }
}

// Singleton instance
export const chunkStorage = new ChunkStorage();

// Initialize on import with error handling
chunkStorage.init().catch((error) => {
  console.error('❌ [CHUNK_STORAGE] Initialization failed:', error);
  // If it's a version error, try to clear and recreate
  if (error instanceof Error && error.name === 'VersionError') {
    console.log('🔄 [CHUNK_STORAGE] Attempting to recover from version error...');
    chunkStorage.clearAllData().then(() => {
      console.log('✅ [CHUNK_STORAGE] Recovery completed, retrying initialization...');
      chunkStorage.init().catch(console.error);
    }).catch(console.error);
  }
});