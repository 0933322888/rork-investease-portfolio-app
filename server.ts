import { serve, file } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./backend/trpc/app-router";
import { createContext } from "./backend/trpc/create-context";
import { registerAuthRoutes, authMiddleware } from "./backend/auth";

const app = new Hono();

app.use("*", cors());
app.use("*", authMiddleware);

registerAuthRoutes(app);

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", message: "Portfolio Tracker API is running" });
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
