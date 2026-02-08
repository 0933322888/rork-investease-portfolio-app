import { createTRPCRouter } from "./create-context";
import { plaidRouter } from "./routes/plaid";
import { snaptradeRouter } from "./routes/snaptrade";
import { coinbaseRouter } from "./routes/coinbase";

export const appRouter = createTRPCRouter({
  plaid: plaidRouter,
  snaptrade: snaptradeRouter,
  coinbase: coinbaseRouter,
});

export type AppRouter = typeof appRouter;
