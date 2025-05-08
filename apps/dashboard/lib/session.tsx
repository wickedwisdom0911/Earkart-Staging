import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SessionPayload } from "@/models/session.model";
import { UserModelData } from "@/models/user.model";

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET environment variable is not set");
}
const key = new TextEncoder().encode(secret);

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRE ?? "1d")
    .sign(key);
}

export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
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
  } catch {
    return false;
  }
}

export async function verifySession(): Promise<UserModelData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session_omni")?.value;
  const session = await decrypt(cookie);
  if (!session?.user?.token) {
    return null;
  }
  return session.user;
}

export async function updateSession(user: UserModelData) {
  try {
    const cookieExpire = parseInt(process.env.COOKIE_EXPIRE || "24", 10); // Default to 24 hours
    const expiresAt = new Date(Date.now() + cookieExpire * 60 * 60 * 1000); // Convert hours to milliseconds
    const session = await encrypt({ user });

    // Safari requires expires to be a valid date string
    const cookieStore = await cookies();
    cookieStore.set("session_omni", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "strict",
      path: "/",
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_omni");
    return true;
  } catch {
    return false;
  }
}
