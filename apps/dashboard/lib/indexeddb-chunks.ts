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
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Chunks store
        if (!db.objectStoreNames.contains('chunks')) {
          const chunksStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunksStore.createIndex('sessionId', 'sessionId', { unique: false });
          chunksStore.createIndex('uploadId', 'uploadId', { unique: false });
          chunksStore.createIndex('uploaded', 'uploaded', { unique: false });
          chunksStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sessions metadata store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
          sessionsStore.createIndex('uploadId', 'uploadId', { unique: false });
          sessionsStore.createIndex('status', 'status', { unique: false });
          sessionsStore.createIndex('lastActivity', 'lastActivity', { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Failed to initialize IndexedDB');
    return this.db;
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
}

// Singleton instance
export const chunkStorage = new ChunkStorage();

// Initialize on import
chunkStorage.init().catch(console.error);