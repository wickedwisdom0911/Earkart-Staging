"use client";

interface ChunkData {
  id: string;
  consultationId: string;
  sessionId: string;
  chunkIndex: number;
  timestamp: number;
  blob: Blob;
  uploaded: boolean;
  uploadId?: string;
  partNumber?: number;
}

class ChunkStorage {
  private dbName = 'RecordingChunks';
  private version = 1;
  private storeName = 'chunks';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('consultationId', 'consultationId', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('uploaded', 'uploaded', { unique: false });
        }
      };
    });
  }

  async saveChunk(chunk: ChunkData): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(chunk);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnuploadedChunks(consultationId: string): Promise<ChunkData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('consultationId');
      
      const request = index.getAll(consultationId);
      request.onsuccess = () => {
        const chunks = request.result.filter(chunk => !chunk.uploaded);
        resolve(chunks.sort((a, b) => a.chunkIndex - b.chunkIndex));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markChunkUploaded(chunkId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(chunkId);
      getRequest.onsuccess = () => {
        const chunk = getRequest.result;
        if (chunk) {
          chunk.uploaded = true;
          const putRequest = store.put(chunk);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearOldChunks(olderThanHours: number = 24): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.timestamp < cutoff && cursor.value.uploaded) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllChunksBySession(consultationId: string, sessionId: string): Promise<ChunkData[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('sessionId');
      
      const request = index.getAll(sessionId);
      request.onsuccess = () => {
        const chunks = request.result
          .filter(chunk => chunk.consultationId === consultationId)
          .sort((a, b) => a.chunkIndex - b.chunkIndex);
        resolve(chunks);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const chunkStorage = new ChunkStorage();
export type { ChunkData };
