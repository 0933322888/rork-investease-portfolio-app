import * as z from "zod";
import { getSnapTradeClient } from "@/backend/lib/snaptrade-client";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const snaptradeRouter = createTRPCRouter({
  registerUser: publicProcedure
    .input(z.object({ 
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[SnapTrade] Registering user:', input.userId);
        const client = getSnapTradeClient();
        
        const response = await client.authentication.registerSnapTradeUser({
          userId: input.userId,
        });

        console.log('[SnapTrade] User registered');
        return { 
          userId: response.data.userId,
          userSecret: response.data.userSecret,
        };
      } catch (error: any) {
        if (error?.response?.status === 409) {
          console.log('[SnapTrade] User already exists, returning existing');
          throw new Error('USER_EXISTS');
        }
        console.error('[SnapTrade] Error registering user:', error);
        throw new Error(`Failed to register user: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getConnectionUrl: publicProcedure
    .input(z.object({
      userId: z.string(),
      userSecret: z.string(),
      broker: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[SnapTrade] Generating connection URL for user:', input.userId);
        const client = getSnapTradeClient();
        
        const response = await client.authentication.loginSnapTradeUser({
          userId: input.userId,
          userSecret: input.userSecret,
          broker: input.broker,
        });

        console.log('[SnapTrade] Connection URL generated');
        return { 
          redirectUri: response.data.redirectURI || response.data.loginLink,
        };
      } catch (error) {
        console.error('[SnapTrade] Error generating connection URL:', error);
        throw new Error(`Failed to generate connection URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  listAccounts: publicProcedure
    .input(z.object({
      userId: z.string(),
      userSecret: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[SnapTrade] Listing accounts for user:', input.userId);
        const client = getSnapTradeClient();
        
        const response = await client.accountInformation.listUserAccounts({
          userId: input.userId,
          userSecret: input.userSecret,
        });

        console.log('[SnapTrade] Accounts listed:', response.data.length);
        return { accounts: response.data };
      } catch (error) {
        console.error('[SnapTrade] Error listing accounts:', error);
        throw new Error(`Failed to list accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getHoldings: publicProcedure
    .input(z.object({
      userId: z.string(),
      userSecret: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[SnapTrade] Fetching holdings for user:', input.userId);
        const client = getSnapTradeClient();
        
        const response = await client.accountInformation.getAllUserHoldings({
          userId: input.userId,
          userSecret: input.userSecret,
        });

        console.log('[SnapTrade] Holdings fetched');
        return { holdings: response.data };
      } catch (error) {
        console.error('[SnapTrade] Error fetching holdings:', error);
        throw new Error(`Failed to fetch holdings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getAccountBalances: publicProcedure
    .input(z.object({
      userId: z.string(),
      userSecret: z.string(),
      accountId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[SnapTrade] Fetching balances for account:', input.accountId);
        const client = getSnapTradeClient();
        
        const response = await client.accountInformation.getUserAccountBalance({
          userId: input.userId,
          userSecret: input.userSecret,
          accountId: input.accountId,
        });

        console.log('[SnapTrade] Balances fetched');
        return { balances: response.data };
      } catch (error) {
        console.error('[SnapTrade] Error fetching balances:', error);
        throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
