import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: string;
  senderName?: string;
  message: string;
  timestamp: Date;
  editedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface RoomParticipant {
  userId: string;
  role: string;
  joinedAt: Date;
}

export interface ChatSocketService {
  socket: Socket | null;
  connect: (token: string, socketUrl: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string, senderName?: string) => void;
  getRoomParticipants: (roomId: string) => void;
  onConnected: (callback: (data: any) => void) => void;
  onNewMessage: (callback: (message: ChatMessage) => void) => void;
  onUserJoined: (callback: (data: any) => void) => void;
  onUserLeft: (callback: (data: any) => void) => void;
  onRoomParticipants: (callback: (data: any) => void) => void;
  onError: (callback: (error: any) => void) => void;
  removeAllListeners: () => void;
}

class ChatSocketServiceImpl implements ChatSocketService {
  socket: Socket | null = null;

  connect(token: string, socketUrl: string) {
    if (this.socket?.connected) {
      console.log("[ChatSocket] Already connected");
      return;
    }

    // Ensure proper URL format for namespace
    // Remove trailing slash if present, then add /chat namespace
    const baseUrl = socketUrl.endsWith('/') ? socketUrl.slice(0, -1) : socketUrl;
    const chatUrl = `${baseUrl}/chat`;
    
    console.log("[ChatSocket] Connecting to:", chatUrl);

    this.socket = io(chatUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("[ChatSocket] ✅ WebSocket connected successfully to:", chatUrl);
      console.log("[ChatSocket] Socket ID:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[ChatSocket] ⚠️ Disconnected:", reason);
      if (reason === "io server disconnect") {
        console.log("[ChatSocket] Server disconnected the socket, attempting reconnect...");
        this.socket?.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("[ChatSocket] ❌ Connection error:", error);
      console.error("[ChatSocket] Failed URL:", chatUrl);
      console.error("[ChatSocket] Error message:", error.message);
      console.error("[ChatSocket] Error stack:", error.stack);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log("[ChatSocket] Disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string) {
    if (!this.socket) {
      console.error("[ChatSocket] Socket not connected");
      return;
    }
    if (!this.socket.connected) {
      console.error("[ChatSocket] Socket is not connected yet, waiting...");
      // Retry after connection
      setTimeout(() => this.joinRoom(roomId), 500);
      return;
    }
    if (!roomId) {
      console.error("[ChatSocket] Cannot join room: roomId is required");
      return;
    }
    console.log("[ChatSocket] Joining room:", roomId);
    this.socket.emit("join_room", { roomId });
  }

  leaveRoom(roomId: string) {
    if (!this.socket) {
      console.error("[ChatSocket] Socket not connected");
      return;
    }
    if (!roomId) {
      console.error("[ChatSocket] Cannot leave room: roomId is required");
      return;
    }
    console.log("[ChatSocket] Leaving room:", roomId);
    this.socket.emit("leave_room", { roomId });
  }

  sendMessage(roomId: string, message: string, senderName?: string) {
    if (!this.socket) {
      console.error("[ChatSocket] Socket not connected");
      return;
    }
    if (!this.socket.connected) {
      console.error("[ChatSocket] Socket is not connected yet");
      return;
    }
    if (!roomId) {
      console.error("[ChatSocket] Cannot send message: roomId is required");
      return;
    }
    if (!message || !message.trim()) {
      console.error("[ChatSocket] Cannot send empty message");
      return;
    }
    console.log("[ChatSocket] Sending message to room:", roomId, "from:", senderName);
    this.socket.emit("send_message", { roomId, message, senderName });
  }

  getRoomParticipants(roomId: string) {
    if (!this.socket) {
      console.error("[ChatSocket] Socket not connected");
      return;
    }
    if (!this.socket.connected) {
      console.error("[ChatSocket] Socket is not connected yet");
      return;
    }
    if (!roomId) {
      console.error("[ChatSocket] Cannot get participants: roomId is required");
      return;
    }
    console.log("[ChatSocket] Getting room participants for room:", roomId);
    this.socket.emit("get_room_participants", { roomId });
  }

  onConnected(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on("connected", callback);
  }

  onNewMessage(callback: (message: ChatMessage) => void) {
    if (!this.socket) return;
    this.socket.on("new_message", callback);
  }

  onUserJoined(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on("user_joined", callback);
  }

  onUserLeft(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on("user_left", callback);
  }

  onRoomParticipants(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on("room_participants", callback);
  }

  onError(callback: (error: any) => void) {
    if (!this.socket) return;
    this.socket.on("error", callback);
  }

  removeAllListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
  }
}

// Singleton instance
export const chatSocketService = new ChatSocketServiceImpl();

