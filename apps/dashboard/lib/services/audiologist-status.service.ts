import { io, Socket } from "socket.io-client";

export interface AudiologistStatus {
  audiologistId: string; // User ID of the audiologist (UUID)
  isInCall: boolean; // Whether audiologist is currently in a call
  consultationId: string | null; // ID of current consultation (null if not in call)
  lastUpdated: Date | string; // Timestamp of last status update
}

export class AudiologistStatusService {
  private socket: Socket | null = null;
  private statusMap: Map<string, AudiologistStatus> = new Map();
  private listeners: Set<(statuses: AudiologistStatus[]) => void> = new Set();
  private apiBaseUrl: string;
  private token: string | null = null;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Connect to the audiologist status websocket
   * @param token JWT authentication token
   */
  connect(token: string): void {
    // Disconnect existing connection if any
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.token = token;

    // Construct the namespace URL
    const namespaceUrl = `${this.apiBaseUrl.replace(/\/$/, "")}/audiologist-status`;

    // Connect to the namespace with JWT token
    this.socket = io(namespaceUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup all event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on("connect", () => {
      console.log("✅ Connected to audiologist status websocket");
      this.socket?.emit("subscribe_status_updates");
    });

    // Receive all statuses on initial connection
    this.socket.on("all_audiologist_statuses", (statuses: AudiologistStatus[]) => {
      console.log("📊 Received all audiologist statuses:", statuses.length);
      statuses.forEach((s) => {
        console.log(`  - ${s.audiologistId}: ${s.isInCall ? "IN CALL" : "AVAILABLE"}`);
      });
      this.updateStatusMap(statuses);
      this.notifyListeners();
    });

    // Receive real-time status updates
    this.socket.on("audiologist_status_updated", (status: AudiologistStatus) => {
      console.log("🔄 Status updated for audiologist:", status.audiologistId, status.isInCall ? "→ IN CALL" : "→ AVAILABLE");
      this.statusMap.set(status.audiologistId, status);
      this.notifyListeners();
    });

    // Receive specific audiologist status
    this.socket.on("audiologist_status", (status: AudiologistStatus) => {
      console.log("📋 Received audiologist status:", status);
      this.statusMap.set(status.audiologistId, status);
      this.notifyListeners();
    });

    // Subscription confirmation
    this.socket.on("subscribed", (data: { message: string }) => {
      console.log("✅", data.message);
    });

    // Error handling
    this.socket.on("error", (error: { message: string }) => {
      console.error("❌ WebSocket error:", error.message);
    });

    // Disconnection handling
    this.socket.on("disconnect", (reason: string) => {
      console.log("🔌 Disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected, reconnect manually
        this.reconnect();
      }
      // Otherwise, Socket.IO will automatically attempt to reconnect
    });

    // Reconnection handling
    this.socket.on("reconnect", (attemptNumber: number) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      // Resubscribe after reconnection
      this.socket?.emit("subscribe_status_updates");
    });
  }

  /**
   * Update internal status map
   */
  private updateStatusMap(statuses: AudiologistStatus[]): void {
    this.statusMap.clear();
    statuses.forEach((status) => {
      this.statusMap.set(status.audiologistId, status);
    });
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    const allStatuses = Array.from(this.statusMap.values());
    this.listeners.forEach((listener) => {
      try {
        listener(allStatuses);
      } catch (error) {
        console.error("Error in status listener:", error);
      }
    });
  }

  /**
   * Reconnect with current token
   */
  private reconnect(): void {
    if (this.token) {
      this.connect(this.token);
    }
  }

  /**
   * Subscribe to status changes
   * @param callback Function called whenever statuses change
   * @returns Unsubscribe function
   */
  onStatusChange(callback: (statuses: AudiologistStatus[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current statuses
    callback(Array.from(this.statusMap.values()));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get status of a specific audiologist
   * @param audiologistId User ID of the audiologist
   * @returns Status object or null if not found
   */
  getAudiologistStatus(audiologistId: string): AudiologistStatus | null {
    return this.statusMap.get(audiologistId) || null;
  }

  /**
   * Get all current statuses
   * @returns Array of all status objects
   */
  getAllStatuses(): AudiologistStatus[] {
    return Array.from(this.statusMap.values());
  }

  /**
   * Check if audiologist is in call
   * @param audiologistId User ID of the audiologist
   * @returns true if in call, false otherwise
   */
  isAudiologistInCall(audiologistId: string): boolean {
    const status = this.statusMap.get(audiologistId);
    return status?.isInCall || false;
  }

  /**
   * Request status of specific audiologist from server
   * @param audiologistId User ID of the audiologist
   */
  requestAudiologistStatus(audiologistId: string): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Cannot request status.");
      return;
    }
    this.socket.emit("get_audiologist_status", audiologistId);
  }

  /**
   * Request all statuses from server
   */
  refreshAllStatuses(): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Cannot refresh statuses.");
      return;
    }
    this.socket.emit("get_all_statuses");
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect from websocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.statusMap.clear();
    this.listeners.clear();
  }
}

// Export singleton instance (will be initialized by hook)
let serviceInstance: AudiologistStatusService | null = null;

export function getAudiologistStatusService(socketUrl: string): AudiologistStatusService {
  if (!serviceInstance) {
    serviceInstance = new AudiologistStatusService(socketUrl);
  }
  return serviceInstance;
}

