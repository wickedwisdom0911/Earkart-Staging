"use client";

// IndexedDB utility for persisting recording data across page refreshes

export interface StoredRecordingSession {
  sessionId: string;
  consultationId: string;
  uploadId: string;
  s3Key?: string;
  partSize: number;
  filename: string;
  mimeType: string;
  nextPartNumber: number;
  uploadedParts: Array<{ partNumber: number; etag: string }>;
  pendingChunks: Array<{ 
    id: string; 
    partNumber: number; 
    blob: Blob;
    timestamp: number;
  }>;
  isActive: boolean;
  createdAt: number;
  lastUpdated: number;
}

export interface StoredChunk {
  id: string;
  sessionId: string;
  partNumber: number;
  blob: Blob;
  timestamp: number;
  isUploaded: boolean;
}

const DB_NAME = 'omni-recording-storage';
const DB_VERSION = 1;
const SESSIONS_STORE = 'recording-sessions';
const CHUNKS_STORE = 'recording-chunks';

class RecordingStorage {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, {
            keyPath: 'sessionId'
          });
          sessionsStore.createIndex('consultationId', 'consultationId', { unique: false });
          sessionsStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Chunks store
        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunksStore = db.createObjectStore(CHUNKS_STORE, {
            keyPath: 'id'
          });
          chunksStore.createIndex('sessionId', 'sessionId', { unique: false });
          chunksStore.createIndex('partNumber', 'partNumber', { unique: false });
          chunksStore.createIndex('isUploaded', 'isUploaded', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Session management
  async saveSession(session: StoredRecordingSession): Promise<void> {
    const store = await this.getStore(SESSIONS_STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...session,
        lastUpdated: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionId: string): Promise<StoredRecordingSession | null> {
    const store = await this.getStore(SESSIONS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveSession(consultationId: string): Promise<StoredRecordingSession | null> {
    const store = await this.getStore(SESSIONS_STORE);
    return new Promise((resolve, reject) => {
      const index = store.index('consultationId');
      const request = index.getAll(consultationId);
      request.onsuccess = () => {
        const sessions = request.result.filter((s: StoredRecordingSession) => s.isActive);
        resolve(sessions.length > 0 ? sessions[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deactivateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.isActive = false;
      await this.saveSession(session);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const store = await this.getStore(SESSIONS_STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Chunk management
  async saveChunk(chunk: StoredChunk): Promise<void> {
    const store = await this.getStore(CHUNKS_STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(chunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChunk(id: string): Promise<StoredChunk | null> {
    const store = await this.getStore(CHUNKS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionChunks(sessionId: string): Promise<StoredChunk[]> {
    const store = await this.getStore(CHUNKS_STORE);
    return new Promise((resolve, reject) => {
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChunks(sessionId: string): Promise<StoredChunk[]> {
    const chunks = await this.getSessionChunks(sessionId);
    return chunks.filter(chunk => !chunk.isUploaded);
  }

  async markChunkUploaded(id: string): Promise<void> {
    const chunk = await this.getChunk(id);
    if (chunk) {
      chunk.isUploaded = true;
      await this.saveChunk(chunk);
    }
  }

  async deleteChunk(id: string): Promise<void> {
    const store = await this.getStore(CHUNKS_STORE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSessionChunks(sessionId: string): Promise<void> {
    const chunks = await this.getSessionChunks(sessionId);
    const store = await this.getStore(CHUNKS_STORE, 'readwrite');
    
    await Promise.all(chunks.map(chunk => 
      new Promise<void>((resolve, reject) => {
        const request = store.delete(chunk.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ));
  }

  // Cleanup old sessions (older than 24 hours)
  async cleanupOldSessions(): Promise<void> {
    const store = await this.getStore(SESSIONS_STORE, 'readwrite');
    const chunksStore = await this.getStore(CHUNKS_STORE, 'readwrite');
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = async () => {
        const sessions = request.result.filter((s: StoredRecordingSession) => 
          s.lastUpdated < cutoff || !s.isActive
        );

        // Delete old sessions and their chunks
        for (const session of sessions) {
          await this.deleteSessionChunks(session.sessionId);
          await this.deleteSession(session.sessionId);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{ sessions: number; chunks: number; totalSize: number }> {
    const [sessions, chunks] = await Promise.all([
      this.getAllSessions(),
      this.getAllChunks()
    ]);

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.blob.size, 0);

    return {
      sessions: sessions.length,
      chunks: chunks.length,
      totalSize
    };
  }

  // Download recording locally by combining chunks
  async downloadRecordingLocally(sessionId: string, filename?: string): Promise<void> {
    try {
      console.log(`💾 [DOWNLOAD] Starting local download for session ${sessionId}`);
      
      // Get all chunks for this session, sorted by timestamp
      const chunks = await this.getSessionChunks(sessionId);
      if (chunks.length === 0) {
        throw new Error('No chunks found for this session');
      }

      // Sort chunks by timestamp to ensure correct order
      chunks.sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`💾 [DOWNLOAD] Found ${chunks.length} chunks, total size: ${(chunks.reduce((sum, chunk) => sum + chunk.blob.size, 0) / 1024 / 1024).toFixed(2)}MB`);

      // Combine all chunks into a single blob
      const combinedBlob = new Blob(
        chunks.map(chunk => chunk.blob),
        { type: chunks[0]?.blob.type || 'video/webm' }
      );

      // Create download link
      const url = URL.createObjectURL(combinedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `recording-${sessionId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log(`✅ [DOWNLOAD] Successfully downloaded recording: ${link.download}`);
    } catch (error) {
      console.error('❌ [DOWNLOAD] Failed to download recording locally:', error);
      throw error;
    }
  }

  // Check if a session has chunks available for local download
  async hasLocalRecording(sessionId: string): Promise<boolean> {
    try {
      const chunks = await this.getSessionChunks(sessionId);
      return chunks.length > 0;
    } catch (error) {
      console.error('❌ [CHECK] Failed to check for local recording:', error);
      return false;
    }
  }

  // Get all sessions with local recordings available
  async getSessionsWithLocalRecordings(): Promise<{ sessionId: string; chunkCount: number; totalSize: number }[]> {
    try {
      const sessions = await this.getAllSessions();
      const results = [];
      
      for (const session of sessions) {
        const chunks = await this.getSessionChunks(session.sessionId);
        if (chunks.length > 0) {
          const totalSize = chunks.reduce((sum, chunk) => sum + chunk.blob.size, 0);
          results.push({
            sessionId: session.sessionId,
            chunkCount: chunks.length,
            totalSize
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ [CHECK] Failed to get sessions with local recordings:', error);
      return [];
    }
  }

  public async getAllSessions(): Promise<StoredRecordingSession[]> {
    const store = await this.getStore(SESSIONS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllChunks(): Promise<StoredChunk[]> {
    const store = await this.getStore(CHUNKS_STORE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const recordingStorage = new RecordingStorage();

// Generate unique IDs
export function generateChunkId(): string {
  return `chunk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
