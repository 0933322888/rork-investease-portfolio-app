import * as z from "zod";
import { CountryCode, Products } from 'plaid';
import { plaidClient } from "@/backend/lib/plaid-client";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const plaidRouter = createTRPCRouter({
  createLinkToken: publicProcedure
    .input(z.object({ 
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Plaid] Creating link token for user:', input.userId);
      
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: input.userId },
        client_name: 'Portfolio Tracker',
        products: [Products.Auth, Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
      });

      console.log('[Plaid] Link token created:', response.data.link_token);
      return { linkToken: response.data.link_token };
    }),

  exchangePublicToken: publicProcedure
    .input(z.object({
      publicToken: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log('[Plaid] Exchanging public token');
      
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
    }),

  getAccounts: publicProcedure
    .input(z.object({
      accessToken: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('[Plaid] Fetching accounts');
      
      const response = await plaidClient.accountsGet({
        access_token: input.accessToken,
      });

      console.log('[Plaid] Accounts fetched:', response.data.accounts.length);

      return {
        accounts: response.data.accounts,
        item: response.data.item,
      };
    }),

  getBalances: publicProcedure
    .input(z.object({
      accessToken: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('[Plaid] Fetching balances');
      
      const response = await plaidClient.accountsBalanceGet({
        access_token: input.accessToken,
      });

      console.log('[Plaid] Balances fetched:', response.data.accounts.length);

      return {
        accounts: response.data.accounts,
      };
    }),

  getTransactions: publicProcedure
    .input(z.object({
      accessToken: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      console.log('[Plaid] Fetching transactions from', input.startDate, 'to', input.endDate);
      
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
    }),
});
