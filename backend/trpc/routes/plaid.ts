import * as z from "zod";
import { CountryCode, Products } from 'plaid';
import { getPlaidClient } from "@/backend/lib/plaid-client";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const plaidRouter = createTRPCRouter({
  createLinkToken: publicProcedure
    .input(z.object({ 
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[Plaid] Creating link token for user:', input.userId);
        const plaidClient = getPlaidClient();
        
        const response = await plaidClient.linkTokenCreate({
          user: { client_user_id: input.userId },
          client_name: 'Portfolio Tracker',
          products: [Products.Auth, Products.Transactions],
          country_codes: [CountryCode.Us],
          language: 'en',
        });

        console.log('[Plaid] Link token created:', response.data.link_token);
        return { linkToken: response.data.link_token };
      } catch (error) {
        console.error('[Plaid] Error creating link token:', error);
        throw new Error(`Failed to create link token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  exchangePublicToken: publicProcedure
    .input(z.object({
      publicToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        console.log('[Plaid] Exchanging public token');
        const plaidClient = getPlaidClient();
        
        const response = await plaidClient.itemPublicTokenExchange({
          public_token: input.publicToken,
        });

        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        console.log('[Plaid] Access token obtained, itemId:', itemId);

        return {
          accessToken,
          itemId,
        };
      } catch (error) {
        console.error('[Plaid] Error exchanging public token:', error);
        throw new Error(`Failed to exchange public token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getAccounts: publicProcedure
    .input(z.object({
      accessToken: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[Plaid] Fetching accounts');
        const plaidClient = getPlaidClient();
        
        const response = await plaidClient.accountsGet({
          access_token: input.accessToken,
        });

        console.log('[Plaid] Accounts fetched:', response.data.accounts.length);

        return {
          accounts: response.data.accounts,
          item: response.data.item,
        };
      } catch (error) {
        console.error('[Plaid] Error fetching accounts:', error);
        throw new Error(`Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getBalances: publicProcedure
    .input(z.object({
      accessToken: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[Plaid] Fetching balances');
        const plaidClient = getPlaidClient();
        
        const response = await plaidClient.accountsBalanceGet({
          access_token: input.accessToken,
        });

        console.log('[Plaid] Balances fetched:', response.data.accounts.length);

        return {
          accounts: response.data.accounts,
        };
      } catch (error) {
        console.error('[Plaid] Error fetching balances:', error);
        throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  getTransactions: publicProcedure
    .input(z.object({
      accessToken: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        console.log('[Plaid] Fetching transactions from', input.startDate, 'to', input.endDate);
        const plaidClient = getPlaidClient();
        
        const response = await plaidClient.transactionsGet({
          access_token: input.accessToken,
          start_date: input.startDate,
          end_date: input.endDate,
        });

        console.log('[Plaid] Transactions fetched:', response.data.transactions.length);

        return {
          transactions: response.data.transactions,
          accounts: response.data.accounts,
        };
      } catch (error) {
        console.error('[Plaid] Error fetching transactions:', error);
        throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),
});
