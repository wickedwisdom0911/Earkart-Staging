/**
 * Recording Manifest System
 * Manages playlists of recording segments for smooth sequential playback
 */

export interface RecordingSegment {
  id: string;
  name: string;
  url: string;
  duration?: number; // in seconds
  size?: number; // in bytes
  timestamp: string;
  orderIndex: number;
  status: 'recording' | 'uploading' | 'completed' | 'failed';
  type: 'multipart' | 'single_put' | 'backup';
}

export interface RecordingManifest {
  consultationId: string;
  totalSegments: number;
  totalDuration?: number; // in seconds
  segments: RecordingSegment[];
  createdAt: string;
  updatedAt: string;
}

const MANIFEST_STORAGE_KEY = 'recording_manifests';

export class RecordingManifestManager {
  private consultationId: string;

  constructor(consultationId: string) {
    this.consultationId = consultationId;
  }

  /**
   * Get the manifest for the current consultation
   */
  getManifest(): RecordingManifest | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const manifests = this.getAllManifests();
      return manifests[this.consultationId] || null;
    } catch (error) {
      console.error('Failed to get recording manifest:', error);
      return null;
    }
  }

  /**
   * Create or update the manifest
   */
  updateManifest(segments: RecordingSegment[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const manifests = this.getAllManifests();
      const now = new Date().toISOString();
      
      const manifest: RecordingManifest = {
        consultationId: this.consultationId,
        totalSegments: segments.length,
        totalDuration: segments.reduce((total, segment) => total + (segment.duration || 30), 0),
        segments: segments.sort((a, b) => a.orderIndex - b.orderIndex),
        createdAt: manifests[this.consultationId]?.createdAt || now,
        updatedAt: now
      };
      
      manifests[this.consultationId] = manifest;
      localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(manifests));
      
      console.log('📋 [MANIFEST] Updated recording manifest:', {
        consultation: this.consultationId,
        segments: segments.length,
        totalDuration: manifest.totalDuration
      });
    } catch (error) {
      console.error('Failed to update recording manifest:', error);
    }
  }

  /**
   * Add a new segment to the manifest
   */
  addSegment(segment: Omit<RecordingSegment, 'orderIndex'>): void {
    const manifest = this.getManifest();
    const currentSegments = manifest?.segments || [];
    
    const newSegment: RecordingSegment = {
      ...segment,
      orderIndex: currentSegments.length
    };
    
    this.updateManifest([...currentSegments, newSegment]);
  }

  /**
   * Update the status of a specific segment
   */
  updateSegmentStatus(segmentId: string, status: RecordingSegment['status'], url?: string): void {
    const manifest = this.getManifest();
    if (!manifest) return;
    
    const updatedSegments = manifest.segments.map(segment => {
      if (segment.id === segmentId) {
        return {
          ...segment,
          status,
          url: url || segment.url
        };
      }
      return segment;
    });
    
    this.updateManifest(updatedSegments);
  }

  /**
   * Get all segments that are ready for playback
   */
  getPlayableSegments(): RecordingSegment[] {
    const manifest = this.getManifest();
    if (!manifest) return [];
    
    return manifest.segments
      .filter(segment => segment.status === 'completed' && segment.url !== 'Processing...')
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * Generate an M3U8 playlist for HLS-style playback
   */
  generateM3U8Playlist(): string {
    const playableSegments = this.getPlayableSegments();
    
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:3\n';
    playlist += '#EXT-X-TARGETDURATION:60\n'; // Max 60 seconds per segment
    playlist += '#EXT-X-MEDIA-SEQUENCE:0\n';
    
    playableSegments.forEach(segment => {
      const duration = segment.duration || 30;
      playlist += `#EXTINF:${duration.toFixed(1)},\n`;
      playlist += `${segment.url}\n`;
    });
    
    playlist += '#EXT-X-ENDLIST\n';
    return playlist;
  }

  /**
   * Get a data URL for the M3U8 playlist
   */
  getPlaylistDataUrl(): string {
    const playlist = this.generateM3U8Playlist();
    return `data:application/vnd.apple.mpegurl;charset=utf-8,${encodeURIComponent(playlist)}`;
  }

  /**
   * Clean up manifest when consultation ends
   */
  cleanup(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const manifests = this.getAllManifests();
      delete manifests[this.consultationId];
      localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(manifests));
      
      console.log('🧹 [MANIFEST] Cleaned up manifest for consultation:', this.consultationId);
    } catch (error) {
      console.error('Failed to cleanup recording manifest:', error);
    }
  }

  /**
   * Generate a combined recording URL that can play all segments sequentially
   */
  getCombinedPlaybackUrl(): string | null {
    const playableSegments = this.getPlayableSegments();
    if (playableSegments.length === 0) return null;
    
    // For browsers that support M3U8, return the playlist
    if (this.supportsHLS()) {
      return this.getPlaylistDataUrl();
    }
    
    // Fallback: return the first segment URL
    // TODO: Implement client-side segment stitching for better UX
    return playableSegments[0]?.url || null;
  }

  /**
   * Check if the browser supports HLS playback
   */
  private supportsHLS(): boolean {
    if (typeof window === 'undefined') return false;
    
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  }

  /**
   * Get all manifests from localStorage
   */
  private getAllManifests(): Record<string, RecordingManifest> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(MANIFEST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse recording manifests:', error);
      return {};
    }
  }
}

/**
 * Helper function to create a manifest manager
 */
export function createRecordingManifest(consultationId: string): RecordingManifestManager {
  return new RecordingManifestManager(consultationId);
}

/**
 * Helper function to convert localStorage recordings to manifest format
 */
export function migrateLocalStorageToManifest(consultationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storageKey = `recordings_${consultationId}`;
    const savedRecordings = localStorage.getItem(storageKey);
    
    if (!savedRecordings) return;
    
    const recordings = JSON.parse(savedRecordings);
    const manifest = createRecordingManifest(consultationId);
    
    const segments: RecordingSegment[] = recordings.map((recording: any, index: number) => ({
      id: recording.id || `segment-${index}`,
      name: recording.name || `Segment ${index + 1}`,
      url: recording.url,
      duration: 30, // Default assumption
      timestamp: recording.timestamp || new Date().toISOString(),
      orderIndex: index,
      status: recording.url === 'Processing...' ? 'uploading' : 'completed',
      type: recording.type === 'backup' ? 'backup' : 'multipart'
    }));
    
    manifest.updateManifest(segments);
    
    console.log('🔄 [MANIFEST] Migrated localStorage recordings to manifest:', segments.length);
  } catch (error) {
    console.error('Failed to migrate localStorage to manifest:', error);
  }
}

