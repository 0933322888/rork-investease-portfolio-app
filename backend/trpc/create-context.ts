import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";

let verifyTokenFn: any = null;
try {
  const clerk = require("@clerk/backend");
  verifyTokenFn = clerk.verifyToken;
} catch {}

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("Authorization");
  let clerkUserId: string | null = null;

  if (authHeader?.startsWith("Bearer ") && verifyTokenFn) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = await verifyTokenFn(token, {
        secretKey: process.env.CLERK_SECRET_KEY || "",
      });
      clerkUserId = payload.sub || null;
    } catch {}
  }

  return {
    req: opts.req,
    clerkUserId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.clerkUserId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      clerkUserId: ctx.clerkUserId,
    },
  });
});
