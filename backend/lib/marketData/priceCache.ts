const CACHE_TTL_MS = 5 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const quoteCache = new MemoryCache<MarketQuote>(CACHE_TTL_MS);
export const profileCache = new MemoryCache<CompanyProfile>(PROFILE_CACHE_TTL_MS);
export const historicalCache = new MemoryCache<HistoricalPoint[]>(CACHE_TTL_MS);

export type MarketQuote = {
  symbol: string;
  price: number;
  changePercent: number;
  dayChange: number;
};

export type CompanyProfile = {
  symbol: string;
  sector: string;
  country: string;
  industry: string;
  marketCap: number;
  companyName: string;
};

export type HistoricalPoint = {
  date: string;
  price: number;
};
