import { fmpClient } from "./fmpClient";
import { historicalCache, type HistoricalPoint } from "./priceCache";

type Range = "1M" | "3M" | "6M" | "1Y" | "5Y";

const RANGE_DAYS: Record<Range, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
};

interface FMPHistorical {
  date: string;
  close: number;
}

export async function getHistoricalPrices(
  symbol: string,
  range: Range = "1Y"
): Promise<HistoricalPoint[]> {
  const cacheKey = `${symbol}_${range}`;
  const cached = historicalCache.get(cacheKey);
  if (cached) return cached;

  try {
    const data: FMPHistorical[] = await fmpClient.get(
      `historical-price-eod/full?symbol=${symbol}`
    );

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const maxDays = RANGE_DAYS[range];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const points: HistoricalPoint[] = data
      .filter((item) => item.date >= cutoffStr)
      .map((item) => ({
        date: item.date,
        price: item.close,
      }))
      .reverse();

    historicalCache.set(cacheKey, points);
    return points;
  } catch (error: any) {
    console.error(`[MarketData] Failed to fetch historical for ${symbol}:`, error.message);
    return [];
  }
}
