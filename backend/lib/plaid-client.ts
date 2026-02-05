import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

let plaidClientInstance: PlaidApi | null = null;

export const getPlaidClient = () => {
  if (plaidClientInstance) {
    return plaidClientInstance;
  }

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  console.log('[Plaid Client] Initializing with clientId:', clientId ? 'present' : 'missing');
  console.log('[Plaid Client] Secret:', secret ? 'present' : 'missing');

  if (!clientId || !secret) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables');
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  plaidClientInstance = new PlaidApi(configuration);
  console.log('[Plaid Client] Successfully initialized');
  return plaidClientInstance;
};
