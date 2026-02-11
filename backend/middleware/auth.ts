import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";

export interface AuthUser {
  clerkUserId: string;
  email?: string;
}

export async function clerkAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY || "",
    });

    c.set("user", {
      clerkUserId: payload.sub,
    } as AuthUser);

    await next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
}

export function getAuthUser(c: Context): AuthUser | null {
  return c.get("user") || null;
}
