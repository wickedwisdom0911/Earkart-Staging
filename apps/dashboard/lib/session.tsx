"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { UserModelData } from "@/models/user.model";

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET environment variable is not set");
}
const key = new TextEncoder().encode(secret);

export async function encrypt(payload: { user: UserModelData }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRE ?? "1d")
    .sign(key);
}

export async function decrypt(session: string) {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });
    return payload as { user: UserModelData };
  } catch {
    return null;
  }
}

export async function createSession(user: UserModelData) {
  try {
    const cookieExpire = parseInt(process.env.COOKIE_EXPIRE || "24", 10); // Default to 24 hours
    const expiresAt = new Date(Date.now() + cookieExpire * 60 * 60 * 1000); // Convert hours to milliseconds
    
    const session = await encrypt({ user });
    
    const cookieStore = await cookies();
    
    // Safari requires expires to be a valid date string
    cookieStore.set("session_omni", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "strict",
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Session creation error:", error);
    return false;
  }
}

export async function getSession(): Promise<UserModelData | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session_omni");

    if (!session) {
      return null;
    }

    const payload = await decrypt(session.value);
    return payload?.user || null;
  } catch (error) {
    console.error("Session retrieval error:", error);
    return null;
  }
}

export async function verifySession(): Promise<UserModelData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session_omni")?.value;
  const session = await decrypt(cookie || "");
  if (!session?.user?.token) {
    return null;
  }
  return session.user;
}

export async function deleteSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_omni");
    return true;
  } catch (error) {
    console.error("Session deletion error:", error);
    return false;
  }
}
