import { fmpClient } from "./fmpClient";
import { quoteCache, type MarketQuote } from "./priceCache";

interface FMPQuote {
  symbol: string;
  price: number;
  changePercentage: number;
  change: number;
  name?: string;
}

async function fetchSingleQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const data: FMPQuote[] = await fmpClient.get(`quote?symbol=${symbol}`);

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const quote: MarketQuote = {
        symbol: item.symbol,
        price: item.price ?? 0,
        changePercent: item.changePercentage ?? 0,
        dayChange: item.change ?? 0,
      };
      quoteCache.set(item.symbol, quote);
      return quote;
    }
    return null;
  } catch (error: any) {
    console.error(`[MarketData] Failed to fetch quote for ${symbol}:`, error.message);
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0) return [];

  const uncachedSymbols: string[] = [];
  const cachedResults: MarketQuote[] = [];

  for (const symbol of symbols) {
    const cached = quoteCache.get(symbol);
    if (cached) {
      cachedResults.push(cached);
    } else {
      uncachedSymbols.push(symbol);
    }
  }

  if (uncachedSymbols.length === 0) {
    return cachedResults;
  }

  const fetchPromises = uncachedSymbols.map((s) => fetchSingleQuote(s));
  const results = await Promise.allSettled(fetchPromises);
  const fetchedResults: MarketQuote[] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      fetchedResults.push(result.value);
    }
  }

  return [...cachedResults, ...fetchedResults];
}

export async function getQuote(symbol: string): Promise<MarketQuote | null> {
  const cached = quoteCache.get(symbol);
  if (cached) return cached;
  return fetchSingleQuote(symbol);
}
