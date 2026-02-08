import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import {
  getMarketDataForSymbols,
  getQuotes,
  getQuote,
  getHistoricalPrices,
  getCompanyProfile,
  getCompanyProfiles,
  normalizeSymbol,
} from "@/backend/lib/marketData";

export const marketDataRouter = createTRPCRouter({
  getQuotes: publicProcedure
    .input(
      z.object({
        symbols: z.array(z.string()).min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const quotes = await getQuotes(input.symbols);
        return { success: true, data: quotes };
      } catch (error: any) {
        console.error("[MarketData] getQuotes error:", error.message);
        return { success: false, data: [], error: error.message };
      }
    }),

  getQuote: publicProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const quote = await getQuote(input.symbol);
        return { success: true, data: quote };
      } catch (error: any) {
        console.error("[MarketData] getQuote error:", error.message);
        return { success: false, data: null, error: error.message };
      }
    }),

  getHistoricalPrices: publicProcedure
    .input(
      z.object({
        symbol: z.string().min(1),
        range: z.enum(["1M", "3M", "6M", "1Y", "5Y"]).default("1Y"),
      })
    )
    .query(async ({ input }) => {
      try {
        const normalized = normalizeSymbol(input.symbol);
        const data = await getHistoricalPrices(normalized, input.range);
        return { success: true, data };
      } catch (error: any) {
        console.error("[MarketData] getHistoricalPrices error:", error.message);
        return { success: false, data: [], error: error.message };
      }
    }),

  getProfile: publicProcedure
    .input(z.object({ symbol: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const profile = await getCompanyProfile(input.symbol);
        return { success: true, data: profile };
      } catch (error: any) {
        console.error("[MarketData] getProfile error:", error.message);
        return { success: false, data: null, error: error.message };
      }
    }),

  getProfiles: publicProcedure
    .input(
      z.object({
        symbols: z.array(z.string()).min(1).max(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const profiles = await getCompanyProfiles(input.symbols);
        return { success: true, data: profiles };
      } catch (error: any) {
        console.error("[MarketData] getProfiles error:", error.message);
        return { success: false, data: [], error: error.message };
      }
    }),

  getMarketData: publicProcedure
    .input(
      z.object({
        assets: z.array(
          z.object({
            symbol: z.string(),
            assetType: z.string().optional(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = await getMarketDataForSymbols(input.assets);
        return { success: true, data: results };
      } catch (error: any) {
        console.error("[MarketData] getMarketData error:", error.message);
        return { success: false, data: [], error: error.message };
      }
    }),
});
