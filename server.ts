import { serve, file } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./backend/trpc/app-router";
import { createContext } from "./backend/trpc/create-context";
import { clerkAuthMiddleware, getAuthUser } from "./backend/middleware/auth";
import { db, schema } from "./backend/db";
import { eq } from "drizzle-orm";

const app = new Hono();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "Assetra API is running" });
});

app.post("/api/auth/bootstrap", clerkAuthMiddleware, async (c) => {
  const user = getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json().catch(() => ({}));

    const existingUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.clerkUserId, user.clerkUserId))
      .limit(1);

    if (existingUsers.length > 0) {
      const dbUser = existingUsers[0];
      const portfolios = await db
        .select()
        .from(schema.portfolios)
        .where(eq(schema.portfolios.userId, dbUser.id))
        .limit(1);

      return c.json({
        user: dbUser,
        portfolio: portfolios[0] || null,
        isNew: false,
      });
    }

    const [newUser] = await db
      .insert(schema.users)
      .values({
        clerkUserId: user.clerkUserId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        avatarUrl: body.avatarUrl,
      })
      .returning();

    const [newPortfolio] = await db
      .insert(schema.portfolios)
      .values({
        userId: newUser.id,
      })
      .returning();

    return c.json({
      user: newUser,
      portfolio: newPortfolio,
      isNew: true,
    });
  } catch (error) {
    console.error("[Bootstrap] Error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.use("/_expo/*", async (c, next) => {
  c.header("Cache-Control", "no-cache, no-store, must-revalidate");
  c.header("Pragma", "no-cache");
  c.header("Expires", "0");
  await next();
});
app.use("/_expo/*", serveStatic({ root: "./dist" }));
app.use("/assets/*", serveStatic({ root: "./dist" }));

const BUILD_ID = Date.now().toString();

app.get("*", async (c) => {
  const indexPath = "./dist/index.html";
  try {
    const indexFile = file(indexPath);
    if (await indexFile.exists()) {
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      c.header("Pragma", "no-cache");
      c.header("Expires", "0");
      let html = await indexFile.text();
      html = html.replace(/(\.js)(")/g, `$1?v=${BUILD_ID}$2`);
      html = html.replace(/(\.css)(")/g, `$1?v=${BUILD_ID}$2`);
      return c.html(html);
    }
  } catch (e) {
    console.error("Error serving index.html:", e);
  }
  return c.text("App not built yet. Run: bunx expo export --platform web", 500);
});

const PORT = 5000;

console.log(`Starting server on port ${PORT}...`);
console.log(`API available at http://0.0.0.0:${PORT}/api/trpc`);
console.log(`Serving static files from ./dist`);

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: "0.0.0.0",
});
