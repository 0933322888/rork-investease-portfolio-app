import { createTRPCRouter } from "./create-context";
import { plaidRouter } from "./routes/plaid";
import { snaptradeRouter } from "./routes/snaptrade";
import { coinbaseRouter } from "./routes/coinbase";
import { marketDataRouter } from "./routes/marketData";

export const appRouter = createTRPCRouter({
  plaid: plaidRouter,
  snaptrade: snaptradeRouter,
  coinbase: coinbaseRouter,
  marketData: marketDataRouter,
});

export type AppRouter = typeof appRouter;
