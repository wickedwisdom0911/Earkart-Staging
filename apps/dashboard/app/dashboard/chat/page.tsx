"use client";

import { useState, useEffect, useRef } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Send, Users, MessageCircle, Loader2 } from "lucide-react";
import { chatSocketService, ChatMessage, RoomParticipant } from "@/services/chat-socket.service";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { getSocketUrl } from "@/lib/environment";
import { Role } from "@/models/enums";
import { format } from "date-fns";
import useGetAllCentres from "@/hooks/centre/use-get-all-centres";
import { toast } from "sonner";
import getChatMessages from "@/actions/chat/get-chat-messages";

export default function ChatPage() {
  const { data: user } = useGetUser();
  const { data: centres, isLoading: centresLoading } = useGetAllCentres();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<any>(null);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCentre = user?.role === Role.CENTRE;
  const isAudiologist = user?.role === Role.AUDIOLOGIST || user?.role === Role.HEAD_AUDIOLOGIST;
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const canSelectCentres = isAudiologist || isAdmin; // Audiologists and Admins can select centres

  // Debug logging
  useEffect(() => {
    console.log("[Chat] User role:", user?.role);
    console.log("[Chat] Is Audiologist:", isAudiologist);
    console.log("[Chat] Is Admin:", isAdmin);
    console.log("[Chat] Is Centre:", isCentre);
    console.log("[Chat] Can Select Centres:", canSelectCentres);
    console.log("[Chat] Centres loaded:", centres?.data?.data?.length || 0);
  }, [user, isAudiologist, isAdmin, isCentre, canSelectCentres, centres]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track if socket is initialized
  const socketInitialized = useRef(false);

  // Initialize chat socket - only once when user is available
  useEffect(() => {
    const initChat = async () => {
      if (!user?.token) return;
      
      // Prevent duplicate initialization
      if (socketInitialized.current) {
        console.log("[Chat] Socket already initialized, skipping...");
        return;
      }
      
      socketInitialized.current = true;
      console.log("[Chat] Initializing socket...");

      const socketUrl = await getSocketUrl();
      
      // Remove any existing listeners before connecting
      chatSocketService.removeAllListeners();
      
      chatSocketService.connect(user.token, socketUrl);

      // Handle connected event
      chatSocketService.onConnected((data) => {
        console.log("[Chat] Connected:", data);
        setIsConnected(true);
        
        // For centres, automatically set their room ID and load history via REST API
        if (data.roomId) {
          setCurrentRoomId(data.roomId);
          // Load chat history for centres when they connect using REST API
          loadMessages(data.roomId);
        }
      });

      // Handle new messages - use functional update to avoid stale closure
      chatSocketService.onNewMessage((message) => {
        console.log("[Chat] New message received:", message.id);
        setMessages((prev) => {
          // Prevent duplicate messages by checking ID
          if (prev.some(m => m.id === message.id)) {
            console.log("[Chat] Duplicate message ignored:", message.id);
            return prev;
          }
          // Ensure timestamp is a Date object
          const processedMessage = {
            ...message,
            timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp),
          };
          // Add to end and sort to maintain chronological order
          const updated = [...prev, processedMessage];
          return updated.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      });

      // Handle user joined
      chatSocketService.onUserJoined((data) => {
        console.log("[Chat] User joined:", data);
      });

      // Handle user left
      chatSocketService.onUserLeft((data) => {
        console.log("[Chat] User left:", data);
      });

      // Handle room participants
      chatSocketService.onRoomParticipants((data) => {
        console.log("[Chat] Room participants:", data);
        setParticipants(data.participants || []);
        
        // Load chat history when joining a room (for audiologists/admins) using REST API
        if (data.roomId) {
          loadMessages(data.roomId);
        }
      });

      // Handle errors
      chatSocketService.onError((error) => {
        console.error("[Chat] Socket error:", error);
        setIsLoadingHistory(false);
        if (error?.message) {
          toast.error(`Chat error: ${error.message}`);
        }
      });
    };

    initChat();

    return () => {
      console.log("[Chat] Cleaning up socket...");
      socketInitialized.current = false;
      chatSocketService.removeAllListeners();
      chatSocketService.disconnect();
    };
  }, [user?.token]); // Only depend on token, not the entire user object or centres

  // Set selected centre for centre users
  useEffect(() => {
    if (currentRoomId && centres?.data?.data && !selectedCentre) {
      const centre = centres.data.data.find((c: any) => c.id === currentRoomId);
      if (centre) {
        setSelectedCentre(centre);
      }
    }
  }, [currentRoomId, centres, selectedCentre]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !currentRoomId) return;

    // Send message with sender's name
    const senderName = user?.name || user?.email || "Unknown";
    chatSocketService.sendMessage(currentRoomId, inputMessage, senderName);
    setInputMessage("");
  };

  // Load messages using REST API
  const loadMessages = async (roomId: string, cursor: string | null = null) => {
    if (!roomId) return;
    
    console.log("[Chat] Loading messages via REST API for room:", roomId, "cursor:", cursor);
    setIsLoadingHistory(true);
    
    try {
      const response = await getChatMessages(roomId, 50, cursor);
      
      if (response.success && response.data) {
        const { messages, cursor: newCursor, hasMore } = response.data;
        
        // Convert timestamp strings to Date objects if needed
        const processedMessages = messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        }));
        
        // Always sort messages by timestamp (oldest first, newest at bottom)
        const sortMessages = (msgs: any[]) => {
          return [...msgs].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB; // Oldest first (ascending)
          });
        };

        if (cursor) {
          // Loading more messages (prepend older messages)
          setMessages((prev) => {
            // Combine and remove duplicates
            const combined = [...processedMessages, ...prev];
            const unique = combined.filter((msg, index, self) => 
              index === self.findIndex((m) => m.id === msg.id)
            );
            // Sort by timestamp (oldest first, newest at bottom)
            return sortMessages(unique);
          });
        } else {
          // Initial load - sort by timestamp (oldest first, newest at bottom)
          const sortedMessages = sortMessages(processedMessages);
          console.log("[Chat] Initial messages sorted:", sortedMessages.length, "messages");
          if (sortedMessages.length > 0) {
            console.log("[Chat] First (oldest) message:", format(new Date(sortedMessages[0].timestamp), "HH:mm:ss"));
            console.log("[Chat] Last (newest) message:", format(new Date(sortedMessages[sortedMessages.length - 1].timestamp), "HH:mm:ss"));
          }
          setMessages(sortedMessages);
          
          // Scroll to bottom after initial load
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "auto" });
            }
          }, 100);
        }
        
        setMessageCursor(newCursor);
        setHasMoreMessages(hasMore || false);
      }
    } catch (error) {
      console.error("[Chat] Error loading messages:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectCentre = (centre: any) => {
    console.log("[Chat] Selecting centre:", centre.id, centre.user?.name);
    
    // Leave current room if any
    if (currentRoomId) {
      console.log("[Chat] Leaving current room:", currentRoomId);
      chatSocketService.leaveRoom(currentRoomId);
    }
    
    // Clear messages and reset pagination when switching rooms
    setMessages([]);
    setMessageCursor(null);
    setHasMoreMessages(false);
    
    // Join new room
    console.log("[Chat] Joining new room:", centre.id);
    chatSocketService.joinRoom(centre.id);
    setCurrentRoomId(centre.id);
    setSelectedCentre(centre);
    
    // Fetch room participants after joining, then load history via REST API
    setTimeout(() => {
      console.log("[Chat] Fetching participants for room:", centre.id);
      chatSocketService.getRoomParticipants(centre.id);
      // Load messages via REST API
      loadMessages(centre.id);
    }, 500);
  };

  const loadMoreMessages = () => {
    if (!currentRoomId || !hasMoreMessages || isLoadingHistory || !messageCursor) {
      return;
    }
    console.log("[Chat] Loading more messages with cursor:", messageCursor);
    loadMessages(currentRoomId, messageCursor);
  };

  if (centresLoading) {
    return (
      <DashboardBodyWrapper>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardBodyWrapper>
    );
  }

  return (
    <DashboardBodyWrapper>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Sidebar - Centres List (Visible for Audiologists and Admins) */}
        {canSelectCentres && (
          <div className="w-80 border-r bg-white flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Select Centre
              </h2>
              <p className="text-sm text-primary-100 mt-1">
                {centres?.data?.data?.length || 0} centres available
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!centres?.data?.data || centres.data.data.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No centres available</p>
                </div>
              ) : (
                <div className="divide-y">
                  {centres.data.data.map((centre: any) => (
                    <div
                      key={centre.id}
                      onClick={() => handleSelectCentre(centre)}
                      className={`p-4 cursor-pointer transition-all ${
                        currentRoomId === centre.id
                          ? "bg-primary-50 border-l-4 border-primary-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          currentRoomId === centre.id ? "bg-primary-600" : "bg-primary-100"
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            currentRoomId === centre.id ? "text-white" : "text-primary-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {centre.user?.name || centre.entName || "Unnamed Centre"}
                          </h3>
                          <p className="text-xs text-gray-500">{centre.code}</p>
                          {centre.city?.name && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              📍 {centre.city.name}
                            </p>
                          )}
                        </div>
                        {currentRoomId === centre.id && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {selectedCentre
                      ? selectedCentre.user?.name || selectedCentre.entName
                      : "Chat"}
                  </h1>
                  {selectedCentre && (
                    <p className="text-sm text-gray-500">{selectedCentre.code}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                    Disconnected
                  </Badge>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{participants.length} online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {!currentRoomId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 max-w-md">
                  <MessageCircle className="w-16 h-16 text-primary-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {canSelectCentres ? "👈 Select a Centre to Start" : "Waiting for Connection"}
                  </h3>
                  <p className="text-gray-500">
                    {canSelectCentres
                      ? "Choose a centre from the left sidebar to start chatting with them"
                      : "Your chat room is ready. Audiologists and admins can connect to chat with you."}
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-6 bg-white rounded-lg shadow-sm max-w-md">
                  <MessageCircle className="w-16 h-16 text-primary-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Messages Yet
                  </h3>
                  <p className="text-gray-500 mb-1">
                    Start the conversation by sending a message below
                  </p>
                  <p className="text-xs text-gray-400">
                    You're chatting with: <strong>{selectedCentre?.user?.name || selectedCentre?.entName}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Load More Button */}
                {hasMoreMessages && (
                  <div className="flex justify-center py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreMessages}
                      disabled={isLoadingHistory}
                      className="text-xs"
                    >
                      {isLoadingHistory ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load Older Messages"
                      )}
                    </Button>
                  </div>
                )}
                {isLoadingHistory && messages.length === 0 && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  </div>
                )}
                {messages.map((msg) => {
                  const isOwnMessage = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          isOwnMessage
                            ? "bg-primary-600 text-white"
                            : "bg-white text-gray-900 border"
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isOwnMessage ? "text-primary-100" : "text-gray-500"}`}>
                          {msg.senderName || msg.senderRole} • {format(new Date(msg.timestamp), "HH:mm")}
                          {msg.editedAt && !msg.deletedAt && (
                            <span className="ml-1 opacity-75">(edited)</span>
                          )}
                        </div>
                        <div className={`text-sm ${msg.deletedAt ? "italic opacity-60 line-through" : ""}`}>
                          {msg.deletedAt ? "This message was deleted" : msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                placeholder={currentRoomId ? "Type a message..." : "Select a centre first..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={!currentRoomId}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !currentRoomId}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}

