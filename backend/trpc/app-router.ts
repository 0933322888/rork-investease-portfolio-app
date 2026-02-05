import { createTRPCRouter } from "./create-context";
import { plaidRouter } from "./routes/plaid";
import { snaptradeRouter } from "./routes/snaptrade";

export const appRouter = createTRPCRouter({
  plaid: plaidRouter,
  snaptrade: snaptradeRouter,
});

export type AppRouter = typeof appRouter;
