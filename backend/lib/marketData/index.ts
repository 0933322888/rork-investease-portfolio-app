import { normalizeSymbol } from "./symbolMapper";
import { getQuotes, getQuote } from "./priceService";
import { getHistoricalPrices } from "./historicalService";
import { getCompanyProfile, getCompanyProfiles } from "./profileService";
import type { MarketQuote, HistoricalPoint, CompanyProfile } from "./priceCache";

export interface MarketDataRequest {
  symbol: string;
  assetType?: string;
}

export interface MarketDataResult {
  symbol: string;
  originalSymbol: string;
  price: number;
  changePercent: number;
  dayChange: number;
}

export async function getMarketDataForSymbols(
  requests: MarketDataRequest[]
): Promise<MarketDataResult[]> {
  if (requests.length === 0) return [];

  const symbolMap = new Map<string, string>();

  for (const req of requests) {
    const normalized = normalizeSymbol(req.symbol, req.assetType);
    symbolMap.set(normalized, req.symbol);
  }

  const uniqueSymbols = Array.from(symbolMap.keys());
  const quotes = await getQuotes(uniqueSymbols);

  return quotes.map((q) => ({
    symbol: q.symbol,
    originalSymbol: symbolMap.get(q.symbol) || q.symbol,
    price: q.price,
    changePercent: q.changePercent,
    dayChange: q.dayChange,
  }));
}

export {
  getQuotes,
  getQuote,
  getHistoricalPrices,
  getCompanyProfile,
  getCompanyProfiles,
  normalizeSymbol,
};

export type { MarketQuote, HistoricalPoint, CompanyProfile };
