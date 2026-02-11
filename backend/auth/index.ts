import { Context, Next } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SESSION_COOKIE = "session_id";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function getIssuerUrl(): string {
  return "https://replit.com/oidc";
}

function getCallbackUrl(): string {
  const domains = process.env.REPLIT_DOMAINS || "";
  const domain = domains.split(",")[0].trim();
  return `https://${domain}/api/auth/callback`;
}

function getClientId(): string {
  return process.env.REPL_ID || "";
}

function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

async function fetchOIDCConfig() {
  const issuer = getIssuerUrl();
  const res = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error("Failed to fetch OIDC config");
  return res.json();
}

export async function createSession(userId: string, userData: any): Promise<string> {
  const sid = generateRandomString(64);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  const data = JSON.stringify({ userId, userData });

  await db.insert(sessions).values({ sid, data, expiresAt });
  return sid;
}

export async function getSession(sid: string): Promise<any | null> {
  const result = await db.select().from(sessions).where(eq(sessions.sid, sid)).limit(1);
  if (result.length === 0) return null;
  const session = result[0];
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.sid, sid));
    return null;
  }
  return JSON.parse(session.data);
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sid, sid));
}

export async function upsertUser(claims: any) {
  const existing = await db.select().from(users).where(eq(users.replitId, claims.sub)).limit(1);

  if (existing.length > 0) {
    await db.update(users)
      .set({
        email: claims.email || existing[0].email,
        firstName: claims.first_name || claims.given_name || existing[0].firstName,
        lastName: claims.last_name || claims.family_name || existing[0].lastName,
        profileImageUrl: claims.profile_image_url || claims.picture || existing[0].profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.replitId, claims.sub));
    return existing[0];
  }

  const inserted = await db.insert(users).values({
    replitId: claims.sub,
    email: claims.email || null,
    firstName: claims.first_name || claims.given_name || null,
    lastName: claims.last_name || claims.family_name || null,
    profileImageUrl: claims.profile_image_url || claims.picture || null,
  }).returning();

  return inserted[0];
}

const stateStore = new Map<string, { codeVerifier: string; timestamp: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of stateStore.entries()) {
    if (now - val.timestamp > 10 * 60 * 1000) stateStore.delete(key);
  }
}, 60 * 1000);

export function registerAuthRoutes(app: any) {
  app.get("/api/login", async (c: Context) => {
    try {
      const config = await fetchOIDCConfig();
      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(64);

      const codeChallenge = crypto
        .createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

      stateStore.set(state, { codeVerifier, timestamp: Date.now() });

      const clientId = getClientId();
      const callbackUrl = getCallbackUrl();

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "openid profile email",
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });

      return c.redirect(`${config.authorization_endpoint}?${params.toString()}`);
    } catch (err) {
      console.error("Login error:", err);
      return c.text("Login failed", 500);
    }
  });

  app.get("/api/auth/callback", async (c: Context) => {
    try {
      const code = c.req.query("code");
      const state = c.req.query("state");

      if (!code || !state) return c.text("Missing code or state", 400);

      const stateData = stateStore.get(state);
      if (!stateData) return c.text("Invalid or expired state", 400);
      stateStore.delete(state);

      const config = await fetchOIDCConfig();
      const clientId = getClientId();
      const callbackUrl = getCallbackUrl();

      const tokenRes = await fetch(config.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          code_verifier: stateData.codeVerifier,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token exchange failed:", errText);
        return c.text("Authentication failed", 500);
      }

      const tokens = await tokenRes.json();

      const userInfoRes = await fetch(config.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoRes.ok) {
        return c.text("Failed to get user info", 500);
      }

      const claims = await userInfoRes.json();
      const user = await upsertUser(claims);

      const sid = await createSession(claims.sub, {
        id: user.id,
        replitId: claims.sub,
        email: claims.email,
        firstName: claims.first_name || claims.given_name,
        lastName: claims.last_name || claims.family_name,
        profileImageUrl: claims.profile_image_url || claims.picture,
      });

      const isSecure = c.req.url.startsWith("https");

      setCookie(c, SESSION_COOKIE, sid, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });

      return c.redirect("/");
    } catch (err) {
      console.error("Callback error:", err);
      return c.text("Authentication failed", 500);
    }
  });

  app.get("/api/auth/user", async (c: Context) => {
    const sid = getCookie(c, SESSION_COOKIE);
    if (!sid) return c.json(null, 401);

    const session = await getSession(sid);
    if (!session) {
      deleteCookie(c, SESSION_COOKIE, { path: "/" });
      return c.json(null, 401);
    }

    return c.json(session.userData);
  });

  app.get("/api/logout", async (c: Context) => {
    const sid = getCookie(c, SESSION_COOKIE);
    if (sid) {
      await deleteSession(sid);
      deleteCookie(c, SESSION_COOKIE, { path: "/" });
    }
    return c.redirect("/");
  });
}

export async function authMiddleware(c: Context, next: Next) {
  const sid = getCookie(c, SESSION_COOKIE);
  if (sid) {
    const session = await getSession(sid);
    if (session) {
      c.set("user", session.userData);
    }
  }
  await next();
}
