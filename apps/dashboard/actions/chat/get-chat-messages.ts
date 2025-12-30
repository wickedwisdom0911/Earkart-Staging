"use server";

import { apiRequest } from "@/lib/api";
import { getBaseUrl } from "@/lib/environment";
import { verifySession } from "@/lib/session";
import { z } from "zod";

// Chat Message Schema (matches Prisma schema)
const ChatMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  senderId: z.string(),
  senderRole: z.string(),
  senderName: z.string().optional(),
  message: z.string(),
  timestamp: z.coerce.date(),
  editedAt: z.coerce.date().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  // readReceipts would be included if backend sends them
  // readReceipts: z.array(z.object({ userId: z.string(), readAt: z.coerce.date() })).optional(),
});

// Messages Response Schema - API returns array directly in data field
const ChatMessagesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(ChatMessageSchema), // API returns array directly
});

export type ChatMessagesResponse = {
  success: boolean;
  message: string;
  data: {
    messages: z.infer<typeof ChatMessageSchema>[];
    cursor: string | null;
    hasMore: boolean;
    roomId: string;
  };
};

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export default async function getChatMessages(
  roomId: string,
  limit: number = 50,
  cursor: string | null = null
): Promise<ChatMessagesResponse> {
  const baseUrl = await getBaseUrl();
  const user = await verifySession();

  if (!user?.token) {
    throw new Error("Unauthorized");
  }

  // Build query string
  const searchParams = new URLSearchParams();
  searchParams.append("limit", String(limit));
  if (cursor) {
    searchParams.append("cursor", cursor);
  }

  const url = `${baseUrl}chat/room/${roomId}/messages?${searchParams.toString()}`;

  console.log("[getChatMessages] Fetching messages for room:", roomId, "cursor:", cursor);

  const response = await apiRequest<{ success: boolean; message: string; data: z.infer<typeof ChatMessageSchema>[] }>(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    },
    ChatMessagesResponseSchema
  );

  // Transform array response to expected structure
  const messages = response.data;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  
  // Use last message ID as cursor for pagination
  // hasMore is true if we got exactly the limit (might need backend to provide this)
  const hasMore = messages.length === limit;
  const newCursor = lastMessage?.id || null;

  return {
    success: response.success,
    message: response.message,
    data: {
      messages,
      cursor: newCursor,
      hasMore,
      roomId, // Use the roomId parameter we already have
    },
  };
}

