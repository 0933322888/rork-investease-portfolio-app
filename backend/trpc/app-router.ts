import { createTRPCRouter } from "./create-context";
import { plaidRouter } from "./routes/plaid";

export const appRouter = createTRPCRouter({
  plaid: plaidRouter,
});

export type AppRouter = typeof appRouter;
