import { Snaptrade } from 'snaptrade-typescript-sdk';

let snaptradeClient: Snaptrade | null = null;

export function getSnapTradeClient(): Snaptrade {
  if (!snaptradeClient) {
    const clientId = process.env.SNAPTRADE_CLIENT_ID;
    const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

    console.log('[SnapTrade Client] Initializing with clientId:', clientId ? 'present' : 'missing');
    console.log('[SnapTrade Client] Consumer key:', consumerKey ? 'present' : 'missing');

    if (!clientId || !consumerKey) {
      throw new Error('SnapTrade credentials not configured. Please set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY.');
    }

    snaptradeClient = new Snaptrade({
      clientId,
      consumerKey,
    });

    console.log('[SnapTrade Client] Successfully initialized');
  }

  return snaptradeClient;
}
