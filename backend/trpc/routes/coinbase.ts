import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import {
  validateCoinbaseKeys,
  getCoinbaseAccounts,
} from "@/backend/lib/coinbase-client";

export const coinbaseRouter = createTRPCRouter({
  connect: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        apiSecret: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("[Coinbase] Validating API keys...");

        const isValid = await validateCoinbaseKeys(input.apiKey, input.apiSecret);

        if (!isValid) {
          return {
            success: false,
            error: "Invalid API keys. Please check your credentials and try again.",
          };
        }

        console.log("[Coinbase] Keys validated successfully");

        const accounts = await getCoinbaseAccounts(input.apiKey, input.apiSecret);
        console.log("[Coinbase] Fetched accounts:", accounts.length);

        return {
          success: true,
          accounts,
        };
      } catch (error: any) {
        console.error("[Coinbase] Connection error:", error.message);
        return {
          success: false,
          error: error.message || "Failed to connect to Coinbase",
        };
      }
    }),

  syncBalances: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        apiSecret: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("[Coinbase] Syncing balances...");

        const accounts = await getCoinbaseAccounts(input.apiKey, input.apiSecret);
        console.log("[Coinbase] Fetched", accounts.length, "accounts with balances");

        return {
          success: true,
          accounts,
        };
      } catch (error: any) {
        console.error("[Coinbase] Sync error:", error.message);
        return {
          success: false,
          error: error.message || "Failed to sync Coinbase balances",
          accounts: [],
        };
      }
    }),
});
